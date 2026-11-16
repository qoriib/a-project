import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AccountDetail.css";
import {
  API_BASE_URL,
  getStorageUrl,
  getAuthHeaders,
} from "../../api/config";
import { AlertModal } from "../../components/common/AlertModal";

function TaxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ==========================================
  // STATE
  // ==========================================

  const [request, setRequest] = useState(null);
  const [permissions, setPermissions] = useState({
    can_view: false,
    can_edit: false,
    can_approve: false,
    is_admin: false,
  });

  const [loading, setLoading] = useState(true);
  const [withholdingTaxes, setWithholdingTaxes] = useState([]);
  const [selectedWithholdingTaxIds, setSelectedWithholdingTaxIds] = useState(
    [],
  );

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  // ==========================================
  // MODAL
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

  const isProcessing = savingDraft || submitting || processingApproval;

  const closeModal = () => {
    if (isProcessing) return;

    setModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  // ==========================================
  // FETCH REQUEST
  // ==========================================

  const fetchRequest = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Mengambil Data",
          message: result.message || "Gagal mengambil data vendor.",
        });
        return;
      }

      const requestData = result.data;

      if (!requestData) {
        showAlert({
          type: "error",
          title: "Data Tidak Ditemukan",
          message: "Data pengajuan vendor tidak ditemukan.",
        });
        return;
      }

      setRequest(requestData);

      setPermissions({
        can_view: Boolean(result.permissions?.can_view),
        can_edit: Boolean(result.permissions?.can_edit),
        can_approve: Boolean(result.permissions?.can_approve),
        is_admin: Boolean(result.permissions?.is_admin),
      });

      const savedTaxIds = Array.isArray(requestData.vendor?.withholding_taxes)
        ? requestData.vendor.withholding_taxes.map((item) => String(item.id))
        : [];

      setSelectedWithholdingTaxIds(savedTaxIds);
    } catch (error) {
      console.error("Error mengambil data request:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menghubungi server.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH MASTER TAX
  // ==========================================

  const fetchMasterData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/withholding-taxes`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Gagal mengambil master Tax:", result);
        return;
      }

      const masterTaxes = result.data ?? result;

      setWithholdingTaxes(Array.isArray(masterTaxes) ? masterTaxes : []);
    } catch (error) {
      console.error("Gagal mengambil master Tax:", error);
    }
  };

  // ==========================================
  // PERMISSION
  // ==========================================

  const canEdit =
    (permissions.can_edit || permissions.is_admin) &&
    request?.current_stage === "TAX" &&
    [
      "PENDING_L4",
      "Pending",
      "Under Review",
      "Revision Required",
      "Draft",
      "DRAFT",
    ].includes(request?.status);

  const canApprove =
    (permissions.can_approve || permissions.is_admin) &&
    request?.current_stage === "TAX" &&
    ["PENDING_L4", "Pending", "Under Review"].includes(request?.status);

  const readOnlyTax = !canEdit && !canApprove;

  // ==========================================
  // TOGGLE WITHHOLDING TAX
  // ==========================================

  const toggleWithholdingTax = (taxId) => {
    const idString = String(taxId);

    setSelectedWithholdingTaxIds((previous) => {
      if (previous.includes(idString)) {
        return previous.filter((item) => item !== idString);
      }

      return [...previous, idString];
    });
  };

  // ==========================================
  // BACK
  // ==========================================

  const confirmBack = () => {
    showAlert({
      type: "warning",
      title: "Kembali ke Halaman Tax?",
      message:
        "Apakah kamu yakin ingin kembali? Perubahan yang belum disimpan tidak akan dikirim.",
      confirmText: "Ya, Kembali",
      cancelText: "Lanjut Periksa",
      showCancel: true,
      onConfirm: () => navigate("/tax"),
    });
  };

  // ==========================================
  // SUBMIT TAX
  // ==========================================

  const submitTax = () => {
    if (selectedWithholdingTaxIds.length === 0) {
      showAlert({
        type: "error",
        title: "Withholding Tax Belum Dipilih",
        message: "Silakan pilih minimal satu jenis Withholding Tax.",
      });
      return;
    }

    showAlert({
      type: "warning",
      title: "Kirim Data Tax ke SAP?",
      message:
        "Apakah kamu yakin ingin menyimpan data Tax dan mengirim pengajuan vendor ini ke tahap selanjutnya?",
      confirmText: "Ya, Kirim ke SAP",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: processSubmitTax,
    });
  };

  // ==========================================
  // PROCESS SUBMIT TAX
  // ==========================================

  const processSubmitTax = async () => {
    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/tax`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            withholding_tax_ids: selectedWithholdingTaxIds.map(Number),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Menyimpan Tax",
          message: result.message || "Gagal menyimpan data Tax.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Tax Berhasil Disimpan",
        message:
          "Data Tax berhasil disimpan dan pengajuan vendor telah dikirim ke tahap selanjutnya.",
        confirmText: "OK",
        onConfirm: () => navigate("/tax"),
      });
    } catch (error) {
      console.error("Error submit Tax:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Terjadi kesalahan saat menyimpan data Tax.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // SAVE TAX DRAFT
  // ==========================================

  const saveTaxDraft = () => {
    showAlert({
      type: "warning",
      title: "Simpan Draft Tax?",
      message:
        "Data akan disimpan sebagai Draft dan belum dikirim ke tahap selanjutnya.",
      confirmText: "Ya, Simpan Draft",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: processSaveTaxDraft,
    });
  };

  const processSaveTaxDraft = async () => {
    try {
      setSavingDraft(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/tax/draft`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            withholding_tax_ids: selectedWithholdingTaxIds.map(Number),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: "Gagal Menyimpan Draft",
          message: result.message || "Gagal menyimpan Draft Tax.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Draft Berhasil Disimpan",
        message: "Data Tax berhasil disimpan sebagai Draft.",
        confirmText: "OK",
        onConfirm: () => navigate("/tax"),
      });
    } catch (error) {
      console.error("Error save Draft Tax:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menyimpan Draft Tax.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // ==========================================
  // APPROVE / REJECT
  // ==========================================

  const handleApproval = async (action) => {
    const isReject = action === "reject";
    const reason = rejectionReason.trim();

    if (isReject && !reason) {
      showAlert({
        type: "error",
        title: "Alasan Penolakan Belum Diisi",
        message: "Silakan isi alasan penolakan terlebih dahulu.",
      });
      return;
    }

    try {
      setProcessingApproval(true);

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${id}/${action}`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify(isReject ? { rejection_reason: reason } : {}),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        showAlert({
          type: "error",
          title: isReject
            ? "Gagal Menolak Pengajuan"
            : "Gagal Menyetujui Pengajuan",
          message: result.message || "Terjadi kesalahan.",
        });
        return;
      }

      setShowRejectForm(false);
      setRejectionReason("");

      showAlert({
        type: "success",
        title: isReject
          ? "Pengajuan Berhasil Ditolak"
          : "Pengajuan Berhasil Disetujui",
        message: isReject
          ? "Pengajuan dikembalikan kepada Requester untuk diperbaiki."
          : "Pengajuan berhasil disetujui dan diteruskan ke tahap SAP.",
        confirmText: "OK",
        onConfirm: () => navigate("/tax"),
      });
    } catch (error) {
      console.error("Error approval Tax:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menghubungi server.",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  // ==========================================
  // OPEN REJECT FORM
  // ==========================================

  const openRejectForm = () => {
    setRejectionReason("");
    setShowRejectForm(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
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
      onConfirm: () => handleApproval("reject"),
    });
  };

  // ==========================================
  // USE EFFECT
  // ==========================================

  useEffect(() => {
    fetchRequest();
    fetchMasterData();
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

  if (!request) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          Data vendor request tidak ditemukan.
        </div>
      </div>
    );
  }

  const vendor = request.vendor ?? {};

  const bankAccounts = Array.isArray(vendor.bank_accounts)
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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="account-detail-page">
      <div className="account-detail-card">
        <div className="account-detail-header">
          <div>
            <h4>Detail Pengajuan Vendor</h4>
            <p>{vendor.nama_perusahaan || "Detail data vendor"}</p>
          </div>
        </div>

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

          <div className="row account-detail-row">
            {[
              ["Nama Perusahaan", vendor.nama_perusahaan],
              ["Search Term", vendor.search_term],
              ["Business Type", vendor.business_type],
              ["Kategori", vendor.kategori?.name],
              ["City", vendor.city],
              ["Postal Code", vendor.postal_code],
              ["Country", vendor.country],
              ["Telephone", vendor.phone],
              ["Mobile Phone", vendor.mobile_phone],
              ["Fax", vendor.fax],
              ["Contact Person", vendor.pic_vendor],
              ["Email", vendor.email],
              ["NPWP", vendor.npwp],
              [
                "Due Date Payment",
                vendor.payment_term?.name || vendor.payment_term_other,
              ],
              [
                "Order Currency",
                vendor.order_currency_other || vendor.order_currency,
              ],
            ].map(([label, value]) => (
              <div className="col-md-6 account-detail-field" key={label}>
                <label className="account-detail-label">{label}</label>
                <input
                  className="account-detail-input"
                  value={value || ""}
                  readOnly
                />
              </div>
            ))}

            <div className="col-12 account-detail-field">
              <label className="account-detail-label">Street Address</label>
              <textarea
                className="account-detail-input account-detail-textarea"
                value={vendor.address || ""}
                readOnly
              />
            </div>

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">
                Company Code / Purchasing Organization
              </label>
              <input
                className="account-detail-input"
                value="1200 / 1300 - PROJECT BAKTI"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* DATA BANK */}

        <div className="account-subsection account-bank-section">
          <h6 className="account-subsection-title">Data Bank</h6>
          <p className="account-bank-description">
            Seluruh rekening bank vendor.
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
                      <div className="account-bank-icon">⌂</div>
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
                    {[
                      ["Bank Name", bank.bank_name ?? bank.bank],
                      [
                        "Bank Account Number",
                        bank.account_number ?? bank.rekening,
                      ],
                      [
                        "Beneficiary",
                        bank.account_name ??
                          bank.benificiary ??
                          bank.beneficiary,
                      ],
                    ].map(([label, value]) => (
                      <div
                        className="col-md-6 account-detail-field"
                        key={label}
                      >
                        <label className="account-detail-label">{label}</label>
                        <input
                          className="account-detail-input account-bank-input"
                          value={value || "-"}
                          readOnly
                        />
                      </div>
                    ))}
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

        {/* DOCUMENTS */}

        <div className="account-document-section">
          <h5 className="account-section-title">Dokumen Vendor</h5>
          <p className="account-section-description">
            Dokumen pendukung yang telah diupload oleh Requester.
          </p>

          <div className="row account-detail-row">
            {latestDocuments.length > 0 ? (
              latestDocuments.map((document) => {
                const filePath =
                  document.file_path ||
                  document.path ||
                  document.file ||
                  document.document_path;

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
                        <span className="account-existing-file-name">
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
                      <div className="account-no-file">File tidak tersedia</div>
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

        {/* DATA ACCOUNTING */}

        <div className="account-section">
          <h5 className="account-section-title">Data Accounting</h5>

          <div className="row account-detail-row">
            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">Account Group</label>
              <input
                className="account-detail-input"
                value={
                  vendor.account_group?.code
                    ? `${vendor.account_group.code} - ${vendor.account_group.name}`
                    : vendor.account_group?.name ||
                      vendor.account_group_other ||
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
                  vendor.recon_account?.code
                    ? `${vendor.recon_account.code} - ${vendor.recon_account.name}`
                    : vendor.recon_account?.name ||
                      vendor.recon_account_other ||
                      ""
                }
                readOnly
              />
            </div>

            <div className="col-md-6 account-detail-field">
              <label className="account-detail-label">Payment Method</label>
              <input
                className="account-detail-input"
                value={vendor.payment_method || "Transfer"}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* DATA TAX */}

        <div className="account-section account-input-section">
          <h5 className="account-section-title">Data Tax</h5>
          <p className="account-section-description">
            {canEdit
              ? "Lengkapi informasi Tax untuk vendor ini."
              : "Informasi Withholding Tax yang dipilih."}
          </p>

          <div className="row account-detail-row">
            <div className="col-12 account-detail-field">
              <label className="account-detail-label">
                Withholding Tax
                {canEdit && <span className="text-danger"> *</span>}
              </label>

              <p className="account-section-description">
                Pilih satu atau beberapa jenis Withholding Tax yang sesuai.
              </p>

              {withholdingTaxes.length > 0 ? (
                <div className="withholding-tax-grid">
                  {withholdingTaxes.map((item) => {
                    const taxId = String(item.id);
                    const checked = selectedWithholdingTaxIds.includes(taxId);

                    return (
                      <label
                        key={item.id}
                        className={`withholding-tax-option ${
                          checked ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="withholding-tax-checkbox"
                          checked={checked}
                          onChange={() => toggleWithholdingTax(item.id)}
                          disabled={!canEdit || isProcessing}
                        />

                        <span className="withholding-tax-name">
                          {item.name}
                        </span>

                        {checked && (
                          <span className="withholding-tax-checkmark">
                            Terpilih
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-warning">
                  Data master Withholding Tax belum tersedia.
                </div>
              )}

              <small className="withholding-tax-count">
                {selectedWithholdingTaxIds.length} jenis pajak dipilih
              </small>
            </div>
          </div>

          {/* STAFF ACTIONS */}

          {canEdit && (
            <div className="account-detail-actions">
              <button
                type="button"
                className="account-detail-cancel"
                onClick={confirmBack}
                disabled={isProcessing}
              >
                Kembali
              </button>

              <button
                type="button"
                className="account-detail-draft"
                onClick={saveTaxDraft}
                disabled={isProcessing}
              >
                {savingDraft ? "Menyimpan..." : "Simpan Draft"}
              </button>

              <button
                type="button"
                className="account-detail-save"
                onClick={submitTax}
                disabled={isProcessing}
              >
                {submitting ? "Mengirim..." : "Simpan & Kirim ke SAP"}
              </button>
            </div>
          )}

          {/* APPROVER ACTIONS */}

          {canApprove && (
            <div className="procurement-approval-actions">
              <div className="procurement-approval-info">
                <span className="procurement-approval-info-icon">✓</span>
                <div>
                  <strong>Pengajuan Siap Ditinjau</strong>
                  <p>
                    Periksa data vendor dan informasi Tax sebelum memberikan
                    keputusan.
                  </p>
                </div>
              </div>

              <div className="procurement-approval-buttons">
                <button
                  type="button"
                  className="procurement-reject-button"
                  onClick={openRejectForm}
                  disabled={isProcessing}
                >
                  ✕ Reject
                </button>

                <button
                  type="button"
                  className="btn btn-warning"
                  disabled={isProcessing}
                  onClick={() =>
                    showAlert({
                      type: "warning",
                      title: "Batalkan Approval (Cancel Approve)?",
                      message:
                        "Apakah kamu yakin ingin membatalkan approval? Pengajuan akan di-rollback ke Level 3 (Accounting).",
                      confirmText: "Ya, Rollback",
                      cancelText: "Kembali",
                      showCancel: true,
                      onConfirm: () => handleApproval("cancel-approve"),
                    })
                  }
                  style={{ padding: "8px 16px", fontWeight: "600", borderRadius: "8px" }}
                >
                  Cancel Approve
                </button>

                <button
                  type="button"
                  className="procurement-approve-button"
                  disabled={isProcessing}
                  onClick={() =>
                    showAlert({
                      type: "success",
                      title: "Setujui Pengajuan?",
                      message:
                        "Apakah kamu yakin ingin menyetujui pengajuan vendor pada tahap Tax? Pengajuan akan diteruskan ke tahap SAP.",
                      confirmText: "Ya, Setujui",
                      cancelText: "Periksa Kembali",
                      showCancel: true,
                      onConfirm: () => handleApproval("approve"),
                    })
                  }
                >
                  ✓ Approve Pengajuan
                </button>
              </div>
            </div>
          )}

          {/* REJECT FORM */}

          {showRejectForm && (canApprove || canEdit) && (
            <div className="procurement-reject-panel">
              <div className="procurement-reject-panel-header">
                <span className="procurement-reject-panel-icon">!</span>
                <div>
                  <h6>Alasan Penolakan</h6>
                  <p>
                    Pengajuan akan dikembalikan kepada Requester untuk
                    diperbaiki.
                  </p>
                </div>
              </div>

              <div className="procurement-reject-field">
                <label className="account-detail-label">
                  Alasan Penolakan <span className="text-danger">*</span>
                </label>

                <textarea
                  className="account-detail-input account-detail-textarea"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas..."
                  disabled={isProcessing}
                />
              </div>

              <div className="procurement-reject-actions">
                <button
                  type="button"
                  className="account-detail-cancel"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  disabled={isProcessing}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="procurement-reject-confirm"
                  onClick={confirmReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                >
                  Konfirmasi Reject
                </button>
              </div>
            </div>
          )}

          {!canEdit && !canApprove && (
            <div className="alert alert-info mt-3">
              Halaman ini hanya menampilkan data Tax. Tidak ada tindakan yang
              tersedia untuk akun ini pada tahap sekarang.
            </div>
          )}
        </div>
      </div>

      {/* ALERT MODAL */}

      <AlertModal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        isLoading={isProcessing}
        onConfirm={() => {
          const callback = modal.onConfirm;
          closeModal();
          if (callback) callback();
        }}
        onCancel={closeModal}
      />
    </div>
  );
}

export default TaxDetail;
