import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../vendors/ExistingVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function SapHistory() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingPdf, setOpeningPdf] = useState(null);

  // Ambil daftar vendor yang sudah selesai diproses SAP
  useEffect(() => {
    const fetchCompletedRequests = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/vendor-requests/completed`,
          {
            headers: getAuthHeaders(false),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Gagal mengambil riwayat SAP:", data);
          setRequests([]);
          return;
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setRequests(list);
      } catch (error) {
        console.error("Error mengambil riwayat SAP:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedRequests();
  }, []);

  // Pencarian vendor
  const filteredRequests = requests.filter((request) => {
    const keyword = search.trim().toLowerCase();
    const vendor = request.vendor;

    if (!keyword) return true;

    return (
      String(request.id).includes(keyword) ||
      vendor?.vendor_code?.toLowerCase().includes(keyword) ||
      vendor?.nama_perusahaan?.toLowerCase().includes(keyword) ||
      vendor?.email?.toLowerCase().includes(keyword)
    );
  });

  // Buka detail vendor
  const handleDetail = (id) => {
    navigate(`/sap/${id}`);
  };

  // Buka PDF menggunakan token autentikasi
  const handleViewPdf = async (id) => {
    try {
      setOpeningPdf(id);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/pdf`,
        {
          headers: getAuthHeaders(false, { Accept: "application/pdf" }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gagal membuka PDF:", errorText);
        alert("PDF gagal dibuka. Periksa endpoint PDF dan log Laravel.");
        return;
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      const pdfWindow = window.open(pdfUrl, "_blank");

      if (!pdfWindow) {
        URL.revokeObjectURL(pdfUrl);
        alert("Popup diblokir browser. Izinkan popup untuk membuka PDF.");
        return;
      }

      // URL blob tidak langsung dihapus agar PDF tetap dapat dibaca.
      // URL akan dibersihkan ketika halaman riwayat ditutup.
    } catch (error) {
      console.error("Error membuka PDF:", error);
      alert("Terjadi kesalahan saat membuka PDF.");
    } finally {
      setOpeningPdf(null);
    }
  };

  if (loading) {
    return (
      <div className="existing-vendor-page">
        <div className="existing-vendor-empty">
          Memuat riwayat vendor...
        </div>
      </div>
    );
  }

  return (
    <div className="existing-vendor-page">
      <div className="existing-vendor-header">
        <div>
          <h2>Riwayat Approval SAP</h2>
          <p>Daftar vendor yang sudah selesai diproses oleh SAP.</p>
        </div>

        <div className="existing-vendor-search">
          <label>Cari Vendor</label>
          <div className="existing-search-wrapper">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID Request / Vendor Code / Nama Vendor"
            />
          </div>
          <small>Cari berdasarkan ID, Vendor Code, nama, atau email.</small>
        </div>
      </div>

      <div className="existing-vendor-list-card">
        <div className="existing-vendor-list-header">
          <div>
            <h4>Vendor Selesai</h4>
            <p>Vendor yang telah memiliki status Approved.</p>
          </div>

          <div className="existing-vendor-total">
            {filteredRequests.length} Vendor
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="existing-vendor-empty">
            <div className="empty-icon">📋</div>
            <h5>Belum ada riwayat vendor</h5>
            <p>
              Vendor yang selesai diproses SAP akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table existing-vendor-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Perusahaan</th>
                  <th>Vendor Code</th>
                  <th>Kategori</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Tanggal Selesai</th>
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
                      <td>{vendor?.vendor_code || "-"}</td>
                      <td>{vendor?.kategori?.name || "-"}</td>
                      <td>{vendor?.email || "-"}</td>
                      <td>
                        <span className="vendor-status active">
                          {request.status || "Approved"}
                        </span>
                      </td>
                      <td>
                        {request.completed_at
                          ? new Date(request.completed_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="existing-detail-button"
                            onClick={() => handleDetail(request.id)}
                          >
                            Detail
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            disabled={openingPdf === request.id}
                            onClick={() => handleViewPdf(request.id)}
                          >
                            {openingPdf === request.id
                              ? "Membuka..."
                              : "Lihat PDF"}
                          </button>
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

export default SapHistory;