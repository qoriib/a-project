import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AccountDetail.css";
import {
  API_BASE_URL,
  getStorageUrl,
  getAuthHeaders,
} from "../../api/config";
import { AlertModal } from "../../components/common/AlertModal";

function SapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorCode, setVendorCode] = useState("");
  const [permissions, setPermissions] = useState({
    can_view: false,
    can_edit: false,
    can_approve: false,
    is_admin: false,
  });

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [rejecting, setRejecting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // STATE ALERT MODAL
  // ==========================================

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Kembali",
    showCancel: false,
    onConfirm: null,
  });

  // ==========================================
  // ALERT MODAL
  // ==========================================

  const showAlert = ({
    type = "info",
    title = "",
    message = "",
    confirmText = "OK",
    cancelText = "Kembali",
    showCancel = false,
    onConfirm = null,
  }) => {
    setModal({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel,
      onConfirm,
    });
  };

  const closeModal = () => {
    if (rejecting || savingDraft || submitting) return;

    setModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  // ==========================================
  // KONFIRMASI KEMBALI
  // ==========================================

  const confirmBack = () => {
    showAlert({
      type: "warning",
      title: "Kembali ke Approval?",
      message:
        "Apakah kamu yakin ingin kembali ke halaman Approval? Perubahan yang belum disimpan tidak akan dikirim.",
      confirmText: "Ya, Kembali",
      cancelText: "Lanjut Periksa",
      showCancel: true,
      onConfirm: () => navigate("/approval"),
    });
  };

  const token = localStorage.getItem("token");

  // ==========================================
  // FETCH REQUEST
  // ==========================================

  const fetchRequest = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gagal mengambil data request:", data);
        return;
      }

      const requestData = data.data ?? data;
      const permissionData = data.permissions || {};

      setRequest(requestData);
      setPermissions({
        can_view: permissionData.can_view ?? false,
        can_edit: permissionData.can_edit ?? false,
        can_approve: permissionData.can_approve ?? false,
        is_admin: permissionData.is_admin ?? false,
      });
      setVendorCode(requestData?.vendor?.vendor_code || "");
    } catch (error) {
      console.error("Error mengambil data SAP:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PERMISSION CHECK
  // ==========================================

  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    storedUser = {};
  }
  const userRole = String(
    storedUser?.role || storedUser?.role_name || ""
  ).toUpperCase().trim();
  const isAdmin = userRole === "ADMIN" || storedUser?.is_admin === true || permissions.is_admin;

  const canEdit =
    (permissions.can_edit || isAdmin) &&
    (isAdmin || userRole === "SAP") &&
    request?.current_stage === "SAP" &&
    [
      "PENDING_L5",
      "FORM_APPROVED",
      "Pending",
      "Under Review",
      "Revision Required",
      "Draft",
      "DRAFT",
    ].includes(request?.status);

  const canApprove =
    (permissions.can_approve || isAdmin) &&
    (isAdmin || userRole === "SAP") &&
    request?.current_stage === "SAP" &&
    ["PENDING_L5", "FORM_APPROVED", "Pending", "Under Review"].includes(
      request?.status,
    );

  // ==========================================
  // SAVE SAP DRAFT
  // ==========================================

  const saveSapDraft = () => {
    showAlert({
      type: "warning",
      title: "Simpan Draft SAP?",
      message:
        "Apakah kamu yakin ingin menyimpan Vendor Code sebagai Draft? Vendor belum akan diselesaikan.",
      confirmText: "Ya, Simpan Draft",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: processSaveSapDraft,
    });
  };

  // ==========================================
  // PROCESS SAVE SAP DRAFT API
  // ==========================================

  const processSaveSapDraft = async () => {
    try {
      setSavingDraft(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/sap/draft`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            vendor_code: vendorCode.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gagal menyimpan Draft SAP:", data);

        showAlert({
          type: "error",
          title: "Gagal Menyimpan Draft",
          message:
            data.message || "Gagal menyimpan Draft SAP. Silakan coba kembali.",
        });

        return;
      }

      showAlert({
        type: "success",
        title: "Draft SAP Berhasil Disimpan",
        message: "Draft SAP berhasil disimpan.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error menyimpan Draft SAP:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Terjadi kesalahan saat menyimpan Draft SAP. Silakan coba kembali.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // ==========================================
  // PROCESS SAP
  // ==========================================

  const submitSap = () => {
    if (!vendorCode.trim()) {
      showAlert({
        type: "error",
        title: "Vendor Code Belum Diisi",
        message:
          "Vendor Code wajib diisi sebelum menyelesaikan pengajuan vendor.",
      });

      return;
    }

    showAlert({
      type: "warning",
      title: "Simpan & Approve Vendor?",
      message:
        "Apakah kamu yakin ingin menyimpan Vendor Code dan menyelesaikan pengajuan vendor ini?",
      confirmText: "Ya, Approve",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: processSubmitSap,
    });
  };

  // ==========================================
  // PROCESS SUBMIT SAP API
  // ==========================================

  const processSubmitSap = async () => {
    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/sap`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            vendor_code: vendorCode.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gagal menyimpan Vendor Code:", data);

        showAlert({
          type: "error",
          title: "Gagal Menyimpan Vendor Code",
          message:
            data.message ||
            "Gagal menyimpan Vendor Code. Silakan coba kembali.",
        });

        return;
      }

      showAlert({
        type: "success",
        title: "Vendor Berhasil Approved",
        message:
          "Vendor Code berhasil disimpan dan pengajuan vendor telah diselesaikan.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error menyimpan Vendor Code:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Terjadi kesalahan saat menyimpan Vendor Code. Silakan coba kembali.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // OPEN REJECT FORM
  // ==========================================

  const openRejectForm = () => {
    setRejectionReason("");
    setShowRejectForm(true);
  };

  // ==========================================
  // REJECT REQUEST
  // ==========================================

  const rejectRequest = () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      showAlert({
        type: "error",
        title: "Alasan Reject Belum Diisi",
        message: "Alasan Reject wajib diisi sebelum menolak pengajuan vendor.",
      });

      return;
    }

    showAlert({
      type: "warning",
      title: "Tolak Pengajuan Vendor?",
      message:
        "Apakah kamu yakin ingin menolak pengajuan vendor ini? Pengajuan akan dikembalikan kepada Requester beserta alasan penolakan.",
      confirmText: "Ya, Tolak Pengajuan",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => processRejectRequest(reason),
    });
  };

  // ==========================================
  // CANCEL APPROVE SAP
  // ==========================================

  const confirmCancelApprove = () => {
    showAlert({
      type: "warning",
      title: "Batalkan Approval (Cancel Approve)?",
      message:
        "Apakah kamu yakin ingin membatalkan approval? Pengajuan akan di-rollback ke Level 4 (Tax).",
      confirmText: "Ya, Rollback",
      cancelText: "Kembali",
      showCancel: true,
      onConfirm: processCancelApprove,
    });
  };

  const processCancelApprove = async () => {
    try {
      setRejecting(true);
      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/cancel-approve`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            reason: "Cancel approve dari bagian SAP",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Membatalkan Approval",
          message: data.message || "Terjadi kesalahan saat cancel approve.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Approval Berhasil Dibatalkan",
        message: "Pengajuan berhasil di-rollback ke Level 4 (Tax).",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal membatalkan approval. Silakan coba kembali.",
      });
    } finally {
      setRejecting(false);
    }
  };

  // ==========================================
  // PROCESS REJECT API
  // ==========================================

  const processRejectRequest = async (reason) => {
    try {
      setRejecting(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/reject`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            rejection_reason: reason,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gagal melakukan Reject:", data);

        showAlert({
          type: "error",
          title: "Gagal Menolak Pengajuan",
          message:
            data.message ||
            "Gagal melakukan Reject vendor. Silakan coba kembali.",
        });

        return;
      }

      setShowRejectForm(false);
      setRejectionReason("");

      showAlert({
        type: "success",
        title: "Pengajuan Berhasil Ditolak",
        message: "Request berhasil ditolak dan dikembalikan kepada Requester.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error Reject vendor:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Terjadi kesalahan saat menghubungi server. Silakan coba kembali.",
      });
    } finally {
      setRejecting(false);
    }
  };

  // ==========================================
  // USE EFFECT
  // ==========================================

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div className="account-detail-loading">Memuat data vendor...</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!request) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div className="account-detail-loading">
            Data vendor request tidak ditemukan.
          </div>
          <button
            type="button"
            className="account-detail-cancel mt-3"
            onClick={() => navigate("/approval")}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isUpdate =
    request?.request_type === "UPDATE" ||
    request?.request_type === "EXISTING" ||
    request?.is_update === true;

  const detailRecord = request?.details?.[0] || {};
  const diffMap = request?.diff_data || detailRecord?.diff_data || {};
  const newData = request?.new_data || detailRecord?.new_data || {};
  const vendor = request.vendor ?? {};
  const displayVendor =
    isUpdate && Object.keys(newData).length > 0
      ? { ...vendor, ...newData }
      : vendor;

  const bankAccounts =
    isUpdate && Array.isArray(newData.bank_accounts) && newData.bank_accounts.length > 0
      ? newData.bank_accounts
      : Array.isArray(vendor.bank_accounts)
      ? vendor.bank_accounts
      : Array.isArray(vendor.bankAccounts)
      ? vendor.bankAccounts
      : [];

  // ==========================================
  // GET LATEST DOCUMENTS
  // ==========================================

  const latestDocuments = Object.values(
    (vendor?.documents || []).reduce((result, document) => {
      const type = (
        document.document_type ||
        document.type ||
        "DOKUMEN"
      ).toUpperCase();

      if (
        !result[type] ||
        Number(document.version || 0) > Number(result[type].version || 0)
      ) {
        result[type] = document;
      }

      return result;
    }, {}),
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="account-detail-page">
      <div className="account-detail-card">
        {/* HEADER */}

        <div className="account-detail-header">
          <div>
            <h4>Detail Pengajuan Vendor</h4>
            <p>{displayVendor?.nama_perusahaan || "Detail data vendor"}</p>
          </div>
        </div>

        {/* REQUEST INFO */}

        <div className="account-request-info">
          <div className="account-request-item">
            <span className="account-request-label">Status</span>
            <span className="account-request-value">
              {request.status || "-"}
            </span>
          </div>

          <div className="account-request-item">
            <span className="account-request-label">Tahap</span>
            <span className="account-request-value">
              {request.current_stage || "-"}
            </span>
          </div>

          <div className="account-request-item">
            <span className="account-request-label">Tipe Pengajuan</span>
            <span className="account-request-value">
              {isUpdate ? "Update Existing Vendor" : "New Vendor"}
            </span>
          </div>
        </div>

        {/* DATA REQUESTER */}

        <div className="account-section">
          <h5 className="account-section-title">Data Requester</h5>
          <p className="account-section-description">
            Data vendor yang telah diisi oleh Requester
          </p>

          {/* DATA PERUSAHAAN */}

          <div className="account-subsection">
            <h6 className="account-subsection-title">Data Perusahaan</h6>

            <div className="row account-detail-row">
              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.nama_perusahaan ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Nama Perusahaan
                  {diffMap.nama_perusahaan && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.nama_perusahaan || ""}
                  readOnly
                />
                {diffMap.nama_perusahaan?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.nama_perusahaan.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.search_term ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Search Term
                  {diffMap.search_term && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.search_term || ""}
                  readOnly
                />
                {diffMap.search_term?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.search_term.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.business_type ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Business Type
                  {diffMap.business_type && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.business_type || ""}
                  readOnly
                />
                {diffMap.business_type?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.business_type.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.vendor_subcategories ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Kategori
                  {diffMap.vendor_subcategories && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.kategori?.name || displayVendor?.kategori_other || ""}
                  readOnly
                />
                {diffMap.vendor_subcategories?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.vendor_subcategories.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-12 account-detail-field ${
                  diffMap.address ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Street Address
                  {diffMap.address && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <textarea
                  className="account-detail-input account-detail-textarea"
                  value={displayVendor?.address || ""}
                  readOnly
                />
                {diffMap.address?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.address.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.city ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  City
                  {diffMap.city && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.city || ""}
                  readOnly
                />
                {diffMap.city?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.city.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.postal_code ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Postal Code
                  {diffMap.postal_code && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.postal_code || ""}
                  readOnly
                />
                {diffMap.postal_code?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.postal_code.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.country ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Country
                  {diffMap.country && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.country || ""}
                  readOnly
                />
                {diffMap.country?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.country.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.phone ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Telephone
                  {diffMap.phone && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.phone || ""}
                  readOnly
                />
                {diffMap.phone?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.phone.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.mobile_phone ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Mobile Phone
                  {diffMap.mobile_phone && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.mobile_phone || ""}
                  readOnly
                />
                {diffMap.mobile_phone?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.mobile_phone.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.fax ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Fax
                  {diffMap.fax && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.fax || ""}
                  readOnly
                />
                {diffMap.fax?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.fax.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.pic_vendor ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Contact Person
                  {diffMap.pic_vendor && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.pic_vendor || ""}
                  readOnly
                />
                {diffMap.pic_vendor?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.pic_vendor.old}</span>
                  </div>
                )}
              </div>

              <div
                className={`col-md-6 account-detail-field ${
                  diffMap.email ? "field-has-diff" : ""
                }`}
              >
                <label className="account-detail-label">
                  Email
                  {diffMap.email && (
                    <span className="field-diff-badge">BERUBAH</span>
                  )}
                </label>
                <input
                  className="account-detail-input"
                  value={displayVendor?.email || ""}
                  readOnly
                />
                {diffMap.email?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.email.old}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PROCUREMENT DETAILS */}

          <div className="account-subsection">
            <h6 className="account-subsection-title">Requester</h6>

            <div className="row account-detail-row">
              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">NPWP</label>
                <input
                  className="account-detail-input"
                  value={vendor?.npwp || ""}
                  readOnly
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">
                  Company Code / Purchasing Organization
                </label>
                <input
                  className="account-detail-input"
                  value={
                    vendor?.company_code_purch_org ||
                    "1200 / 1300 - PROJECT BAKTI"
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Due Date Payment</label>
                <input
                  className="account-detail-input"
                  value={
                    vendor?.payment_term?.name ||
                    vendor?.payment_term_other ||
                    ""
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Order Currency</label>
                <input
                  className="account-detail-input"
                  value={
                    vendor?.order_currency_other || vendor?.order_currency || ""
                  }
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* DATA BANK */}

          <div className="account-subsection account-bank-section">
            <h6 className="account-subsection-title">Data Bank</h6>

            <p className="account-bank-description">
              Informasi seluruh rekening bank vendor yang telah diisi oleh
              Procurement.
            </p>

            {bankAccounts.length > 0 ? (
              <div className="account-bank-list">
                {bankAccounts.map((bank, index) => (
                  <div
                    className="account-bank-card"
                    key={bank.id ?? `bank-${index}`}
                  >
                    <div className="account-bank-card-header">
                      <div className="account-bank-card-heading">
                        <div className="account-bank-icon" aria-hidden="true">
                          <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 10h18" />
                            <path d="M5 10v9" />
                            <path d="M9 10v9" />
                            <path d="M15 10v9" />
                            <path d="M19 10v9" />
                            <path d="M3 19h18" />
                            <path d="M2 10 12 4l10 6" />
                          </svg>
                        </div>

                        <div>
                          <h6 className="account-bank-card-title">
                            Rekening Bank {index + 1}
                          </h6>
                          <p className="account-bank-card-subtitle">
                            Informasi rekening vendor
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="row account-detail-row account-bank-fields">
                      <div className="col-md-6 account-detail-field">
                        <label className="account-detail-label">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          className="account-detail-input account-bank-input"
                          value={bank.bank_name ?? bank.bank ?? "-"}
                          readOnly
                        />
                      </div>

                      <div className="col-md-6 account-detail-field">
                        <label className="account-detail-label">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          className="account-detail-input account-bank-input"
                          value={bank.account_number ?? bank.rekening ?? "-"}
                          readOnly
                        />
                      </div>

                      <div className="col-md-6 account-detail-field">
                        <label className="account-detail-label">
                          Beneficiary
                        </label>
                        <input
                          type="text"
                          className="account-detail-input account-bank-input"
                          value={
                            bank.account_name ??
                            bank.benificiary ??
                            bank.beneficiary ??
                            "-"
                          }
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="account-bank-empty">
                <span className="account-bank-empty-icon" aria-hidden="true">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10h18" />
                    <path d="M5 10v9" />
                    <path d="M9 10v9" />
                    <path d="M15 10v9" />
                    <path d="M19 10v9" />
                    <path d="M3 19h18" />
                    <path d="M2 10 12 4l10 6" />
                  </svg>
                </span>

                <span>Belum ada data rekening bank.</span>
              </div>
            )}
          </div>

          {/* DOKUMEN */}

          <div className="account-document-section">
            <h5 className="account-section-title">Dokumen Vendor</h5>
            <p className="account-section-description">
              Dokumen pendukung vendor yang telah diupload oleh Requester
            </p>

            <div className="row account-detail-row">
              {latestDocuments.length > 0 ? (
                latestDocuments.map((document) => {
                  const filePath =
                    document.file_path ||
                    document.path ||
                    document.file ||
                    document.document_path ||
                    null;

                  const fileName = filePath ? filePath.split("/").pop() : null;

                  return (
                    <div
                      className="col-md-6 account-detail-field"
                      key={document.id}
                    >
                      <label className="account-detail-file-label">
                        {document.document_type || document.type || "Dokumen"}
                      </label>

                      {filePath ? (
                        <div className="account-existing-file">
                          <span
                            className="account-existing-file-name"
                            title={fileName}
                          >
                            {fileName}
                          </span>

                          <a
                            href={getStorageUrl(filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="account-view-file"
                          >
                            Lihat
                          </a>
                        </div>
                      ) : (
                        <div className="account-no-file">
                          File tidak tersedia
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-12">
                  <div className="account-no-file">
                    Belum ada dokumen yang diupload.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DATA ACCOUNTING */}

        <div className="account-section">
          <h5 className="account-section-title">Data Accounting</h5>
          <p className="account-section-description">
            Data Accounting yang telah dilengkapi sebelumnya
          </p>

          <div className="row account-detail-row">
            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">Account Group</label>
              <input
                className="account-detail-input"
                value={
                  vendor?.account_group?.code
                    ? `${vendor.account_group.code} - ${vendor.account_group.name}`
                    : vendor?.account_group?.name ||
                    vendor?.account_group_other ||
                    ""
                }
                readOnly
              />
            </div>

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">Recon Account</label>
              <input
                className="account-detail-input"
                value={
                  vendor?.recon_account?.code
                    ? `${vendor.recon_account.code} - ${vendor.recon_account.name}`
                    : vendor?.recon_account?.name ||
                    vendor?.recon_account_other ||
                    ""
                }
                readOnly
              />
            </div>

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">Payment Method</label>
              <input
                className="account-detail-input"
                value={vendor?.payment_method || "Transfer"}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* DATA TAX */}

        <div className="account-section">
          <h5 className="account-section-title">Data Tax</h5>
          <p className="account-section-description">
            Data Tax yang telah dilengkapi sebelumnya
          </p>

          <div className="row account-detail-row">
            <div className="col-12 account-detail-field">
              <label className="account-detail-label">Withholding Tax</label>

              {Array.isArray(vendor?.withholding_taxes) &&
                vendor.withholding_taxes.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {vendor.withholding_taxes.map((tax) => (
                    <span
                      key={tax.id}
                      className="badge text-bg-light border text-dark p-2"
                    >
                      {tax.name}
                    </span>
                  ))}
                </div>
              ) : (
                <input
                  className="account-detail-input"
                  value="Belum ada Withholding Tax"
                  readOnly
                />
              )}
            </div>
          </div>
        </div>

        {/* DATA SAP */}

        <div className="account-section account-input-section">
          <h5 className="account-section-title">Data SAP</h5>
          <p className="account-section-description">
            {canEdit
              ? "Lengkapi Vendor Code dari SAP untuk vendor ini."
              : "Informasi identitas Vendor Code di SAP."}
          </p>

          <div className="row account-detail-row">
            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">
                Vendor Code {canEdit && <span className="text-danger">*</span>}
              </label>

              <input
                type="text"
                className="account-detail-input"
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                placeholder="Masukkan Vendor Code"
                readOnly={!canEdit}
                disabled={submitting || savingDraft || rejecting}
              />

              {isUpdate && vendor?.vendor_code && (
                <div className="field-old-hint mt-2">
                  Vendor Code SAP Terdaftar di Master: <strong>{vendor.vendor_code}</strong>
                </div>
              )}

              {isUpdate && (
                <div className="alert alert-info py-2 px-3 small mt-3">
                  ℹ️ <strong>Pembaruan Existing Vendor:</strong> Vendor ini telah memiliki kode SAP <strong>{vendor?.vendor_code || vendorCode}</strong>. Menyetujui tahap akhir SAP ini akan secara otomatis memperbarui data master vendor dan menyelesaikan seluruh alur pengajuan.
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}

          {(canEdit || canApprove) && !showRejectForm && (
            <div className="account-detail-actions">
              <button
                type="button"
                className="account-detail-cancel"
                onClick={confirmBack}
                disabled={submitting || savingDraft || rejecting}
              >
                Kembali
              </button>

              {canEdit && (
                <button
                  type="button"
                  className="account-detail-draft"
                  onClick={saveSapDraft}
                  disabled={submitting || savingDraft || rejecting}
                >
                  {savingDraft ? "Menyimpan..." : "Simpan Draft"}
                </button>
              )}

              <button
                type="button"
                className="account-detail-reject"
                onClick={openRejectForm}
                disabled={submitting || savingDraft || rejecting}
              >
                Reject
              </button>

              <button
                type="button"
                className="account-detail-cancel-approve"
                onClick={confirmCancelApprove}
                disabled={submitting || savingDraft || rejecting}
              >
                Cancel Approve
              </button>

              <button
                type="button"
                className="account-detail-save"
                onClick={submitSap}
                disabled={submitting || savingDraft || rejecting}
              >
                {submitting ? "Menyimpan..." : "Simpan & Selesaikan"}
              </button>
            </div>
          )}

          {/* READ ONLY BACK BUTTON */}
          {!canEdit && !canApprove && (
            <div className="account-detail-actions">
              <button
                type="button"
                className="account-detail-cancel"
                onClick={() => navigate("/approval")}
              >
                Kembali
              </button>
            </div>
          )}

          {/* REJECT FORM */}

          {showRejectForm && (canApprove || canEdit) && (
            <div className="account-reject-form">
              <h6>Alasan Penolakan</h6>

              <p className="account-section-description">
                Pengajuan akan dikembalikan ke Requester untuk diperbaiki.
              </p>

              <label className="account-detail-label">
                Alasan Penolakan <span className="text-danger">*</span>
              </label>

              <textarea
                className="account-detail-input account-detail-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan secara jelas..."
                rows={4}
                disabled={rejecting}
              />

              <div className="account-detail-actions">
                <button
                  type="button"
                  className="account-detail-cancel"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  disabled={rejecting}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="account-detail-reject"
                  onClick={rejectRequest}
                  disabled={rejecting || !rejectionReason.trim()}
                >
                  {rejecting ? "Memproses..." : "Konfirmasi Reject"}
                </button>
              </div>
            </div>
          )}

          {/* READ ONLY NOTICE */}
          {!canEdit && !canApprove && (
            <div className="account-section-description">
              Kamu memiliki akses untuk melihat data ini, tetapi tidak memiliki
              izin untuk mengubah atau menyelesaikan pengajuan.
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
            ALERT MODAL
        ========================================== */}

      <AlertModal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        isLoading={submitting || savingDraft || rejecting}
        onConfirm={() => {
          const callback = modal.onConfirm;
          closeModal();
          if (callback) {
            callback();
          }
        }}
        onCancel={closeModal}
      />
    </div>
  );
}

export default SapDetail;
