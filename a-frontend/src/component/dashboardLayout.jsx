import { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import "./dashboardLayout.css";

import ibsLogo from "../assets/ibsw.png";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(true);

  /* =========================================================
     USER
  ========================================================= */

  const storedUser = localStorage.getItem("user");

  let user = null;

  if (storedUser && storedUser !== "undefined") {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("Data user di localStorage tidak valid:", storedUser);

      localStorage.removeItem("user");
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    setShowLogoutModal(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  /* =========================================================
     ACTIVE MENU
  ========================================================= */

  const isActive = (menu) => {
    const path = location.pathname;

    /* ================= DASHBOARD ================= */

    if (menu === "dashboard") {
      return path === "/dashboard";
    }

    /* ================= LIST ALL VENDOR ================= */

    if (menu === "all-vendor") {
      return path === "/vendors/all" || path.startsWith("/vendors/all/");
    }

    /* ================= NEW VENDOR ================= */

    if (menu === "new-vendor") {
      return path === "/vendors/add" || path.startsWith("/vendors/add/");
    }

    /* ================= EXISTING VENDOR ================= */

    if (menu === "existing-vendor") {
      return (
        path === "/vendors/existing" || path.startsWith("/vendors/existing/")
      );
    }

    /* ================= APPROVAL ================= */

    if (menu === "approval") {
      return path === "/approval" || path.startsWith("/approval/");
    }

    /* ================= MASTER APPROVAL ================= */

    if (menu === "master-approval") {
      return (
        path === "/master-approvals" || path.startsWith("/master-approvals/")
      );
    }

    return false;
  };

  /* =========================================================
     HEADER TITLE
  ========================================================= */

  const getPageTitle = () => {
    const path = location.pathname;

    /* ================= DASHBOARD ================= */

    if (path === "/dashboard") {
      return {
        title: "Dashboard",
        description: "Overview sistem vendor",
      };
    }

    /* ================= LIST ALL VENDOR ================= */

    if (path === "/vendors/all" || path.startsWith("/vendors/all/")) {
      return {
        title: "All Vendor",
        description: "Kelola seluruh vendor",
      };
    }

    /* ================= NEW VENDOR ================= */

    if (path === "/vendors/add" || path.startsWith("/vendors/add/")) {
      return {
        title: "New Vendor",
        description: "Kelola pengajuan vendor baru",
      };
    }

    /* ================= EXISTING VENDOR ================= */

    if (path === "/vendors/existing" || path.startsWith("/vendors/existing/")) {
      return {
        title: "Existing Vendor",
        description: "Kelola perubahan data vendor yang sudah terdaftar",
      };
    }

    /* ================= APPROVAL ================= */

    if (path === "/approval" || path.startsWith("/approval/")) {
      return {
        title: "Approval",
        description: "Kelola proses approval vendor",
      };
    }

    /* ================= MASTER APPROVAL ================= */

    if (path === "/master-approvals" || path.startsWith("/master-approvals/")) {
      return {
        title: "Master Approval",
        description: "Kelola hak akses dan approval pengguna",
      };
    }

    /* ================= DEFAULT ================= */

    return {
      title: "Vendor System",
      description: "Vendor Management System",
    };
  };

  const page = getPageTitle();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="dashboard">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* ===================================================
            BRAND
        =================================================== */}

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

        {/* ===================================================
            SIDEBAR CONTENT
        =================================================== */}

        <div className="sidebar-content">
          {/* =================================================
              MAIN MENU
          ================================================= */}

          {sidebarOpen && <p className="menu-label">MAIN MENU</p>}

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <button
            type="button"
            className={`nav-item ${isActive("dashboard") ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <span className="nav-icon">▦</span>

            {sidebarOpen && <span>Dashboard</span>}
          </button>

          {/* =================================================
              VENDOR SYSTEM
          ================================================= */}

          {sidebarOpen && (
            <p className="menu-label menu-label-second">VENDOR SYSTEM</p>
          )}

          {/* =================================================
              LIST ALL VENDOR
          ================================================= */}

          <button
            type="button"
            className={`nav-item ${isActive("all-vendor") ? "active" : ""}`}
            onClick={() => navigate("/vendors/all")}
          >
            <span className="nav-icon">🏢</span>

            {sidebarOpen && <span>All Vendor</span>}
          </button>

          {/* =================================================
              NEW VENDOR
          ================================================= */}

          <button
            type="button"
            className={`nav-item ${isActive("new-vendor") ? "active" : ""}`}
            onClick={() => navigate("/vendors/add")}
          >
            <span className="nav-icon">🏢</span>

            {sidebarOpen && <span>New Vendor</span>}
          </button>

          {/* =================================================
              EXISTING VENDOR
          ================================================= */}

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

          {/* =================================================
              APPROVAL
              ================================================= */}

          <button
            type="button"
            className={`nav-item ${isActive("approval") ? "active" : ""}`}
            onClick={() => navigate("/approval")}
          >
            <span className="nav-icon">✓</span>

            {sidebarOpen && <span>Approval</span>}
          </button>



          {/* =================================================
              MASTER DATA
          ================================================= */}

          {sidebarOpen && (
            <p className="menu-label menu-label-second">MASTER DATA</p>
          )}

          {/* =================================================
              MASTER APPROVAL
          ================================================= */}

          <button
            type="button"
            className={`nav-item ${
              isActive("master-approval") ? "active" : ""
            }`}
            onClick={() => navigate("/master-approvals")}
          >
            <span className="nav-icon">⚙</span>

            {sidebarOpen && <span>Master Approval</span>}
          </button>
        </div>

        {/* ===================================================
            SIDEBAR FOOTER
        =================================================== */}

        <div className="sidebar-footer">
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>

            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">
        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <header className="top-header">
          <div className="header-left">
            {/* ================= SIDEBAR TOGGLE ================= */}

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            {/* ================= PAGE TITLE ================= */}

            <div>
              <h5>{page.title}</h5>

              <p>{page.description}</p>
            </div>
          </div>

          {/* =================================================
              HEADER RIGHT
          ================================================= */}

          <div className="header-right">
            <div className="header-profile">
              {/* ================= AVATAR ================= */}

              <div className="header-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>

              {/* ================= USER INFO ================= */}

              <div className="header-profile-text">
                <strong>{user?.name || "Administrator"}</strong>

                <span>{user?.role || "Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
