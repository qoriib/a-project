import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AccountDetail.css";
import {
  API_BASE_URL as API_URL,
  getStorageUrl,
  getAuthHeaders,
} from "../../api/config";
import { AlertModal } from "../../components/common/AlertModal";

function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // =====================================================
  // STATE
  // =====================================================

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [permissions, setPermissions] = useState({
    can_view: false,
    can_edit: false,
    can_approve: false,
    is_admin: false,
  });

  const [accountGroups, setAccountGroups] = useState([]);
  const [reconAccounts, setReconAccounts] = useState([]);

  const [accountGroupId, setAccountGroupId] = useState("");
  const [accountGroupOther, setAccountGroupOther] = useState("");

  const [reconAccountId, setReconAccountId] = useState("");
  const [reconAccountOther, setReconAccountOther] = useState("");

  const [saving, setSaving] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // =====================================================
  // ALERT MODAL
  // =====================================================

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
    if (saving || processingApproval) return;

    setModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const handleModalConfirm = () => {
    const callback = modal.onConfirm;

    setModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));

    if (callback) callback();
  };

  // =====================================================
  // CONFIRM BACK
  // =====================================================

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

  // =====================================================
  // FETCH REQUEST
  // =====================================================

  const fetchRequest = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/vendor-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data pengajuan vendor.",
        );
      }

      // Backend mengembalikan { data, permissions }
      const requestData = result.data;
      const permissionData = result.permissions || {};

      if (!requestData) {
        throw new Error("Data pengajuan tidak ditemukan.");
      }

      setRequest(requestData);

      setPermissions({
        can_view: permissionData.can_view === true,
        can_edit: permissionData.can_edit === true,
        can_approve: permissionData.can_approve === true,
        is_admin: permissionData.is_admin === true,
      });

      const vendor = requestData.vendor || {};

      const existingAg = String(
        vendor.account_group_id ||
        vendor.account_group?.id ||
        vendor.accountGroup?.id ||
        ""
      );
      setAccountGroupId(existingAg);

      setAccountGroupOther(vendor.account_group_other || "");

      const existingRa = String(
        vendor.recon_account_id ||
        vendor.recon_account?.id ||
        vendor.reconAccount?.id ||
        ""
      );
      setReconAccountId(existingRa);

      setReconAccountOther(vendor.recon_account_other || "");
    } catch (error) {
      console.error("Error fetch Account Detail:", error);

      showAlert({
        type: "error",
        title: "Gagal Mengambil Data",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH MASTER ACCOUNTING
  // =====================================================

  const fetchMasterData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [groupResponse, reconResponse] = await Promise.all([
        fetch(`${API_URL}/account-groups`, { headers }),
        fetch(`${API_URL}/recon-accounts`, { headers }),
      ]);

      const groupData = await groupResponse.json();
      const reconData = await reconResponse.json();

      if (groupResponse.ok) {
        setAccountGroups(Array.isArray(groupData) ? groupData : []);
      }

      if (reconResponse.ok) {
        setReconAccounts(Array.isArray(reconData) ? reconData : []);
      }
    } catch (error) {
      console.error("Gagal mengambil master Accounting:", error);
    }
  };

  useEffect(() => {
    fetchRequest();
    fetchMasterData();
  }, [id]);

  // =====================================================
  // PERMISSION CHECK
  // =====================================================

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
    (isAdmin || userRole === "ACCOUNTING") &&
    request?.current_stage === "ACCOUNTING" &&
    [
      "PENDING_L3",
      "Pending",
      "Under Review",
      "Revision Required",
      "Draft",
      "DRAFT",
    ].includes(request?.status);

  const canApprove =
    (permissions.can_approve || isAdmin) &&
    (isAdmin || userRole === "ACCOUNTING") &&
    request?.current_stage === "ACCOUNTING" &&
    ["PENDING_L3", "Pending", "Under Review"].includes(request?.status);

  // =====================================================
  // SELECTED MASTER DATA
  // =====================================================

  const selectedAccountGroup = accountGroups.find(
    (item) => String(item.id) === String(accountGroupId),
  );

  const selectedReconAccount = reconAccounts.find(
    (item) => String(item.id) === String(reconAccountId),
  );

  const isAccountGroupOther =
    selectedAccountGroup?.name?.toLowerCase() === "other";

  const isReconAccountOther =
    selectedReconAccount?.name?.toLowerCase() === "other";

  // =====================================================
  // SAVE ACCOUNTING
  // =====================================================

  const validateAccounting = () => {
    if (!accountGroupId) {
      showAlert({
        type: "error",
        title: "Account Group Belum Dipilih",
        message: "Silakan pilih Account Group terlebih dahulu.",
      });
      return false;
    }

    if (isAccountGroupOther && !accountGroupOther.trim()) {
      showAlert({
        type: "error",
        title: "Account Group Other Belum Diisi",
        message: "Silakan masukkan Account Group lainnya.",
      });
      return false;
    }

    if (!reconAccountId) {
      showAlert({
        type: "error",
        title: "Recon Account Belum Dipilih",
        message: "Silakan pilih Recon Account terlebih dahulu.",
      });
      return false;
    }

    if (isReconAccountOther && !reconAccountOther.trim()) {
      showAlert({
        type: "error",
        title: "Recon Account Other Belum Diisi",
        message: "Silakan masukkan Recon Account lainnya.",
      });
      return false;
    }

    return true;
  };

  const submitAccounting = () => {
    if (!canEdit || !validateAccounting()) return;

    showAlert({
      type: "warning",
      title: "Kirim Data Accounting?",
      message:
        "Apakah kamu yakin ingin menyimpan data Accounting dan mengirim pengajuan vendor ke tahap selanjutnya?",
      confirmText: "Ya, Kirim ke Tax",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => processAccounting(false),
    });
  };

  const saveAccountingDraft = () => {
    if (!canEdit) return;

    showAlert({
      type: "warning",
      title: "Simpan Draft Accounting?",
      message:
        "Data Accounting akan disimpan sebagai draft dan belum dikirim ke tahap Tax.",
      confirmText: "Ya, Simpan Draft",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => processAccounting(true),
    });
  };

  const processAccounting = async (isDraft) => {
    try {
      setSaving(true);

      const endpoint = isDraft
        ? `${API_URL}/vendor-requests/${id}/accounting/draft`
        : `${API_URL}/vendor-requests/${id}/accounting`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_group_id: accountGroupId || null,
          account_group_other: accountGroupOther || null,
          recon_account_id: reconAccountId || null,
          recon_account_other: reconAccountOther || null,
          payment_method: "Transfer",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: isDraft
            ? "Gagal Menyimpan Draft"
            : "Gagal Mengirim Accounting",
          message: result.message || "Terjadi kesalahan saat menyimpan data.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: isDraft
          ? "Draft Berhasil Disimpan"
          : "Accounting Berhasil Dikirim",
        message: isDraft
          ? "Data Accounting berhasil disimpan sebagai draft."
          : "Data Accounting berhasil disimpan dan dikirim ke tahap Tax.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error Accounting:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Silakan coba kembali.",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // APPROVE ACCOUNTING
  // =====================================================

  const approveAccounting = async () => {
    if (!canApprove) return;

    try {
      setProcessingApproval(true);

      const response = await fetch(`${API_URL}/vendor-requests/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Menyetujui Pengajuan",
          message: result.message || "Terjadi kesalahan saat menyetujui.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Pengajuan Berhasil Disetujui",
        message: "Pengajuan vendor berhasil diteruskan ke tahap Tax.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error Approve Accounting:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menyetujui pengajuan. Silakan coba kembali.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  // =====================================================
  // CANCEL APPROVE ACCOUNTING
  // =====================================================

  const cancelApproveAccounting = async () => {
    try {
      setProcessingApproval(true);

      const response = await fetch(
        `${API_URL}/vendor-requests/${id}/cancel-approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Cancel approve dari bagian Accounting",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Membatalkan Approval",
          message: result.message || "Terjadi kesalahan saat cancel approve.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Approval Berhasil Dibatalkan",
        message: "Pengajuan berhasil di-rollback ke Level 2 (Kadiv SCM).",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error Cancel Approve Accounting:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal membatalkan approval. Silakan coba kembali.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  // =====================================================
  // REJECT ACCOUNTING
  // =====================================================

  const rejectRequest = () => {
    if (!canApprove && !canEdit) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      showAlert({
        type: "error",
        title: "Alasan Penolakan Belum Diisi",
        message: "Mohon isi alasan penolakan terlebih dahulu.",
      });
      return;
    }

    showAlert({
      type: "warning",
      title: "Tolak Pengajuan Vendor?",
      message:
        "Pengajuan akan dikembalikan kepada Requester beserta alasan penolakan.",
      confirmText: "Ya, Tolak Pengajuan",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => processRejectRequest(reason),
    });
  };

  const processRejectRequest = async (reason) => {
    try {
      setProcessingApproval(true);

      const response = await fetch(`${API_URL}/vendor-requests/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejection_reason: reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Menolak Pengajuan",
          message:
            result.message || "Terjadi kesalahan saat menolak pengajuan.",
        });
        return;
      }

      setShowRejectForm(false);
      setRejectionReason("");

      showAlert({
        type: "success",
        title: "Pengajuan Berhasil Ditolak",
        message:
          "Pengajuan vendor berhasil dikembalikan kepada Requester untuk diperbaiki.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      console.error("Error Reject Accounting:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menolak pengajuan. Silakan coba kembali.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div className="account-detail-loading">Memuat data vendor...</div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!request) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div className="account-detail-loading">
            Data vendor request tidak ditemukan.
          </div>
          <button
            type="button"
            className="account-detail-cancel"
            onClick={() => navigate("/approval")}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // VENDOR DATA
  // =====================================================

  const isUpdate =
    request?.request_type === "UPDATE" ||
    request?.request_type === "EXISTING" ||
    request?.is_update === true;

  const detailRecord = request?.details?.[0] || {};
  const diffMap = request?.diff_data || detailRecord?.diff_data || {};
  const newData = request?.new_data || detailRecord?.new_data || {};
  const vendor = request?.vendor || {};
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

  const latestDocuments = Object.values(
    (Array.isArray(vendor.documents) ? vendor.documents : []).reduce(
      (result, document) => {
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
      },
      {},
    ),
  );

  const accountGroupDisplay = selectedAccountGroup
    ? `${selectedAccountGroup.code ? `${selectedAccountGroup.code} - ` : ""}${selectedAccountGroup.name}`
    : vendor.account_group_other || "-";

  const reconAccountDisplay = selectedReconAccount
    ? `${selectedReconAccount.code ? `${selectedReconAccount.code} - ` : ""}${selectedReconAccount.name}`
    : vendor.recon_account_other || "-";

  // =====================================================
  // REUSABLE READ-ONLY FIELD (DILENGKAPI INDIKATOR DIFF)
  // =====================================================

  const ReadOnlyField = ({ label, value, fieldKey = null }) => {
    const diff = fieldKey ? diffMap[fieldKey] : null;
    return (
      <div
        className={`col-md-6 account-detail-field ${diff ? "field-has-diff" : ""
          }`}
      >
        <label className="account-detail-label">
          {label}
          {diff && <span className="field-diff-badge">BERUBAH</span>}
        </label>
        <input
          type="text"
          className="account-detail-input"
          value={value || "-"}
          readOnly
        />
        {diff && diff.old && (
          <div className="field-old-hint">
            Sebelumnya: <span>{diff.old}</span>
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="account-detail-page">
      <div className="account-detail-card">
        {/* HEADER */}

        <div className="account-detail-header">
          <div>
            <h4>Detail Pengajuan Vendor</h4>
            <p>{displayVendor.nama_perusahaan || "Detail data vendor"}</p>
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
        </div>

        {/* DATA REQUESTER */}

        <div className="account-section">
          <h5 className="account-section-title">Data Requester</h5>
          <p className="account-section-description">
            Data vendor yang telah diisi oleh Requester.
          </p>

          <div className="account-subsection">
            <h6 className="account-subsection-title">Data Perusahaan</h6>

            <div className="row account-detail-row">
              <ReadOnlyField
                label="Nama Perusahaan"
                value={displayVendor.nama_perusahaan}
                fieldKey="nama_perusahaan"
              />
              <ReadOnlyField
                label="Search Term"
                value={displayVendor.search_term}
                fieldKey="search_term"
              />
              <ReadOnlyField
                label="Business Type"
                value={displayVendor.business_type}
                fieldKey="business_type"
              />
              <ReadOnlyField
                label="Kategori"
                value={displayVendor.kategori?.name}
                fieldKey="vendor_subcategories"
              />

              <div
                className={`col-12 account-detail-field ${diffMap.address ? "field-has-diff" : ""
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
                  value={displayVendor.address || ""}
                  readOnly
                />
                {diffMap.address?.old && (
                  <div className="field-old-hint">
                    Sebelumnya: <span>{diffMap.address.old}</span>
                  </div>
                )}
              </div>

              <ReadOnlyField
                label="City"
                value={displayVendor.city}
                fieldKey="city"
              />
              <ReadOnlyField
                label="Postal Code"
                value={displayVendor.postal_code}
                fieldKey="postal_code"
              />
              <ReadOnlyField
                label="Country"
                value={displayVendor.country}
                fieldKey="country"
              />
              <ReadOnlyField
                label="Telephone"
                value={displayVendor.phone}
                fieldKey="phone"
              />
              <ReadOnlyField
                label="Mobile Phone"
                value={displayVendor.mobile_phone}
                fieldKey="mobile_phone"
              />
              <ReadOnlyField
                label="Fax"
                value={displayVendor.fax}
                fieldKey="fax"
              />
              <ReadOnlyField
                label="Contact Person"
                value={displayVendor.pic_vendor}
                fieldKey="pic_vendor"
              />
              <ReadOnlyField
                label="Email"
                value={displayVendor.email}
                fieldKey="email"
              />
            </div>
          </div>

          <div className="account-subsection">
            <h6 className="account-subsection-title">Informasi Requester</h6>

            <div className="row account-detail-row">
              <ReadOnlyField
                label="NPWP"
                value={displayVendor.npwp}
                fieldKey="npwp"
              />
              <ReadOnlyField
                label="Company Code / Purchasing Organization"
                value="1200 / 1300 - PROJECT BAKTI"
              />
              <ReadOnlyField
                label="Due Date Payment"
                value={displayVendor.payment_term?.name || displayVendor.payment_term_other}
                fieldKey="payment_term_id"
              />
              <ReadOnlyField
                label="Order Currency"
                value={displayVendor.order_currency_other || displayVendor.order_currency}
                fieldKey="order_currency"
              />
            </div>
          </div>

          {/* DATA BANK */}

          <div className="account-subsection account-bank-section">
            <h6 className="account-subsection-title">Data Bank</h6>

            <p className="account-bank-description">
              Informasi seluruh rekening bank vendor yang telah diisi oleh
              Requester.
            </p>

            {diffMap.bank_accounts && (
              <div className="vcc-old-box mb-3">
                <span className="vcc-tag">Perubahan Rekening Bank Diajukan</span>
                <div style={{ whiteSpace: "pre-line" }}>
                  <strong>Rekening Sebelumnya di Master:</strong>
                  <br />
                  {diffMap.bank_accounts.old}
                </div>
              </div>
            )}

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
                      <ReadOnlyField
                        label="Bank Name"
                        value={bank.bank_name ?? bank.bank}
                      />
                      <ReadOnlyField
                        label="Bank Account Number"
                        value={bank.account_number ?? bank.rekening}
                      />
                      <ReadOnlyField
                        label="Beneficiary"
                        value={
                          bank.account_name ??
                          bank.benificiary ??
                          bank.beneficiary
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="account-bank-empty">
                Belum ada data rekening bank.
              </div>
            )}
          </div>

          {/* DOKUMEN */}

          <div className="account-document-section">
            <h5 className="account-section-title">Dokumen Vendor</h5>

            <p className="account-section-description">
              Dokumen pendukung vendor yang telah diupload oleh Requester.
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

        <div className="account-section account-input-section">
          <h5 className="account-section-title">Data Accounting</h5>

          <p className="account-section-description">
            {canEdit
              ? "Lengkapi informasi Accounting untuk vendor ini."
              : "Informasi Accounting untuk vendor ini."}
          </p>

          <div className="row account-detail-row">
            {/* ACCOUNT GROUP */}

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">
                Account Group {canEdit && <span className="text-danger">*</span>}
              </label>

              {canEdit ? (
                <select
                  className="account-detail-input account-detail-select"
                  value={String(accountGroupId || "")}
                  onChange={(e) => {
                    setAccountGroupId(e.target.value);
                    setAccountGroupOther("");
                  }}
                >
                  <option value="">Pilih Account Group</option>

                  {accountGroups.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.code ? `${item.code} - ${item.name}` : item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="account-detail-input account-detail-readonly"
                  value={accountGroupDisplay}
                  readOnly
                />
              )}

              {isAccountGroupOther && (
                <input
                  type="text"
                  className="account-detail-input account-detail-other"
                  placeholder="Masukkan Account Group lainnya"
                  value={accountGroupOther}
                  onChange={(e) => setAccountGroupOther(e.target.value)}
                  readOnly={!canEdit}
                />
              )}

              {isUpdate && vendor?.account_group && (
                <div className="field-old-hint">
                  Konfigurasi di Master: <strong>{vendor.account_group.code ? `${vendor.account_group.code} - ${vendor.account_group.name}` : vendor.account_group.name}</strong>
                </div>
              )}
            </div>

            {/* RECON ACCOUNT */}

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">
                Recon Account {canEdit && <span className="text-danger">*</span>}
              </label>

              {canEdit ? (
                <select
                  className="account-detail-input account-detail-select"
                  value={String(reconAccountId || "")}
                  onChange={(e) => {
                    setReconAccountId(e.target.value);
                    setReconAccountOther("");
                  }}
                >
                  <option value="">Pilih Recon Account</option>

                  {reconAccounts.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.code ? `${item.code} - ${item.name}` : item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="account-detail-input account-detail-readonly"
                  value={reconAccountDisplay}
                  readOnly
                />
              )}

              {isReconAccountOther && (
                <input
                  type="text"
                  className="account-detail-input account-detail-other"
                  placeholder="Masukkan Recon Account lainnya"
                  value={reconAccountOther}
                  onChange={(e) => setReconAccountOther(e.target.value)}
                  readOnly={!canEdit}
                />
              )}

              {isUpdate && vendor?.recon_account && (
                <div className="field-old-hint">
                  Konfigurasi di Master: <strong>{vendor.recon_account.code ? `${vendor.recon_account.code} - ${vendor.recon_account.name}` : vendor.recon_account.name}</strong>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD */}

            <ReadOnlyField
              label="Payment Method"
              value={vendor.payment_method || "Transfer"}
            />
          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          {(canEdit || canApprove) && !showRejectForm && (
            <div className="account-detail-actions">
              <button
                type="button"
                className="account-detail-cancel"
                onClick={confirmBack}
                disabled={saving || processingApproval}
              >
                Kembali
              </button>

              {canEdit && (
                <button
                  type="button"
                  className="account-detail-draft"
                  onClick={saveAccountingDraft}
                  disabled={saving || processingApproval}
                >
                  {saving ? "Memproses..." : "Simpan Draft"}
                </button>
              )}

              <button
                type="button"
                className="account-detail-reject"
                onClick={() => {
                  setRejectionReason("");
                  setShowRejectForm(true);
                }}
                disabled={saving || processingApproval}
              >
                Reject
              </button>

              <button
                type="button"
                className="account-detail-cancel-approve"
                onClick={() =>
                  showAlert({
                    type: "warning",
                    title: "Batalkan Approval (Cancel Approve)?",
                    message:
                      "Apakah kamu yakin ingin membatalkan approval? Pengajuan akan di-rollback ke Level 2 (Kadiv SCM).",
                    confirmText: "Ya, Rollback",
                    cancelText: "Kembali",
                    showCancel: true,
                    onConfirm: cancelApproveAccounting,
                  })
                }
                disabled={saving || processingApproval}
              >
                Cancel Approve
              </button>

              <button
                type="button"
                className="account-detail-save"
                onClick={submitAccounting}
                disabled={saving || processingApproval}
              >
                {saving ? "Memproses..." : "Simpan & Kirim ke Tax"}
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

          {/* =================================================
              REJECT FORM
          ================================================= */}

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
                rows={4}
                placeholder="Tuliskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={processingApproval}
              />

              <div className="account-detail-actions">
                <button
                  type="button"
                  className="account-detail-cancel"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  disabled={processingApproval}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="account-detail-reject"
                  onClick={rejectRequest}
                  disabled={processingApproval || !rejectionReason.trim()}
                >
                  {processingApproval ? "Memproses..." : "Konfirmasi Reject"}
                </button>
              </div>
            </div>
          )}

          {/* READ ONLY NOTICE */}
          {!canEdit && !canApprove && (
            <div className="account-section-description">
              Kamu memiliki akses untuk melihat data ini, tetapi tidak memiliki
              izin untuk mengubah atau menyetujui pengajuan.
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ALERT MODAL
      ===================================================== */}

      <AlertModal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        isLoading={saving || processingApproval}
        onConfirm={handleModalConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}

export default AccountDetail;
