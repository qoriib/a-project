import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExistingVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function NewVendor() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Popup notifikasi import
  const [importAlert, setImportAlert] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
    details: [],
    total: 0,
  });

  // ==========================================
  // AMBIL SELURUH DATA NEW VENDOR
  // ==========================================

  const fetchVendorRequests = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setVendors([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/new-vendors`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const responseText = await response.text();

      console.log("HTTP Status:", response.status);
      console.log("Response Backend:", responseText);

      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Response bukan JSON:", responseText);
        throw new Error("Backend mengirim respons kosong atau bukan JSON.");
      }

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data vendor.");
      }

      const requestList = Array.isArray(result.data) ? result.data : [];

      console.table(
        requestList.map((request) => ({
          id: request.id,
          vendor: request.vendor?.nama_perusahaan,
          status: request.status,
          current_stage: request.current_stage,
          request_type: request.request_type,
        })),
      );

      // New Vendor hanya menampilkan pengajuan yang belum Completed.
      const activeRequests = requestList.filter((request) => {
        const stage = (request.current_stage || "").toUpperCase().trim();
        const status = (request.status || "").toLowerCase().trim();

        return !(stage === "COMPLETED" && status === "approved");
      });

      setVendors(activeRequests);
    } catch (error) {
      console.error("Gagal mengambil data vendor:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorRequests();
  }, []);

  // ==========================================
  // LABEL TAHAP PROSES
  // ==========================================

  const getStageLabel = (request) => {
    const stage = (request.current_stage || "").toUpperCase();
    const status = (request.status || "").trim().toLowerCase();

    // Pengajuan ditolak
    if (status === "rejected") {
      return request.rejection_info?.label || "Ditolak";
    }

    if (stage === "REQUESTER" && status === "pending") {
      return "Draft Requester";
    }

    if (stage === "REQUESTER" && status === "under review") {
      return "Menunggu Kadiv Requester";
    }

    if (stage === "ACCOUNTING" && status === "pending") {
      return "Proses Accounting";
    }

    if (stage === "ACCOUNTING" && status === "under review") {
      return "Menunggu Kadiv Accounting";
    }

    if (stage === "TAX" && status === "pending") {
      return "Proses Tax";
    }

    if (stage === "TAX" && status === "under review") {
      return "Menunggu Kadiv Tax";
    }

    if (stage === "SAP" && status === "pending") {
      return "Proses SAP";
    }

    if (stage === "COMPLETED" && status === "approved") {
      return "Completed";
    }

    return stage || "-";
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredVendors = vendors.filter((request) => {
    const keyword = search.trim().toLowerCase();
    const vendor = request.vendor;

    if (!keyword) return true;

    return (
      vendor?.vendor_code?.toLowerCase().includes(keyword) ||
      vendor?.nama_perusahaan?.toLowerCase().includes(keyword)
    );
  });

  // ==========================================
  // BUKA DETAIL
  // ==========================================

  const handleDetail = (requestId) => {
    navigate(`/procurement/${requestId}`);
  };

  // ==========================================
  // ENTER PADA SEARCH
  // ==========================================

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;

    const keyword = search.trim().toLowerCase();

    if (!keyword) return;

    const foundRequest = vendors.find((request) => {
      const vendor = request.vendor;

      return (
        vendor?.vendor_code?.toLowerCase() === keyword ||
        vendor?.nama_perusahaan?.toLowerCase() === keyword
      );
    });

    if (foundRequest) {
      handleDetail(foundRequest.id);
    } else {
      alert("Vendor tidak ditemukan.");
    }
  };

  // ==========================================
  // IMPORT EXCEL VENDOR BARU
  // ==========================================

  const handleImportExcel = async () => {
    if (!selectedFile) {
      setImportAlert({
        show: true,
        type: "error",
        title: "File Belum Dipilih",
        message: "Silakan pilih file Excel yang ingin diimpor.",
        details: [],
        total: 0,
      });
      return;
    }

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setImportAlert({
        show: true,
        type: "error",
        title: "Format File Tidak Sesuai",
        message: "Gunakan file Excel dengan format .xlsx atau .xls.",
        details: [],
        total: 0,
      });
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setImportAlert({
        show: true,
        type: "error",
        title: "Sesi Login Berakhir",
        message: "Silakan login kembali sebelum melakukan import.",
        details: [],
        total: 0,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setImporting(true);
    setImportAlert((prev) => ({ ...prev, show: false }));

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/import`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      console.log("Status import:", response.status);
      console.log("Hasil import:", result);

      if (!response.ok) {
        let details = [];

        if (Array.isArray(result.errors)) {
          details = result.errors.map((item) => {
            if (typeof item === "string") return item;

            const lokasi = [
              item.sheet ? `Sheet ${item.sheet}` : "",
              item.row ? `Baris ${item.row}` : "",
              item.field ? `Kolom ${item.field}` : "",
            ]
              .filter(Boolean)
              .join(" • ");

            return lokasi
              ? `${lokasi}: ${item.message || "Data tidak valid."}`
              : item.message || JSON.stringify(item);
          });
        } else if (result.errors && typeof result.errors === "object") {
          details = Object.entries(result.errors).flatMap(([field, messages]) =>
            (Array.isArray(messages) ? messages : [messages]).map(
              (message) => `${field}: ${message}`,
            ),
          );
        }

        setImportAlert({
          show: true,
          type: "error",
          title: "Import Gagal",
          message:
            result.message ||
            `Import tidak berhasil. Kode respons: ${response.status}.`,
          details,
          total: 0,
        });

        return;
      }

      setSelectedFile(null);

      // Reset input file agar file yang sama bisa dipilih kembali.
      const fileInput = document.getElementById("new-vendor-excel-input");
      if (fileInput) fileInput.value = "";

      setImportAlert({
        show: true,
        type: "success",
        title: "Import Berhasil!",
        message:
          result.message ||
          "Data vendor berhasil diimpor dan pengajuan telah dibuat.",
        details: [],
        total: Number(result.total_imported || 0),
      });

      // Refresh seluruh daftar New Vendor.
      await fetchVendorRequests();
    } catch (error) {
      console.error("Error import:", error);

      setImportAlert({
        show: true,
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          error.message ||
          "Tidak dapat terhubung ke server. Periksa koneksi backend.",
        details: [],
        total: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  // ==========================================
  // CLASS STATUS
  // ==========================================

  const getStatusClass = (status) => {
    switch ((status || "").trim().toLowerCase()) {
      case "pending":
        return "pending";
      case "rejected":
        return "rejected";
      case "under review":
        return "review";
      case "approved":
        return "approved";
      default:
        return "inactive";
    }
  };

  // ==========================================
  // TAMPILAN
  // ==========================================

  return (
    <div className="existing-vendor-page">
      {/* HEADER */}

      <div className="existing-vendor-header">
        <div>
          <h2>New Vendor</h2>
          <p>Kelola seluruh pengajuan vendor baru.</p>
        </div>

        {/* SEARCH */}

        <div className="existing-vendor-search">
          <label>Cari Vendor</label>

          <div className="existing-search-wrapper">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Vendor Code / Nama Perusahaan"
            />

            <button
              type="button"
              onClick={() => {
                const keyword = search.trim().toLowerCase();

                if (!keyword) return;

                const foundRequest = vendors.find((request) => {
                  const vendor = request.vendor;

                  return (
                    vendor?.vendor_code?.toLowerCase() === keyword ||
                    vendor?.nama_perusahaan?.toLowerCase() === keyword
                  );
                });

                if (foundRequest) {
                  handleDetail(foundRequest.id);
                } else {
                  alert("Vendor tidak ditemukan.");
                }
              }}
            >
              🔍
            </button>
          </div>

          <small>Tekan Enter untuk membuka data vendor</small>
        </div>
      </div>

      {/* ACTION CARD */}

      <div className="existing-vendor-actions-row">
        {/* INPUT MANUAL */}

        <div className="existing-action-card manual-card">
          <div className="existing-action-icon manual">+</div>

          <div className="existing-action-content">
            <h5>Input Manual</h5>

            <p>Tambahkan satu vendor baru secara manual.</p>

            <button
              type="button"
              className="existing-action-primary manual-primary"
              onClick={() => navigate("/vendors/add/new")}
            >
              Tambah Vendor
            </button>
          </div>
        </div>

        {/* IMPORT EXCEL */}

        <div className="existing-action-card excel-card">
          <div className="existing-action-icon excel">
            <span>▤</span>
          </div>

          <div className="existing-action-content">
            <h5>Import Excel</h5>

            <p>Impor beberapa data vendor baru sekaligus.</p>

            <div className="excel-actions-inline">
              <label
                htmlFor="new-vendor-excel-input"
                className={`excel-file-picker ${importing ? "disabled" : ""}`}
              >
                <span className="excel-file-picker-icon">↑</span>

                <span className="excel-file-picker-text">
                  <strong>
                    {selectedFile ? "Ganti File" : "Pilih File Excel"}
                  </strong>

                  <small>
                    {selectedFile
                      ? selectedFile.name
                      : "Format .xlsx atau .xls"}
                  </small>
                </span>
              </label>

              <input
                id="new-vendor-excel-input"
                className="excel-hidden-input"
                type="file"
                accept=".xlsx,.xls"
                disabled={importing}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />

              <button
                type="button"
                className="existing-action-primary import-primary"
                onClick={handleImportExcel}
                disabled={importing || !selectedFile}
              >
                {importing ? (
                  <>
                    <span className="import-button-spinner" />
                    Mengimpor...
                  </>
                ) : (
                  "Import Excel"
                )}
              </button>

              <a
                href={`${API_BASE_URL}/vendors/template/new`}
                className="btn btn-outline-secondary"
                download="template-new-vendor.xlsx"
                style={{ padding: "8px 14px", fontSize: "13px", borderRadius: "8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>📥</span> Template Excel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* DAFTAR PENGAJUAN */}

      <div className="existing-vendor-list-card">
        <div className="existing-vendor-list-header">
          <div>
            <h4>Daftar Pengajuan Vendor</h4>

            <p>
              Seluruh pengajuan New Vendor, mulai dari Draft, proses persetujuan
              dan pengajuan ditolak.
            </p>
          </div>

          <div className="existing-vendor-total">
            {filteredVendors.length} Vendor
          </div>
        </div>

        {loading ? (
          <div className="existing-vendor-empty">Memuat data vendor...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="existing-vendor-empty">
            <div className="empty-icon">📋</div>

            <h5>Belum ada pengajuan vendor</h5>

            <p>Belum ada data pengajuan New Vendor yang dapat ditampilkan.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table existing-vendor-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Perusahaan</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Tahap Proses</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((request, index) => {
                  const vendor = request.vendor;

                  return (
                    <tr key={request.id}>
                      <td>{index + 1}</td>

                      <td>{vendor?.nama_perusahaan || "-"}</td>

                      <td>{vendor?.email || "-"}</td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`vendor-status ${getStatusClass(
                            request.status,
                          )}`}
                        >
                          {request.status || "-"}
                        </span>
                      </td>

                      {/* TAHAP PROSES */}

                      <td>
                        <span className="vendor-stage-label">
                          {getStageLabel(request)}
                        </span>
                      </td>

                      {/* AKSI */}

                      <td>
                        <button
                          type="button"
                          className="existing-detail-button"
                          onClick={() => handleDetail(request.id)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP NOTIFIKASI IMPORT */}

      {importAlert.show && (
        <div
          className="import-alert-overlay"
          onClick={() =>
            setImportAlert((prev) => ({
              ...prev,
              show: false,
            }))
          }
        >
          <div
            className={`import-alert-modal ${
              importAlert.type === "success"
                ? "import-alert-success"
                : "import-alert-error"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-alert-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="import-alert-close"
              onClick={() =>
                setImportAlert((prev) => ({
                  ...prev,
                  show: false,
                }))
              }
              aria-label="Tutup notifikasi"
            >
              ×
            </button>

            <div className="import-alert-icon">
              {importAlert.type === "success" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>

            <h3 id="import-alert-title">{importAlert.title}</h3>

            <p className="import-alert-message">{importAlert.message}</p>

            {importAlert.type === "success" && (
              <div className="import-alert-summary">
                <span className="import-alert-summary-label">
                  Total vendor berhasil diimpor
                </span>

                <strong>{importAlert.total}</strong>

                <span className="import-alert-summary-note">
                  Pengajuan vendor telah dibuat dan dikirim ke tahap persetujuan
                  berikutnya.
                </span>
              </div>
            )}

            {importAlert.details.length > 0 && (
              <div className="import-alert-error-details">
                <h4>Detail yang perlu diperbaiki</h4>

                <ul>
                  {importAlert.details.map((detail, index) => (
                    <li key={`${index}-${detail}`}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="import-alert-actions">
              <button
                type="button"
                className="import-alert-primary-button"
                onClick={() =>
                  setImportAlert((prev) => ({
                    ...prev,
                    show: false,
                  }))
                }
              >
                {importAlert.type === "success" ? "Selesai" : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewVendor;
