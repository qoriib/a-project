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
| CARD STATISTIK
|--------------------------------------------------------------------------
*/

  // Gabungkan vendor yang sudah terdaftar dan seluruh pengajuan CREATE.
  // Gunakan vendor_id agar satu vendor tidak dihitung berkali-kali.

  const allVendorIds = new Set();

  // Vendor dari tabel vendors
  vendors.forEach((vendor) => {
    if (vendor.id) {
      allVendorIds.add(`vendor-${vendor.id}`);
    }
  });

  // Vendor dari seluruh pengajuan
  vendorRequests.forEach((request) => {
    if (request.request_type !== "CREATE") return;

    if (request.vendor_id) {
      allVendorIds.add(`vendor-${request.vendor_id}`);
    } else {
      // Cadangan jika request belum memiliki vendor_id
      allVendorIds.add(`request-${request.id}`);
    }
  });

  const totalVendor = allVendorIds.size;

  const existingVendor = existingVendors.length;

  const pendingVendor = vendorRequests.filter((request) => {
    const status = (request.status || "").toLowerCase().trim();
    const stage = (request.current_stage || "").toUpperCase().trim();

    return (
      request.request_type === "CREATE" &&
      stage !== "COMPLETED" &&
      (status === "pending" || status === "under review")
    );
  }).length;

  const approvedVendor = vendorRequests.filter((request) => {
    return (
      request.request_type === "CREATE" &&
      (request.status || "").toLowerCase().trim() === "approved" &&
      (request.current_stage || "").toUpperCase().trim() === "COMPLETED"
    );
  }).length;

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
          <p className="welcome-small">ADMINISTRATOR</p>

          <h2>Selamat datang kembali, {userName}</h2>

          <p>Kelola dan pantau seluruh data vendor dalam sistem.</p>
        </div>

        <div className="welcome-actions">
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
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="row g-3 mb-4">
        {/* TOTAL VENDOR */}

        <div className="col-xl-3 col-md-6">
          <div className="stat-box">
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
          <div className="stat-box">
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
          <div className="stat-box">
            <div className="stat-top">
              <span className="stat-title">Pending Approval</span>

              <div className="stat-symbol pending-symbol">P</div>
            </div>

            <div className="stat-value">{pendingVendor}</div>

            <div className="stat-bottom">Vendor dalam proses</div>
          </div>
        </div>

        {/* APPROVED */}

        <div className="col-xl-3 col-md-6">
          <div className="stat-box">
            <div className="stat-top">
              <span className="stat-title">Approved Vendor</span>

              <div className="stat-symbol active-symbol">A</div>
            </div>

            <div className="stat-value">{approvedVendor}</div>

            <div className="stat-bottom">Vendor yang disetujui</div>
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
            onClick={() => navigate("/vendors/all")}
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

                <th>STATUS</th>

                <th>TERDAFTAR</th>
              </tr>
            </thead>

            <tbody>
              {latestVendors.length > 0 ? (
                latestVendors.map((vendor) => {
                  const status = getVendorStatus(vendor);

                  const vendorType = getVendorType(vendor);

                  return (
                    <tr key={vendor.id}>
                      {/* VENDOR */}

                      <td>
                        <div className="vendor-name">
                          <div className="vendor-avatar">
                            {vendor.nama_perusahaan?.charAt(0).toUpperCase()}
                          </div>

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

                      {/* STATUS */}

                      <td>
                        {status ? (
                          <span className={`status ${getStatusClass(status)}`}>
                            {status}
                          </span>
                        ) : (
                          <span className="status">-</span>
                        )}
                      </td>

                      {/* TANGGAL */}

                      <td>{formatDate(vendor.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
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
