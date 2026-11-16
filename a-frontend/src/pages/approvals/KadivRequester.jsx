import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcurementDetail.css";
import "./KadivRequester.css";
import {
  API_BASE_URL as API,
  getStorageUrl,
  getAuthHeaders,
} from "../../api/config";
import { AlertModal } from "../../components/common/AlertModal";

function KadivDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [requestData, setRequestData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
  // CUSTOM ALERT
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
    if (processing) return;

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

    if (callback) {
      callback();
    }
  };

  // ==========================================
  // ALERT KEMBALI
  // ==========================================

  const handleBack = () => {
    showAlert({
      type: "warning",
      title: "Kembali ke Approval?",
      message: "Apakah kamu yakin ingin kembali ke halaman Approval?",
      confirmText: "Ya, Kembali",
      cancelText: "Lanjut Periksa",
      showCancel: true,
      onConfirm: () => navigate("/approval"),
    });
  };

  // ==========================================
  // KONFIRMASI APPROVE
  // ==========================================

  const confirmApprove = () => {
    showAlert({
      type: "warning",
      title: "Setujui Pengajuan?",
      message:
        "Apakah kamu yakin ingin menyetujui pengajuan vendor ini? Pengajuan akan diteruskan ke tahap berikutnya.",
      confirmText: "Ya, Setujui",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => handleProcess("approve"),
    });
  };

  // ==========================================
  // KONFIRMASI REJECT
  // ==========================================

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      showAlert({
        type: "error",
        title: "Alasan Penolakan Belum Diisi",
        message:
          "Mohon isi alasan penolakan terlebih dahulu sebelum melanjutkan.",
        confirmText: "Mengerti",
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
      onConfirm: () => handleProcess("reject"),
    });
  };

  // ==========================================
  // KONFIRMASI CANCEL APPROVE
  // ==========================================

  const confirmCancelApprove = () => {
    showAlert({
      type: "warning",
      title: "Batalkan Approval (Cancel Approve)?",
      message:
        "Apakah kamu yakin ingin membatalkan approval pengajuan vendor ini? Pengajuan akan di-rollback ke tahap sebelumnya.",
      confirmText: "Ya, Cancel Approve",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => handleProcess("cancel_approve"),
    });
  };

  // AMBIL DETAIL REQUEST

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`${API}/vendor-requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil detail vendor.");
        }

        setRequestData(result.data ?? result);
      } catch (err) {
        console.error("Detail vendor:", err);
        setError(err.message || "Gagal mengambil data vendor.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, token]);

  // MASTER KATEGORI

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API}/vendor-categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil kategori.");
        }

        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [token]);

  // MASTER PAYMENT TERM

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const response = await fetch(`${API}/payment-terms`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil payment terms.");
        }

        const data = await response.json();
        setPaymentTerms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setPaymentTerms([]);
      }
    };

    fetchPaymentTerms();
  }, [token]);

  // HELPER

  const value = (...values) => {
    const found = values.find(
      (item) => item !== null && item !== undefined && item !== "",
    );

    return found === undefined ? "" : found;
  };

  const showValue = (item) => {
    if (item === null || item === undefined || item === "") {
      return "-";
    }

    if (typeof item === "object") {
      return item.name ?? item.code ?? "-";
    }

    return String(item);
  };

  const getRelationName = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;

    return value(item.name, item.code, item.label);
  };

  // DATA REQUEST DAN VENDOR

  const vendor = requestData?.vendor ?? {};

  const bankAccounts = Array.isArray(
    vendor.bank_accounts ?? vendor.bankAccounts,
  )
    ? (vendor.bank_accounts ?? vendor.bankAccounts)
    : [];

  const documents = Array.isArray(vendor.documents) ? vendor.documents : [];

  const categoryName = value(
    getRelationName(vendor.kategori),
    getRelationName(vendor.category),
    vendor.kategori_name,
    vendor.kategori_other,
    categories.find((item) => String(item.id) === String(vendor.kategori_id))
      ?.name,
  );

  const paymentName = value(
    getRelationName(vendor.payment_term),
    getRelationName(vendor.paymentTerm),
    vendor.payment_term_name,
    vendor.payment_term_other,
    paymentTerms.find(
      (item) => String(item.id) === String(vendor.payment_term_id),
    )?.name,
  );

  const categoryIsOther =
    String(categoryName).toLowerCase() === "other" ||
    Boolean(vendor.kategori_other);

  const paymentIsOther =
    String(paymentName).toLowerCase() === "other" ||
    Boolean(vendor.payment_term_other);

  const currency = value(
    vendor.order_currency === "OTHER" ? vendor.order_currency_other : "",
    vendor.order_currency,
  );

  // DOKUMEN

  const documentList = [
    { type: "NPWP", label: "Dokumen NPWP" },
    { type: "REKENING", label: "Dokumen Rekening Bank" },
    { type: "NIB", label: "Dokumen NIB" },
    { type: "SIUP", label: "Dokumen SIUP" },
    { type: "COMPANY_PROFILE", label: "Dokumen Company Profile" },
    {
      type: "SERTIFIKAT",
      label: "Dokumen Sertifikat Pendukung",
    },
  ];

  const getExistingDocument = (type) => {
    const matches = documents.filter(
      (document) => String(document.document_type || "").toUpperCase() === type,
    );

    if (!matches.length) return null;

    return matches.reduce((latest, current) =>
      Number(current.version || 0) > Number(latest.version || 0)
        ? current
        : latest,
    );
  };

  const getDocumentPath = (document) =>
    document?.file_path ||
    document?.path ||
    document?.file ||
    document?.document_path ||
    document?.file_url ||
    document?.url ||
    "";

  const getDocumentUrl = (path) => {
    return getStorageUrl(path);
  };

  const getFileName = (path) => {
    if (!path) return "";
    return String(path).split("/").pop();
  };

  // ==========================================
  // SETUJUI / TOLAK
  // ==========================================

  const handleProcess = async (action) => {
    if (processing) return;

    const isReject = action === "reject";

    // Validasi alasan penolakan
    if (isReject && !rejectReason.trim()) {
      showAlert({
        type: "error",
        title: "Alasan Penolakan Wajib Diisi",
        message:
          "Mohon isi alasan penolakan terlebih dahulu sebelum menolak pengajuan vendor.",
        confirmText: "Mengerti",
      });

      return;
    }

    setProcessing(true);

    try {
      let endpoint = `${API}/vendor-requests/${id}/approve`;
      if (isReject) {
        endpoint = `${API}/vendor-requests/${id}/reject`;
      } else if (action === "cancel_approve") {
        endpoint = `${API}/vendor-requests/${id}/cancel-approve`;
      }

      const body = isReject
        ? { rejection_reason: rejectReason.trim() }
        : action === "cancel_approve"
        ? { reason: "Cancel approve dari antarmuka verifikator/approver" }
        : {};

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            Object.values(result.errors || {})
              .flat()
              .join("\n") ||
            "Gagal memproses pengajuan vendor.",
        );
      }

      // Alert berhasil
      showAlert({
        type: "success",
        title: isReject
          ? "Pengajuan Berhasil Ditolak"
          : action === "cancel_approve"
          ? "Approval Berhasil Dibatalkan"
          : "Pengajuan Berhasil Disetujui",
        message:
          result.message ||
          (isReject
            ? "Pengajuan vendor telah ditolak dan dikembalikan kepada Requester."
            : action === "cancel_approve"
            ? "Approval dibatalkan dan pengajuan di-rollback ke tahap sebelumnya."
            : "Pengajuan vendor berhasil disetujui dan diteruskan ke tahap berikutnya."),
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (err) {
      console.error("Proses Kadiv:", err);

      showAlert({
        type: "error",
        title: "Gagal Memproses Pengajuan",
        message:
          err.message || "Terjadi kesalahan saat memproses pengajuan vendor.",
        confirmText: "Mengerti",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // KOMPONEN FIELD READ-ONLY
  // ==========================================

  const Field = ({ label, children, full = false }) => (
    <div className={`${full ? "col-12" : "col-md-6"} procurement-detail-field`}>
      <label className="procurement-detail-label">{label}</label>
      {children}
    </div>
  );

  const Input = ({ label, data, full = false }) => (
    <Field label={label} full={full}>
      <input
        type="text"
        className="procurement-detail-input"
        value={showValue(data)}
        readOnly
      />
    </Field>
  );

  const TextArea = ({ label, data }) => (
    <Field label={label} full>
      <textarea
        className="procurement-detail-input procurement-detail-textarea"
        rows={3}
        value={showValue(data)}
        readOnly
      />
    </Field>
  );

  // LOADING

  if (loading) {
    return (
      <div className="procurement-detail-page">
        <div className="procurement-detail-card">
          <div className="procurement-detail-loading">
            Memuat data vendor...
          </div>
        </div>
      </div>
    );
  }

  // ERROR
  if (error || !requestData) {
    return (
      <div className="procurement-detail-page">
        <div className="procurement-detail-card">
          <div className="alert alert-danger">
            {error || "Data vendor tidak ditemukan."}
          </div>

          <button
            type="button"
            className="procurement-detail-cancel"
            onClick={() => navigate("/approval")}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="procurement-detail-page kadiv-detail-page">
      <div className="procurement-detail-card">
        {/* HEADER */}

        <div className="procurement-detail-header">
          <h4>Detail Pengajuan Vendor</h4>
          <p>
            {vendor.nama_perusahaan || "Periksa data vendor sebelum menyetujui"}
          </p>
        </div>

        {/* STATUS DAN TAHAP */}

        <div className="procurement-request-info">
          <div className="procurement-request-item">
            <span className="procurement-request-label">Status</span>
            <span className="procurement-request-value">
              {requestData.status || "-"}
            </span>
          </div>

          <div className="procurement-request-item">
            <span className="procurement-request-label">Tahap</span>
            <span className="procurement-request-value">
              {requestData.current_stage || "-"}
            </span>
          </div>
        </div>

        {/* FORM READ-ONLY */}

        <div className="procurement-detail-form">
          {/* DATA PERUSAHAAN */}

          <div className="procurement-section">
            <h5 className="procurement-section-title">Data Perusahaan</h5>
            <p className="procurement-section-description">
              Informasi utama perusahaan vendor
            </p>

            <div className="row procurement-detail-row">
              <Input label="Nama Perusahaan" data={vendor.nama_perusahaan} />

              <Input label="Search Term" data={vendor.search_term} />

              <Input label="City" data={vendor.city} />

              <Input label="Postal Code" data={vendor.postal_code} />

              <Input label="Country" data={vendor.country} />

              <Input label="Telephone / Nomor Telepon" data={vendor.phone} />

              <Input label="Mobile Phone" data={vendor.mobile_phone} />

              <Input label="Fax" data={vendor.fax} />

              <Input label="Contact Person" data={vendor.pic_vendor} />

              <Input label="Email" data={vendor.email} />

              <TextArea label="Street Address" data={vendor.address} />
            </div>
          </div>

          {/* PROCUREMENT */}

          <div className="procurement-section">
            <h5 className="procurement-section-title">Requester</h5>
            <p className="procurement-section-description">
              Informasi requester dan klasifikasi vendor
            </p>

            <div className="row procurement-detail-row">
              <Input label="NPWP" data={vendor.npwp} />

              <Input label="Business Type" data={vendor.business_type} />

              <Input label="Kategori" data={categoryName} />

              {categoryIsOther && (
                <Input label="Kategori" data={vendor.kategori_other} />
              )}

              <Input
                label="Company Code / Purchasing Organization"
                data="1200 / 1300 (PROJECT BAKTI)"
              />

              <Input
                label="Due Date Payment"
                data={
                  paymentName && vendor.payment_term?.code
                    ? `${vendor.payment_term.code} - ${paymentName}`
                    : paymentName
                }
              />

              {paymentIsOther && (
                <Input
                  label="Due Date Payment"
                  data={vendor.payment_term_other}
                />
              )}

              <Input label="Order Currency" data={currency} />
            </div>
          </div>

          {/* DATA BANK */}
          <div className="procurement-section kadiv-bank-section">
            <div className="kadiv-bank-section-heading">
              <div>
                <h5 className="procurement-section-title">Data Bank</h5>
                <p className="procurement-section-description">
                  Informasi rekening bank vendor.
                </p>
              </div>
            </div>

            {bankAccounts.length > 0 ? (
              <div className="kadiv-bank-account-list">
                {bankAccounts.map((bank, index) => (
                  <div
                    className="kadiv-bank-account-card"
                    key={bank.id ?? `bank-${index}`}
                  >
                    {/* HEADER REKENING */}
                    <div className="kadiv-bank-card-heading">
                      <div className="kadiv-bank-card-title-wrap">
                        <div className="kadiv-bank-card-icon">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 10h18" />
                            <path d="M5 10v9" />
                            <path d="M9 10v9" />
                            <path d="M15 10v9" />
                            <path d="M19 10v9" />
                            <path d="M3 21h18" />
                            <path d="m12 3 9 5H3l9-5Z" />
                          </svg>
                        </div>

                        <div>
                          <h6 className="kadiv-bank-card-title">
                            Rekening Bank {String(index + 1).padStart(2, "0")}
                          </h6>
                          <p className="kadiv-bank-card-subtitle">
                            Informasi rekening vendor
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="kadiv-bank-card-divider" />

                    {/* DETAIL REKENING — READ ONLY */}
                    <div className="row kadiv-bank-fields-row">
                      <div className="col-md-4 procurement-detail-field">
                        <label className="procurement-detail-label">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          className="procurement-detail-input kadiv-bank-input"
                          value={showValue(bank.bank_name)}
                          readOnly
                        />
                      </div>

                      <div className="col-md-4 procurement-detail-field">
                        <label className="procurement-detail-label">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          className="procurement-detail-input kadiv-bank-input"
                          value={showValue(
                            bank.account_number ?? bank.rekening,
                          )}
                          readOnly
                        />
                      </div>

                      <div className="col-md-4 procurement-detail-field">
                        <label className="procurement-detail-label">
                          Nama Pemilik Rekening
                        </label>
                        <input
                          type="text"
                          className="procurement-detail-input kadiv-bank-input"
                          value={showValue(
                            bank.account_name ??
                              bank.benificiary ??
                              bank.beneficiary,
                          )}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kadiv-bank-empty">
                Belum ada data rekening bank.
              </div>
            )}
          </div>

          {/* UPLOAD DOKUMEN */}
          <div className="procurement-document-section">
            <h5 className="procurement-section-title">Upload Dokumen</h5>
            <p className="procurement-section-description">
              Dokumen pendukung vendor yang sudah diunggah
            </p>

            <div className="row procurement-detail-row">
              {documentList.map((item) => {
                const document = getExistingDocument(item.type);
                const path = getDocumentPath(document);
                const url = getDocumentUrl(path);

                return (
                  <div
                    className="col-md-6 procurement-detail-field"
                    key={item.type}
                  >
                    <label className="procurement-detail-file-label">
                      {item.label}
                    </label>

                    {path ? (
                      <div className="procurement-existing-file">
                        <span
                          className="procurement-existing-file-name"
                          title={getFileName(path)}
                        >
                          {getFileName(path)}
                        </span>

                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="procurement-view-file"
                        >
                          Lihat Dokumen
                        </a>
                      </div>
                    ) : (
                      <div className="procurement-no-file">
                        Belum ada dokumen
                      </div>
                    )}

                    <small className="procurement-detail-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ALASAN PENOLAKAN */}
        {showRejectForm && (
          <div className="kadiv-reject-panel">
            <label htmlFor="rejectReason">
              Alasan Penolakan <span className="text-danger">*</span>
            </label>

            <textarea
              id="rejectReason"
              className="procurement-detail-input procurement-detail-textarea"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan pengajuan vendor ditolak..."
              disabled={processing}
            />

            <div className="kadiv-reject-actions">
              <button
                type="button"
                className="procurement-detail-cancel"
                disabled={processing}
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
              >
                Batal
              </button>

              <button
                type="button"
                className="kadiv-reject-confirm"
                disabled={processing}
                onClick={confirmReject}
              >
                {processing ? "Memproses..." : "Konfirmasi Penolakan"}
              </button>
            </div>
          </div>
        )}

        {/* ACTION */}

        <div className="procurement-detail-actions">
          <button
            type="button"
            className="procurement-detail-cancel"
            disabled={processing}
            onClick={handleBack}
          >
            Kembali
          </button>

          {!showRejectForm && (
            <>
              <button
                type="button"
                className="kadiv-reject-button"
                disabled={processing}
                onClick={() => {
                  setRejectReason("");
                  setShowRejectForm(true);
                }}
              >
                Tolak
              </button>

              <button
                type="button"
                className="btn btn-warning"
                disabled={processing}
                onClick={confirmCancelApprove}
                style={{ padding: "10px 20px", fontWeight: "600", borderRadius: "8px" }}
              >
                Cancel Approve
              </button>

              <button
                type="button"
                className="kadiv-approve-button"
                disabled={processing}
                onClick={confirmApprove}
              >
                {processing ? "Memproses..." : "Setujui"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
              CUSTOM ALERT MODAL
          ========================================== */}

      <AlertModal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        isLoading={processing}
        onConfirm={handleModalConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}

export default KadivDetail;
