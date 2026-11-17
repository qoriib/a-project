import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../vendors/ExistingVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function Sap() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("PROCESS");
  const [requests, setRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // AMBIL DATA REQUEST SAP
  // ==========================================

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [response, rejRes] = await Promise.all([
          fetch(`${API_BASE_URL}/vendor-requests/stage/SAP`, {
            headers: getAuthHeaders(false),
          }),
          fetch(`${API_BASE_URL}/vendor-requests/rejected?stage=SAP`, {
            headers: getAuthHeaders(false),
          }),
        ]);

        const data = await response.json().catch(() => []);
        const rejData = await rejRes.json().catch(() => []);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const rejList = Array.isArray(rejData)
          ? rejData
          : Array.isArray(rejData?.data)
          ? rejData.data
          : [];

        setRequests(list);
        setRejectedRequests(rejList);
      } catch (error) {
        console.error("Error mengambil vendor request:", error);
        setRequests([]);
        setRejectedRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredRequests = requests.filter((request) => {
    const keyword = search.trim().toLowerCase();
    const vendor = request.vendor;
    if (!keyword) return true;
    return (
      vendor?.vendor_code?.toLowerCase().includes(keyword) ||
      vendor?.nama_perusahaan?.toLowerCase().includes(keyword)
    );
  });

  const filteredRejected = rejectedRequests.filter((request) => {
    const keyword = search.trim().toLowerCase();
    const vendor = request.vendor;
    if (!keyword) return true;
    return (
      vendor?.vendor_code?.toLowerCase().includes(keyword) ||
      vendor?.nama_perusahaan?.toLowerCase().includes(keyword) ||
      request.rejection_reason?.toLowerCase().includes(keyword)
    );
  });

  // ==========================================
  // BUKA DETAIL
  // ==========================================

  const handleDetail = (requestId) => {
    navigate(`/sap/${requestId}`);
  };

  // ==========================================
  // ENTER PADA SEARCH
  // ==========================================

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") {
      return;
    }

    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return;
    }

    const foundRequest = requests.find((request) => {
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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="existing-vendor-page">
        <div className="existing-vendor-empty">Memuat data vendor...</div>
      </div>
    );
  }

  return (
    <div className="existing-vendor-page">
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="existing-vendor-header">
        <div>
          <h2>SAP</h2>

          <p>Kelola data vendor yang menunggu proses Sap</p>
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

                if (!keyword) {
                  return;
                }

                const foundRequest = requests.find((request) => {
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

      {/* ==========================================
          TABS
      ========================================== */}

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
        <button
          type="button"
          className={`btn ${activeTab === "PROCESS" ? "btn-dark" : "btn-light"}`}
          style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
          onClick={() => {
            setActiveTab("PROCESS");
            setSearch("");
          }}
        >
          Dalam Proses ({requests.length})
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "REJECTED" ? "btn-dark" : "btn-light"}`}
          style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
          onClick={() => {
            setActiveTab("REJECTED");
            setSearch("");
          }}
        >
          History Rejected ({rejectedRequests.length})
        </button>
      </div>

      {/* ==========================================
          VENDOR LIST
      ========================================== */}

      {activeTab === "PROCESS" ? (
        <div className="existing-vendor-list-card">
          <div className="existing-vendor-list-header">
            <div>
              <h4>Daftar Vendor</h4>

              <p>Vendor yang sedang menunggu proses Sap.</p>
            </div>

            <div className="existing-vendor-total">
              {filteredRequests.length} Vendor
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="existing-vendor-empty">
              <div className="empty-icon">📋</div>

              <h5>Belum ada vendor</h5>

              <p>Belum ada vendor yang sedang diproses di tahap Sap.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table existing-vendor-table">
                <thead>
                  <tr>
                    <th>No</th>

                    <th>Nama Perusahaan</th>

                    <th>Kategori</th>

                    <th>PIC Vendor</th>

                    <th>Email</th>

                    <th>Status</th>

                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request, index) => {
                    const vendor = request.vendor;

                    return (
                      <tr key={request.id}>
                        <td>{index + 1}</td>

                        <td>{vendor?.nama_perusahaan || "-"}</td>

                        <td>{vendor?.kategori?.name || "-"}</td>

                        <td>{vendor?.pic_vendor || "-"}</td>

                        <td>{vendor?.email || "-"}</td>

                        <td>
                          <span
                            className={
                              request.status === "Pending"
                                ? "vendor-status active"
                                : "vendor-status inactive"
                            }
                          >
                            {request.status || "-"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="existing-detail-button"
                            onClick={() => handleDetail(request.id)}
                          >
                            Proses
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
      ) : (
        <div className="existing-vendor-list-card">
          <div className="existing-vendor-list-header">
            <div>
              <h4>History Rejected</h4>
              <p>Daftar pengajuan vendor yang ditolak pada tahap SAP.</p>
            </div>
            <div className="existing-vendor-total">
              {filteredRejected.length} Vendor
            </div>
          </div>

          {filteredRejected.length === 0 ? (
            <div className="existing-vendor-empty">
              <div className="empty-icon">✓</div>
              <h5>Belum ada History Rejected</h5>
              <p>Tidak ada pengajuan vendor yang berstatus ditolak di tahap SAP.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table existing-vendor-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Perusahaan</th>
                    <th>Kategori</th>
                    <th>PIC Vendor</th>
                    <th>Email</th>
                    <th>Alasan Penolakan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRejected.map((request, index) => {
                    const vendor = request.vendor;
                    return (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{vendor?.nama_perusahaan || "-"}</strong>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            {request.form_number || `Request #${request.id}`}
                          </div>
                        </td>
                        <td>{vendor?.kategori?.name || "-"}</td>
                        <td>{vendor?.pic_vendor || "-"}</td>
                        <td>{vendor?.email || "-"}</td>
                        <td>
                          <span style={{ color: "#b91c1c", fontSize: "12px", maxWidth: "250px", display: "inline-block" }}>
                            {request.rejection_reason || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="vendor-status rejected">REJECTED</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="existing-detail-button"
                            onClick={() => navigate(`/procurement/${request.id}`)}
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
      )}
    </div>
  );
}

export default Sap;
