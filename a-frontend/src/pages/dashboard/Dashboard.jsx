import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function Dashboard() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [vendorRequests, setVendorRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const token = localStorage.getItem("token");

      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const headers = getAuthHeaders(false);

        // Ambil data vendor
        const vendorResponse = await fetch(`${API_BASE_URL}/vendors`, {
          method: "GET",
          headers,
        });

        const vendorData = await vendorResponse.json();

        if (!vendorResponse.ok) {
          throw new Error(vendorData.message || "Gagal mengambil data vendor.");
        }

        const vendorList = Array.isArray(vendorData)
          ? vendorData
          : Array.isArray(vendorData.data)
            ? vendorData.data
            : Array.isArray(vendorData.vendors)
              ? vendorData.vendors
              : [];

        setVendors(vendorList);

        // Ambil seluruh pengajuan vendor
        const requestResponse = await fetch(`${API_BASE_URL}/vendor-requests`, {
          method: "GET",
          headers,
        });

        const requestData = await requestResponse.json();

        if (!requestResponse.ok) {
          throw new Error(
            requestData.message || "Gagal mengambil data pengajuan.",
          );
        }

        const requestList = Array.isArray(requestData)
          ? requestData
          : Array.isArray(requestData.data)
            ? requestData.data
            : [];

        setVendorRequests(requestList);

        console.log("Data vendor:", vendorList);
        console.log("Data vendor requests:", requestList);
      } catch (error) {
        console.error("Error dashboard:", error);

        setVendors([]);
        setVendorRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | USER LOGIN
  |--------------------------------------------------------------------------
  */

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const userName = user?.name || user?.nama || user?.nama_lengkap || "User";

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

  const isAccounting = userRole === "ACCOUNTING";
  const isTax = userRole === "TAX";
  const isSap = userRole === "SAP";

  /*
  |--------------------------------------------------------------------------
  | WARNA DONUT CHART
  |--------------------------------------------------------------------------
  */

  const chartColors = [
    "#6750A4",
    "#4776E6",
    "#19A7A0",
    "#F0A23B",
    "#E66B83",
    "#6482AD",
    "#8B79C6",
    "#8A969F",
  ];

  /*
|--------------------------------------------------------------------------
| DONUT CHART KATEGORI VENDOR
|--------------------------------------------------------------------------
*/

  // Gabungkan data vendor dan pengajuan CREATE.
  // Hindari menghitung vendor yang sama lebih dari satu kali.

  const categoryVendorMap = new Map();

  // 1. Ambil seluruh vendor yang sudah terdaftar
  vendors.forEach((vendor) => {
    if (!vendor.id) return;

    const categoryName =
      vendor.kategori?.name ||
      vendor.kategori?.nama ||
      vendor.kategori_other ||
      "Belum Dikategorikan";

    categoryVendorMap.set(String(vendor.id), categoryName);
  });

  // 2. Ambil pengajuan New yang belum tercatat di vendors
  vendorRequests.forEach((request) => {
    if (request.request_type !== "CREATE") return;

    const vendor = request.vendor;

    if (!vendor?.id) return;

    const vendorId = String(vendor.id);

    // Jangan menimpa data yang sudah diambil dari vendors
    if (categoryVendorMap.has(vendorId)) return;

    const categoryName =
      vendor.kategori?.name ||
      vendor.kategori?.nama ||
      vendor.kategori_other ||
      "Belum Dikategorikan";

    categoryVendorMap.set(vendorId, categoryName);
  });

  // 3. Hitung jumlah berdasarkan kategori
  const categoryCount = {};

  categoryVendorMap.forEach((categoryName) => {
    categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
  });

  // 4. Format data untuk Recharts
  const vendorCategoryData = Object.entries(categoryCount)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // 5. Total seluruh vendor pada Pie Chart
  const totalCategoryVendors = vendorCategoryData.reduce(
    (total, item) => total + item.value,
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | PISAHKAN EXISTING DAN NEW
  |--------------------------------------------------------------------------
  */

  const existingVendors = vendors.filter(
    (vendor) => vendor.source_type === "EXISTING",
  );

  const newVendors = vendors.filter((vendor) => vendor.source_type === "NEW");

  /*
  |--------------------------------------------------------------------------
  | AMBIL STATUS VENDOR
  |--------------------------------------------------------------------------
  |
  | Existing:
  | Tidak menggunakan workflow status.
  |
  | New:
  | Status berasal dari vendor request terbaru.
  |
  */

  const getVendorStatus = (vendor) => {
    if (vendor.source_type === "EXISTING") {
      return null;
    }

    return (
      vendor.latest_request?.status || vendor.latestRequest?.status || null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CLASS STATUS
  |--------------------------------------------------------------------------
  */

  const getStatusClass = (status) => {
    if (!status) {
      return "";
    }

    return status.toLowerCase().replace(/\s+/g, "-");
  };

  /*
  |--------------------------------------------------------------------------
  | JENIS VENDOR
  |--------------------------------------------------------------------------
  */

  const getVendorType = (vendor) => {
    if (vendor.source_type === "EXISTING") {
      return "Existing";
    }

    return "New";
  };

  /*
  |--------------------------------------------------------------------------
  | CARD STATISTIK (SESUAI ROLE USER)
  |--------------------------------------------------------------------------
  */

  // 1. Cek apakah pengajuan sudah disetujui / completed
  const isRequestApproved = (request) => {
    const stage = String(request.current_stage || "").toUpperCase().trim();
    const status = String(request.status || "").toUpperCase().trim();

    return (
      stage === "COMPLETED" ||
      status === "COMPLETED" ||
      status === "APPROVED" ||
      status === "DONE"
    );
  };

  // 2. Cek apakah pengajuan sedang aktif dalam antrean approval
  const isRequestPending = (request) => {
    const stage = String(request.current_stage || "").toUpperCase().trim();
    const status = String(request.status || "").toUpperCase().trim();

    if (isRequestApproved(request)) return false;
    if (stage === "REJECTED" || status === "REJECTED") return false;

    return (
      [
        "REQUESTER",
        "ASISTEN_KADIV",
        "KADIV",
        "ACCOUNTING",
        "TAX",
        "SAP",
      ].includes(stage) ||
      [
        "PENDING_L1",
        "PENDING_L2",
        "PENDING_L3",
        "PENDING_L4",
        "PENDING_L5",
        "FORM_APPROVED",
        "DRAFT",
        "IN_PROGRESS",
        "PENDING",
        "UNDER REVIEW",
      ].includes(status)
    );
  };

  // 3. Cek apakah pengajuan diajukan oleh user saat ini
  const isUserRequest = (request) => {
    if (!user) return false;

    const userEmail = String(user.email || "").toLowerCase().trim();
    const userNik = String(user.nik || "").replace(/\D/g, "");
    const userId = Number(user.id);

    const reqEmail = String(
      request.requested_by_email || request.requester?.email || ""
    )
      .toLowerCase()
      .trim();
    const reqNik = String(
      request.requested_by_nik || request.requester?.nik || ""
    ).replace(/\D/g, "");
    const creatorId = Number(request.vendor?.created_by);

    if (userEmail && reqEmail && userEmail === reqEmail) return true;
    if (userNik && reqNik && userNik === reqNik) return true;
    if (userId && creatorId && userId === creatorId) return true;

    if (
      user.division &&
      request.requester?.division &&
      user.division === request.requester?.division
    ) {
      return true;
    }

    return false;
  };

  // 4. Identifikasi stage approver
  const roleStageMap = {
    ASISTEN_KADIV: "ASISTEN_KADIV",
    KADIV: "KADIV",
    ACCOUNTING: "ACCOUNTING",
    TAX: "TAX",
    SAP: "SAP",
  };

  const approverStage = roleStageMap[userRole] || null;

  // 5. Kumpulan data pengajuan
  const allPendingRequests = vendorRequests.filter(isRequestPending);
  const allApprovedRequests = vendorRequests.filter(isRequestApproved);

  const myRequests = vendorRequests.filter(isUserRequest);
  const myPendingRequests = myRequests.filter(isRequestPending);
  const myApprovedRequests = myRequests.filter(isRequestApproved);

  const stagePendingRequests = approverStage
    ? allPendingRequests.filter(
        (req) =>
          String(req.current_stage || "").toUpperCase().trim() === approverStage
      )
    : [];

  // 6. Hitung Total Vendor & Existing Vendor
  const allVendorIds = new Set();
  vendors.forEach((vendor) => {
    if (vendor.id) {
      allVendorIds.add(`vendor-${vendor.id}`);
    }
  });

  vendorRequests.forEach((request) => {
    if (request.request_type !== "CREATE") return;
    if (request.vendor_id) {
      allVendorIds.add(`vendor-${request.vendor_id}`);
    } else {
      allVendorIds.add(`request-${request.id}`);
    }
  });

  const totalVendor = allVendorIds.size;
  const existingVendor = existingVendors.length;

  // 7. Hitung Pending & Approved berdasarkan role user
  let pendingVendor = allPendingRequests.length;
  let pendingSubtitle = "Seluruh vendor dalam proses";
  let approvedVendor = allApprovedRequests.length;
  let approvedSubtitle = "Vendor yang disetujui";

  if (isAdmin) {
    pendingVendor = allPendingRequests.length;
    pendingSubtitle = "Seluruh antrean workflow";
    approvedVendor = allApprovedRequests.length;
    approvedSubtitle = "Seluruh vendor disetujui";
  } else if (approverStage) {
    // Role Approver: Menampilkan antrean yang menunggu di tahapan approver bersangkutan
    pendingVendor = stagePendingRequests.length;
    pendingSubtitle =
      stagePendingRequests.length > 0
        ? `Menunggu approval Anda (${stagePendingRequests.length} dari ${allPendingRequests.length} antrean)`
        : `Tidak ada antrean tahap Anda (${allPendingRequests.length} total antrean)`;
    approvedVendor = allApprovedRequests.length;
    approvedSubtitle = "Total vendor disetujui";
  } else if (isRequester) {
    // Role Requester: Menampilkan pengajuan milik requester yang sedang dalam proses
    const hasMyRequests = myRequests.length > 0;
    pendingVendor = hasMyRequests
      ? myPendingRequests.length
      : allPendingRequests.length;
    pendingSubtitle = hasMyRequests
      ? `Pengajuan Anda dalam proses (${myPendingRequests.length} dari ${allPendingRequests.length} antrean)`
      : `Vendor dalam proses (${allPendingRequests.length} antrean)`;
    approvedVendor = hasMyRequests
      ? myApprovedRequests.length
      : allApprovedRequests.length;
    approvedSubtitle = hasMyRequests
      ? `Pengajuan Anda disetujui (${allApprovedRequests.length} total vendor)`
      : `Vendor yang disetujui`;
  }

  /*
  |--------------------------------------------------------------------------
  | DATA PERTUMBUHAN VENDOR
  |--------------------------------------------------------------------------
  */

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const monthlyCount = {};

  vendors.forEach((vendor) => {
    if (!vendor.created_at) {
      return;
    }

    const date = new Date(vendor.created_at);

    const month = monthNames[date.getMonth()];

    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  });

  const vendorGrowthData = monthNames.map((month) => ({
    month,
    vendor: monthlyCount[month] || 0,
  }));

  /*
  |--------------------------------------------------------------------------
  | VENDOR TERBARU
  |--------------------------------------------------------------------------
  */

  const latestVendors = [...vendors]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0);

      const dateB = new Date(b.created_at || 0);

      return dateB - dateA;
    })
    .slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="page-content">
        <div className="content-card">
          <div className="card-header-custom">
            <h5>Memuat dashboard...</h5>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */

  return (
    <div className="page-content">
      {/* =====================================================
          WELCOME
      ===================================================== */}

      <div className="welcome-section">
        <div>
          <p className="welcome-small">
            {isAdmin
              ? "PORTAL ADMINISTRATOR"
              : isApprover
              ? "PORTAL APPROVAL WORKFLOW"
              : "PORTAL PENGADAAN & VENDOR"}
          </p>

          <h2>Selamat datang kembali, {userName}</h2>

          <p>
            {isAdmin
              ? "Kelola dan pantau seluruh data vendor, pengguna, dan alur persetujuan sistem."
              : isApprover
              ? "Pantau dan proses antrean verifikasi serta persetujuan vendor pada tahapan Anda."
              : "Kelola pengajuan vendor baru dan pantau status persetujuan vendor."}
          </p>
        </div>

        <div className="welcome-actions">
          {/* Untuk Administrator: Hanya tombol User Management, navigasi lain cukup lewat sidemenu */}
          {isAdmin ? (
            <button
              type="button"
              className="dashboard-action-btn user-management-button"
              onClick={() => navigate("/user")}
            >
              <span className="dashboard-btn-icon">
                <i className="bi bi-people-fill"></i>
              </span>
              <span>User Management</span>
              <i className="bi bi-arrow-up-right dashboard-btn-arrow"></i>
            </button>
          ) : (
            <>
              {/* Untuk Requester: Tambah Vendor & Existing Vendor */}
              {isRequester && (
                <>
                  <button
                    type="button"
                    className="dashboard-action-btn existing-vendor-button"
                    onClick={() => navigate("/vendors/existing")}
                  >
                    <span className="dashboard-btn-icon">
                      <i className="bi bi-database"></i>
                    </span>
                    <span>Existing Vendor</span>
                    <i className="bi bi-arrow-up-right dashboard-btn-arrow"></i>
                  </button>

                  <button
                    type="button"
                    className="dashboard-action-btn add-vendor-button"
                    onClick={() => navigate("/vendors/add")}
                  >
                    <span className="dashboard-btn-icon">
                      <i className="bi bi-plus-lg"></i>
                    </span>
                    <span>Tambah Vendor</span>
                    <i className="bi bi-arrow-up-right dashboard-btn-arrow"></i>
                  </button>
                </>
              )}

              {/* Untuk Approver: Tombol Cepat ke Antrean Approval */}
              {isApprover && (
                <button
                  type="button"
                  className="dashboard-action-btn approval-vendor-button"
                  onClick={() => navigate("/approval")}
                >
                  <span className="dashboard-btn-icon">
                    <i className="bi bi-check2-circle"></i>
                  </span>
                  <span>Proses Approval</span>
                  <i className="bi bi-arrow-up-right dashboard-btn-arrow"></i>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="row g-3 mb-4">
        {/* TOTAL VENDOR */}

        <div className="col-xl-3 col-md-6">
          <div
            className="stat-box"
            onClick={() => navigate("/vendors")}
            title="Klik untuk melihat daftar vendor"
          >
            <div className="stat-top">
              <span className="stat-title">Total Vendor</span>

              <div className="stat-symbol total-symbol">V</div>
            </div>

            <div className="stat-value">{totalVendor}</div>

            <div className="stat-bottom">Seluruh vendor</div>
          </div>
        </div>

        {/* EXISTING VENDOR */}

        <div className="col-xl-3 col-md-6">
          <div
            className="stat-box"
            onClick={() => navigate("/vendors/existing")}
            title="Klik untuk melihat existing vendor"
          >
            <div className="stat-top">
              <span className="stat-title">Existing Vendor</span>

              <div className="stat-symbol active-symbol">E</div>
            </div>

            <div className="stat-value">{existingVendor}</div>

            <div className="stat-bottom">Vendor existing</div>
          </div>
        </div>

        {/* PENDING APPROVAL */}

        <div className="col-xl-3 col-md-6">
          <div
            className="stat-box"
            onClick={() => navigate("/approval")}
            title="Klik untuk melihat antrean approval"
          >
            <div className="stat-top">
              <span className="stat-title">Pending Approval</span>

              <div className="stat-symbol pending-symbol">P</div>
            </div>

            <div className="stat-value">{pendingVendor}</div>

            <div className="stat-bottom">{pendingSubtitle}</div>
          </div>
        </div>

        {/* APPROVED */}

        <div className="col-xl-3 col-md-6">
          <div
            className="stat-box"
            onClick={() => navigate("/approval?tab=HISTORY")}
            title="Klik untuk melihat riwayat vendor disetujui"
          >
            <div className="stat-top">
              <span className="stat-title">Approved Vendor</span>

              <div className="stat-symbol active-symbol">A</div>
            </div>

            <div className="stat-value">{approvedVendor}</div>

            <div className="stat-bottom">{approvedSubtitle}</div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <div className="row g-3 mb-4">
        {/* ===================================================
            PIE CHART
        =================================================== */}

        {/* ===================================================
                DONUT CHART KATEGORI VENDOR
            =================================================== */}

        <div className="col-12">
          <div className="content-card chart-card category-donut-card">
            <div className="card-header-custom">
              <div>
                <h5>Vendor berdasarkan Kategori</h5>
                <p>Distribusi vendor menurut kategori perusahaan</p>
              </div>
            </div>

            <div className="category-donut-content">
              {vendorCategoryData.length > 0 ? (
                <>
                  <div className="category-donut-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorCategoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="64%"
                          outerRadius="88%"
                          paddingAngle={3}
                          cornerRadius={5}
                          stroke="none"
                          isAnimationActive={true}
                          animationDuration={700}
                        >
                          {vendorCategoryData.map((entry, index) => (
                            <Cell
                              key={`category-${entry.name}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value, name) => {
                            const percentage = totalCategoryVendors
                              ? (
                                (Number(value) / totalCategoryVendors) *
                                100
                              ).toFixed(1)
                              : "0.0";

                            return [`${value} vendor (${percentage}%)`, name];
                          }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e8eaf0",
                            boxShadow: "0 8px 24px rgba(30, 41, 59, 0.10)",
                            padding: "10px 14px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="category-donut-center">
                      <span className="category-donut-center-label">
                        Total Vendor
                      </span>
                      <strong>{totalCategoryVendors}</strong>
                      <span className="category-donut-center-caption">
                        Terdaftar
                      </span>
                    </div>
                  </div>

                  <div className="category-donut-legend">
                    {vendorCategoryData.map((item, index) => {
                      const percentage = totalCategoryVendors
                        ? ((item.value / totalCategoryVendors) * 100).toFixed(1)
                        : "0.0";

                      return (
                        <div className="category-legend-item" key={item.name}>
                          <span
                            className="category-legend-dot"
                            style={{
                              backgroundColor:
                                chartColors[index % chartColors.length],
                            }}
                          />

                          <div className="category-legend-info">
                            <span
                              className="category-legend-name"
                              title={item.name}
                            >
                              {item.name}
                            </span>

                            <span className="category-legend-percentage">
                              {percentage}%
                            </span>
                          </div>

                          <strong className="category-legend-count">
                            {item.value}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="category-donut-empty">
                  <div className="category-donut-empty-icon">◔</div>
                  <strong>Belum ada data kategori</strong>
                  <span>Data kategori vendor akan ditampilkan di sini.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            LINE CHART
        =================================================== */}

        <div className="col-12">
          <div className="content-card chart-card">
            <div className="card-header-custom">
              <div>
                <h5>Pertumbuhan Vendor</h5>

                <p>Jumlah vendor berdasarkan bulan</p>
              </div>
            </div>

            <div className="category-chart">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vendorGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="vendor"
                    stroke="#764ba2"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          VENDOR TERBARU
      ===================================================== */}

      <div className="content-card">
        <div className="card-header-custom">
          <div>
            <h5>Vendor Terbaru</h5>

            <p>Vendor yang terakhir terdaftar dalam sistem</p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => navigate("/vendors/existing")}
          >
            Lihat Semua
          </button>
        </div>

        <div className="table-responsive">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>VENDOR</th>

                <th>VENDOR CODE</th>

                <th>JENIS</th>

                <th>EMAIL</th>

                <th>TERDAFTAR</th>
              </tr>
            </thead>

            <tbody>
              {latestVendors.length > 0 ? (
                latestVendors.map((vendor) => {
                  const vendorType = getVendorType(vendor);

                  return (
                    <tr key={vendor.id}>
                      {/* VENDOR */}

                      <td>
                        <div className="vendor-name">
                          <strong>{vendor.nama_perusahaan}</strong>
                        </div>
                      </td>

                      {/* VENDOR CODE */}

                      <td>{vendor.vendor_code || "-"}</td>

                      {/* JENIS */}

                      <td>
                        <span
                          className={`status ${vendor.source_type === "EXISTING"
                              ? "existing"
                              : "new"
                            }`}
                        >
                          {vendorType}
                        </span>
                      </td>

                      {/* EMAIL */}

                      <td>{vendor.email || "-"}</td>

                      {/* TANGGAL */}

                      <td>{formatDate(vendor.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Belum ada vendor
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

export default Dashboard;
