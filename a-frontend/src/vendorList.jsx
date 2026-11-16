import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./vendorList.css";
import "bootstrap/dist/css/bootstrap.min.css";

function VendorList() {
  const navigate = useNavigate();

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
    const token = localStorage.getItem("token");

    fetch("http://localhost:8000/api/vendors", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
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
        console.log("Data Vendor:", data);

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

    const isCompletedNew =
      vendor.source_type === "NEW" &&
      request?.current_stage === "COMPLETED" &&
      request?.status === "Approved";

    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      String(vendor.vendor_code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(vendor.nama_perusahaan || "")
        .toLowerCase()
        .includes(keyword);

    return (isExisting || isCompletedNew) && matchesSearch;
  });

  // ==========================================
  // DELETE VENDOR
  // ==========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus vendor ini?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/vendors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          Accept: "application/json",
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

  // ==========================================
  // STATUS WORKFLOW
  // ==========================================

  const getVendorStatus = (vendor) => {
    if (vendor.source_type === "EXISTING") {
      return "Existing";
    }

    const request = vendor.latest_request || vendor.latestRequest;

    return request?.status || "-";
  };

  // ==========================================
  // VENDOR STAGE
  // ==========================================

  const getVendorStage = (vendor) => {
    if (vendor.source_type === "EXISTING") {
      return "Existing Vendor";
    }

    const request = vendor.latest_request || vendor.latestRequest;

    if (!request) {
      return "-";
    }

    const stage = request.current_stage;
    const status = request.status;

    if (status === "Rejected") {
      return "Ditolak - Kembali ke Requester";
    }

    if (stage === "REQUESTER") {
      return status === "Under Review"
        ? "Menunggu Kadiv Requester"
        : "Draft Requester";
    }

    if (stage === "ACCOUNTING") {
      return status === "Under Review"
        ? "Menunggu Kadiv Accounting"
        : "Proses Accounting";
    }

    if (stage === "TAX") {
      return status === "Under Review" ? "Menunggu Kadiv Tax" : "Proses Tax";
    }

    if (stage === "SAP") {
      return "Proses SAP";
    }

    if (stage === "COMPLETED") {
      return "Completed";
    }

    return stage || "-";
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    if (!status) {
      return "";
    }

    return status.toLowerCase().replace(/\s+/g, "-");
  };

  const getStageClass = (stage) => {
    if (!stage || stage === "-") {
      return "no-status";
    }

    return stage.toLowerCase().replace(/\s+/g, "-");
  };

  // ==========================================
  // VENDOR TYPE
  // ==========================================

  const getVendorType = (vendor) => {
    if (vendor.source_type === "EXISTING") {
      return "Existing";
    }

    return "New";
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="page-content vendor-list-page">
      {/* ======================================
          HEADER
          TITLE LEFT - SEARCH RIGHT
      ====================================== */}

      <div className="vendor-list-header">
        {/* TITLE */}
        <div className="vendor-list-title">
          <h2>Daftar Vendor</h2>

          <p>Seluruh vendor yang terdaftar dalam sistem</p>
        </div>

        {/* SEARCH */}
        <div className="vendor-list-search-container">
          <div className="existing-vendor-search">
            <label htmlFor="existing-vendor-search-input">Cari Vendor</label>

            <div className="existing-search-wrapper">
              <input
                id="existing-vendor-search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Vendor Code / Nama Perusahaan"
              />

              <span className="search-icon">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          TABLE CARD
      ====================================== */}

      <div className="vendor-list-card">
        <div className="table-responsive">
          <table className="vendor-list-table">
            <thead>
              <tr>
                <th>VENDOR</th>
                <th>EMAIL</th>
                <th>JENIS</th>
                <th>STATUS</th>
                <th>TAHAP</th>
                <th>AKSI</th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}
              {loading && (
                <tr>
                  <td colSpan="6" className="vendor-list-message">
                    Memuat data vendor...
                  </td>
                </tr>
              )}

              {/* DATA VENDOR */}
              {!loading &&
                filteredVendors.length > 0 &&
                filteredVendors.map((vendor) => {
                  const status = getVendorStatus(vendor);
                  const stage = getVendorStage(vendor);
                  const vendorType = getVendorType(vendor);

                  const isRejected =
                    vendor.source_type !== "EXISTING" &&
                    status?.trim().toLowerCase() === "rejected";

                  return (
                    <tr key={vendor.id}>
                      {/* VENDOR */}
                      <td>
                        <div className="vendor-list-name">
                          <div className="vendor-list-avatar">
                            {vendor.nama_perusahaan?.charAt(0).toUpperCase()}
                          </div>

                          <strong>{vendor.nama_perusahaan}</strong>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td>{vendor.email || "-"}</td>

                      {/* JENIS */}
                      <td>
                        <span
                          className={`vendor-list-type ${
                            vendor.source_type === "EXISTING"
                              ? "existing"
                              : "new"
                          }`}
                        >
                          {vendorType}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        {status ? (
                          <span
                            className={`vendor-list-status ${getStatusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="vendor-list-status no-status">
                            -
                          </span>
                        )}
                      </td>

                      {/* TAHAP */}
                      <td>
                        {stage !== "-" ? (
                          <span
                            className={`vendor-list-stage ${getStageClass(
                              stage,
                            )}`}
                          >
                            {stage}
                          </span>
                        ) : (
                          <span className="vendor-list-status no-status">
                            -
                          </span>
                        )}
                      </td>

                      {/* AKSI */}
                      <td>
                        <div className="vendor-actions">
                          {isRejected ? (
                            <>
                              <button
                                type="button"
                                className="action-button detail-button"
                                onClick={() =>
                                  navigate(`/vendors/detail/${vendor.id}`)
                                }
                              >
                                Detail
                              </button>

                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() => handleDelete(vendor.id)}
                              >
                                Hapus
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="action-button edit-button"
                                onClick={() =>
                                  navigate(`/vendors/edit/${vendor.id}`)
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() => handleDelete(vendor.id)}
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* EMPTY */}
              {!loading && filteredVendors.length === 0 && (
                <tr>
                  <td colSpan="6" className="vendor-list-message">
                    {search.trim()
                      ? `Vendor "${search}" tidak ditemukan`
                      : "Belum ada vendor"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorList;
