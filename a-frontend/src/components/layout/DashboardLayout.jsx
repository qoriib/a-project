import { useState, useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import "./DashboardLayout.css";
import ibsLogo from "../../assets/ibsw.png";
import { getAuthUser } from "../../api/config";
import { AlertModal } from "../common/AlertModal";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* =========================================================
     AUTH CHECK
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate, location.pathname]);

  /* =========================================================
     USER
  ========================================================= */
  const user = getAuthUser();

  /* =========================================================
     LOGOUT
  ========================================================= */
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  /* =========================================================
     ACTIVE MENU
  ========================================================= */
  const isActive = (menu) => {
    const path = location.pathname;

    if (menu === "dashboard") {
      return path === "/dashboard";
    }
    if (menu === "all-vendor") {
      return path === "/vendors/all" || path.startsWith("/vendors/all/");
    }
    if (menu === "new-vendor") {
      return path === "/vendors/add" || path.startsWith("/vendors/add/");
    }
    if (menu === "existing-vendor") {
      return (
        path === "/vendors/existing" || path.startsWith("/vendors/existing/")
      );
    }
    if (menu === "approval") {
      return path === "/approval" || path.startsWith("/approval/");
    }
    if (menu === "master-approval") {
      return (
        path === "/master-approvals" || path.startsWith("/master-approvals/")
      );
    }
    if (menu === "user-management") {
      return path === "/user" || path.startsWith("/user/");
    }

    return false;
  };

  /* =========================================================
     PAGE TITLE
  ========================================================= */
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return {
        title: "Dashboard",
        description: "Overview sistem vendor",
      };
    }
    if (path === "/vendors/all" || path.startsWith("/vendors/all/")) {
      return {
        title: "All Vendor",
        description: "Kelola seluruh vendor",
      };
    }
    if (path === "/vendors/add" || path.startsWith("/vendors/add/")) {
      return {
        title: "New Vendor",
        description: "Kelola pengajuan vendor baru",
      };
    }
    if (path === "/vendors/existing" || path.startsWith("/vendors/existing/")) {
      return {
        title: "Existing Vendor",
        description: "Kelola perubahan data vendor yang sudah terdaftar",
      };
    }
    if (path === "/approval" || path.startsWith("/approval/")) {
      return {
        title: "Approval",
        description: "Kelola proses approval vendor",
      };
    }
    if (path === "/master-approvals" || path.startsWith("/master-approvals/")) {
      return {
        title: "Master Approval",
        description: "Kelola hak akses dan approval pengguna",
      };
    }
    if (path === "/user" || path.startsWith("/user/")) {
      return {
        title: "User Management",
        description:
          "Kelola akun pengguna, status active/inactive, dan pengganti cuti",
      };
    }

    return {
      title: "Vendor System",
      description: "Vendor Management System",
    };
  };

  const page = getPageTitle();

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

  const isApprover =
    ["ASISTEN_KADIV", "KADIV", "ACCOUNTING", "TAX", "SAP"].includes(userRole) ||
    user?.has_approval_access === true;

  // Pembatasan menu sesuai role:
  // - Dashboard: Seluruh pengguna
  // - All Vendor: Seluruh pengguna (master daftar vendor IBS)
  // - New Vendor: Admin dan Requester/Procurement
  // - Existing Vendor: Admin dan Requester/Procurement
  // - Approval: Admin dan Approver (Asisten Kadiv, Kadiv, Accounting, Tax, SAP)
  // - User Management: Khusus Administrator
  const canSeeAllVendor = true;
  const canSeeNewVendor = isAdmin || isRequester;
  const canSeeExistingVendor = isAdmin || isRequester;
  const canSeeApproval = isAdmin || isApprover;
  const canSeeUserManagement = isAdmin;

  const getRoleDisplayName = (role, admin) => {
    if (admin) return "Administrator";
    switch (role) {
      case "REQUESTER":
        return "Staff Requester SCM";
      case "PROCUREMENT":
        return "Staff Procurement";
      case "ASISTEN_KADIV":
        return "Asisten Kadiv SCM (L1)";
      case "KADIV":
        return "Kadiv SCM (L2)";
      case "ACCOUNTING":
        return "Accounting Lead (L3)";
      case "TAX":
        return "Tax Specialist (L4)";
      case "SAP":
        return "SAP Team (L5)";
      default:
        return role || "User";
    }
  };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* BRAND */}
        <div className="brand">
          <div className="brand-logo">
            <img src={ibsLogo} alt="IBS Logo" />
          </div>

          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-main">Vendor</span>
              <span className="brand-sub">System</span>
            </div>
          )}
        </div>

        {/* SIDEBAR CONTENT */}
        <div className="sidebar-content">
          {sidebarOpen && <p className="menu-label">MAIN MENU</p>}

          {/* DASHBOARD */}
          <button
            type="button"
            className={`nav-item ${isActive("dashboard") ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          {/* ALL VENDOR */}
          {canSeeAllVendor && (
            <button
              type="button"
              className={`nav-item ${isActive("all-vendor") ? "active" : ""}`}
              onClick={() => navigate("/vendors/all")}
            >
              <span className="nav-icon">🏢</span>
              {sidebarOpen && <span>All Vendor</span>}
            </button>
          )}

          {/* NEW VENDOR */}
          {canSeeNewVendor && (
            <button
              type="button"
              className={`nav-item ${isActive("new-vendor") ? "active" : ""}`}
              onClick={() => navigate("/vendors/add")}
            >
              <span className="nav-icon">➕</span>
              {sidebarOpen && <span>New Vendor</span>}
            </button>
          )}

          {/* EXISTING VENDOR */}
          {canSeeExistingVendor && (
            <button
              type="button"
              className={`nav-item ${
                isActive("existing-vendor") ? "active" : ""
              }`}
              onClick={() => navigate("/vendors/existing")}
            >
              <span className="nav-icon">📁</span>
              {sidebarOpen && <span>Existing Vendor</span>}
            </button>
          )}

          {/* APPROVAL */}
          {canSeeApproval && (
            <button
              type="button"
              className={`nav-item ${isActive("approval") ? "active" : ""}`}
              onClick={() => navigate("/approval")}
            >
              <span className="nav-icon">✅</span>
              {sidebarOpen && <span>Approval</span>}
            </button>
          )}

          {/* USER MANAGEMENT (ADMIN ONLY) */}
          {canSeeUserManagement && (
            <button
              type="button"
              className={`nav-item ${
                isActive("user-management") ? "active" : ""
              }`}
              onClick={() => navigate("/user")}
            >
              <span className="nav-icon">👥</span>
              {sidebarOpen && <span>User Management</span>}
            </button>
          )}
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="logout-button"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span>↪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <div>
              <h5>{page.title}</h5>
              <p>{page.description}</p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-profile">
              <div className="header-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>

              <div className="header-profile-text">
                <strong>{user?.name || "Administrator"}</strong>
                <span>{getRoleDisplayName(userRole, isAdmin)}</span>
              </div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AlertModal
        isOpen={showLogoutConfirm}
        type="warning"
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari Vendor Management System?"
        confirmText="Ya, Logout"
        cancelText="Batal"
        showCancel={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default DashboardLayout;
