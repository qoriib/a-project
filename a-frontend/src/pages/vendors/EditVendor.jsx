import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditVendor.css";
import {
  API_BASE_URL as API_URL,
  STORAGE_BASE_URL as STORAGE_URL,
} from "../../api/config";

const DOCUMENT_TYPES = [
  {
    key: "STRUKTUR_ORGANISASI",
    label: "Struktur Organisasi Perusahaan",
    field: "struktur_organisasi_files",
    aliases: ["STRUKTUR_ORGANISASI"],
  },
  {
    key: "AKTA_PENDIRIAN",
    label: "Akta Pendirian dan SK Kemenkumham",
    field: "akta_pendirian_files",
    aliases: ["AKTA_PENDIRIAN"],
  },
  {
    key: "AKTA_PERUBAHAN",
    label: "Akta Perubahan Terakhir dan SK Kemenkumham",
    field: "akta_perubahan_files",
    aliases: ["AKTA_PERUBAHAN"],
  },
  {
    key: "COMPANY_PROFILE",
    label: "Company Profile",
    field: "company_profile_files",
    aliases: ["COMPANY_PROFILE"],
  },
  {
    key: "NPWP_SPPKP",
    label: "NPWP & SPPKP / Faktur Pajak",
    field: "npwp_sppkp_files",
    aliases: ["NPWP_SPPKP", "NPWP", "SPPKP"],
  },
  {
    key: "NIB",
    label: "Nomor Induk Berusaha (NIB)",
    field: "nib_files",
    aliases: ["NIB"],
  },
  {
    key: "IDENTITAS_PENGURUS",
    label: "Identitas Pengurus (KTP / Paspor & NPWP Direksi)",
    field: "identitas_pengurus_files",
    aliases: ["IDENTITAS_PENGURUS", "KTP", "PASPOR"],
  },
  {
    key: "LAPORAN_KEUANGAN",
    label: "Laporan Keuangan (Neraca / Laba Rugi)",
    field: "laporan_keuangan_files",
    aliases: ["LAPORAN_KEUANGAN"],
  },
  {
    key: "DOKUMENTASI_LOKASI",
    label: "Foto Kantor / Plang Nama Perusahaan / Surat Keterangan Domisili",
    field: "dokumentasi_lokasi_files",
    aliases: [
      "DOKUMENTASI_LOKASI",
      "SURAT_KETERANGAN_DOMISILI",
      "FOTO_TEMPAT_USAHA",
      "DOMISILI",
    ],
  },
  {
    key: "BPJS_KETENAGAKERJAAN",
    label: "BPJS Ketenagakerjaan",
    field: "bpjs_ketenagakerjaan_files",
    aliases: ["BPJS_KETENAGAKERJAAN", "BPJS"],
  },
  {
    key: "PERIZINAN_PEKERJAAN",
    label: "Dokumen Perizinan Lingkup Pekerjaan (SIUP / SBU)",
    field: "perizinan_pekerjaan_files",
    aliases: ["PERIZINAN_PEKERJAAN", "SIUP", "SBU"],
  },
  {
    key: "SERTIFIKASI_KOMPETENSI",
    label: "Sertifikasi Kompetensi Keahlian",
    field: "sertifikasi_kompetensi_files",
    aliases: ["SERTIFIKASI_KOMPETENSI", "SERTIFIKAT"],
  },
  {
    key: "DOKUMEN_PENDUKUNG",
    label: "Dokumen Pendukung Lainnya",
    field: "dokumen_pendukung_files",
    aliases: ["DOKUMEN_PENDUKUNG", "REKENING", "LAINNYA"],
  },
];

const EMPTY_FORM = {
  nama_perusahaan: "",
  vendor_code: "",
  company_code_purch_org: "1200 / 1300 (PROJECT BAKTI)",
  search_term: "",
  address: "",
  city: "",
  postal_code: "",
  country: "Indonesia",
  phone: "",
  mobile_phone: "",
  fax: "",
  pic_vendor: "",
  email: "",
  npwp: "",
  business_type: "",
  kategori_id: "",
  kategori_other: "",
  payment_term_id: "",
  payment_term_other: "",
  order_currency: "IDR",
  order_currency_other: "",
  bank_name: "",
  rekening: "",
  benificiary: "",
  account_group_id: "",
  recon_account_id: "",
  payment_method: "Transfer",
  withholding_tax_ids: [],
};

const EMPTY_DOCUMENTS = {
  STRUKTUR_ORGANISASI: null,
  AKTA_PENDIRIAN: null,
  AKTA_PERUBAHAN: null,
  COMPANY_PROFILE: null,
  NPWP_SPPKP: null,
  NIB: null,
  IDENTITAS_PENGURUS: null,
  LAPORAN_KEUANGAN: null,
  DOKUMENTASI_LOKASI: null,
  BPJS_KETENAGAKERJAAN: null,
  PERIZINAN_PEKERJAAN: null,
  SERTIFIKASI_KOMPETENSI: null,
  DOKUMEN_PENDUKUNG: null,
};

