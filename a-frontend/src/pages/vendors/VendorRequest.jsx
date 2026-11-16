import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";
import { StatusBadge } from "../../components/common/StatusBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function VendorRequest() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor-requests`, {
        headers: getAuthHeaders(false),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Gagal mengambil request:", data);
        return;
      }

      setRequests(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error mengambil vendor request:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Memuat daftar pengajuan vendor..." fullPage />;
  }

  return (
    <div className="app-page-wrapper">
      <div className="page-header-standard">
        <div>
          <h3 className="page-header-title">Vendor Requests</h3>
          <p className="page-header-subtitle">
            Daftar seluruh antrean pengajuan vendor
          </p>
        </div>
      </div>

      <div className="card-standard">
        <div className="card-standard-body">
          <div className="table-responsive-custom">
            <table className="table-standard">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>No</th>
                  <th>Nama Vendor</th>
                  <th>Jenis Pengajuan</th>
                  <th>Tahap / Stage</th>
                  <th>Status</th>
                  <th style={{ width: "100px" }}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      Belum ada vendor request aktif.
                    </td>
                  </tr>
                ) : (
                  requests.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.vendor?.nama_perusahaan || "-"}</strong>
                        <div className="small text-muted">
                          {item.vendor?.vendor_code || "Belum ada kode"}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.request_type || "NEW"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge stage={item.current_stage} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/approval/${item.id}`)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorRequest;
