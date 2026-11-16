import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcurementDetail.css";
import { BASE_URL as API_URL, API_BASE_URL, getStorageUrl } from "../../api/config";

const DOCUMENT_LIST = [
  {
    key: "struktur_organisasi_files",
    type: "STRUKTUR_ORGANISASI",
    label: "Struktur Organisasi",
  },
  {
    key: "akta_pendirian_files",
    type: "AKTA_PENDIRIAN",
    label: "Akta Pendirian",
  },
  {
    key: "akta_perubahan_files",
    type: "AKTA_PERUBAHAN",
    label: "Akta Perubahan",
  },
  {
    key: "company_profile_files",
    type: "COMPANY_PROFILE",
    label: "Company Profile",
  },
  {
    key: "npwp_sppkp_files",
    type: "NPWP_SPPKP",
    label: "NPWP / SPPKP"
  },
  {
    key: "nib_files",
    type: "NIB",
    label: "NIB"
  },
  {
    key: "identitas_pengurus_files",
    type: "IDENTITAS_PENGURUS",
    label: "Identitas Pengurus",
  },
  {
    key: "laporan_keuangan_files",
    type: "LAPORAN_KEUANGAN",
    label: "Laporan Keuangan",
  },
  {
    key: "dokumentasi_lokasi_files",
    type: "DOKUMENTASI_LOKASI",
    label: "Dokumentasi Lokasi",
  },
  {
    key: "bpjs_ketenagakerjaan_files",
    type: "BPJS_KETENAGAKERJAAN",
    label: "BPJS Ketenagakerjaan",
  },
  {
    key: "perizinan_pekerjaan_files",
    type: "PERIZINAN_PEKERJAAN",
    label: "Perizinan Pekerjaan",
  },
  {
    key: "sertifikasi_kompetensi_files",
    type: "SERTIFIKASI_KOMPETENSI",
    label: "Sertifikasi Kompetensi",
  },
  {
    key: "dokumen_pendukung_files",
    type: "DOKUMEN_PENDUKUNG",
    label: "Dokumen Pendukung",
  },
];

const EMPTY_FORM = {
  nama_perusahaan: "",
  search_term: "",
  address: "",
  city: "",
  postal_code: "",
  country: "",
  phone: "",
  mobile_phone: "",
  fax: "",
  pic_vendor: "",
  email: "",
  npwp: "",
  business_type: "",
  payment_term_id: "",
  payment_term_other: "",
  order_currency: "",
  order_currency_other: "",
};

