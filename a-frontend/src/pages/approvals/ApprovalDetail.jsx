import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../vendors/ExistingVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("user");

  let user = null;

  if (storedUser && storedUser !== "undefined") {
    try {
      user = JSON.parse(storedUser);
    } catch (err) {
      console.error("Data user tidak valid:", err);
    }
  }

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}`,
        {
          headers: getAuthHeaders(false),
        }
      );

      if (!response.ok) {
        throw new Error("Data approval tidak ditemukan");
      }

      const result = await response.json();

      console.log("Approval detail:", result);

      setRequest(result.data ?? result);
    } catch (err) {
      console.error("Error fetch approval detail:", err);
      setError(err.message || "Gagal mengambil data approval");
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case "REQUESTER":
        return "Procurement";
      case "KADIV":
        return "Kadiv";
      case "ACCOUNTING":
        return "Accounting";
      case "TAX":
        return "Tax";
      case "SAP":
        return "SAP";
      case "COMPLETED":
        return "Completed";
      default:
        return stage || "-";
    }
  };

  const getStageClass = (stage) => {
    switch (stage) {
      case "REQUESTER":
        return "requester";
      case "KADIV":
        return "kadiv";
      case "ACCOUNTING":
        return "accounting";
      case "TAX":
        return "tax";
      case "SAP":
        return "sap";
      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    if (status === "Pending") {
      return "pending";
    }

    if (status === "Under Review") {
      return "under-review";
    }

    if (status === "Approved") {
      return "approved";
    }

    return "";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleBack = () => {
    navigate("/approval");
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="content-card">
          <div className="empty-state">
            <p>Memuat detail approval...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="content-card">
          <div className="empty-state">
            <p>{error}</p>

            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={handleBack}
            >
              Kembali ke Approval
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-content">
        <div className="content-card">
          <div className="empty-state">
            <p>Data approval tidak ditemukan.</p>

            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={handleBack}
            >
              Kembali ke Approval
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vendor = request.vendor || {};

  const currentStage = request.current_stage;
  const status = request.status;

  return (
    <div className="page-content">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h4>Approval Detail</h4>
          <p>Detail proses pengajuan vendor</p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleBack}
        >
          ← Kembali
        </button>
      </div>

      {/* REQUEST INFORMATION */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>Informasi Pengajuan</h5>
            <p>Informasi utama pengajuan vendor</p>
          </div>

          <div className="approval-badge-wrapper">
            <span
              className={`approval-stage ${getStageClass(currentStage)}`}
            >
              {getStageLabel(currentStage)}
            </span>

            <span
              className={`status-badge ${getStatusClass(status)}`}
            >
              {status || "-"}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Request ID</label>
            <span>#{request.id}</span>
          </div>

          <div className="detail-item">
            <label>Request Type</label>
            <span>{request.request_type || "CREATE"}</span>
          </div>

          <div className="detail-item">
            <label>Current Stage</label>
            <span>{getStageLabel(currentStage)}</span>
          </div>

          <div className="detail-item">
            <label>Status</label>
            <span>{status || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Requested By</label>
            <span>{request.requested_by || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Submitted At</label>
            <span>{formatDate(request.submitted_at)}</span>
          </div>

          <div className="detail-item">
            <label>Created At</label>
            <span>{formatDate(request.created_at)}</span>
          </div>

          <div className="detail-item">
            <label>Completed At</label>
            <span>{formatDate(request.completed_at)}</span>
          </div>
        </div>
      </div>

      {/* VENDOR INFORMATION */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>Informasi Vendor</h5>
            <p>Data utama vendor</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Nama Perusahaan</label>
            <span>{vendor.nama_perusahaan || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Vendor Code</label>
            <span>{vendor.vendor_code || "Belum ada"}</span>
          </div>

          <div className="detail-item">
            <label>Search Term</label>
            <span>{vendor.search_term || "-"}</span>
          </div>

          <div className="detail-item">
            <label>PIC Vendor</label>
            <span>{vendor.pic_vendor || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Email</label>
            <span>{vendor.email || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Telephone</label>
            <span>{vendor.phone || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Fax</label>
            <span>{vendor.fax || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Business Type</label>
            <span>{vendor.business_type || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Kategori</label>
            <span>
              {vendor.kategori?.name ||
                vendor.kategori?.nama ||
                vendor.kategori_other ||
                "-"}
            </span>
          </div>

          <div className="detail-item">
            <label>NPWP</label>
            <span>{vendor.npwp || "-"}</span>
          </div>
        </div>
      </div>

      {/* ADDRESS */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>Alamat Vendor</h5>
            <p>Informasi alamat perusahaan</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Street Address</label>
            <span>{vendor.street_address || "-"}</span>
          </div>

          <div className="detail-item">
            <label>City</label>
            <span>{vendor.city || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Postal Code</label>
            <span>{vendor.postal_code || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Country</label>
            <span>{vendor.country || "-"}</span>
          </div>
        </div>
      </div>

      {/* ACCOUNTING */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>Accounting</h5>
            <p>Informasi accounting vendor</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Account Group</label>
            <span>
              {vendor.account_group?.name ||
                vendor.account_group?.code ||
                vendor.account_group_id ||
                "-"}
            </span>
          </div>

          <div className="detail-item">
            <label>Recon Account</label>
            <span>
              {vendor.recon_account?.name ||
                vendor.recon_account?.code ||
                vendor.recon_account_id ||
                "-"}
            </span>
          </div>

          <div className="detail-item">
            <label>Payment Method</label>
            <span>{vendor.payment_method || "Transfer"}</span>
          </div>

          <div className="detail-item">
            <label>Due Date Payment</label>
            <span>
              {vendor.due_date_payment ||
                vendor.payment_term?.name ||
                vendor.payment_term_id ||
                "-"}
            </span>
          </div>

          <div className="detail-item">
            <label>Order Currency</label>
            <span>{vendor.order_currency || "-"}</span>
          </div>
        </div>
      </div>

      {/* TAX */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>Tax</h5>
            <p>Informasi pajak vendor</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Withholding Tax Type</label>
            <span>{vendor.withholding_tax_type || "-"}</span>
          </div>

          <div className="detail-item">
            <label>Withholding Tax Code</label>
            <span>{vendor.withholding_tax_code || "-"}</span>
          </div>
        </div>
      </div>

      {/* SAP */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <div>
            <h5>SAP</h5>
            <p>Informasi SAP vendor</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Vendor Code</label>
            <span>{vendor.vendor_code || "Belum diberikan SAP"}</span>
          </div>

          <div className="detail-item">
            <label>Source Type</label>
            <span>{vendor.source_type || "NEW"}</span>
          </div>
        </div>
      </div>

      {/* ACTION */}
      <div className="content-card">
        <div className="card-header-custom">
          <div>
            <h5>Proses Approval</h5>
            <p>Tahap proses pengajuan saat ini</p>
          </div>
        </div>

        <div className="approval-action-box">
          <div>
            <strong>Tahap Saat Ini</strong>
            <p className="mb-0">
              Pengajuan sedang berada pada tahap{" "}
              <strong>{getStageLabel(currentStage)}</strong>.
            </p>
          </div>

          <div className="mt-3">
            {currentStage === "REQUESTER" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/procurement/${id}`)}
              >
                Proses Procurement
              </button>
            )}

            {(currentStage === "ASISTEN_KADIV" || currentStage === "KADIV") && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/vendor-requests/${id}`)}
              >
                Proses Approval {currentStage === "ASISTEN_KADIV" ? "Asisten Kadiv" : "Kadiv"}
              </button>
            )}

            {currentStage === "ACCOUNTING" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/account/${id}`)}
              >
                Proses Accounting
              </button>
            )}

            {currentStage === "TAX" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/tax/${id}`)}
              >
                Proses Tax
              </button>
            )}

            {currentStage === "SAP" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/sap/${id}`)}
              >
                Proses SAP
              </button>
            )}

            {currentStage === "COMPLETED" && (
              <div className="alert alert-success mb-0">
                Vendor sudah menyelesaikan seluruh proses approval.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalDetail;