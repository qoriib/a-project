import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ibsLogo from "../../assets/ibsw.png";
import { API_BASE_URL } from "../../api/config";
import "./Login.css";

const QUICK_TEST_ACCOUNTS = [
  {
    role: "Requester (SCM)",
    name: "Fajar Nugraha",
    email: "test.requester@ibs.test",
  },
  {
    role: "Asisten Kadiv (L1)",
    name: "Dwi Handayani, S.T.",
    email: "test.asisten@ibs.test",
  },
  {
    role: "Kadiv SCM (L2)",
    name: "Hendro Prasetyo, S.T.",
    email: "test.kadiv@ibs.test",
  },
  {
    role: "Accounting (L3)",
    name: "Bambang Sudarsono, S.E.",
    email: "test.accounting@ibs.test",
  },
  {
    role: "Tax (L4)",
    name: "Citra Anggraini, S.E.",
    email: "test.tax@ibs.test",
  },
  {
    role: "SAP Team (L5)",
    name: "Rizky Pratama, M.Kom.",
    email: "test.sap@ibs.test",
  },
  {
    role: "Requester (BR)",
    name: "Dimas Anggara",
    email: "test.requester.br@ibs.test",
  },
  {
    role: "Administrator",
    name: "Admin Testing IBS",
    email: "admin@ibs.test",
  },
];

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSelectQuickAccount = (accountEmail) => {
    setEmail(accountEmail);
    setPassword("password");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Email atau password yang Anda masukkan tidak sesuai.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Tidak dapat terhubung ke server backend. Pastikan server berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Decorative ambient background spots */}
      <div className="login-bg-decor-1" aria-hidden="true" />
      <div className="login-bg-decor-2" aria-hidden="true" />

      <div className="login-container">
        <div className="login-card">
          {/* Accent top stripe matching IBS Brand */}
          <div className="login-card-stripe" />

          <div className="login-card-body">
            {/* Brand Header */}
            <div className="login-brand-header">
              <div className="login-logo-container">
                <img src={ibsLogo} alt="IBS Logo" className="login-logo-img" />
              </div>

              <div className="login-brand-title">
                <span className="login-brand-main">IBS</span>
                <span className="login-brand-sub">Vendor</span>
              </div>

              <p className="login-eyebrow">Vendor Management System</p>
              <p className="login-subtitle">
                Masuk ke akun Anda untuk mengelola registrasi & approval vendor
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="login-alert-error" role="alert">
                <span className="login-alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} noValidate>
              {/* Email Input */}
              <div className="login-form-group">
                <label className="login-label" htmlFor="login-email">
                  Alamat Email
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>

                  <input
                    id="login-email"
                    type="email"
                    className="login-input"
                    placeholder="nama@ibs.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-form-group">
                <label className="login-label" htmlFor="login-password">
                  Kata Sandi
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    <span>Memproses Autentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Quick Testing Accounts Section */}
            <div className="login-demo-section">
              <button
                type="button"
                className="login-demo-toggle"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              >
                <span>Pilih Akun Uji Coba Cepat</span>
                <span className="login-demo-badge">
                  {showDemoAccounts ? "Tutup ▲" : "8 Peran Tersedia ▼"}
                </span>
              </button>

              {showDemoAccounts && (
                <div className="login-demo-grid">
                  {QUICK_TEST_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.email}
                      className={`login-demo-pill ${email === acc.email ? "active" : ""}`}
                      onClick={() => handleSelectQuickAccount(acc.email)}
                    >
                      <span className="login-demo-role">{acc.role}</span>
                      <span className="login-demo-name">{acc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            &copy; {new Date().getFullYear()} PT Inti Bangun Sejahtera Tbk. All rights reserved.
          </p>
          <div className="login-footer-security">
            <span>🔒 Enterprise System & Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