const createEmptyBank = () => ({
  _key: `new-bank-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  id: null,
  bank_name: "",
  account_number: "",
  account_name: "",
  swift_code: "",
});

function ProcurementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const token = localStorage.getItem("token");

  // ==========================================
  // STATE
  // ==========================================

  const [requestData, setRequestData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendorSubcategories, setVendorSubcategories] = useState([]);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [paymentTerms, setPaymentTerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  const [permissions, setPermissions] = useState({
    can_view: false,
    can_edit: false,
    can_approve: false,
    is_admin: false,
  });

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [bankAccounts, setBankAccounts] = useState([createEmptyBank()]);

  const [files, setFiles] = useState({
    struktur_organisasi_files: [],
    akta_pendirian_files: [],
    akta_perubahan_files: [],
    company_profile_files: [],
    npwp_sppkp_files: [],
    nib_files: [],
    identitas_pengurus_files: [],
    laporan_keuangan_files: [],
    dokumentasi_lokasi_files: [],
    bpjs_ketenagakerjaan_files: [],
    perizinan_pekerjaan_files: [],
    sertifikasi_kompetensi_files: [],
    dokumen_pendukung_files: [],
  });

  // Key dokumen rekening menggunakan _key rekening,
  // bukan index array agar tidak tertukar saat rekening ditambah.
  const [bankDocuments, setBankDocuments] = useState({});

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Kembali",
    onConfirm: null,
    showCancel: false,
  });

  // ==========================================
  // ALERT / CONFIRMATION MODAL
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
    if (saving || processingApproval) return;

    setModal((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const handleCancel = () => {
    showAlert({
      type: "warning",
      title: "Batalkan Perubahan?",
      message:
        "Apakah kamu yakin ingin keluar dari halaman ini? Perubahan yang belum disimpan tidak akan tersimpan.",
      confirmText: "Ya, Batal",
      cancelText: "Lanjut Edit",
      showCancel: true,
      onConfirm: () => navigate("/vendors/add"),
    });
  };

  const confirmSubmit = (action) => {
    if (saving) return;

    const isDraft = action === "draft";

    showAlert({
      type: "warning",
      title: isDraft ? "Simpan Draft?" : "Simpan & Kirim Vendor?",
      message: isDraft
        ? "Apakah kamu yakin ingin menyimpan perubahan data vendor sebagai draft?"
        : "Pastikan seluruh data vendor sudah benar. Data akan disimpan dan dikirim untuk proses approval.",
      confirmText: isDraft ? "Ya, Simpan Draft" : "Ya, Simpan & Kirim",
      cancelText: "Periksa Kembali",
      showCancel: true,
      onConfirm: () => handleSubmit(action),
    });
  };

  // ==========================================
  // GET DETAIL REQUEST
  // ==========================================

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendor-requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data request.");
        }

        const result = await response.json();
        const data = result.data;

        if (!data) {
          throw new Error("Data request tidak ditemukan.");
        }

        console.log("Procurement Detail:", result);

        setRequestData(data);

        setPermissions(
          result.permissions || {
            can_view: false,
            can_edit: false,
            can_approve: false,
            is_admin: false,
          },
        );

        const vendor = data.vendor || {};

        // --------------------------------------
        // KATEGORI DAN SUBKATEGORI
        // --------------------------------------

        const existingSubcategories =
          vendor.vendor_subcategories ?? vendor.vendorSubcategories ?? [];

        setVendorSubcategories(
          Array.isArray(existingSubcategories)
            ? existingSubcategories.map((item) => ({
              category_id: item.category_id,
              subcategory: item.subcategory,
              category: item.category ?? null,
            }))
            : [],
        );

        // --------------------------------------
        // BANK ACCOUNTS
        // --------------------------------------

        const existingBankAccounts =
          vendor.bank_accounts ?? vendor.bankAccounts ?? [];

        if (
          Array.isArray(existingBankAccounts) &&
          existingBankAccounts.length > 0
        ) {
          setBankAccounts(
            existingBankAccounts.map((bank) => ({
              _key: `bank-${bank.id}`,
              id: bank.id ?? null,
              bank_name: bank.bank_name ?? "",
              account_number: bank.account_number ?? bank.rekening ?? "",
              account_name:
                bank.account_name ?? bank.benificiary ?? bank.beneficiary ?? "",
              swift_code: bank.swift_code ?? "",
            })),
          );
        } else {
          setBankAccounts([createEmptyBank()]);
        }

        // --------------------------------------
        // VENDOR FORM
        // --------------------------------------

        setForm({
          nama_perusahaan: vendor.nama_perusahaan || "",
          search_term: vendor.search_term || "",
          address: vendor.address || "",
          city: vendor.city || "",
          postal_code: vendor.postal_code || "",
          country: vendor.country || "",
          phone: vendor.phone || "",
          mobile_phone: vendor.mobile_phone || "",
          fax: vendor.fax || "",
          pic_vendor: vendor.pic_vendor || "",
          email: vendor.email || "",
          npwp: vendor.npwp || "",
          business_type: vendor.business_type || "",
          payment_term_id: vendor.payment_term_id || "",
          payment_term_other: vendor.payment_term_other || "",
          order_currency: vendor.order_currency || "",
          order_currency_other: vendor.order_currency_other || "",
        });
      } catch (error) {
        console.error("Gagal mengambil detail procurement:", error);
        showAlert({
          type: "error",
          title: "Gagal Memuat Data",
          message: error.message || "Gagal mengambil data vendor.",
          confirmText: "Kembali",
          onConfirm: () => navigate("/approval"),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, token]);

  // ==========================================
  // MASTER KATEGORI
  // ==========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendor-categories`, {
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
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [token]);

  // ==========================================
  // MASTER PAYMENT TERM
  // ==========================================

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/payment-terms`, {
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
      } catch (error) {
        console.error("Gagal mengambil payment terms:", error);
        setPaymentTerms([]);
      }
    };

    fetchPaymentTerms();
  }, [token]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // KATEGORI DAN SUBKATEGORI
  // ==========================================

  const addVendorSubcategory = () => {
    if (!selectedCategoryId || !selectedSubcategory) {
      showAlert({
        type: "error",
        title: "Data Belum Lengkap",
        message: "Pilih kategori dan subkategori terlebih dahulu.",
        confirmText: "Mengerti",
      });
      return;
    }

    const alreadyExists = vendorSubcategories.some(
      (item) =>
        String(item.category_id) === String(selectedCategoryId) &&
        item.subcategory === selectedSubcategory,
    );

    if (alreadyExists) {
      showAlert({
        type: "error",
        title: "Kategori Sudah Dipilih",
        message: "Kombinasi kategori dan subkategori tersebut sudah tersedia.",
        confirmText: "Mengerti",
      });
      return;
    }

    setVendorSubcategories((prev) => [
      ...prev,
      {
        category_id: selectedCategoryId,
        subcategory: selectedSubcategory,
      },
    ]);

    setSelectedCategoryId("");
    setSelectedSubcategory("");
    setCategoryModalOpen(false);
  };

  const removeVendorSubcategory = (index) => {
    setVendorSubcategories((prev) => prev.filter((_, i) => i !== index));
  };

  const getCategoryName = (categoryId, categoryData = null) => {
    if (categoryData?.name) {
      return categoryData.name;
    }

    const category = categories.find(
      (item) => String(item.id) === String(categoryId),
    );

    return category?.name || "-";
  };

  // ==========================================
  // HANDLE BANK ACCOUNTS
  // ==========================================

  const handleBankChange = (index, field, value) => {
    setBankAccounts((prev) =>
      prev.map((bank, bankIndex) =>
        bankIndex === index ? { ...bank, [field]: value } : bank,
      ),
    );
  };

  const addBankAccount = () => {
    setBankAccounts((prev) => [...prev, createEmptyBank()]);
  };

  const removeBankAccount = (index) => {
    const bank = bankAccounts[index];

    // Rekening yang sudah tersimpan tidak dihapus dari sini.
    if (bank?.id) return;

    setBankAccounts((prev) => prev.filter((_, i) => i !== index));

    if (bank?._key) {
      setBankDocuments((prev) => {
        const updated = { ...prev };
        delete updated[bank._key];
        return updated;
      });
    }
  };

  // ==========================================
  // HANDLE FILE UPLOAD
  // ==========================================

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;

    setFiles((prev) => ({
      ...prev,
      [name]: Array.from(selectedFiles || []),
    }));
  };

  const handleBankDocumentChange = (bankKey, selectedFiles) => {
    setBankDocuments((prev) => ({
      ...prev,
      [bankKey]: Array.from(selectedFiles || []),
    }));
  };

  // ==========================================
  // OTHER PAYMENT TERM
  // ==========================================

  const isPaymentTermOther = paymentTerms.some(
    (payment) =>
      String(payment.id) === String(form.payment_term_id) &&
      payment.name?.toLowerCase() === "other",
  );

  // ==========================================
  // PERMISSIONS
  // ==========================================

  const canEdit =
    permissions.can_edit &&
    requestData?.current_stage === "REQUESTER" &&
    requestData?.status === "Pending";

  const canApprove =
    permissions.can_approve &&
    requestData?.current_stage === "REQUESTER" &&
    requestData?.status === "Under Review";

  // ==========================================
  // DOCUMENT HELPERS
  // ==========================================

  const getDocumentPath = (document) => {
    if (!document) return null;

    return (
      document.file_path ||
      document.path ||
      document.file ||
      document.document_path ||
      null
    );
  };

  const getFileName = (path) => {
    if (!path) return null;

    return String(path).split("/").pop();
  };

  // Dokumen umum: tidak mengambil dokumen rekening.
  const getExistingDocuments = (type, legacyTypes = []) => {
    const documents = requestData?.vendor?.documents || [];

    const allowedTypes = [type, ...legacyTypes].map((item) =>
      String(item).toUpperCase(),
    );

    return documents
      .filter(
        (document) =>
          !document.bank_account_id &&
          allowedTypes.includes(
            String(document.document_type || "").toUpperCase(),
          ),
      )
      .sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
  };

  // Dokumen rekening berdasarkan ID rekening.
  const getBankDocuments = (bankId) => {
    if (!bankId) return [];

    const documents = requestData?.vendor?.documents || [];

    return documents
      .filter(
        (document) =>
          String(document.document_type || "").toUpperCase() === "REKENING" &&
          String(document.bank_account_id) === String(bankId),
      )
      .sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (action) => {
    if (!canEdit || saving) return;

    // Submit wajib lolos validasi browser.
    if (action === "submit") {
      if (!formRef.current?.reportValidity()) {
        return;
      }

      const errors = [];

      if (vendorSubcategories.length === 0) {
        errors.push("Pilih minimal satu kategori dan subkategori.");
      }

      if (isPaymentTermOther && !form.payment_term_other.trim()) {
        errors.push("Due Date Payment Other wajib diisi.");
      }

      if (
        form.order_currency === "OTHER" &&
        !form.order_currency_other.trim()
      ) {
        errors.push("Keterangan Order Currency Other wajib diisi.");
      }

      if (errors.length > 0) {
        showAlert({
          type: "error",
          title: "Data Belum Lengkap",
          message: errors.join("\n"),
          confirmText: "Periksa Kembali",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const formData = new FormData();

      // Endpoint saat ini menggunakan POST + method spoofing PUT.
      formData.append("_method", "PUT");

      // --------------------------------------
      // DATA VENDOR
      // --------------------------------------

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // KATEGORI DAN SUBKATEGORI
      vendorSubcategories.forEach((item, index) => {
        formData.append(
          `vendor_subcategories[${index}][category_id]`,
          item.category_id,
        );

        formData.append(
          `vendor_subcategories[${index}][subcategory]`,
          item.subcategory,
        );
      });

      // --------------------------------------
      // BANK ACCOUNTS
      // --------------------------------------

      const validBankAccounts = bankAccounts
        .map((bank, originalIndex) => ({
          ...bank,
          originalIndex,
        }))
        .filter(
          (bank) =>
            bank.bank_name.trim() !== "" ||
            bank.account_number.trim() !== "" ||
            bank.account_name.trim() !== "" ||
            (bank.swift_code || "").trim() !== "" ||
            (bankDocuments[bank._key] || []).length > 0,
        );

      validBankAccounts.forEach((bank, index) => {
        if (bank.id !== null && bank.id !== undefined) {
          formData.append(`bank_accounts[${index}][id]`, String(bank.id));
        }

        formData.append(
          `bank_accounts[${index}][bank_name]`,
          bank.bank_name.trim(),
        );

        formData.append(
          `bank_accounts[${index}][account_number]`,
          bank.account_number.trim(),
        );

        formData.append(
          `bank_accounts[${index}][account_name]`,
          bank.account_name.trim(),
        );

        formData.append(
          `bank_accounts[${index}][swift_code]`,
          (bank.swift_code || "").trim(),
        );

        // Dokumen rekening memakai key rekening yang stabil.
        const selectedBankDocuments = bankDocuments[bank._key] || [];

        selectedBankDocuments.forEach((file, fileIndex) => {
          formData.append(
            `bank_accounts[${index}][documents][${fileIndex}]`,
            file,
          );
        });
      });

      // --------------------------------------
      // DOKUMEN UMUM
      // --------------------------------------

      Object.entries(files).forEach(([key, selectedFiles]) => {
        selectedFiles.forEach((file, index) => {
          formData.append(`${key}[${index}]`, file);
        });
      });

      formData.append("action", action);

      // --------------------------------------
      // REQUEST
      // --------------------------------------

      const response = await fetch(
        `${API_URL}/api/vendor-requests/${id}/procurement`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const messages = Object.values(data.errors).flat().join("\n");

          throw new Error(
            messages || data.message || "Gagal menyimpan vendor.",
          );
        }

        throw new Error(data.message || "Gagal menyimpan vendor.");
      }

      const isDraft = action === "draft";

      showAlert({
        type: "success",
        title: isDraft ? "Draft Berhasil Disimpan" : "Vendor Berhasil Dikirim",
        message:
          data.message ||
          (isDraft
            ? "Perubahan data vendor berhasil disimpan sebagai draft."
            : "Data vendor berhasil disimpan dan dikirim untuk proses approval."),
        confirmText: "OK",
        onConfirm: () => navigate("/vendors/add"),
      });
    } catch (error) {
      console.error("Procurement error:", error);

      showAlert({
        type: "error",
        title: "Gagal Menyimpan Data",
        message:
          error.message || "Terjadi kesalahan saat menyimpan data vendor.",
        confirmText: "Mengerti",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // APPROVAL / REJECT
  // ==========================================

  const handleApproval = async (action) => {
    if (processingApproval || !canApprove) return;

    if (action === "reject" && !rejectionReason.trim()) {
      showAlert({
        type: "error",
        title: "Catatan Wajib Diisi",
        message: "Masukkan alasan penolakan terlebih dahulu.",
        confirmText: "Mengerti",
      });
      return;
    }

    setProcessingApproval(true);

    try {
      const response = await fetch(
        `${API_URL}/api/vendor-requests/${id}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "reject" ? { rejection_reason: rejectionReason } : {},
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          `Gagal ${action === "approve" ? "menyetujui" : "menolak"
          } pengajuan.`,
        );
      }

      showAlert({
        type: "success",
        title:
          action === "approve" ? "Pengajuan Disetujui" : "Pengajuan Ditolak",
        message: data.message || "Status pengajuan berhasil diperbarui.",
        confirmText: "OK",
        onConfirm: () => navigate("/approval"),
      });
    } catch (error) {
      showAlert({
        type: "error",
        title: "Approval Gagal",
        message: error.message,
        confirmText: "Mengerti",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // DATA TIDAK ADA
  // ==========================================

  if (!requestData) {
    return (
      <div className="procurement-detail-page">
        <div className="procurement-detail-card">
          <div className="procurement-detail-loading">
            Data vendor tidak ditemukan.
          </div>
        </div>
      </div>
    );
  }

  const vendor = requestData.vendor || {};

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="procurement-detail-page">
      <div className="procurement-detail-card">
        {/* HEADER */}
        <div className="procurement-detail-header">
          <h4>Detail Procurement</h4>
          <p>{vendor.nama_perusahaan || "Detail data vendor"}</p>
        </div>

        {/* REQUEST INFO */}
        <div className="procurement-request-info">
          <div className="procurement-request-item">
            <span className="procurement-request-label">Status</span>
            <span
              className={`procurement-request-value ${requestData.status === "Rejected"
                ? "procurement-status-rejected"
                : ""
                }`}
            >
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

        {/* REJECTION NOTICE */}
        {requestData.status === "Rejected" &&
          requestData.current_stage === "REQUESTER" && (
            <div className="procurement-rejection-notice">
              <div className="procurement-rejection-header">
                <div className="procurement-rejection-mark">!</div>

                <div className="procurement-rejection-title-wrap">
                  <h6 className="procurement-rejection-title">
                    Pengajuan Dikembalikan
                  </h6>
                  <p className="procurement-rejection-subtitle">
                    Pengajuan vendor perlu diperbaiki sebelum dikirim kembali.
                  </p>
                </div>

                <span className="procurement-rejection-badge">Rejected</span>
              </div>

              <div className="procurement-rejection-body">
                <span className="procurement-rejection-label">
                  Catatan dari Kadiv Requester
                </span>
                <p className="procurement-rejection-reason">
                  {requestData.rejection_reason ||
                    requestData.rejection_session ||
                    "Alasan penolakan belum tersedia."}
                </p>
              </div>

              <div className="procurement-rejection-hint">
                Perbaiki data yang diperlukan, lalu klik{" "}
                <strong>Simpan & Kirim</strong> untuk mengajukan ulang.
              </div>
            </div>
          )}

        {/* FORM */}
        <form
          ref={formRef}
          className="procurement-detail-form"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* ======================================
              DATA PERUSAHAAN
          ====================================== */}

          <div className="procurement-section">
            <h5 className="procurement-section-title">Data Perusahaan</h5>
            <p className="procurement-section-description">
              Informasi utama perusahaan vendor.
            </p>

            <div className="row procurement-detail-row">
              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Nama Perusahaan {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="nama_perusahaan"
                  value={form.nama_perusahaan}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan nama perusahaan"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">Search Term</label>
                <input
                  type="text"
                  name="search_term"
                  value={form.search_term}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan search term"
                />
              </div>

              <div className="col-12 procurement-detail-field">
                <label className="procurement-detail-label">
                  Street Address {canEdit && <span className="text-danger">*</span>}
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input procurement-detail-textarea"
                  placeholder="Masukkan street address"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  City {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan city"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Postal Code {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan postal code"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Country {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan country"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Telephone {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan nomor telepon"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Mobile Phone {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="mobile_phone"
                  value={form.mobile_phone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan mobile phone"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Fax {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="fax"
                  value={form.fax}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan nomor fax"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Contact Person {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="pic_vendor"
                  value={form.pic_vendor}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan contact person"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Email {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="vendor@email.com"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  NPWP {canEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  name="npwp"
                  value={form.npwp}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan NPWP"
                  required={canEdit}
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Business Type
                </label>
                <input
                  type="text"
                  name="business_type"
                  value={form.business_type}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input"
                  placeholder="Masukkan business type"
                />
              </div>

              <div className="col-12 procurement-detail-field">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <label className="procurement-detail-label mb-1">
                      Kategori dan Subkategori {canEdit && <span className="text-danger">*</span>}
                    </label>

                    <small className="text-muted d-block">
                      Daftar kategori dan subkategori vendor.
                    </small>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCategoryModalOpen(true)}
                      disabled={saving}
                    >
                      + Tambah Kategori
                    </button>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "70px" }}>No</th>
                        <th>Kategori</th>
                        <th>Subkategori</th>
                        {canEdit && <th style={{ width: "110px" }}>Aksi</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {vendorSubcategories.length > 0 ? (
                        vendorSubcategories.map((item, index) => (
                          <tr key={`${item.category_id}-${item.subcategory}`}>
                            <td>{index + 1}</td>

                            <td>
                              {getCategoryName(item.category_id, item.category)}
                            </td>

                            <td>{item.subcategory}</td>

                            {canEdit && (
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeVendorSubcategory(index)}
                                  disabled={saving}
                                >
                                  Hapus
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={canEdit ? 4 : 3}
                            className="text-center text-muted py-3"
                          >
                            Belum ada kategori yang dipilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Company Code / Purchasing Organization
                </label>
                <input
                  type="text"
                  value="1200 / 1300 - PROJECT BAKTI"
                  readOnly
                  className="procurement-detail-input procurement-detail-readonly"
                />
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Due Date Payment {canEdit && <span className="text-danger">*</span>}
                </label>
                <select
                  name="payment_term_id"
                  value={form.payment_term_id}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input procurement-detail-select"
                  required={canEdit}
                >
                  <option value="">Pilih Due Date Payment</option>
                  {paymentTerms.map((payment) => (
                    <option key={payment.id} value={payment.id}>
                      {payment.code
                        ? `${payment.code} - ${payment.name}`
                        : payment.name}
                    </option>
                  ))}
                </select>

                {isPaymentTermOther && (
                  <input
                    type="text"
                    name="payment_term_other"
                    value={form.payment_term_other}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="procurement-detail-input procurement-detail-other"
                    placeholder="Masukkan due date payment"
                    required={canEdit}
                  />
                )}
              </div>

              <div className="col-md-6 procurement-detail-field">
                <label className="procurement-detail-label">
                  Order Currency {canEdit && <span className="text-danger">*</span>}
                </label>
                <select
                  name="order_currency"
                  value={form.order_currency}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="procurement-detail-input procurement-detail-select"
                  required={canEdit}
                >
                  <option value="">Pilih Order Currency</option>
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="OTHER">Other</option>
                </select>

                {form.order_currency === "OTHER" && (
                  <input
                    type="text"
                    name="order_currency_other"
                    value={form.order_currency_other}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="procurement-detail-input procurement-detail-other"
                    placeholder="Masukkan order currency"
                    required={canEdit}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ======================================
              DATA BANK
          ====================================== */}

          <div className="procurement-section">
            <h5 className="procurement-section-title">Data Bank</h5>
            <p className="procurement-section-description">
              Informasi seluruh rekening bank vendor. Setiap rekening dapat
              memiliki dokumen pendukung masing-masing.
            </p>

            {bankAccounts.map((bank, index) => {
              const existingBankDocuments = getBankDocuments(bank.id);
              const selectedBankFiles = bankDocuments[bank._key] || [];

              return (
                <div className="procurement-bank-card" key={bank._key}>
                  <div className="procurement-bank-card-header">
                    <h6>Rekening Bank {index + 1}</h6>

                    {canEdit && !bank.id && bankAccounts.length > 1 && (
                      <button
                        type="button"
                        className="procurement-bank-remove"
                        onClick={() => removeBankAccount(index)}
                        disabled={saving}
                      >
                        Hapus Rekening
                      </button>
                    )}
                  </div>

                  <div className="row procurement-detail-row">
                    <div className="col-md-6 procurement-detail-field">
                      <label className="procurement-detail-label">
                        Bank Name {canEdit && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.bank_name}
                        onChange={(e) =>
                          handleBankChange(index, "bank_name", e.target.value)
                        }
                        disabled={!canEdit}
                        className="procurement-detail-input"
                        placeholder="Masukkan nama bank"
                        required={canEdit}
                      />
                    </div>

                    <div className="col-md-6 procurement-detail-field">
                      <label className="procurement-detail-label">
                        Bank Account Number {canEdit && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.account_number}
                        onChange={(e) =>
                          handleBankChange(
                            index,
                            "account_number",
                            e.target.value,
                          )
                        }
                        disabled={!canEdit}
                        className="procurement-detail-input"
                        placeholder="Masukkan nomor rekening"
                        required={canEdit}
                      />
                    </div>

                    <div className="col-md-6 procurement-detail-field">
                      <label className="procurement-detail-label">
                        Beneficiary {canEdit && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.account_name}
                        onChange={(e) =>
                          handleBankChange(
                            index,
                            "account_name",
                            e.target.value,
                          )
                        }
                        disabled={!canEdit}
                        className="procurement-detail-input"
                        placeholder="Masukkan nama pemilik rekening"
                        required={canEdit}
                      />
                    </div>

                    <div className="col-md-6 procurement-detail-field">
                      <label className="procurement-detail-label">
                        Swift Code
                      </label>
                      <input
                        type="text"
                        value={bank.swift_code}
                        onChange={(e) =>
                          handleBankChange(index, "swift_code", e.target.value)
                        }
                        disabled={!canEdit}
                        className="procurement-detail-input"
                        placeholder="Masukkan Swift Code (jika ada)"
                      />
                    </div>
                  </div>

                  {/* DOKUMEN REKENING */}
                  <div className="procurement-bank-documents">
                    <div className="procurement-bank-documents-header">
                      <div>
                        <h6>Dokumen Rekening</h6>
                        <p>Dokumen pendukung untuk rekening bank ini.</p>
                      </div>
                    </div>

                    {existingBankDocuments.length > 0 ? (
                      <div className="procurement-document-list">
                        {existingBankDocuments.map((document) => {
                          const path = getDocumentPath(document);

                          return (
                            <div
                              className="procurement-existing-file"
                              key={document.id}
                            >
                              <span
                                className="procurement-existing-file-name"
                                title={getFileName(path)}
                              >
                                {getFileName(path) || "Dokumen rekening"}
                                {document.version
                                  ? ` (Versi ${document.version})`
                                  : ""}
                              </span>

                              {path && (
                                <a
                                  href={`${API_URL}/storage/${path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="procurement-view-file"
                                >
                                  Lihat
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="procurement-no-file">
                        Belum ada dokumen rekening.
                      </div>
                    )}

                    {canEdit && (
                      <>
                        <input
                          type="file"
                          className="procurement-detail-file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) =>
                            handleBankDocumentChange(bank._key, e.target.files)
                          }
                        />

                        {selectedBankFiles.length > 0 && (
                          <div className="procurement-selected-files">
                            <strong>File yang akan diupload:</strong>
                            {selectedBankFiles.map((file, fileIndex) => (
                              <div
                                className="procurement-selected-file-item"
                                key={`${file.name}-${fileIndex}`}
                              >
                                <span className="procurement-file-bullet">
                                  •
                                </span>
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <small className="procurement-detail-file-info">
                      Format: PDF, JPG, JPEG, PNG.
                    </small>
                  </div>
                </div>
              );
            })}

            {canEdit && (
              <button
                type="button"
                className="procurement-bank-add"
                onClick={addBankAccount}
                disabled={saving}
              >
                + Tambah Rekening Bank
              </button>
            )}
          </div>

          {/* ======================================
              DOKUMEN UMUM
          ====================================== */}

          <div className="procurement-document-section">
            <h5 className="procurement-section-title">Upload Dokumen</h5>
            <p className="procurement-section-description">
              Dokumen pendukung vendor yang sudah tersimpan. Kamu dapat
              menambahkan beberapa file untuk setiap kategori dokumen.
            </p>

            <div className="row procurement-detail-row">
              {DOCUMENT_LIST.map((document) => {
                const existingDocuments = getExistingDocuments(document.type);

                const selectedFiles = files[document.key] || [];

                return (
                  <div
                    className="col-md-6 procurement-detail-field"
                    key={document.key}
                  >
                    <label className="procurement-detail-file-label">
                      {document.label}
                    </label>

                    {existingDocuments.length > 0 ? (
                      <div className="procurement-document-list">
                        {existingDocuments.map((existing) => {
                          const path = getDocumentPath(existing);

                          return (
                            <div
                              className="procurement-existing-file"
                              key={existing.id}
                            >
                              <span
                                className="procurement-existing-file-name"
                                title={getFileName(path)}
                              >
                                {getFileName(path) || "Dokumen"}
                                {existing.version
                                  ? ` (Versi ${existing.version})`
                                  : ""}
                              </span>

                              {path && (
                                <a
                                  href={`${API_URL}/storage/${path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="procurement-view-file"
                                >
                                  Lihat
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="procurement-no-file">
                        Belum ada dokumen.
                      </div>
                    )}

                    {canEdit && (
                      <>
                        <input
                          type="file"
                          name={document.key}
                          className="procurement-detail-file"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                        />

                        {selectedFiles.length > 0 && (
                          <div className="procurement-selected-files">
                            <strong>File yang akan diupload:</strong>
                            {selectedFiles.map((file, fileIndex) => (
                              <div
                                className="procurement-selected-file-item"
                                key={`${file.name}-${fileIndex}`}
                              >
                                <span className="procurement-file-bullet">
                                  •
                                </span>
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <small className="procurement-detail-file-info">
                      Format: PDF, JPG, JPEG, PNG.
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================
              ACTION
          ====================================== */}

          <div className="procurement-detail-actions">
            <button
              type="button"
              className="procurement-detail-cancel"
              disabled={saving || processingApproval}
              onClick={() => navigate("/approval")}
            >
              Kembali
            </button>

            {/* REQUESTER */}
            {canEdit && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary procurement-detail-draft"
                  disabled={saving}
                  onClick={() => confirmSubmit("draft")}
                >
                  {saving ? "Menyimpan..." : "Simpan Draft"}
                </button>

                <button
                  type="button"
                  className="btn btn-primary procurement-detail-save"
                  disabled={saving}
                  onClick={() => confirmSubmit("submit")}
                >
                  {saving ? "Mengirim..." : "Simpan & Kirim"}
                </button>
              </>
            )}

            {/* APPROVER */}
            {canApprove && (
              <div className="procurement-approval-actions">
                <div className="procurement-approval-info">
                  <span className="procurement-approval-info-icon">✓</span>
                  <div>
                    <strong>Pengajuan Siap Ditinjau</strong>
                    <p>Periksa data vendor sebelum memberikan keputusan.</p>
                  </div>
                </div>

                <div className="procurement-approval-buttons">
                  <button
                    type="button"
                    className="procurement-reject-button"
                    disabled={processingApproval}
                    onClick={() => setShowRejectForm((prev) => !prev)}
                  >
                    <span>✕</span>
                    Reject
                  </button>

                  <button
                    type="button"
                    className="procurement-approve-button"
                    disabled={processingApproval}
                    onClick={() =>
                      showAlert({
                        type: "warning",
                        title: "Setujui Pengajuan?",
                        message:
                          "Apakah kamu yakin ingin menyetujui pengajuan vendor pada tahap Requester?",
                        confirmText: "Ya, Setujui",
                        cancelText: "Periksa Kembali",
                        showCancel: true,
                        onConfirm: () => handleApproval("approve"),
                      })
                    }
                  >
                    {processingApproval ? (
                      <>
                        <span className="procurement-button-spinner"></span>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Approve Pengajuan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FORM REJECT */}
          {showRejectForm && canApprove && (
            <div className="procurement-reject-panel">
              <div className="procurement-reject-panel-header">
                <div className="procurement-reject-panel-icon">!</div>
                <div>
                  <h6>Tolak Pengajuan Vendor</h6>
                  <p>
                    Berikan alasan yang jelas agar Requester mengetahui bagian
                    yang harus diperbaiki.
                  </p>
                </div>
              </div>

              <div className="procurement-reject-field">
                <label htmlFor="rejectionReason">
                  Alasan Penolakan <span className="text-danger">*</span>
                </label>

                <textarea
                  id="rejectionReason"
                  rows="4"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas..."
                  disabled={processingApproval}
                />

                <small>Catatan ini akan ditampilkan kepada Requester.</small>
              </div>

              <div className="procurement-reject-actions">
                <button
                  type="button"
                  className="procurement-reject-cancel"
                  disabled={processingApproval}
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="procurement-reject-confirm"
                  disabled={processingApproval || !rejectionReason.trim()}
                  onClick={() =>
                    showAlert({
                      type: "warning",
                      title: "Konfirmasi Penolakan",
                      message:
                        "Pengajuan akan dikembalikan kepada Requester dengan catatan penolakan yang sudah kamu tulis. Lanjutkan?",
                      confirmText: "Ya, Tolak Pengajuan",
                      cancelText: "Periksa Kembali",
                      showCancel: true,
                      onConfirm: () => handleApproval("reject"),
                    })
                  }
                >
                  {processingApproval ? "Memproses..." : "Tolak Pengajuan"}
                </button>
              </div>
            </div>
          )}
        </form>

        {categoryModalOpen && canEdit && (
          <div className="procurement-alert-overlay">
            <div
              className="procurement-alert-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
            >
              <div className="procurement-alert-content">
                <h5 id="category-modal-title">Tambah Kategori</h5>

                <p>Pilih kategori dan subkategori vendor.</p>

                <div className="mb-3 text-start">
                  <label className="procurement-detail-label">
                    Kategori <span className="text-danger">*</span>
                  </label>

                  <select
                    className="form-select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Pilih Kategori</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 text-start">
                  <label className="procurement-detail-label">
                    Subkategori <span className="text-danger">*</span>
                  </label>

                  <select
                    className="form-select"
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                  >
                    <option value="">Pilih Subkategori</option>
                    <option value="Material">Material</option>
                    <option value="Jasa">Jasa</option>
                  </select>
                </div>
              </div>

              <div className="procurement-alert-actions">
                <button
                  type="button"
                  className="procurement-alert-btn procurement-alert-cancel"
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setSelectedCategoryId("");
                    setSelectedSubcategory("");
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="procurement-alert-btn procurement-alert-confirm"
                  onClick={addVendorSubcategory}
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================
          CUSTOM MODAL
      ====================================== */}

      {modal.open && (
        <div className="procurement-alert-overlay">
          <div
            className={`procurement-alert-modal procurement-alert-${modal.type}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="procurement-alert-title"
          >
            <div className="procurement-alert-icon">
              {modal.type === "success" && "✓"}
              {modal.type === "error" && "!"}
              {modal.type === "warning" && "?"}
              {modal.type === "info" && "i"}
            </div>

            <div className="procurement-alert-content">
              <h5 id="procurement-alert-title">{modal.title}</h5>
              <p>{modal.message}</p>
            </div>

            <div className="procurement-alert-actions">
              {modal.showCancel && (
                <button
                  type="button"
                  className="procurement-alert-btn procurement-alert-cancel"
                  onClick={closeModal}
                  disabled={saving || processingApproval}
                >
                  {modal.cancelText}
                </button>
              )}

              <button
                type="button"
                className={`procurement-alert-btn ${modal.type === "warning"
                  ? "procurement-alert-confirm-warning"
                  : modal.type === "error"
                    ? "procurement-alert-confirm-danger"
                    : "procurement-alert-confirm"
                  }`}
                disabled={saving || processingApproval}
                onClick={() => {
                  if (modal.onConfirm) {
                    modal.onConfirm();
                  } else {
                    closeModal();
                  }
                }}
              >
                {saving || processingApproval
                  ? "Memproses..."
                  : modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcurementDetail;
