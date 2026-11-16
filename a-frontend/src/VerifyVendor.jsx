import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./VerifyVendor.css";
import ibsLogo from "./assets/ibsw.png";

const API_URL = "http://localhost:8000/api";

function VerifyVendor() {
  const { token } = useParams();
 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function verifyToken() {
      try {
        setLoading(true);
        setError("");
        setData(null);

        const response = await fetch(
          `${API_URL}/vendor-verifications/${encodeURIComponent(token)}`,
          {
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Verifikasi QR Code gagal."
          );
        }

        setData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Tidak dapat menghubungi server."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    verifyToken();

    return () => controller.abort();
  }, [token]);

  // Tampilan ketika sedang memverifikasi QR Code.
  if (loading) {
    return (
      <main className="verify-page">
        <section className="verify-card text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            aria-label="Memverifikasi"
          />

          <p className="mt-3 mb-0">
            Memverifikasi QR Code...
          </p>
        </section>
      </main>
    );
  }

  // Tampilan jika token tidak valid atau verifikasi gagal.
  if (error || !data || !data.valid) {
    return (
      <main className="verify-page">
        <section className="verify-card text-center">
          <div className="verify-icon verify-invalid">
            ✕
          </div>

          <h3 className="verify-title">
            Verifikasi Gagal
          </h3>

          <p>
            {error || "Data verifikasi tidak ditemukan."}
          </p>

          <p className="text-muted small mb-0">
            Periksa kembali QR Code atau hubungi administrator.
          </p>
        </section>
      </main>
    );
  }

  const approval = data.approval;
  const vendor = data.vendor;
  const request = data.request;

  const approvalStatus = (
    approval?.status || ""
  ).toUpperCase();

  const approved = approvalStatus === "APPROVED";
  const rejected = approvalStatus === "REJECTED";

  // Format tanggal berdasarkan zona waktu WIB.
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Format jam approval berdasarkan zona waktu WIB.
  const formatTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return (
      parsedDate.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " WIB"
    );
  };

  return (
    <main className="verify-page">
      <section className="verify-card">
        {/* Header */}
        <div className="text-center">
          <img
            src={ibsLogo}
            alt="Logo IBS"
            className="verify-logo"
          />

          <h3 className="verify-title">
            Verifikasi Approval Vendor
          </h3>

          <p className="text-muted">
            PT. Infrastruktur Bisnis Sejahtera
          </p>

          <div
            className={`verify-status ${
              approved
                ? "verify-status-approved"
                : rejected
                ? "verify-status-rejected"
                : "verify-status-pending"
            }`}
          >
            <span className="verify-status-icon">
              {approved ? "✓" : rejected ? "✕" : "!"}
            </span>

            {approved
              ? "APPROVED"
              : rejected
              ? "REJECTED"
              : approval?.status || "MENUNGGU"}
          </div>
        </div>

        <hr />

        {/* Informasi vendor */}
        <h6 className="verify-section-title">
          Informasi Approval Vendor
        </h6>

        <div className="verify-row">
          <span>No. Request</span>
          <strong>
            {request?.form_number || "-"}
          </strong>
        </div>

        <div className="verify-row">
          <span>Nama Vendor</span>
          <strong>
            {vendor?.name || "-"}
          </strong>
        </div>

        <div className="verify-row">
          <span>Nama Approval</span>
          <strong>
            {approval?.approver || "-"}
          </strong>
        </div>

        {/* Tanggal dan waktu approval */}
        <div className="verify-row">
          <span>Tanggal Approve</span>
          <strong>
            {formatDate(approval?.acted_at)}
          </strong>
        </div>

        <div className="verify-row">
          <span>Waktu Approve</span>
          <strong>
            {formatTime(approval?.acted_at)}
          </strong>
        </div>

        <div className="verify-row">
          <span>Tahap Approval</span>
          <strong>
            {approval?.stage || "-"}
          </strong>
        </div>

        <div className="verify-row">
          <span>Status Approval</span>
          <strong
            className={
              approved
                ? "text-success"
                : rejected
                ? "text-danger"
                : "text-warning"
            }
          >
            {approval?.status || "-"}
          </strong>
        </div>

        <hr />

        <p className="verify-footer">
          Dokumen ini menampilkan hasil verifikasi untuk satu
          tahap approval berdasarkan data yang tercatat pada
          sistem Vendor System.
        </p>
      </section>
    </main>
  );
}

export default VerifyVendor;
