import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./existingVendor.css";

function Account() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // AMBIL DATA REQUEST ACCOUNTING
  // ==========================================

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/vendor-requests/stage/ACCOUNTING",
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Gagal mengambil vendor request:", data);

          setRequests([]);
          return;
        }

        console.log("Data Account:", data);

        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error mengambil vendor request:", error);

        setRequests([]);
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

    if (!keyword) {
      return true;
    }

    return (
      vendor?.vendor_code?.toLowerCase().includes(keyword) ||
      vendor?.nama_perusahaan?.toLowerCase().includes(keyword)
    );
  });

  // ==========================================
  // BUKA DETAIL
  // ==========================================

  const handleDetail = (requestId) => {
    navigate(`/account/${requestId}`);
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
          <h2>Account</h2>

          <p>Kelola data vendor yang menunggu proses Account</p>
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
          VENDOR LIST
      ========================================== */}

      <div className="existing-vendor-list-card">
        <div className="existing-vendor-list-header">
          <div>
            <h4>Daftar Vendor</h4>

            <p>Vendor yang sedang menunggu proses Account.</p>
          </div>

          <div className="existing-vendor-total">
            {filteredRequests.length} Vendor
          </div>
        </div>

        {/* ==========================================
            EMPTY
        ========================================== */}

        {filteredRequests.length === 0 ? (
          <div className="existing-vendor-empty">
            <div className="empty-icon">📋</div>

            <h5>Belum ada vendor</h5>

            <p>Belum ada vendor yang sedang diproses di tahap Account.</p>
          </div>
        ) : (
          /* ==========================================
             TABLE
             ========================================== */

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
                      {/* NO */}

                      <td>{index + 1}</td>

                      {/* NAMA PERUSAHAAN */}

                      <td>{vendor?.nama_perusahaan || "-"}</td>

                      {/* KATEGORI */}

                      <td>{vendor?.kategori?.name || "-"}</td>

                      {/* PIC */}

                      <td>{vendor?.pic_vendor || "-"}</td>

                      {/* EMAIL */}

                      <td>{vendor?.email || "-"}</td>

                      {/* STATUS */}

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

                      {/* AKSI */}

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
    </div>
  );
}

export default Account;
