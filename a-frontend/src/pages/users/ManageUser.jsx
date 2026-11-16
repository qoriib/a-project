import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageUser.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";
import { AlertModal, useAlertModal } from "../../components/common";

export function ManageUser() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { modalState, showAlert, closeModal, AlertModalComponent } = useAlertModal();

  // Ambil users
  useEffect(() => {
    fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(false),
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.data || []);
      })
      .catch((err) => {
        console.error("Gagal load users:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Ambil roles
  useEffect(() => {
    fetch(`${API_BASE_URL}/roles`, {
      headers: getAuthHeaders(false),
    })
      .then((res) => res.json())
      .then((data) => {
        setRoles(data || []);
      })
      .catch((err) => {
        console.error("Gagal load roles:", err);
      });
  }, []);

  const updateUserField = async (userId, field, value) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
        );
        showAlert({
          type: "success",
          title: "Berhasil Diperbarui",
          message: `Field ${field} user berhasil diperbarui.`,
        });
      } else {
        const result = await response.json().catch(() => ({}));
        showAlert({
          type: "error",
          title: "Gagal Update",
          message: result.message || "Gagal memperbarui data user.",
        });
      }
    } catch (err) {
      console.error(err);
      showAlert({
        type: "error",
        title: "Kesalahan Jaringan",
        message: "Terjadi kesalahan saat menghubungi server.",
      });
    }
  };

  return (
    <div className="user-page">
      <div className="user-card">
        <div className="user-header">
          <h4>User Management</h4>
          <p>
            Kelola hak akses pengguna, status aktif/nonaktif, dan pengganti cuti
          </p>
        </div>

        {loading ? (
          <p className="text-center py-4 text-muted">Memuat data user...</p>
        ) : (
          <div className="table-responsive">
            <table className="table user-table align-middle">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Pengganti User Cuti</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div className="small text-muted">
                        {user.position || "-"}
                      </div>
                    </td>

                    <td>{user.nik}</td>

                    <td>{user.email}</td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.role_id || ""}
                        onChange={(e) =>
                          updateUserField(
                            user.id,
                            "role_id",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      >
                        <option value="">Pilih Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        className={`form-select form-select-sm ${
                          user.is_active
                            ? "text-success fw-bold"
                            : "text-danger fw-bold"
                        }`}
                        value={user.is_active ? "1" : "0"}
                        onChange={(e) =>
                          updateUserField(
                            user.id,
                            "is_active",
                            e.target.value === "1"
                          )
                        }
                      >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                      </select>
                    </td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.substitute_nik || ""}
                        onChange={(e) =>
                          updateUserField(
                            user.id,
                            "substitute_nik",
                            e.target.value || null
                          )
                        }
                      >
                        <option value="">Tidak ada (Normal)</option>
                        {users
                          .filter((u) => u.nik !== user.nik)
                          .map((u) => (
                            <option key={u.id} value={u.nik}>
                              {u.name} ({u.nik})
                            </option>
                          ))}
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/user/${user.id}`)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {AlertModalComponent}
    </div>
  );
}

export default ManageUser;
