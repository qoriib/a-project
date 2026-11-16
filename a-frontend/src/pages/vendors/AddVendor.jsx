
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AddVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function AddVendor() {
  const navigate = useNavigate();

  // ==========================================
  // DATA MASTER
  // ==========================================

  const [categoryList, setCategoryList] = useState([]);
  const [paymentTermList, setPaymentTermList] = useState([]);

  const [selectedVendorSubcategories, setSelectedVendorSubcategories] =
    useState([]);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [categoryOther, setCategoryOther] = useState("");
  const [approvalLayers, setApprovalLayers] = useState([]);

  const subcategoryOptions = ["Material", "Jasa"];

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    namaPerusahaan: "",
    searchTerm: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Indonesia",

    phone: "",
    mobilePhone: "",
    fax: "",
    picVendor: "",
    email: "",

    npwp: "",
    businessType: "",
    dueDatePayment: "",
    paymentTermOther: "",
    orderCurrency: "",
    orderCurrencyOther: "",

    bankAccounts: [
      {
        bank_name: "",
        account_number: "",
        account_name: "",
        swift_code: "",
        documents: [],
      },
    ],

    strukturOrganisasiFiles: [],
    aktaPendirianFiles: [],
    aktaPerubahanFiles: [],
    companyProfileFiles: [],
    npwpSppkpFiles: [],
    nibFiles: [],
    identitasPengurusFiles: [],
    laporanKeuanganFiles: [],
    dokumentasiLokasiFiles: [],
    bpjsKetenagakerjaanFiles: [],
    perizinanPekerjaanFiles: [],
    sertifikasiKompetensiFiles: [],
    dokumenPendukungFiles: [],
  });

  // ==========================================
  // MODAL ALERT
  // ==========================================

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Kembali",
    onConfirm: null,
    showCancel: false,
    loading: false,
  });

  // ==========================================
  // AMBIL DATA KATEGORI
  // ==========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vendor-categories`, {
          headers: getAuthHeaders(false),
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil kategori");
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setCategoryList(list);
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
        setCategoryList([]);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================
  // AMBIL DATA PAYMENT TERM
  // ==========================================

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/payment-terms`, {
          headers: getAuthHeaders(false),
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil payment terms");
        }

        const data = await response.json();
        setPaymentTermList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal mengambil payment terms:", error);
        setPaymentTermList([]);
      }
    };

    fetchPaymentTerms();
  }, []);

  // ==========================================
  // INPUT BIASA
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // KATEGORI DAN SUBKATEGORI
  // ==========================================

  const selectedCategory = categoryList.find(
    (item) => String(item.id) === String(selectedCategoryId)
  );

  const categoryDesc =
    selectedCategory?.category_desc || selectedCategory?.name || "";

  const isCategoryOther =
    categoryDesc.trim().toLowerCase().includes("other") ||
    selectedCategory?.cat_code === "VMS_012" ||
    selectedCategory?.cat_code === "VMS_015";

  const handleCategoryChange = (value) => {
    setSelectedCategoryId(value);
    setSelectedSubcategories([]);
    setCategoryOther("");
  };

  useEffect(() => {
    if (!selectedCategory) {
      setApprovalLayers([]);
      return;
    }

    const catCode =
      selectedCategory.cat_code ||
      selectedCategory.code ||
      selectedCategory.category_desc ||
      "";

    if (!catCode) return;

    fetch(`${API_BASE_URL}/vendor-categories/${catCode}/approval-layer`, {
      headers: getAuthHeaders(false),
    })
      .then((res) => res.json())
      .then((data) => {
        setApprovalLayers(data.approval_layers || []);
      })
      .catch((err) => {
        console.error("Gagal load approval layer:", err);
      });
  }, [selectedCategory]);

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategory)
        ? prev.filter((item) => item !== subcategory)
        : [...prev, subcategory]
    );
  };

  const addVendorSubcategory = () => {
    if (!selectedCategoryId) {
      alert("Pilih kategori utama terlebih dahulu.");
      return;
    }

    if (selectedSubcategories.length === 0) {
      alert("Pilih minimal satu subkategori.");
      return;
    }

    if (isCategoryOther && !categoryOther.trim()) {
      alert("Nama kategori Other wajib diisi.");
      return;
    }

    const alreadyExists = selectedVendorSubcategories.some(
      (item) => String(item.category_id) === String(selectedCategoryId)
    );

    if (alreadyExists) {
      alert(
        "Kategori tersebut sudah ditambahkan. Hapus kategori tersebut terlebih dahulu jika ingin mengubah subkategori."
      );
      return;
    }

    setSelectedVendorSubcategories((prev) => [
      ...prev,
      {
        category_id: Number(selectedCategoryId),
        category_other: isCategoryOther ? categoryOther.trim() : null,
        subcategories: [...selectedSubcategories],
      },
    ]);

    closeCategoryModal();
  };

  const removeVendorSubcategory = (index) => {
    setSelectedVendorSubcategories((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const getCategoryName = (item) => {
    const category = categoryList.find(
      (cat) => String(cat.id) === String(item.category_id)
    );

    if (!category) return "-";

    const desc = category.category_desc || category.name || category.cat_code || "";

    if (desc.trim().toLowerCase().includes("other")) {
      return `Other - ${item.category_other || "-"}`;
    }

    return desc;
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setSelectedCategoryId("");
    setSelectedSubcategories([]);
    setCategoryOther("");
  };

  // ==========================================
  // INPUT REKENING BANK
  // ==========================================

  const handleBankChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((bank, i) =>
        i === index ? { ...bank, [field]: value } : bank
      ),
    }));
  };

  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        {
          bank_name: "",
          account_number: "",
          account_name: "",
          swift_code: "",
          documents: [],
        },
      ],
    }));
  };

  const removeBankAccount = (index) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index),
    }));
  };

  // ==========================================
  // VALIDASI FILE
  // ==========================================

  const validateFiles = (files) => {
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const maxSize = 10 * 1024 * 1024;

    for (const file of files) {
      const extension = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        alert(`Format file ${file.name} tidak didukung.`);
        return false;
      }

      if (file.size > maxSize) {
        alert(`Ukuran file ${file.name} melebihi 10 MB.`);
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // INPUT DOKUMEN UMUM
  // ==========================================

  const handleGeneralFilesChange = (e, field) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (!validateFiles(files)) {
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ...files],
    }));

    e.target.value = "";
  };

  // ==========================================
  // INPUT DOKUMEN REKENING
  // ==========================================

  const handleBankDocumentsChange = (e, bankIndex) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (!validateFiles(files)) {
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((bank, i) =>
        i === bankIndex
          ? {
              ...bank,
              documents: [...bank.documents, ...files],
            }
          : bank
      ),
    }));

    e.target.value = "";
  };

  // ==========================================
  // HAPUS DOKUMEN
  // ==========================================

  const removeGeneralFile = (field, fileIndex) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== fileIndex),
    }));
  };

  const removeBankDocument = (bankIndex, fileIndex) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((bank, i) =>
        i === bankIndex
          ? {
              ...bank,
              documents: bank.documents.filter((_, j) => j !== fileIndex),
            }
          : bank
      ),
    }));
  };

  // ==========================================
  // CEK PAYMENT TERM OTHER
  // ==========================================

  const isPaymentTermOther = paymentTermList.some(
    (payment) =>
      String(payment.id) === String(formData.dueDatePayment) &&
      payment.name?.toLowerCase() === "other"
  );

  // ==========================================
  // MODAL ALERT
  // ==========================================

  const closeModal = () => {
    if (modal.loading) return;

    setModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const openConfirmModal = ({
    type = "info",
    title,
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Kembali",
    onConfirm,
  }) => {
    setModal({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      showCancel: true,
      loading: false,
    });
  };

  const openAlertModal = ({
    type = "success",
    title,
    message,
    confirmText = "Mengerti",
    onConfirm = null,
  }) => {
    setModal({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText: "",
      onConfirm,
      showCancel: false,
      loading: false,
    });
  };

  const handleModalConfirm = async () => {
    if (modal.loading) return;

    const callback = modal.onConfirm;

    if (callback) {
      await callback();
    } else {
      closeModal();
    }
  };

  // ==========================================
  // SUBMIT VENDOR
  // ==========================================

  const handleSubmit = async (action = "submit") => {
    if (
      action === "submit" &&
      selectedVendorSubcategories.length === 0
    ) {
      setModal((prev) => ({ ...prev, loading: false }));

      openAlertModal({
        type: "error",
        title: "Kategori Belum Dipilih",
        message:
          "Pilih minimal satu kategori dan subkategori sebelum mengirim vendor.",
        confirmText: "Mengerti",
      });

      return;
    }

    const data = new FormData();

    // ACTION
    data.append("action", action);

    // DATA PERUSAHAAN
    data.append("nama_perusahaan", formData.namaPerusahaan);
    data.append("search_term", formData.searchTerm);
    data.append("address", formData.address);
    data.append("city", formData.city);
    data.append("postal_code", formData.postalCode);
    data.append("country", formData.country);

    // CONTACT
    data.append("phone", formData.phone);
    data.append("mobile_phone", formData.mobilePhone);
    data.append("fax", formData.fax);
    data.append("pic_vendor", formData.picVendor);
    data.append("email", formData.email);

    // PROCUREMENT
    data.append("npwp", formData.npwp);
    data.append("business_type", formData.businessType);

    // KATEGORI DAN SUBKATEGORI
    // Satu kategori dengan dua subkategori dikirim sebagai dua record.
    let subcategoryIndex = 0;

    selectedVendorSubcategories.forEach((item) => {
      item.subcategories.forEach((subcategory) => {
        data.append(
          `vendor_subcategories[${subcategoryIndex}][category_id]`,
          item.category_id
        );

        data.append(
          `vendor_subcategories[${subcategoryIndex}][category_other]`,
          item.category_other || ""
        );

        data.append(
          `vendor_subcategories[${subcategoryIndex}][subcategory]`,
          subcategory
        );

        subcategoryIndex++;
      });
    });

    // PAYMENT TERM
    if (formData.dueDatePayment) {
      data.append("payment_term_id", formData.dueDatePayment);
    }

    if (isPaymentTermOther && formData.paymentTermOther) {
      data.append("payment_term_other", formData.paymentTermOther);
    }

    // ORDER CURRENCY
    if (formData.orderCurrency) {
      data.append("order_currency", formData.orderCurrency);
    }

    if (
      formData.orderCurrency === "OTHER" &&
      formData.orderCurrencyOther
    ) {
      data.append("order_currency_other", formData.orderCurrencyOther);
    }

    // BANK ACCOUNTS
    formData.bankAccounts.forEach((bank, index) => {
      data.append(`bank_accounts[${index}][bank_name]`, bank.bank_name);

      data.append(
        `bank_accounts[${index}][account_number]`,
        bank.account_number
      );

      data.append(
        `bank_accounts[${index}][account_name]`,
        bank.account_name
      );

      data.append(
        `bank_accounts[${index}][swift_code]`,
        bank.swift_code || ""
      );

      bank.documents.forEach((file, fileIndex) => {
        data.append(
          `bank_accounts[${index}][documents][${fileIndex}]`,
          file
        );
      });
    });

    // DOKUMEN UMUM VENDOR
    const generalDocumentFields = [
      ["strukturOrganisasiFiles", "struktur_organisasi_files"],
      ["aktaPendirianFiles", "akta_pendirian_files"],
      ["aktaPerubahanFiles", "akta_perubahan_files"],
      ["companyProfileFiles", "company_profile_files"],
      ["npwpSppkpFiles", "npwp_sppkp_files"],
      ["nibFiles", "nib_files"],
      ["identitasPengurusFiles", "identitas_pengurus_files"],
      ["laporanKeuanganFiles", "laporan_keuangan_files"],
      ["dokumentasiLokasiFiles", "dokumentasi_lokasi_files"],
      ["bpjsKetenagakerjaanFiles", "bpjs_ketenagakerjaan_files"],
      ["perizinanPekerjaanFiles", "perizinan_pekerjaan_files"],
      ["sertifikasiKompetensiFiles", "sertifikasi_kompetensi_files"],
      ["dokumenPendukungFiles", "dokumen_pendukung_files"],
    ];

    generalDocumentFields.forEach(([stateField, requestField]) => {
      formData[stateField].forEach((file, index) => {
        data.append(`${requestField}[${index}]`, file);
      });
    });

    // KIRIM KE BACKEND
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error menyimpan vendor:", result);

        const validationMessages = result.errors
          ? Object.values(result.errors).flat().join("\n")
          : "";

        setModal((prev) => ({ ...prev, loading: false }));

        openAlertModal({
          type: "error",
          title: "Gagal Menyimpan Vendor",
          message:
            validationMessages ||
            result.message ||
            "Terjadi kesalahan saat menyimpan data vendor.",
          confirmText: "Periksa Kembali",
        });

        return;
      }

      console.log("Vendor berhasil disimpan:", result);

      setModal((prev) => ({ ...prev, loading: false }));

      openAlertModal({
        type: "success",
        title:
          action === "draft"
            ? "Draft Berhasil Disimpan!"
            : "Vendor Berhasil Dikirim!",
        message:
          action === "draft"
            ? "Data vendor telah disimpan sebagai draft. Kamu dapat melanjutkan prosesnya nanti."
            : "Data vendor berhasil disimpan dan dikirim ke proses approval Kadiv Requester.",
        confirmText: "Selesai",
        onConfirm: () => {
          setModal((prev) => ({ ...prev, open: false }));
          navigate("/vendors/add");
        },
      });
    } catch (error) {
      console.error("Error mengirim vendor:", error);

      setModal((prev) => ({ ...prev, loading: false }));

      openAlertModal({
        type: "error",
        title: "Koneksi Bermasalah",
        message:
          "Data vendor belum berhasil dikirim. Periksa koneksi ke server, lalu coba kembali.",
        confirmText: "Mengerti",
      });
    }
  };

  // ==========================================
  // DAFTAR DOKUMEN UMUM
  // ==========================================

  const documents = [
    {
      label: "Struktur Organisasi Perusahaan",
      field: "strukturOrganisasiFiles",
    },
    {
      label: "Akta Pendirian dan SK Kemenkumham",
      field: "aktaPendirianFiles",
    },
    {
      label: "Akta Perubahan Terakhir dan SK Kemenkumham",
      field: "aktaPerubahanFiles",
    },
    {
      label: "Company Profile",
      field: "companyProfileFiles",
    },
    {
      label: "NPWP & SPPKP / SPNon-PKP",
      field: "npwpSppkpFiles",
    },
    {
      label: "NIB",
      field: "nibFiles",
    },
    {
      label: "Identitas Pengurus",
      field: "identitasPengurusFiles",
    },
    {
      label: "Laporan Keuangan",
      field: "laporanKeuanganFiles",
    },
    {
      label: "Dokumentasi Lokasi Usaha",
      field: "dokumentasiLokasiFiles",
    },
    {
      label: "BPJS Ketenagakerjaan",
      field: "bpjsKetenagakerjaanFiles",
    },
    {
      label: "Dokumen Perizinan Lingkup Pekerjaan",
      field: "perizinanPekerjaanFiles",
    },
    {
      label: "Sertifikasi Kompetensi Keahlian",
      field: "sertifikasiKompetensiFiles",
    },
    {
      label: "Dokumen Pendukung Lainnya",
      field: "dokumenPendukungFiles",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="add-vendor-page">
      <div className="add-vendor-card">

        {/* HEADER */}

        <div className="add-vendor-header">
          <h4>Tambah Vendor</h4>
          <p>Tambahkan data vendor baru</p>
        </div>

        {/* FORM */}

        <form
          className="add-vendor-form"
          onSubmit={(e) => {
            e.preventDefault();

            openConfirmModal({
              type: "send",
              title: "Kirim Data Vendor?",
              message:
                "Pastikan seluruh informasi dan dokumen vendor sudah benar. Setelah dikirim, data akan masuk ke proses approval Kadiv Requester.",
              confirmText: "Ya, Kirim Vendor",
              onConfirm: async () => {
                setModal((prev) => ({
                  ...prev,
                  loading: true,
                }));

                await handleSubmit("submit");
              },
            });
          }}
        >

          {/* DATA PERUSAHAAN */}

          <div className="add-vendor-section">
            <h5 className="add-vendor-section-title">Data Perusahaan</h5>

            <p className="add-vendor-section-description">
              Informasi utama perusahaan vendor
            </p>

            <div className="row add-vendor-row">
              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Nama Perusahaan</label>
                <input
                  type="text"
                  name="namaPerusahaan"
                  className="add-vendor-input"
                  value={formData.namaPerusahaan}
                  onChange={handleChange}
                  placeholder="Masukkan nama perusahaan"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Search Term</label>
                <input
                  type="text"
                  name="searchTerm"
                  className="add-vendor-input"
                  value={formData.searchTerm}
                  onChange={handleChange}
                  placeholder="Masukkan search term"
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="add-vendor-input"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Masukkan city"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  className="add-vendor-input"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Masukkan postal code"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Country</label>
                <input
                  type="text"
                  name="country"
                  className="add-vendor-input"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Masukkan country"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">
                  Telephone / Nomor Telepon
                </label>
                <input
                  type="text"
                  name="phone"
                  className="add-vendor-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Masukkan nomor telepon"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Mobile Phone</label>
                <input
                  type="text"
                  name="mobilePhone"
                  className="add-vendor-input"
                  value={formData.mobilePhone}
                  onChange={handleChange}
                  placeholder="Masukkan mobile phone"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Fax</label>
                <input
                  type="text"
                  name="fax"
                  className="add-vendor-input"
                  value={formData.fax}
                  onChange={handleChange}
                  placeholder="Masukkan nomor fax"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Contact Person</label>
                <input
                  type="text"
                  name="picVendor"
                  className="add-vendor-input"
                  value={formData.picVendor}
                  onChange={handleChange}
                  placeholder="Masukkan nama contact person"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="add-vendor-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vendor@email.com"
                  required
                />
              </div>
            </div>

            <div className="row add-vendor-row add-vendor-address-row">
              <div className="col-12 add-vendor-field">
                <label className="add-vendor-label">Street Address</label>
                <textarea
                  name="address"
                  className="add-vendor-input add-vendor-textarea"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Masukkan street address"
                  required
                />
              </div>
            </div>
          </div>

          {/* REQUESTER */}

          <div className="add-vendor-section">
            <h5 className="add-vendor-section-title">Requester</h5>

            <p className="add-vendor-section-description">
              Informasi requester dan klasifikasi vendor
            </p>

            <div className="row add-vendor-row">
              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">NPWP</label>
                <input
                  type="text"
                  name="npwp"
                  className="add-vendor-input"
                  value={formData.npwp}
                  onChange={handleChange}
                  placeholder="Masukkan NPWP"
                  required
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Business Type</label>
                <input
                  type="text"
                  name="businessType"
                  className="add-vendor-input"
                  value={formData.businessType}
                  onChange={handleChange}
                  placeholder="Masukkan business type"
                />
              </div>

              {/* KATEGORI DAN SUBKATEGORI */}

              <div className="col-12 add-vendor-field">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <label className="add-vendor-label mb-1">
                      Kategori dan Subkategori
                    </label>

                    <small className="text-muted d-block">
                      Pilih kategori beserta jenis subkategorinya. Satu
                      kategori dapat memiliki Material dan Jasa.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCategoryModalOpen(true)}
                  >
                    + Tambah Kategori
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "70px" }}>No</th>
                        <th>Kategori</th>
                        <th>Subkategori</th>
                        <th style={{ width: "110px" }}>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedVendorSubcategories.length > 0 ? (
                        selectedVendorSubcategories.map((item, index) => (
                          <tr key={item.category_id}>
                            <td>{index + 1}</td>
                            <td>{getCategoryName(item)}</td>
                            <td>{item.subcategories.join(", ")}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => removeVendorSubcategory(index)}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
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

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">
                  Company Code / Purchasing Organization
                </label>
                <input
                  type="text"
                  className="add-vendor-input"
                  value="1200 / 1300 (All Comp. Code)"
                  readOnly
                />
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Due Date Payment</label>

                <select
                  name="dueDatePayment"
                  className="add-vendor-input add-vendor-select"
                  value={formData.dueDatePayment}
                  onChange={handleChange}
                  required
                >
                  <option value="">Pilih Due Date Payment</option>

                  {paymentTermList.map((payment) => (
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
                    name="paymentTermOther"
                    className="add-vendor-input add-vendor-other"
                    value={formData.paymentTermOther}
                    onChange={handleChange}
                    placeholder="Masukkan due date payment"
                    required
                  />
                )}
              </div>

              <div className="col-md-6 add-vendor-field">
                <label className="add-vendor-label">Order Currency</label>

                <select
                  name="orderCurrency"
                  className="add-vendor-input add-vendor-select"
                  value={formData.orderCurrency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Pilih Order Currency</option>
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="OTHER">Other</option>
                </select>

                {formData.orderCurrency === "OTHER" && (
                  <input
                    type="text"
                    name="orderCurrencyOther"
                    className="add-vendor-input add-vendor-other"
                    value={formData.orderCurrencyOther}
                    onChange={handleChange}
                    placeholder="Masukkan order currency"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          {/* DATA BANK */}

          <div className="add-vendor-section">
            <div className="bank-section-heading">
              <div>
                <h5 className="add-vendor-section-title">Data Bank</h5>
                <p className="add-vendor-section-description">
                  Informasi rekening bank vendor. Tambahkan rekening sebanyak
                  yang diperlukan.
                </p>
              </div>

              <button
                type="button"
                className="bank-add-button"
                onClick={addBankAccount}
              >
                <span className="bank-add-icon">+</span>
                Tambah Rekening
              </button>
            </div>

            <div className="bank-account-list">
              {formData.bankAccounts.map((bank, index) => (
                <div className="bank-account-card" key={`new-bank-${index}`}>
                  <div className="bank-card-heading">
                    <div className="bank-card-title-wrap">
                      <div className="bank-card-icon">
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
                        <h6 className="bank-card-title">
                          Rekening Bank {String(index + 1).padStart(2, "0")}
                        </h6>
                        <p className="bank-card-subtitle">
                          Informasi rekening vendor
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bank-remove-button"
                      onClick={() => removeBankAccount(index)}
                      disabled={formData.bankAccounts.length <= 1}
                      title={
                        formData.bankAccounts.length <= 1
                          ? "Minimal satu rekening harus tersedia"
                          : "Hapus rekening ini"
                      }
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="bank-card-divider" />

                  <div className="row bank-fields-row">
                    <div className="col-md-4 add-vendor-field">
                      <label className="add-vendor-label">
                        Nama Bank <span className="bank-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="add-vendor-input bank-input"
                        placeholder="Contoh: Bank Mandiri"
                        value={bank.bank_name}
                        onChange={(event) =>
                          handleBankChange(
                            index,
                            "bank_name",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="col-md-4 add-vendor-field">
                      <label className="add-vendor-label">
                        Nomor Rekening <span className="bank-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="add-vendor-input bank-input"
                        placeholder="Masukkan nomor rekening"
                        value={bank.account_number}
                        onChange={(event) =>
                          handleBankChange(
                            index,
                            "account_number",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="col-md-4 add-vendor-field">
                      <label className="add-vendor-label">
                        Nama Pemilik Rekening{" "}
                        <span className="bank-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="add-vendor-input bank-input"
                        placeholder="Nama sesuai rekening"
                        value={bank.account_name}
                        onChange={(event) =>
                          handleBankChange(
                            index,
                            "account_name",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="col-md-4 add-vendor-field">
                      <label className="add-vendor-label">Swift Code</label>
                      <input
                        type="text"
                        className="add-vendor-input bank-input"
                        placeholder="Masukkan Swift Code (opsional)"
                        value={bank.swift_code || ""}
                        onChange={(event) =>
                          handleBankChange(
                            index,
                            "swift_code",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* DOKUMEN REKENING */}

                  <div className="bank-document-upload mt-3">
                    <label className="add-vendor-label">
                      Dokumen Rekening Bank
                    </label>

                    <input
                      type="file"
                      className="add-vendor-file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) =>
                        handleBankDocumentsChange(e, index)
                      }
                    />

                    <small className="add-vendor-file-info">
                      Bisa memilih beberapa dokumen sekaligus. Maksimal 10 MB
                      per file.
                    </small>

                    {bank.documents.length > 0 && (
                      <div className="mt-3">
                        {bank.documents.map((file, fileIndex) => (
                          <div
                            className="add-vendor-document-selected mb-2"
                            key={`${file.name}-${fileIndex}`}
                          >
                            <div className="add-vendor-document-file-info">
                              <span className="add-vendor-document-file-icon">
                                📄
                              </span>

                              <div className="add-vendor-document-file-detail">
                                <span className="add-vendor-document-file-name">
                                  {file.name}
                                </span>
                                <small>
                                  {(file.size / 1024).toFixed(2)} KB
                                </small>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="add-vendor-document-remove"
                              onClick={() =>
                                removeBankDocument(index, fileIndex)
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPLOAD DOKUMEN UMUM */}

          <div className="add-vendor-document-section">
            <h5 className="add-vendor-document-title">
              Upload Dokumen Perusahaan
            </h5>

            <p className="add-vendor-document-description">
              Upload dokumen pendukung perusahaan vendor. Format PDF, JPG,
              JPEG, atau PNG dengan ukuran maksimal 10 MB per file. Setiap
              kategori dapat memiliki beberapa file.
            </p>

            <div className="add-vendor-document-list">
              {documents.map((document, index) => {
                const files = formData[document.field];
                const isUploaded = files.length > 0;

                return (
                  <div
                    className="add-vendor-document-item"
                    key={document.field}
                  >
                    <div className="add-vendor-document-row">
                      <div className="add-vendor-document-name">
                        <span className="add-vendor-document-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div>
                          <p className="add-vendor-document-label">
                            {document.label}
                          </p>

                          <div
                            className={`add-vendor-document-status ${
                              isUploaded ? "completed" : ""
                            }`}
                          >
                            {isUploaded ? (
                              <>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m5 12 4 4L19 6" />
                                </svg>
                                {files.length} file berhasil dipilih
                              </>
                            ) : (
                              "Belum ada dokumen"
                            )}
                          </div>
                        </div>
                      </div>

                      <label
                        className="add-vendor-upload-button"
                        htmlFor={`upload-${document.field}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 16V4" />
                          <path d="m7 9 5-5 5 5" />
                          <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
                        </svg>
                        Upload
                      </label>

                      <input
                        id={`upload-${document.field}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        hidden
                        onChange={(e) =>
                          handleGeneralFilesChange(e, document.field)
                        }
                      />
                    </div>

                    {isUploaded && (
                      <div className="add-vendor-document-files">
                        {files.map((file, fileIndex) => (
                          <div
                            className="add-vendor-document-selected"
                            key={`${file.name}-${fileIndex}`}
                          >
                            <div className="add-vendor-document-file-info">
                              <span className="add-vendor-document-file-icon">
                                📄
                              </span>

                              <div className="add-vendor-document-file-detail">
                                <span className="add-vendor-document-file-name">
                                  {file.name}
                                </span>
                                <small>
                                  {(file.size / 1024).toFixed(2)} KB
                                </small>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="add-vendor-document-remove"
                              onClick={() =>
                                removeGeneralFile(
                                  document.field,
                                  fileIndex
                                )
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTION */}

          <div className="add-vendor-actions">
            <button
              type="button"
              className="add-vendor-cancel"
              onClick={() => {
                openConfirmModal({
                  type: "warning",
                  title: "Batalkan Pengisian?",
                  message:
                    "Data yang sudah kamu isi dan dokumen yang dipilih akan ditinggalkan. Pastikan kamu memang ingin keluar dari halaman ini.",
                  confirmText: "Ya, Batalkan",
                  cancelText: "Lanjut Mengisi",
                  onConfirm: () => {
                    setModal((prev) => ({
                      ...prev,
                      open: false,
                    }));

                    navigate(-1);
                  },
                });
              }}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-secondary add-vendor-draft"
              onClick={() => {
                openConfirmModal({
                  type: "draft",
                  title: "Simpan sebagai Draft?",
                  message:
                    "Data vendor akan disimpan sebagai draft agar bisa dilanjutkan nanti. Pastikan informasi yang diperlukan sudah diisi.",
                  confirmText: "Ya, Simpan Draft",
                  onConfirm: async () => {
                    setModal((prev) => ({
                      ...prev,
                      loading: true,
                    }));

                    await handleSubmit("draft");
                  },
                });
              }}
            >
              Simpan Draft
            </button>

            <button
              type="submit"
              className="btn btn-primary add-vendor-save"
            >
              Simpan & Kirim
            </button>
          </div>
        </form>

        {/* MODAL PILIH KATEGORI DAN SUBKATEGORI */}

        {categoryModalOpen && (
          <div
            className="vendor-alert-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeCategoryModal();
              }
            }}
          >
            <div
              className="vendor-alert-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
            >
              <h4 id="category-modal-title">Tambah Kategori Vendor</h4>

              <p className="vendor-alert-message">
                Pilih kategori utama dan satu atau beberapa subkategori.
              </p>

              {/* KATEGORI UTAMA */}

              <div className="mb-3 text-start">
                <label className="add-vendor-label">
                  Kategori Utama
                </label>

                <select
                  className="add-vendor-input add-vendor-select"
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Pilih Kategori</option>

                  {categoryList.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_desc || category.name || category.cat_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* ALUR APPROVAL PREVIEW */}
              {approvalLayers.length > 0 && (
                <div className="mb-3 text-start p-3 bg-light rounded border">
                  <label className="fw-bold mb-2 text-primary" style={{ fontSize: "13px" }}>
                    ℹ️ Alur Approval untuk Kategori Ini:
                  </label>
                  <ol className="mb-0 ps-3" style={{ fontSize: "12px", color: "#333" }}>
                    {approvalLayers.map((layer) => (
                      <li key={layer.priority} className="mb-1">
                        <strong>Level {layer.priority} ({layer.stage}):</strong>{" "}
                        {layer.name} — <span className="text-muted">{layer.position} ({layer.department})</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* INPUT KATEGORI OTHER */}

              {isCategoryOther && (
                <div className="mb-3 text-start">
                  <label className="add-vendor-label">
                    Nama Kategori Other
                  </label>

                  <input
                    type="text"
                    className="add-vendor-input"
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    placeholder="Masukkan nama kategori"
                    maxLength={255}
                  />
                </div>
              )}

              {/* SUBKATEGORI CHECKBOX */}

              <div className="mb-4 text-start">
                <label className="add-vendor-label d-block mb-2">
                  Subkategori
                </label>

                <div className="border rounded p-3">
                  {subcategoryOptions.map((subcategory) => (
                    <div className="form-check mb-2" key={subcategory}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`subcategory-${subcategory}`}
                        checked={selectedSubcategories.includes(subcategory)}
                        onChange={() =>
                          handleSubcategoryChange(subcategory)
                        }
                        disabled={!selectedCategoryId}
                      />

                      <label
                        className="form-check-label"
                        htmlFor={`subcategory-${subcategory}`}
                      >
                        {subcategory}
                      </label>
                    </div>
                  ))}
                </div>

                <small className="text-muted">
                  Kamu bisa memilih Material dan Jasa sekaligus.
                </small>
              </div>

              {/* TOMBOL */}

              <div className="vendor-alert-actions">
                <button
                  type="button"
                  className="vendor-alert-secondary"
                  onClick={closeCategoryModal}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="vendor-alert-primary"
                  onClick={addVendorSubcategory}
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ALERT */}

        {modal.open && (
          <div
            className="vendor-alert-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !modal.loading) {
                closeModal();
              }
            }}
          >
            <div
              className="vendor-alert-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-alert-title"
            >
              <div className={`vendor-alert-icon ${modal.type}`}>
                {modal.type === "success" && "✓"}
                {modal.type === "error" && "!"}
                {modal.type === "warning" && "!"}
                {modal.type === "draft" && "▤"}
                {modal.type === "send" && "➤"}
                {modal.type === "info" && "i"}
              </div>

              <h4 id="vendor-alert-title">{modal.title}</h4>

              <p className="vendor-alert-message">{modal.message}</p>

              <div className="vendor-alert-actions">
                {modal.showCancel && (
                  <button
                    type="button"
                    className="vendor-alert-secondary"
                    onClick={closeModal}
                    disabled={modal.loading}
                  >
                    {modal.cancelText}
                  </button>
                )}

                <button
                  type="button"
                  className={`vendor-alert-primary ${modal.type}`}
                  onClick={handleModalConfirm}
                  disabled={modal.loading}
                >
                  {modal.loading ? "Memproses..." : modal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddVendor;
