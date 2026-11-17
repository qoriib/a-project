import { useState, useMemo } from "react";
import "./VendorChangeComparison.css";

const ROLE_META = {
  ASISTEN_KADIV: {
    title: "Verifikasi Asisten Kadiv (Level 1)",
    focus:
      "Periksa kesesuaian dokumen legalitas, profil perusahaan, nomor kontak, serta rekening bank yang diajukan oleh Requester untuk vendor existing ini.",
  },
  KADIV: {
    title: "Approval Kadiv SCM (Level 2)",
    focus:
      "Lakukan persetujuan pengajuan pembaruan vendor existing setelah diverifikasi oleh Asisten Kadiv sebelum dialihkan ke tim Accounting.",
  },
  ACCOUNTING: {
    title: "Review & Pengaturan Accounting (Level 3)",
    focus:
      "Periksa perubahan profil vendor dari Requester serta tentukan atau verifikasi konfigurasi Account Group, Reconciliation Account, dan Payment Method untuk vendor ini.",
  },
  TAX: {
    title: "Review & Validasi Perpajakan (Level 4)",
    focus:
      "Periksa validitas NPWP, SPPKP, dan tentukan klasifikasi Withholding Tax (PPh) yang berlaku untuk vendor existing ini.",
  },
  SAP: {
    title: "Finalisasi & Sinkronisasi SAP (Level 5)",
    focus:
      "Vendor ini sudah memiliki Vendor Code SAP terdaftar di sistem. Menyetujui tahap ini akan memperbarui master data vendor secara permanen di database.",
  },
  REQUESTER: {
    title: "Pemantauan Pengajuan Requester",
    focus:
      "Pantau perbedaan data lama master vendor dengan usulan perubahan baru yang Anda ajukan.",
  },
};

const FIELD_LABELS = {
  nama_perusahaan: { label: "Nama Perusahaan", role: "REQUESTER" },
  search_term: { label: "Search Term", role: "REQUESTER" },
  business_type: { label: "Business Type", role: "REQUESTER" },
  address: { label: "Alamat Perusahaan", role: "REQUESTER" },
  city: { label: "Kota", role: "REQUESTER" },
  postal_code: { label: "Kode Pos", role: "REQUESTER" },
  country: { label: "Negara", role: "REQUESTER" },
  phone: { label: "Nomor Telepon", role: "REQUESTER" },
  mobile_phone: { label: "No. Handphone / PIC", role: "REQUESTER" },
  fax: { label: "Fax", role: "REQUESTER" },
  pic_vendor: { label: "Contact Person / PIC", role: "REQUESTER" },
  email: { label: "Email Perusahaan", role: "REQUESTER" },
  npwp: { label: "NPWP", role: "TAX" },
  payment_term_id: { label: "Term of Payment", role: "REQUESTER" },
  order_currency: { label: "Mata Uang (Order Currency)", role: "REQUESTER" },
  bank_name: { label: "Nama Bank", role: "REQUESTER" },
  account_number: { label: "Nomor Rekening", role: "REQUESTER" },
  account_name: { label: "Nama Pemilik Rekening", role: "REQUESTER" },
  swift_code: { label: "SWIFT Code", role: "REQUESTER" },
  bank_accounts: { label: "Rekening Bank", role: "REQUESTER" },
  vendor_subcategories: { label: "Kategori & Subkategori", role: "REQUESTER" },
  account_group_id: { label: "Account Group", role: "ACCOUNTING" },
  recon_account_id: { label: "Recon Account", role: "ACCOUNTING" },
  payment_method: { label: "Payment Method", role: "ACCOUNTING" },
  withholding_tax_ids: { label: "Withholding Tax (PPh)", role: "TAX" },
  vendor_code: { label: "Vendor Code SAP", role: "SAP" },
  company_code_purch_org: { label: "Company Code / Purch Org", role: "SAP" },
};

function formatValue(val) {
  if (val === null || val === undefined || val === "") {
    return "-";
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      if (val.length === 0) return "-";
      return val
        .map((item) => {
          if (typeof item === "object") {
            return (
              item.name ||
              item.code ||
              item.bank_name ||
              item.subcategory ||
              JSON.stringify(item)
            );
          }
          return String(item);
        })
        .join("\n");
    }
    return val.name || val.code || val.label || JSON.stringify(val);
  }
  return String(val);
}

