import { Navigate, Outlet } from "react-router-dom";
import { getAuthUser } from "../../api/config";

/**
 * RoleRoute: Komponen pelindung rute berdasarkan peran (role-based route protection).
 *
 * @param {Array<string>} allowedRoles Daftar peran yang diizinkan (misal: ['ADMIN', 'REQUESTER', 'APPROVER'])
 * @param {string} redirectTo Halaman pengalihan jika akses tidak diizinkan (default: /dashboard)
 */
export function RoleRoute({ allowedRoles = [], redirectTo = "/dashboard" }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getAuthUser();
  const userRole = String(
    user?.role || user?.role_name || (user?.is_admin ? "ADMIN" : "")
  )
    .toUpperCase()
    .trim();

  const isAdmin = userRole === "ADMIN" || user?.is_admin === true;

  // Admin memiliki akses bypass ke seluruh rute aplikasi
  if (isAdmin) {
    return <Outlet />;
  }

  // Periksa apakah peran user cocok dengan salah satu allowedRoles
  const isAllowed = allowedRoles.some((allowed) => {
    const roleKey = allowed.toUpperCase();

    if (roleKey === "APPROVER") {
      return (
        ["ASISTEN_KADIV", "KADIV", "ACCOUNTING", "TAX", "SAP"].includes(
          userRole
        ) || user?.has_approval_access === true
      );
    }

    if (roleKey === "REQUESTER") {
      return userRole === "REQUESTER" || userRole === "PROCUREMENT";
    }

    return userRole === roleKey;
  });

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
