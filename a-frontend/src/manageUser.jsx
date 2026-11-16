import { useEffect, useState } from "react";
import "./manageUser.css";
import { useNavigate } from "react-router-dom";

function ManageUser() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  // ambil user
  useEffect(() => {
    fetch("http://localhost:8000/api/users", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("HASIL API USER:", data);

        setUsers(data.data);
      });
  }, []);

  // ambil role
  useEffect(() => {
    fetch("http://localhost:8000/api/roles", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setRoles(data);
      });
  }, []);

  const changeRole = async (userId, roleId) => {
    const response = await fetch(
      `http://localhost:8000/api/users/${userId}/role`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          Authorization: "Bearer " + localStorage.getItem("token"),
        },

        body: JSON.stringify({
          role_id: roleId,
        }),
      },
    );

    if (response.ok) {
      alert("Role berhasil diperbarui");

      window.location.reload();
    }
  };

  return (
    <div className="user-page">
      <div className="user-card">
        <div className="user-header">
          <h4>User Management</h4>

          <p>Kelola hak akses pengguna sistem</p>
        </div>

        <div className="table-responsive">
          <table className="table user-table">
            <thead>
              <tr>
                <th>Nama</th>

                <th>NIK</th>

                <th>Email</th>

                <th>Role</th>

                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>

                  <td>{user.nik}</td>

                  <td>{user.email}</td>

                  <td>
                    <select
                      className="form-select"
                      value={user.role_id || ""}
                      onChange={(e) => changeRole(user.id, e.target.value)}
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
                    <button
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
      </div>
    </div>
  );
}

export default ManageUser;
