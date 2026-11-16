import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserDetail.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(false),
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.data || null);
      })
      .catch((err) => {
        console.error("Gagal load detail user:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="user-page">
        <LoadingSpinner message="Memuat informasi pengguna..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-page">
        <div className="user-card text-center py-5">
          <p className="text-muted">Pengguna tidak ditemukan.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/user")}
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page">
      <div className="user-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Detail User</h4>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/user")}
          >
            ← Kembali
          </button>
        </div>

        <hr />

        <div className="row g-3">
          <div className="col-md-6">
            <span className="text-muted small d-block">Nama Lengkap</span>
            <strong>{user.name}</strong>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">NIK</span>
            <strong>{user.nik}</strong>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Email</span>
            <span>{user.email}</span>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Department</span>
            <span>{user.department || "-"}</span>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Jabatan / Position</span>
            <span>{user.position || "-"}</span>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Role Hak Akses</span>
            <span className="badge bg-primary">
              {user.role?.name || user.role || "-"}
            </span>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Status Akun</span>
            <span
              className={`badge ${user.is_active ? "bg-success" : "bg-danger"}`}
            >
              {user.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <div className="col-md-6">
            <span className="text-muted small d-block">Pengganti Cuti</span>
            <span>{user.substitute_nik || "Tidak Ada (Normal)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