function editVendor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [subcategories, setSubcategories] = useState(["Material", "Jasa"]);

  const [bankAccounts, setBankAccounts] = useState([
    {
      id: null,
      bank_name: "",
      rekening: "",
      benificiary: "",
      swift_code: "",
    },
  ]);

  const [categories, setCategories] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [accountGroups, setAccountGroups] = useState([]);
  const [reconAccounts, setReconAccounts] = useState([]);
  const [withholdingTaxes, setWithholdingTaxes] = useState([]);

  // Dokumen yang baru dipilih untuk upload.
  const [selectedDocuments, setSelectedDocuments] = useState(EMPTY_DOCUMENTS);

  // ID dokumen lama yang akan dihapus.
  const [deletedDocuments, setDeletedDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [alertModal, setAlertModal] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  // =========================================================
  // ALERT
  // =========================================================

  const showAlert = (type, title, message) => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    const shouldRedirect = alertModal.type === "success" && Boolean(success);

    setAlertModal((previous) => ({
      ...previous,
      show: false,
    }));

    if (shouldRedirect) {
      navigate("/vendors/existing");
    }
  };

  // =========================================================
  // API HEADERS
  // =========================================================

  const headers = useMemo(
    () => ({
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  // =========================================================
  // RESPONSE HELPERS
  // =========================================================

  const getData = (result) => {
    let value = result?.data ?? result;

    if (value?.vendor && typeof value.vendor === "object") {
      value = value.vendor;
    }

    return value;
  };

  const getList = (body) => {
    let value = body;

    for (let i = 0; i < 3; i++) {
      if (Array.isArray(value)) return value;

      if (!value || typeof value !== "object") {
        return [];
      }

      if (Array.isArray(value.data)) {
        return value.data;
      }

      if (value.vendor && typeof value.vendor === "object") {
        value = value.vendor;
        continue;
      }

      if (Array.isArray(value.account_groups)) {
        return value.account_groups;
      }

      if (Array.isArray(value.recon_accounts)) {
        return value.recon_accounts;
      }

      if (Array.isArray(value.withholding_taxes)) {
        return value.withholding_taxes;
      }

      return [];
    }

    return Array.isArray(value) ? value : [];
  };

  // =========================================================
  // BANK HELPERS
  // =========================================================

  const getBanks = (data) => {
    const banks = data?.bank_accounts ?? data?.bankAccounts ?? [];

    if (Array.isArray(banks) && banks.length > 0) {
      return banks.map((bank) => ({
        id: bank.id ?? null,
        bank_name: bank.bank_name ?? "",
        rekening: bank.account_number ?? bank.rekening ?? "",
        benificiary: bank.account_name ?? bank.benificiary ?? "",
        swift_code: bank.swift_code ?? "",
      }));
    }

    // Kompatibilitas data lama.
    if (data?.bank_name || data?.rekening || data?.benificiary) {
      return [
        {
          id: null,
          bank_name: data.bank_name ?? "",
          rekening: data.rekening ?? "",
          benificiary: data.benificiary ?? "",
          swift_code: data.swift_code ?? "",
        },
      ];
    }

    return [
      {
        id: null,
        bank_name: "",
        rekening: "",
        benificiary: "",
        swift_code: "",
      },
    ];
  };

  // =========================================================
  // FILL FORM
  // =========================================================

  const fillForm = (data) => {
    const banks = getBanks(data);

    setBankAccounts(banks);

    // Muat subkategori yang sudah ada
    const existingSubs = (data?.vendor_subcategories ?? data?.vendorSubcategories ?? [])
      .map((s) => s.subcategory)
      .filter(Boolean);
    setSubcategories(existingSubs.length > 0 ? existingSubs : ["Material", "Jasa"]);

    const taxes = data.withholding_taxes ?? data.withholdingTaxes ?? [];

    const taxIds = Array.isArray(taxes)
      ? taxes.map((tax) => String(tax.id))
      : [];

    setForm({
      ...EMPTY_FORM,

      nama_perusahaan: data.nama_perusahaan ?? "",
      vendor_code: data.vendor_code ?? "",

      company_code_purch_org:
        data.company_code_purch_org ?? "1200 / 1300 (PROJECT BAKTI)",

      search_term: data.search_term ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      postal_code: data.postal_code ?? "",
      country: data.country ?? "Indonesia",

      phone: data.phone ?? "",
      mobile_phone: data.mobile_phone ?? "",
      fax: data.fax ?? "",
      pic_vendor: data.pic_vendor ?? "",
      email: data.email ?? "",
      npwp: data.npwp ?? "",
      business_type: data.business_type ?? "",

      kategori_id: String(
        data.kategori_id ??
        data.vendor_subcategories?.[0]?.category_id ??
        data.vendorSubcategories?.[0]?.category_id ??
        data.kategori?.id ??
        ""
      ),

      kategori_other: data.kategori_other ?? "",

      payment_term_id: String(
        data.payment_term_id ?? data.payment_term?.id ?? "",
      ),

      payment_term_other: data.payment_term_other ?? "",

      order_currency: data.order_currency ?? "IDR",
      order_currency_other: data.order_currency_other ?? "",

      account_group_id: String(
        data.account_group_id ??
        data.account_group?.id ??
        data.accountGroup?.id ??
        ""
      ),

      recon_account_id: String(
        data.recon_account_id ??
        data.recon_account?.id ??
        data.reconAccount?.id ??
        ""
      ),

      payment_method: data.payment_method ?? "Transfer",

      withholding_tax_ids: taxIds,
    });
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (!token) {
          throw new Error(
            "Token login tidak ditemukan. Silakan login kembali.",
          );
        }

        const endpoints = [
          `${API_URL}/vendors/${id}`,
          `${API_URL}/vendor-categories`,
          `${API_URL}/payment-terms`,
          `${API_URL}/account-groups`,
          `${API_URL}/recon-accounts`,
          `${API_URL}/withholding-taxes`,
        ];

        const responses = await Promise.all(
          endpoints.map((url) =>
            fetch(url, {
              headers,
            }),
          ),
        );

        const results = await Promise.all(
          responses.map(async (response) => {
            let body = {};

            try {
              body = await response.json();
            } catch {
              body = {};
            }

            return {
              ok: response.ok,
              body,
            };
          }),
        );

        const endpointNames = [
          "detail vendor",
          "kategori vendor",
          "payment term",
          "account group",
          "recon account",
          "withholding tax",
        ];

        for (let index = 0; index < results.length; index++) {
          if (!results[index].ok) {
            throw new Error(
              `Gagal mengambil ${endpointNames[index]}: ${
                results[index].body.message ?? "Periksa route API Laravel."
              }`,
            );
          }
        }

        if (cancelled) return;

        const [
          vendorResult,
          categoryResult,
          paymentResult,
          accountGroupResult,
          reconAccountResult,
          taxResult,
        ] = results;

        const data = getData(vendorResult.body);

        setVendor(data);
        fillForm(data);

        setCategories(getList(categoryResult.body));
        setPaymentTerms(getList(paymentResult.body));
        setAccountGroups(getList(accountGroupResult.body));
        setReconAccounts(getList(reconAccountResult.body));
        setWithholdingTaxes(getList(taxResult.body));

        setSelectedDocuments(EMPTY_DOCUMENTS);
        setDeletedDocuments([]);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil data vendor.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, headers, token]);

  // =========================================================
  // LATEST DOCUMENTS
  // =========================================================

  const latestDocuments = useMemo(() => {
    const result = {};
    const docs = vendor?.documents ?? [];

    DOCUMENT_TYPES.forEach((def) => {
      const candidates = docs.filter((d) => {
        const type = String(d.document_type ?? d.type ?? "").toUpperCase();
        return def.key === type || (def.aliases && def.aliases.includes(type));
      });

      if (candidates.length > 0) {
        candidates.sort(
          (a, b) =>
            Number(b.version ?? 0) - Number(a.version ?? 0) ||
            (b.id ?? 0) - (a.id ?? 0)
        );
        result[def.key] = candidates[0];
      }
    });

    return result;
  }, [vendor]);

  // =========================================================
  // SUBKATEGORI HANDLER
  // =========================================================

  const handleSubcategoryToggle = (sub) => {
    setSubcategories((prev) =>
      prev.includes(sub)
        ? prev.length > 1
          ? prev.filter((s) => s !== sub)
          : prev
        : [...prev, sub]
    );
  };

  // =========================================================
  // FORM HANDLER
  // =========================================================

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // BANK HANDLERS
  // =========================================================

  const addBankAccount = () => {
    setBankAccounts((previous) => [
      ...previous,
      {
        id: null,
        bank_name: "",
        rekening: "",
        benificiary: "",
        swift_code: "",
      },
    ]);
  };

  const removeBankAccount = (index) => {
    setBankAccounts((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((_, i) => i !== index);
    });
  };

  const updateBankAccount = (index, field, value) => {
    setBankAccounts((previous) =>
      previous.map((bank, i) =>
        i === index
          ? {
              ...bank,
              [field]: value,
            }
          : bank,
      ),
    );
  };

  // =========================================================
  // DOCUMENT URL
  // =========================================================

  const documentUrl = (path) => {
    if (!path) return "#";

    const cleanPath = String(path)
      .replace(/^public\//, "")
      .replace(/^storage\//, "");

    return `${STORAGE_URL}/${cleanPath}`;
  };

  // =========================================================
  // DOCUMENT UPLOAD HANDLER
  // =========================================================

  const handleDocumentChange = (event, documentType) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      showAlert(
        "warning",
        "Ukuran File Terlalu Besar",
        `File "${file.name}" melebihi batas maksimal 5 MB.`,
      );

      event.target.value = "";

      setSelectedDocuments((previous) => ({
        ...previous,
        [documentType]: null,
      }));

      return;
    }

    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

    const extension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      showAlert(
        "warning",
        "Format File Tidak Sesuai",
        "Format file harus PDF, JPG, JPEG, atau PNG.",
      );

      event.target.value = "";

      setSelectedDocuments((previous) => ({
        ...previous,
        [documentType]: null,
      }));

      return;
    }

    setSelectedDocuments((previous) => ({
      ...previous,
      [documentType]: file,
    }));
  };

  // =========================================================
  // CANCEL SELECTED DOCUMENT
  // =========================================================

  const cancelSelectedDocument = (documentType) => {
    setSelectedDocuments((previous) => ({
      ...previous,
      [documentType]: null,
    }));

    const input = document.getElementById(`edit-vendor-file-${documentType}`);

    if (input) {
      input.value = "";
    }
  };

  // =========================================================
  // DELETE EXISTING DOCUMENT
  // =========================================================

  const handleRemoveDocument = (document) => {
    if (!document?.id) {
      showAlert("error", "Gagal Menghapus", "ID dokumen tidak ditemukan.");

      return;
    }

    const documentType = String(
      document.document_type ?? document.type ?? "",
    ).toUpperCase();

    const alreadyDeleted = deletedDocuments.includes(String(document.id));

    if (alreadyDeleted) {
      // Batalkan pilihan penghapusan.
      setDeletedDocuments((previous) =>
        previous.filter((documentId) => documentId !== String(document.id)),
      );

      return;
    }

    // Kalau dokumen sudah dipilih untuk dihapus,
    // klik lagi untuk membatalkan penghapusan.
    setDeletedDocuments((previous) => [...previous, String(document.id)]);

    // Jika ada file baru yang dipilih untuk tipe dokumen
    // yang sama, batalkan file baru agar tidak ambigu.
    setSelectedDocuments((previous) => ({
      ...previous,
      [documentType]: null,
    }));

    const input = document.getElementById(`edit-vendor-file-${documentType}`);

    if (input) {
      input.value = "";
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan login kembali.");
      }

      const payload = new FormData();

      // -----------------------------------------------------
      // DATA VENDOR
      // -----------------------------------------------------

      Object.entries(form).forEach(([key, value]) => {
        if (
          key === "bank_name" ||
          key === "rekening" ||
          key === "benificiary"
        ) {
          return;
        }

        if (key === "withholding_tax_ids") {
          value.forEach((taxId) => {
            payload.append("withholding_tax_ids[]", taxId);
          });
        } else {
          payload.append(key, value ?? "");
        }
      });

      // -----------------------------------------------------
      // SUBKATEGORI VENDOR
      // -----------------------------------------------------

      if (form.kategori_id) {
        const subsToSend = subcategories.length > 0 ? subcategories : ["Material", "Jasa"];
        subsToSend.forEach((sub, idx) => {
          payload.append(`vendor_subcategories[${idx}][category_id]`, form.kategori_id);
          payload.append(`vendor_subcategories[${idx}][subcategory]`, sub);
          if (form.kategori_other) {
            payload.append(`vendor_subcategories[${idx}][category_other]`, form.kategori_other);
          }
        });
      }

      // -----------------------------------------------------
      // BANK ACCOUNTS
      // -----------------------------------------------------

      bankAccounts.forEach((bank, index) => {
        if (bank.id != null) {
          payload.append(`bank_accounts[${index}][id]`, String(bank.id));
        }

        payload.append(
          `bank_accounts[${index}][bank_name]`,
          bank.bank_name ?? "",
        );

        payload.append(
          `bank_accounts[${index}][account_number]`,
          bank.rekening ?? "",
        );

        payload.append(
          `bank_accounts[${index}][account_name]`,
          bank.benificiary ?? "",
        );

        payload.append(
          `bank_accounts[${index}][swift_code]`,
          bank.swift_code ?? "",
        );
      });

      // -----------------------------------------------------
      // NEW DOCUMENTS
      // -----------------------------------------------------

      Object.entries(selectedDocuments).forEach(([type, file]) => {
        if (file) {
          payload.append(`documents[${type}]`, file);
          const docDef = DOCUMENT_TYPES.find((d) => d.key === type);
          if (docDef && docDef.field) {
            payload.append(`${docDef.field}[]`, file);
          }
        }
      });

      // -----------------------------------------------------
      // DOCUMENTS TO DELETE
      // -----------------------------------------------------

      deletedDocuments.forEach((documentId) => {
        payload.append("deleted_documents[]", documentId);
      });

      // -----------------------------------------------------
      // METHOD SPOOFING
      // -----------------------------------------------------

      payload.append("_method", "PUT");

      // -----------------------------------------------------
      // UPDATE VENDOR
      // -----------------------------------------------------

      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (result.errors) {
          const validationMessages = Object.entries(result.errors)
            .map(([field, messages]) => {
              const messageList = Array.isArray(messages)
                ? messages
                : [messages];

              return `${field}: ${messageList.join(", ")}`;
            })
            .join("\n");

          throw new Error(validationMessages);
        }

        throw new Error(result.message || "Gagal memperbarui vendor.");
      }

      // -----------------------------------------------------
      // REFRESH VENDOR
      // -----------------------------------------------------

      const refreshedResponse = await fetch(`${API_URL}/vendors/${id}`, {
        headers,
      });

      let refreshedResult = {};

      try {
        refreshedResult = await refreshedResponse.json();
      } catch {
        refreshedResult = {};
      }

      if (!refreshedResponse.ok) {
        throw new Error(
          refreshedResult.message ??
            "Data tersimpan, tetapi gagal memuat ulang detail vendor.",
        );
      }

      const refreshed = getData(refreshedResult);

      setVendor(refreshed);
      fillForm(refreshed);

      setSelectedDocuments(EMPTY_DOCUMENTS);
      setDeletedDocuments([]);

      const successMessage =
        result.message || "Data vendor berhasil diperbarui.";

      setSuccess(successMessage);

      showAlert("success", "Berhasil!", successMessage);
    } catch (err) {
      const message =
        err.message || "Terjadi kesalahan saat memperbarui vendor.";

      setError(message);

      showAlert("error", "Gagal Menyimpan", message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SELECT OPTIONS
  // =========================================================

  const renderSelectOptions = (items) =>
    items.map((item) => (
      <option key={item.id} value={String(item.id)}>
        {item.code ? `${item.code} - ` : ""}
        {item.name ?? item.nama ?? item.description ?? `ID ${item.id}`}
      </option>
    ));

  const isOtherSelected = (items, selectedId) =>
    items.some(
      (item) =>
        String(item.id) === String(selectedId) &&
        String(item.name ?? item.nama ?? "")
          .toLowerCase()
          .includes("other"),
    );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div className="account-detail-loading">Memuat data vendor...</div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VENDOR NOT FOUND
  // =========================================================

  if (!vendor) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-card">
          <div
            className="alert alert-danger"
            style={{ whiteSpace: "pre-line" }}
          >
            {error || "Data vendor tidak ditemukan."}
          </div>

          <button
            type="button"
            className="account-detail-cancel"
            onClick={() => navigate(-1)}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN JSX
  // =========================================================

  return (
    <div className="account-detail-page">
      <div className="account-detail-card">
        {/* HEADER */}
        <div className="account-detail-header">
          <div>
            <h4>Edit Data Vendor</h4>
            <p>{vendor.nama_perusahaan || "Edit data vendor"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* =================================================
              DATA PERUSAHAAN
          ================================================= */}

          <div className="account-section">
            <h5 className="account-section-title">Data Perusahaan</h5>

            <p className="account-section-description">
              Informasi perusahaan dan identitas vendor.
            </p>

            <div className="account-subsection">
              <h6 className="account-subsection-title">Informasi Vendor</h6>

              <div className="row account-detail-row">
                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">
                    Nama Perusahaan *
                  </label>

                  <input
                    className="account-detail-input"
                    name="nama_perusahaan"
                    value={form.nama_perusahaan}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">Search Term</label>

                  <input
                    className="account-detail-input"
                    name="search_term"
                    value={form.search_term}
                    onChange={updateField}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">Business Type</label>

                  <input
                    className="account-detail-input"
                    name="business_type"
                    value={form.business_type}
                    onChange={updateField}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">
                    Kategori Vendor *
                  </label>

                  <select
                    className="account-detail-input account-detail-select"
                    name="kategori_id"
                    value={form.kategori_id}
                    onChange={updateField}
                    required
                    disabled={saving}
                  >
                    <option value="">Pilih kategori</option>
                    {renderSelectOptions(categories)}
                  </select>
                </div>

                {isOtherSelected(categories, form.kategori_id) && (
                  <div className="col-md-6 account-detail-field">
                    <label className="account-detail-label">
                      Keterangan Kategori Other *
                    </label>

                    <input
                      className="account-detail-input"
                      name="kategori_other"
                      value={form.kategori_other}
                      onChange={updateField}
                      required
                      disabled={saving}
                    />
                  </div>
                )}

                <div className="col-12 account-detail-field">
                  <label className="account-detail-label d-block mb-2">
                    Subkategori Vendor *
                  </label>
                  <div className="d-flex gap-4">
                    <label className="form-check-label d-flex align-items-center gap-2" style={{ cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={subcategories.includes("Material")}
                        onChange={() => handleSubcategoryToggle("Material")}
                        disabled={saving}
                      />
                      <span>Material</span>
                    </label>
                    <label className="form-check-label d-flex align-items-center gap-2" style={{ cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={subcategories.includes("Jasa")}
                        onChange={() => handleSubcategoryToggle("Jasa")}
                        disabled={saving}
                      />
                      <span>Jasa</span>
                    </label>
                  </div>
                </div>

                <div className="col-12 account-detail-field">
                  <label className="account-detail-label">
                    Street Address *
                  </label>

                  <textarea
                    className="account-detail-input account-detail-textarea"
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">City *</label>

                  <input
                    className="account-detail-input"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">Postal Code *</label>

                  <input
                    className="account-detail-input"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">Country *</label>

                  <input
                    className="account-detail-input"
                    name="country"
                    value={form.country}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              CONTACT INFORMATION
          ================================================= */}

          <div className="account-section">
            <h5 className="account-section-title">Contact Information</h5>

            <div className="row account-detail-row">
              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Contact Person *</label>

                <input
                  className="account-detail-input"
                  name="pic_vendor"
                  value={form.pic_vendor}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Email *</label>

                <input
                  type="email"
                  className="account-detail-input"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Telephone *</label>

                <input
                  className="account-detail-input"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Mobile Phone *</label>

                <input
                  className="account-detail-input"
                  name="mobile_phone"
                  value={form.mobile_phone}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Fax *</label>

                <input
                  className="account-detail-input"
                  name="fax"
                  value={form.fax}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* =================================================
              REQUESTER / PROCUREMENT
          ================================================= */}

          <div className="account-section">
            <h5 className="account-section-title">Requester</h5>

            <p className="account-section-description">
              Informasi purchasing dan pembayaran vendor.
            </p>

            <div className="row account-detail-row">
              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">NPWP *</label>

                <input
                  className="account-detail-input"
                  name="npwp"
                  value={form.npwp}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Due Date Payment</label>

                <select
                  className="account-detail-input account-detail-select"
                  name="payment_term_id"
                  value={form.payment_term_id}
                  onChange={updateField}
                  disabled={saving}
                >
                  <option value="">Pilih payment term</option>
                  {renderSelectOptions(paymentTerms)}
                </select>
              </div>

              {isOtherSelected(paymentTerms, form.payment_term_id) && (
                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">
                    Payment Term Other *
                  </label>

                  <input
                    className="account-detail-input"
                    name="payment_term_other"
                    value={form.payment_term_other}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>
              )}

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Order Currency *</label>

                <select
                  className="account-detail-input account-detail-select"
                  name="order_currency"
                  value={form.order_currency}
                  onChange={updateField}
                  required
                  disabled={saving}
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {form.order_currency === "OTHER" && (
                <div className="col-md-6 account-detail-field">
                  <label className="account-detail-label">
                    Keterangan Currency Other *
                  </label>

                  <input
                    className="account-detail-input"
                    name="order_currency_other"
                    value={form.order_currency_other}
                    onChange={updateField}
                    required
                    disabled={saving}
                  />
                </div>
              )}

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">
                  Company Code / Purchasing Organization *
                </label>

                <input
                  className="account-detail-input"
                  name="company_code_purch_org"
                  value={form.company_code_purch_org}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* =================================================
              BANK ACCOUNTS
          ================================================= */}

          <div className="account-section">
            <div className="bank-section-heading">
              <div>
                <h5 className="account-section-title">Data Bank</h5>

                <p className="account-section-description">
                  Informasi rekening bank vendor. Tambahkan rekening sebanyak
                  yang diperlukan.
                </p>
              </div>

              <button
                type="button"
                className="bank-add-button"
                onClick={addBankAccount}
                disabled={saving}
              >
                <span className="bank-add-icon">+</span>
                Tambah Rekening
              </button>
            </div>

            <div className="bank-account-list">
              {bankAccounts.map((bank, index) => (
                <div
                  className="bank-account-card"
                  key={bank.id ?? `new-bank-${index}`}
                >
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
                      disabled={saving || bankAccounts.length <= 1}
                      title={
                        bankAccounts.length <= 1
                          ? "Minimal satu rekening harus tersedia"
                          : "Hapus rekening ini"
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="m19 6-1 14H6L5 6" />
                        <path d="M10 11v5M14 11v5" />
                      </svg>
                      Hapus
                    </button>
                  </div>

                  <div className="bank-card-divider" />

                  <div className="row bank-fields-row">
                    <div className="col-md-3 account-detail-field">
                      <label className="account-detail-label">
                        Nama Bank <span className="bank-required">*</span>
                      </label>

                      <input
                        className="account-detail-input bank-input"
                        placeholder="Contoh: Bank Mandiri"
                        value={bank.bank_name}
                        onChange={(event) =>
                          updateBankAccount(
                            index,
                            "bank_name",
                            event.target.value,
                          )
                        }
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-3 account-detail-field">
                      <label className="account-detail-label">
                        Nomor Rekening <span className="bank-required">*</span>
                      </label>

                      <input
                        className="account-detail-input bank-input"
                        placeholder="Masukkan nomor rekening"
                        value={bank.rekening}
                        onChange={(event) =>
                          updateBankAccount(
                            index,
                            "rekening",
                            event.target.value,
                          )
                        }
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-3 account-detail-field">
                      <label className="account-detail-label">
                        Nama Pemilik Rekening{" "}
                        <span className="bank-required">*</span>
                      </label>

                      <input
                        className="account-detail-input bank-input"
                        placeholder="Nama sesuai rekening"
                        value={bank.benificiary}
                        onChange={(event) =>
                          updateBankAccount(
                            index,
                            "benificiary",
                            event.target.value,
                          )
                        }
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-3 account-detail-field">
                      <label className="account-detail-label">
                        SWIFT / BIC Code (Opsional)
                      </label>

                      <input
                        className="account-detail-input bank-input"
                        placeholder="Contoh: BMRIIDJA"
                        value={bank.swift_code || ""}
                        onChange={(event) =>
                          updateBankAccount(
                            index,
                            "swift_code",
                            event.target.value,
                          )
                        }
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              ACCOUNTING
          ================================================= */}

          <div className="account-section">
            <h5 className="account-section-title">Data Accounting</h5>

            <p className="account-section-description">
              Informasi accounting vendor.
            </p>

            <div className="row account-detail-row">
              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Account Group *</label>

                <select
                  className="account-detail-input account-detail-select"
                  name="account_group_id"
                  value={form.account_group_id}
                  onChange={updateField}
                  required
                  disabled={saving}
                >
                  <option value="">Pilih Account Group</option>
                  {renderSelectOptions(accountGroups)}
                </select>
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Recon Account *</label>

                <select
                  className="account-detail-input account-detail-select"
                  name="recon_account_id"
                  value={form.recon_account_id}
                  onChange={updateField}
                  required
                  disabled={saving}
                >
                  <option value="">Pilih Recon Account</option>
                  {renderSelectOptions(reconAccounts)}
                </select>
              </div>

              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label">Payment Method *</label>

                <input
                  className="account-detail-input"
                  name="payment_method"
                  value={form.payment_method}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* =================================================
              TAX
          ================================================= */}

          <div className="account-section">
            <h5 className="account-section-title">Data Tax</h5>

            <p className="account-section-description">
              Pilih satu atau beberapa Withholding Tax untuk vendor.
            </p>

            <div className="row account-detail-row">
              <div className="col-12 account-detail-field">
                <label className="account-detail-label">Withholding Tax</label>

                {withholdingTaxes.length > 0 ? (
                  <div className="withholding-tax-grid">
                    {withholdingTaxes.map((tax) => {
                      const taxId = String(tax.id);

                      const selectedIds = (form.withholding_tax_ids || []).map(
                        String,
                      );

                      const checked = selectedIds.includes(taxId);

                      return (
                        <label
                          key={tax.id}
                          className={`withholding-tax-option ${
                            checked ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="withholding-tax-checkbox"
                            checked={checked}
                            disabled={saving}
                            onChange={() => {
                              setForm((previous) => {
                                const currentIds = (
                                  previous.withholding_tax_ids || []
                                ).map(String);

                                const nextIds = currentIds.includes(taxId)
                                  ? currentIds.filter(
                                      (value) => value !== taxId,
                                    )
                                  : [...currentIds, taxId];

                                return {
                                  ...previous,
                                  withholding_tax_ids: nextIds,
                                };
                              });
                            }}
                          />

                          <span className="withholding-tax-name">
                            {tax.code ? `${tax.code} - ` : ""}
                            {tax.name ?? tax.description ?? `Tax ${tax.id}`}
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
                    Data master Withholding Tax belum tersedia atau gagal
                    dimuat.
                  </div>
                )}

                <small className="withholding-tax-count">
                  {(form.withholding_tax_ids || []).length} jenis pajak dipilih
                </small>
              </div>
            </div>
          </div>

          {/* =================================================
              SAP
          ================================================= */}

          <div className="account-section account-input-section">
            <h5 className="account-section-title">Data SAP</h5>

            <p className="account-section-description">
              Vendor Code yang terdaftar pada SAP.
            </p>

            <div className="row account-detail-row">
              <div className="col-md-6 account-detail-field">
                <label className="account-detail-label d-flex align-items-center justify-content-between">
                  <span>Vendor Code SAP</span>
                  <span className="badge bg-success" style={{ fontSize: "11px" }}>SAP Verified</span>
                </label>

                <input
                  className="account-detail-input bg-light"
                  name="vendor_code"
                  value={form.vendor_code}
                  readOnly
                  disabled
                  title="Kode Vendor SAP bersifat tetap (tidak dapat diubah manual)"
                  style={{ cursor: "not-allowed", backgroundColor: "#f8f9fa", fontWeight: "600" }}
                />
              </div>
            </div>
          </div>

          {/* =================================================
    DOCUMENTS
================================================= */}

          <div className="account-document-section">
            <h5 className="account-section-title">Dokumen Vendor</h5>

            <p className="account-section-description">
              Upload dokumen pendukung vendor. Format PDF, JPG, JPEG, atau PNG
              dengan ukuran maksimal 5 MB.
            </p>

            <div className="row account-detail-row">
              {DOCUMENT_TYPES.map((item) => {
                const document = latestDocuments[item.key];

                const selectedFile = selectedDocuments[item.key];

                const isDeleted =
                  document && deletedDocuments.includes(String(document.id));

                return (
                  <div className="col-md-6 account-detail-field" key={item.key}>
                    {/* LABEL */}
                    <label
                      className="account-detail-file-label"
                      htmlFor={`edit-vendor-file-${item.key}`}
                    >
                      {item.label}
                    </label>

                    {/* EXISTING DOCUMENT */}
                    {document && (
                      <div
                        className={`edit-vendor-existing-file ${
                          isDeleted ? "document-marked-delete" : ""
                        }`}
                      >
                        <div className="edit-vendor-document-info">
                          <div className="edit-vendor-document-icon">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                              <path d="M8 13h8" />
                              <path d="M8 17h8" />
                            </svg>
                          </div>

                          <div className="edit-vendor-document-text">
                            <span
                              className="edit-vendor-document-name"
                              title={
                                document.file_name ??
                                document.file_path ??
                                "Dokumen vendor"
                              }
                            >
                              {document.file_name ??
                                document.file_path ??
                                "Dokumen vendor"}
                            </span>

                            <span className="edit-vendor-document-status">
                              {isDeleted
                                ? "Dokumen akan dihapus saat disimpan"
                                : `Versi ${document.version ?? 1}`}
                            </span>
                          </div>
                        </div>

                        <div className="edit-vendor-document-actions">
                          {!isDeleted && document.file_path && (
                            <a
                              className="edit-vendor-view-document"
                              href={documentUrl(document.file_path)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Lihat
                            </a>
                          )}

                          <button
                            type="button"
                            className={`edit-vendor-delete-document ${
                              isDeleted ? "cancel-delete" : ""
                            }`}
                            onClick={() => handleRemoveDocument(document)}
                            disabled={saving}
                          >
                            {isDeleted ? "Batal Hapus" : "Hapus"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* NO EXISTING DOCUMENT */}
                    {!document && (
                      <div className="account-no-file">
                        Dokumen belum diunggah.
                      </div>
                    )}

                    {/* FILE INPUT */}
                    <input
                      id={`edit-vendor-file-${item.key}`}
                      type="file"
                      className="account-detail-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={saving}
                      onChange={(event) =>
                        handleDocumentChange(event, item.key)
                      }
                    />

                    {/* SELECTED FILE */}
                    {selectedFile && (
                      <div className="edit-vendor-selected-file">
                        <div className="edit-vendor-selected-file-info">
                          <span className="edit-vendor-selected-file-name">
                            File baru: {selectedFile.name}
                          </span>

                          <span className="edit-vendor-selected-file-size">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        <button
                          type="button"
                          className="edit-vendor-cancel-selected"
                          onClick={() => cancelSelectedDocument(item.key)}
                          disabled={saving}
                        >
                          Batal
                        </button>
                      </div>
                    )}

                    {/* REPLACEMENT NOTICE */}
                    {selectedFile && document && !isDeleted && (
                      <small className="edit-vendor-document-notice">
                        File baru akan diunggah sebagai dokumen pengganti sesuai
                        proses backend.
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="account-detail-actions">
            <button
              type="button"
              className="account-detail-cancel"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="submit"
              className="account-detail-save"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          ALERT MODAL
      ================================================= */}

      {alertModal.show && (
        <div
          className="vendor-alert-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAlert();
            }
          }}
        >
          <div
            className={`vendor-alert-modal ${alertModal.type}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="vendor-alert-title"
          >
            <div className={`vendor-alert-icon ${alertModal.type}`}>
              {alertModal.type === "success" && <span>✓</span>}

              {alertModal.type === "error" && <span>!</span>}

              {alertModal.type === "warning" && <span>!</span>}
            </div>

            <h5 id="vendor-alert-title">{alertModal.title}</h5>

            <p>{alertModal.message}</p>

            <button
              type="button"
              className={`vendor-alert-button ${alertModal.type}`}
              onClick={closeAlert}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default editVendor;