export function VendorChangeComparison({
  requestData,
  currentRole = "ALL",
  className = "",
}) {
  const isUpdate =
    requestData?.request_type === "UPDATE" ||
    requestData?.request_type === "EXISTING" ||
    requestData?.is_update === true;

  if (!isUpdate) {
    return null;
  }

  const detailRecord = requestData?.details?.[0] || {};
  const rawDiff =
    requestData?.diff_data || detailRecord?.diff_data || {};
  const oldData = requestData?.old_data || detailRecord?.old_data || {};
  const newData = requestData?.new_data || detailRecord?.new_data || {};

  // Normalisasi diff items
  const diffItems = useMemo(() => {
    const items = [];
    const processedKeys = new Set();

    // 1. Ambil dari diff_data jika ada
    if (rawDiff && typeof rawDiff === "object") {
      Object.entries(rawDiff).forEach(([key, val]) => {
        processedKeys.add(key);
        const meta = FIELD_LABELS[key] || {};
        items.push({
          key,
          label: val.label || meta.label || ucwords(key),
          role: val.role || meta.role || "REQUESTER",
          old: formatValue(val.old),
          new: formatValue(val.new),
        });
      });
    }

    // 2. Jika diff_data kosong atau belum lengkap, periksa perbandingan oldData vs newData
    if (oldData && newData && typeof oldData === "object" && typeof newData === "object") {
      Object.keys(newData).forEach((key) => {
        if (processedKeys.has(key)) return;
        const oldVal = oldData[key];
        const newVal = newData[key];
        if (
          oldVal !== undefined &&
          newVal !== undefined &&
          formatValue(oldVal) !== formatValue(newVal)
        ) {
          const meta = FIELD_LABELS[key] || {};
          items.push({
            key,
            label: meta.label || ucwords(key),
            role: meta.role || "REQUESTER",
            old: formatValue(oldVal),
            new: formatValue(newVal),
          });
        }
      });
    }

    return items;
  }, [rawDiff, oldData, newData]);

  const [activeTab, setActiveTab] = useState("ALL");

  const counts = useMemo(() => {
    return {
      ALL: diffItems.length,
      REQUESTER: diffItems.filter((i) => i.role === "REQUESTER").length,
      ACCOUNTING: diffItems.filter((i) => i.role === "ACCOUNTING").length,
      TAX: diffItems.filter((i) => i.role === "TAX").length,
      SAP: diffItems.filter((i) => i.role === "SAP").length,
    };
  }, [diffItems]);

  const filteredItems = useMemo(() => {
    if (activeTab === "ALL") return diffItems;
    return diffItems.filter((item) => item.role === activeTab);
  }, [diffItems, activeTab]);

  const roleMeta = ROLE_META[currentRole] || ROLE_META.ASISTEN_KADIV;

  function ucwords(str) {
    return String(str)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <div className={`vcc-container ${className}`}>
      {/* HEADER */}
      <div className="vcc-header">
        <div>
          <div className="vcc-badge-group">
            <span className="vcc-type-badge">
              🔄 Pengajuan Update Existing Vendor
            </span>
            {requestData?.vendor?.vendor_code && (
              <span className="vcc-role-badge">
                SAP Code: {requestData.vendor.vendor_code}
              </span>
            )}
            <span className="vcc-role-badge">
              Form: {requestData?.form_number || "-"}
            </span>
          </div>
          <h4 className="vcc-title">Perbandingan Perubahan Data Vendor</h4>
          <p className="vcc-subtitle">
            Halaman ini menampilkan perbedaan antara data master vendor yang telah
            terdaftar dengan data baru yang diajukan oleh Requester.
          </p>
        </div>

        <div className="vcc-count-badge">
          <span>{diffItems.length} Field Berubah</span>
        </div>
      </div>

      {/* ROLE NOTICE */}
      <div className="vcc-role-notice">
        <span className="vcc-role-notice-icon">ℹ️</span>
        <div>
          <strong>{roleMeta.title}:</strong> {roleMeta.focus}
        </div>
      </div>

      {/* TABS */}
      <div className="vcc-tabs">
        <button
          type="button"
          className={`vcc-tab ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          Semua Perubahan <span className="vcc-tab-count">{counts.ALL}</span>
        </button>

        {counts.REQUESTER > 0 && (
          <button
            type="button"
            className={`vcc-tab ${activeTab === "REQUESTER" ? "active" : ""}`}
            onClick={() => setActiveTab("REQUESTER")}
          >
            Data Requester / Perusahaan{" "}
            <span className="vcc-tab-count">{counts.REQUESTER}</span>
          </button>
        )}

        <button
          type="button"
          className={`vcc-tab ${activeTab === "ACCOUNTING" ? "active" : ""}`}
          onClick={() => setActiveTab("ACCOUNTING")}
        >
          Accounting <span className="vcc-tab-count">{counts.ACCOUNTING}</span>
        </button>

        <button
          type="button"
          className={`vcc-tab ${activeTab === "TAX" ? "active" : ""}`}
          onClick={() => setActiveTab("TAX")}
        >
          Perpajakan (Tax) <span className="vcc-tab-count">{counts.TAX}</span>
        </button>

        <button
          type="button"
          className={`vcc-tab ${activeTab === "SAP" ? "active" : ""}`}
          onClick={() => setActiveTab("SAP")}
        >
          SAP <span className="vcc-tab-count">{counts.SAP}</span>
        </button>
      </div>

      {/* COMPARISON TABLE */}
      {filteredItems.length === 0 ? (
        <div className="vcc-empty">
          <p>
            {activeTab === "ALL"
              ? "Tidak ada perubahan field teks yang tercatat (mungkin berupa pembaruan file dokumen lampiran)."
              : `Tidak ada perubahan khusus kategori ${activeTab} pada pengajuan ini.`}
          </p>
        </div>
      ) : (
        <div className="vcc-table-wrapper">
          <table className="vcc-table">
            <thead>
              <tr>
                <th width="24%">Field / Bagian</th>
                <th width="35%">Data Sebelumnya</th>
                <th width="35%">Data Baru (Diajukan)</th>
                <th width="6%">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={`${item.key}-${idx}`}>
                  <td>
                    <div className="vcc-field-name">{item.label}</div>
                    <span
                      className={`vcc-field-role ${String(
                        item.role,
                      ).toLowerCase()}`}
                    >
                      {item.role}
                    </span>
                  </td>

                  <td>
                    <div className="vcc-old-box">
                      <span className="vcc-tag">Sebelumnya</span>
                      <div>{item.old}</div>
                    </div>
                  </td>

                  <td>
                    <div className="vcc-new-box">
                      <span className="vcc-tag">Pembaruan (Diajukan)</span>
                      <div>{item.new}</div>
                    </div>
                  </td>

                  <td>
                    <span className="vcc-status-pill">Diubah</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VendorChangeComparison;
