import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExistingVendor.css";
import { API_BASE_URL as API_URL } from "../../api/config";

function ExistingVendor() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk import Excel.
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [duplicateVendorMessage, setDuplicateVendorMessage] = useState("");

  // Mengambil data Existing Vendor dari backend.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchExistingVendors() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/existing-vendors`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Gagal mengambil data Existing Vendor (HTTP ${response.status}).`,
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Format data dari server tidak sesuai.");
        }

        setVendors(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Gagal mengambil Existing Vendor:", err);
          setError(err.message || "Terjadi kesalahan saat mengambil data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchExistingVendors();

    return () => controller.abort();
  }, [refreshKey]);

  // Pencarian berdasarkan Vendor Code atau nama perusahaan.
  const keyword = search.trim().toLowerCase();

  const filteredVendors = vendors.filter((vendor) => {
    return (
      String(vendor.vendor_code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(vendor.nama_perusahaan || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  // Membuka halaman Detail Existing Vendor.
  const openDetail = (vendor) => {
    navigate(`/vendors/detail/${vendor.id}`);
  };

  // Membuka halaman Edit Existing Vendor.
  const openEdit = (vendor) => {
    navigate(`/vendors/edit/${vendor.id}`);
  };

  // Cari vendor dan buka detail jika ditemukan.
  const handleSearch = () => {
    if (!keyword) return;

    const foundVendor = vendors.find(
      (vendor) =>
        String(vendor.vendor_code || "").toLowerCase() === keyword ||
        String(vendor.nama_perusahaan || "").toLowerCase() === keyword,
    );

    if (foundVendor) {
      openDetail(foundVendor);
    } else {
      window.alert("Vendor tidak ditemukan.");
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // Pilih file Excel.
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setImportMessage("");
    setImportError("");

    if (!file) return;

    const validExtension = /\.(xlsx|xls)$/i.test(file.name);

    if (!validExtension) {
      setSelectedFile(null);
      setImportError("Pilih file Excel dengan format .xlsx atau .xls.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setImportError("Ukuran file maksimal 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // Import file Excel ke backend Laravel.
  const handleImport = async () => {
    if (!selectedFile || importing) return;

    setImporting(true);
    setImportMessage("");
    setImportError("");
    setDuplicateVendorMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan login kembali.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/existing-vendors/import`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().filter(Boolean)
          : [];

        const detail = validationErrors.length
          ? validationErrors.join("\n")
          : data.message || `Import gagal (HTTP ${response.status}).`;

        throw new Error(detail);
      }

      setImportMessage(
        `${data.message || "Import selesai."} ` +
          `${data.imported ?? 0} vendor baru berhasil diimpor. ` +
          `${data.skipped ?? 0} vendor dilewati karena sudah terdaftar.`,
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Memuat ulang tabel dari backend setelah import berhasil.
      setRefreshKey((current) => current + 1);
    } catch (err) {
      console.error("Import Existing Vendor gagal:", err);

      const message = err.message || "Terjadi kesalahan saat import.";

      if (/sudah terdaftar/i.test(message)) {
        setDuplicateVendorMessage(message);
        setImportError("");
      } else {
        setImportError(message);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="existing-vendor-page">
      {/* HEADER */}
      <div className="existing-vendor-header">
        <div>
          <h2>Existing Vendor</h2>
          <p>Kelola data vendor yang sudah terdaftar di sistem.</p>
        </div>

        <div className="existing-vendor-search">
          <label htmlFor="existing-vendor-search-input">Cari Vendor</label>

          <div className="existing-search-wrapper">
            <input
              id="existing-vendor-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Vendor Code / Nama Perusahaan"
            />

            <button
              type="button"
              aria-label="Cari vendor"
              onClick={handleSearch}
            >
              🔍
            </button>
          </div>

          <small>Tekan Enter untuk membuka detail vendor.</small>
        </div>
      </div>

      {/* ==========================================
            ACTION IMPORT EXCEL
        ========================================== */}

      <div className="existing-vendor-actions-row">
        {/* IMPORT EXCEL */}
        <div className="existing-action-card excel-card">
          <div className="existing-action-icon excel">
            <span>▤</span>
          </div>

          <div className="existing-action-content">
            <h5>Import Excel</h5>

            <p>
              Impor data Existing Vendor beserta rekening bank dan withholding
              tax melalui template Excel.
            </p>

            <div className="excel-actions-inline">
              {/* PILIH FILE */}
              <label
                htmlFor="existing-vendor-excel-input"
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

              {/* INPUT FILE */}
              <input
                ref={fileInputRef}
                id="existing-vendor-excel-input"
                className="excel-hidden-input"
                type="file"
                accept=".xlsx,.xls"
                disabled={importing}
                onChange={handleFileChange}
              />

              {/* IMPORT BUTTON */}
              <button
                type="button"
                className="existing-action-primary import-primary"
                onClick={handleImport}
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
                href={`${API_URL}/vendors/template/existing`}
                className="btn btn-outline-secondary"
                download="template-existing-vendor.xlsx"
                style={{ padding: "8px 14px", fontSize: "13px", borderRadius: "8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>📥</span> Template Excel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VENDOR SUDAH TERDAFTAR */}
      {duplicateVendorMessage && (
        <div
          className="duplicate-vendor-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDuplicateVendorMessage("");
            }
          }}
        >
          <div
            className="duplicate-vendor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-vendor-title"
          >
            <div className="duplicate-vendor-icon">
              <span>!</span>
            </div>

            <h4 id="duplicate-vendor-title">Vendor Sudah Terdaftar</h4>

            <p className="duplicate-vendor-subtitle">
              Import tidak dapat dilanjutkan.
            </p>

            <div className="duplicate-vendor-detail">
              {duplicateVendorMessage}
            </div>

            <p className="duplicate-vendor-info">
              Periksa kembali Vendor Code dalam file Excel kamu. Data tidak akan
              ditimpa oleh proses import ini.
            </p>

            <button
              type="button"
              className="duplicate-vendor-close"
              onClick={() => setDuplicateVendorMessage("")}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* PESAN IMPORT */}
      {importMessage && (
        <div className="alert alert-success mt-3" role="status">
          {importMessage}
        </div>
      )}

      {importError && (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          style={{ whiteSpace: "pre-line" }}
        >
          <strong>Import gagal.</strong>
          <div className="mt-1">{importError}</div>
        </div>
      )}

      {/* DAFTAR VENDOR */}
      <div className="existing-vendor-list-card">
        <div className="existing-vendor-list-header">
          <div>
            <h4>Daftar Existing Vendor</h4>
            <p>Data seluruh existing vendor.</p>
          </div>

          <div className="existing-vendor-total">
            {filteredVendors.length} Vendor
          </div>
        </div>

        {loading ? (
          <div className="existing-vendor-empty">
            Memuat data Existing Vendor...
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3" role="alert">
            <p className="mb-2">{error}</p>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="existing-vendor-empty">
            <div className="empty-icon">📋</div>
            <h5>
              {search ? "Vendor tidak ditemukan" : "Belum ada Existing Vendor"}
            </h5>
            <p>
              {search
                ? "Coba periksa kembali Vendor Code atau nama perusahaan."
                : "Vendor yang sudah terdaftar akan muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table existing-vendor-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Vendor Code</th>
                  <th>Nama Perusahaan</th>
                  <th>Kategori</th>
                  <th>PIC Vendor</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor, index) => (
                  <tr key={vendor.id}>
                    <td>{index + 1}</td>
                    <td>{vendor.vendor_code || "-"}</td>
                    <td>{vendor.nama_perusahaan || "-"}</td>
                    <td>{vendor.kategori?.name || "-"}</td>
                    <td>{vendor.pic_vendor || "-"}</td>
                    <td>{vendor.email || "-"}</td>
                    <td>
                      <span className="vendor-status active">Terdaftar</span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="existing-detail-button"
                          onClick={() => openDetail(vendor)}
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          className="existing-edit-button"
                          onClick={() => openEdit(vendor)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExistingVendor;
