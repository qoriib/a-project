import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import ibsLogo from "./assets/ibsw.png";

function Login() {
  console.log("LOGIN COMPONENT RENDER");

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("FORM SUBMIT");
    console.log("Email:", email);

    setError("");
    setLoading(true);

    try {
      console.log("Mengirim request login...");

      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login berhasil");
      console.log("User:", data.user);

      navigate("/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 w-100 d-flex justify-content-center align-items-center"
      style={{
        background: "linear-gradient(135deg)",
      }}
    >
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4">
                {/* HEADER */}
                <div className="text-center mb-3">
                  <div
                    className="mx-auto mb-3 d-flex justify-content-center align-items-center"
                    style={{
                      width: "100px",
                      height: "100px",
                    }}
                  >
                    <img
                      src={ibsLogo}
                      alt="IBS Logo"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <h2 className="fw-bold mb-2">Sign In</h2>

                  <p className="text-muted mb-0">
                    Acces the HRIS using your email and password
                  </p>
                </div>

                {/* FORM LOGIN */}
                <form className="text-start" onSubmit={handleLogin}>
                  {/* EMAIL */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold">Email</label>

                    <input
                      type="email"
                      className="form-control"
                      placeholder="Masukkan email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      required
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold">Password</label>

                    <input
                      type="password"
                      className="form-control"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      required
                    />
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="alert alert-danger py-2 mt-2 mb-2">
                      {error}
                    </div>
                  )}

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white fw-semibold"
                    disabled={loading}
                    style={{
                      background: "linear-gradient(135deg, #0168E7)",
                      border: "none",
                    }}
                  >
                    {loading ? "Memproses..." : "Login"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
