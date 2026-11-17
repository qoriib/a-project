import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ExistingVendor.css";
import "../approvals/Approval.css";
import { API_BASE_URL as API_URL, getAuthUser } from "../../api/config";

function ExistingVendor() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const user = getAuthUser();
  const userRole = String(
    user?.role || user?.role_name || (user?.is_admin ? "ADMIN" : "")
  )
    .toUpperCase()
    .trim();

  const isAdmin = userRole === "ADMIN" || user?.is_admin === true;
  const isRequester =
    userRole === "REQUESTER" ||
    userRole === "PROCUREMENT" ||
    (!isAdmin &&
      !["ASISTEN_KADIV", "KADIV", "ACCOUNTING", "TAX", "SAP"].includes(
        userRole
      ));

  // Hanya Requester dan Admin yang dapat mengajukan update vendor
  const canSubmitUpdate = isAdmin || isRequester;
  const canEdit = canSubmitUpdate;
  const canDelete = isAdmin;

  // Role selain requester/admin langsung menampilkan tabel Data Vendor tanpa tab
  const activeTab = canSubmitUpdate && searchParams.get("tab") === "requests" ? "REQUESTS" : "VENDORS";

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

  // State untuk pengajuan Update Vendor (alur approval - khusus requester/admin)
  const [existingRequests, setExistingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchExistingRequests = async () => {
    if (!canSubmitUpdate) return;

    try {
      setRequestsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/vendor-requests/existing-vendors`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const resData = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(resData?.data)) {
        const nonDraft = resData.data.filter(
          (req) => String(req.status || "").toUpperCase() !== "DRAFT"
        );
        setExistingRequests(nonDraft);
      }
    } catch (err) {
      console.error("Gagal mengambil data pengajuan update vendor:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (canSubmitUpdate) {
      fetchExistingRequests();
    }
  }, [refreshKey, canSubmitUpdate]);

  const handleViewPdf = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/vendor-requests/${requestId}/pdf`, {
        headers: {
          Accept: "application/pdf",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        alert("PDF belum tersedia atau masih dalam proses approval.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      alert("Terjadi kesalahan saat membuka PDF.");
    }
  };

  const getStageLabel = (request) => {
    const stage = String(request.current_stage || "").toUpperCase();
    const status = String(request.status || "").toUpperCase();
    if (stage === "COMPLETED" || status === "COMPLETED") return "Selesai (Master Updated)";
    if (stage === "REJECTED" || status === "REJECTED") return "Ditolak (Perlu Revisi)";
    switch (stage) {
      case "REQUESTER": return "Draft Requester";
      case "ASISTEN_KADIV": return "Level 1: Verifikasi Asisten Kadiv";
      case "KADIV": return "Level 2: Approval Kadiv SCM";
      case "ACCOUNTING": return "Level 3: Accounting Input";
      case "TAX": return "Level 4: Tax Input";
      case "SAP": return "Level 5: Review Tim SAP";
      default: return stage || "-";
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "COMPLETED" || s === "APPROVED") return "active";
    if (s === "REJECTED") return "rejected";
    if (s === "DRAFT") return "draft";
    return "pending";
  };

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

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : null;

        if (!list) {
          throw new Error("Format data dari server tidak sesuai.");
        }

        setVendors(list);
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
    if (!keyword) return true;
    return (
      String(vendor.vendor_code || "").toLowerCase().includes(keyword) ||
      String(vendor.nama_perusahaan || "").toLowerCase().includes(keyword) ||
      String(vendor.kategori?.name || "").toLowerCase().includes(keyword) ||
      String(vendor.pic_vendor || "").toLowerCase().includes(keyword) ||
      String(vendor.email || "").toLowerCase().includes(keyword) ||
      String(vendor.city || "").toLowerCase().includes(keyword) ||
      String(vendor.phone || vendor.mobile_phone || "").toLowerCase().includes(keyword)
    );
  });

  const filteredRequests = existingRequests.filter((req) => {
    if (String(req.status || "").toUpperCase() === "DRAFT") return false;
    if (!keyword) return true;
    const vendor = req.vendor || {};
    return (
      String(req.form_number || "").toLowerCase().includes(keyword) ||
      String(vendor.vendor_code || "").toLowerCase().includes(keyword) ||
      String(vendor.nama_perusahaan || "").toLowerCase().includes(keyword) ||
      String(vendor.pic_vendor || "").toLowerCase().includes(keyword) ||
      String(vendor.email || "").toLowerCase().includes(keyword) ||
      String(req.status || "").toLowerCase().includes(keyword)
    );
  });

  const handleRequestDetail = (request) => {
    const isRejected = String(request.status || "").toUpperCase() === "REJECTED";
    if (isRejected && (isRequester || isAdmin)) {
      navigate(`/vendors/edit/${request.vendor_id}`);
    } else {
      navigate(`/vendor-requests/${request.id}`);
    }
  };

  // Hapus vendor (khusus Admin)
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus vendor ini?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus vendor");
      }

      setVendors((previousVendors) =>
        previousVendors.filter((vendor) => vendor.id !== id),
      );

      alert("Vendor berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus vendor:", error);
      alert(error.message);
    }
  };

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

  // Download Template Excel
  const handleDownloadTemplate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/vendors/template/existing`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Gagal mengunduh template Excel");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-existing-vendor.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      window.location.href = `${API_URL}/vendors/template/existing`;
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

      {/* TABS SWITCHER (HANYA DITAMPILKAN UNTUK REQUESTER & ADMIN YANG DAPAT MENGAJUKAN UPDATE) */}
      {canSubmitUpdate && (
        <div className="approval-tabs" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={`approval-tab ${activeTab === "VENDORS" ? "active" : ""}`}
            onClick={() => {
              setSearch("");
              setSearchParams({});
            }}
          >
            Data Vendor
            <span>{vendors.length}</span>
          </button>

          <button
            type="button"
            className={`approval-tab ${activeTab === "REQUESTS" ? "active" : ""}`}
            onClick={() => {
              setSearch("");
              setSearchParams({ tab: "requests" });
            }}
          >
            Pengajuan Update Vendor
            <span>{existingRequests.length}</span>
          </button>
        </div>
      )}

      {activeTab === "VENDORS" && (
        <>
          {/* ==========================================
            ACTION IMPORT EXCEL (KHUSUS ADMIN)
        ========================================== */}

          {isAdmin && (
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
                    tax melalui template Excel. Data otomatis langsung berstatus
                    Completed tanpa perlu proses approval.
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
                      onClick={handleDownloadTemplate}
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
          )}

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
                      <th width="45">No.</th>
                      <th>Vendor Code</th>
                      <th>Nama Perusahaan</th>
                      <th>Kategori</th>
                      <th>PIC Vendor</th>
                      <th>Email</th>
                      <th>No. Telepon</th>
                      <th>Kota</th>
                      <th width="140">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVendors.map((vendor, index) => (
                      <tr key={vendor.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{vendor.vendor_code || "-"}</strong>
                        </td>
                        <td>
                          <strong>{vendor.nama_perusahaan || "-"}</strong>
                        </td>
                        <td>
                          {vendor.kategori?.name ||
                            vendor.kategori?.category_desc ||
                            "-"}
                        </td>
                        <td>{vendor.pic_vendor || "-"}</td>
                        <td>{vendor.email || "-"}</td>
                        <td>{vendor.phone || vendor.mobile_phone || "-"}</td>
                        <td>{vendor.city || "-"}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              className="existing-detail-button"
                              onClick={() => openDetail(vendor)}
                            >
                              Detail
                            </button>

                            {canEdit && (
                              <button
                                type="button"
                                className="existing-edit-button"
                                onClick={() => openEdit(vendor)}
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                className="existing-delete-button"
                                onClick={() => handleDelete(vendor.id)}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
            TAB 2: PENGAJUAN UPDATE VENDOR
        ========================================== */}
      {activeTab === "REQUESTS" && (
        <div className="existing-vendor-list-card">
          <div className="existing-vendor-list-header">
            <div>
              <h4>Daftar Pengajuan Update Vendor</h4>
              <p>
                Seluruh pengajuan perubahan data Existing Vendor beserta status antrean persetujuan workflow.
              </p>
            </div>

            <div className="existing-vendor-total">
              {filteredRequests.length} Pengajuan
            </div>
          </div>

          {requestsLoading ? (
            <div className="existing-vendor-empty">
              Memuat data pengajuan update vendor...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="existing-vendor-empty">
              <div className="empty-icon">📝</div>
              <h5>
                {search ? "Pengajuan tidak ditemukan" : "Belum ada Pengajuan Update Vendor"}
              </h5>
              <p>
                {search
                  ? "Coba periksa kembali kata kunci pencarian Anda."
                  : "Pengajuan update vendor yang diajukan oleh Requester akan muncul dan dipantau di sini."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table existing-vendor-table">
                <thead>
                  <tr>
                    <th width="45">No.</th>
                    <th>No. Request</th>
                    <th>Nama Perusahaan</th>
                    <th>Vendor Code</th>
                    <th>Status</th>
                    <th>Tahap Proses</th>
                    <th>Tanggal Pengajuan</th>
                    <th width="90">PDF</th>
                    <th width="130">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request, index) => {
                    const vendor = request.vendor || {};
                    const isRejected = String(request.status || "").toUpperCase() === "REJECTED";
                    const isDraft = String(request.status || "").toUpperCase() === "DRAFT";

                    return (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong style={{ color: "#2563eb" }}>
                            {request.form_number || `#${request.id}`}
                          </strong>
                        </td>
                        <td>
                          <strong>{vendor.nama_perusahaan || "-"}</strong>
                        </td>
                        <td>{vendor.vendor_code || "-"}</td>
                        <td>
                          <span className={`vendor-status ${getStatusBadgeClass(request.status)}`}>
                            {request.status || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="vendor-stage-label" style={{ fontWeight: 500, fontSize: "12px" }}>
                            {getStageLabel(request)}
                          </span>
                        </td>
                        <td>
                          {request.submitted_at
                            ? new Date(request.submitted_at).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "-"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="approval-pdf-button"
                            onClick={() => handleViewPdf(request.id)}
                            title="Lihat PDF"
                          >
                            📄 PDF
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="existing-detail-button"
                            onClick={() => handleRequestDetail(request)}
                            style={isRejected ? { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" } : {}}
                          >
                            {isRejected ? "Revisi" : "Detail"}
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
      )}
    </div>
  );
}

export default ExistingVendor;
