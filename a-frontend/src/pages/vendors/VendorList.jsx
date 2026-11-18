import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExistingVendor.css";
import "./VendorList.css";
import { API_BASE_URL, getAuthHeaders, getAuthUser } from "../../api/config";

function VendorList() {
  const navigate = useNavigate();

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

  // ==========================================
  // STATE
  // ==========================================

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ==========================================
  // GET VENDORS
  // ==========================================

  useEffect(() => {
    fetch(`${API_BASE_URL}/vendors`, {
      headers: getAuthHeaders(false),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Response API:", errorData);
          throw new Error(errorData.message || "Gagal mengambil data vendor");
        }
        return response.json();
      })
      .then((data) => {
        setVendors(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Gagal mengambil data:", error);
        setVendors([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ==========================================
  // FILTER VENDOR
  // ==========================================

  const filteredVendors = vendors.filter((vendor) => {
    const isExisting = vendor.source_type === "EXISTING";
    const request = vendor.latest_request || vendor.latestRequest;

    const isCompleted =
      isExisting ||
      Boolean(vendor.vendor_code) ||
      request?.current_stage === "COMPLETED" ||
      request?.status === "COMPLETED" ||
      request?.status === "Approved";

    const keyword = search.trim().toLowerCase();

    if (!isCompleted) return false;
    if (!keyword) return true;

    return (
      String(vendor.vendor_code || "").toLowerCase().includes(keyword) ||
      String(vendor.nama_perusahaan || "").toLowerCase().includes(keyword) ||
      String(vendor.pic_vendor || "").toLowerCase().includes(keyword) ||
      String(vendor.email || "").toLowerCase().includes(keyword) ||
      String(vendor.city || "").toLowerCase().includes(keyword) ||
      String(vendor.kategori?.name || "").toLowerCase().includes(keyword) ||
      String(vendor.phone || "").toLowerCase().includes(keyword) ||
      String(vendor.mobile_phone || "").toLowerCase().includes(keyword)
    );
  });

  // ==========================================
  // SEARCH KEY DOWN (ENTER)
  // ==========================================

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return;
    }

    const matchedVendor = filteredVendors.find((vendor) => {
      return (
        String(vendor.vendor_code || "").toLowerCase() === keyword ||
        String(vendor.nama_perusahaan || "").toLowerCase() === keyword
      );
    });

    if (matchedVendor) {
      navigate(`/vendors/detail/${matchedVendor.id}`);
    } else {
      alert("Vendor tidak ditemukan.");
    }
  };

  // ==========================================
  // TOGGLE STATUS VENDOR (ADMIN ONLY)
  // ==========================================

  const handleToggleStatus = async (vendor) => {
    const isCurrentlyActive = vendor.is_active !== false;
    const actionText = isCurrentlyActive ? "menonaktifkan" : "mengaktifkan";
    const confirmChange = window.confirm(
      `Apakah Anda yakin ingin ${actionText} vendor "${vendor.nama_perusahaan}"?`
    );

    if (!confirmChange) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendor.id}/toggle-status`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ is_active: !isCurrentlyActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Gagal ${actionText} vendor`);
      }

      setVendors((previousVendors) =>
        previousVendors.map((item) =>
          item.id === vendor.id ? { ...item, is_active: !isCurrentlyActive } : item
        )
      );

      alert(data.message || `Vendor berhasil di${isCurrentlyActive ? "nonaktifkan" : "aktifkan"}.`);
    } catch (error) {
      console.error(`Gagal ${actionText} vendor:`, error);
      alert(error.message);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="existing-vendor-page">
      {/* ======================================
          HEADER (TITLE LEFT - SEARCH RIGHT)
      ====================================== */}

      <div className="existing-vendor-header">
        <div>
          <h2>All Vendor</h2>
          <p>Seluruh master data vendor yang terdaftar dalam sistem IBS.</p>
        </div>

        {/* SEARCH */}
        <div className="existing-vendor-search">
          <label htmlFor="all-vendor-search-input">Cari Vendor</label>

          <div className="existing-search-wrapper">
            <input
              id="all-vendor-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Vendor Code / Nama Perusahaan"
            />

            <button
              type="button"
              aria-label="Cari vendor"
              onClick={() => {
                const keyword = search.trim().toLowerCase();
                if (!keyword) return;
                const matched = filteredVendors.find(
                  (v) =>
                    String(v.vendor_code || "").toLowerCase() === keyword ||
                    String(v.nama_perusahaan || "").toLowerCase() === keyword,
                );
                if (matched) {
                  navigate(`/vendors/detail/${matched.id}`);
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

      {/* ======================================
          TABLE CARD
      ====================================== */}

      <div className="existing-vendor-list-card">
        <div className="existing-vendor-list-header">
          <div>
            <h4>Daftar Vendor</h4>
            <p>Seluruh vendor yang terdaftar dan aktif dalam sistem IBS</p>
          </div>

          <div className="existing-vendor-total">
            {filteredVendors.length} Vendor
          </div>
        </div>

        {loading ? (
          <div className="existing-vendor-empty">Memuat data vendor...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="existing-vendor-empty">
            <div className="empty-icon">🏢</div>
            <h5>Vendor Tidak Ditemukan</h5>
            <p>
              {search
                ? "Coba periksa kembali kata kunci pencarian Anda."
                : "Belum ada vendor terdaftar yang dapat ditampilkan."}
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
                  <th width="90">Status</th>
                  <th width="160">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor, index) => {
                  const isRejected =
                    vendor.source_type !== "EXISTING" &&
                    (vendor.latest_request?.status || "").toLowerCase() ===
                      "rejected";
                  const isActive = vendor.is_active !== false;

                  return (
                    <tr key={vendor.id}>
                      {/* NO */}
                      <td>{index + 1}</td>

                      {/* VENDOR CODE */}
                      <td>
                        <strong>{vendor.vendor_code || "-"}</strong>
                      </td>

                      {/* NAMA PERUSAHAAN */}
                      <td>
                        <strong>{vendor.nama_perusahaan || "-"}</strong>
                      </td>

                      {/* KATEGORI */}
                      <td>
                        {vendor.kategori?.name ||
                          vendor.kategori?.category_desc ||
                          "-"}
                      </td>

                      {/* PIC VENDOR */}
                      <td>{vendor.pic_vendor || "-"}</td>

                      {/* EMAIL */}
                      <td>{vendor.email || "-"}</td>

                      {/* NO. TELEPON */}
                      <td>{vendor.phone || vendor.mobile_phone || "-"}</td>

                      {/* KOTA */}
                      <td>{vendor.city || "-"}</td>

                      {/* STATUS */}
                      <td>
                        {isActive ? (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"
                            style={{ fontSize: "11px", fontWeight: "600", borderRadius: "4px" }}
                          >
                            Aktif
                          </span>
                        ) : (
                          <span
                            className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"
                            style={{ fontSize: "11px", fontWeight: "600", borderRadius: "4px" }}
                          >
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* AKSI */}
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
                            onClick={() =>
                              navigate(`/vendors/detail/${vendor.id}`)
                            }
                          >
                            Detail
                          </button>

                          {(isAdmin || isRequester) && !isRejected && (
                            <button
                              type="button"
                              className="existing-edit-button"
                              onClick={() => {
                                if (!isActive) {
                                  alert("Vendor ini sedang nonaktif dan tidak dapat diajukan perbaikan.");
                                  return;
                                }
                                navigate(`/vendors/edit/${vendor.id}`);
                              }}
                              style={!isActive ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                              title={!isActive ? "Vendor sedang nonaktif" : "Edit vendor"}
                            >
                              Edit
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              className={isActive ? "existing-deactivate-button" : "existing-activate-button"}
                              onClick={() => handleToggleStatus(vendor)}
                              title={isActive ? "Nonaktifkan vendor ini" : "Aktifkan kembali vendor ini"}
                            >
                              {isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          )}
                        </div>
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

export default VendorList;
