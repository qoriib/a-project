import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./VendorDetail.css";
import {
  API_BASE_URL as API_URL,
  STORAGE_BASE_URL as STORAGE_URL,
  getAuthUser,
} from "../../api/config";

const DOCUMENT_TYPES = [
  { key: "NPWP", label: "NPWP" },
  { key: "REKENING", label: "Rekening" },
  { key: "NIB", label: "NIB" },
  { key: "SIUP", label: "SIUP" },
  { key: "COMPANY_PROFILE", label: "Company Profile" },
  { key: "SERTIFIKAT", label: "Sertifikat" },
];

function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = getAuthUser();
  const userRole = String(
    user?.role || user?.role_name || (user?.is_admin ? "ADMIN" : "")
  )
    .toUpperCase()
    .trim();

  const isAdmin = userRole === "ADMIN" || user?.is_admin === true;
  const isRequester =
    userRole === "REQUESTER" ||
    userRole === "PROCUREMENT" ||
    (!isAdmin &&
      !["ASISTEN_KADIV", "KADIV", "ACCOUNTING", "TAX", "SAP"].includes(
        userRole
      ));

  const canEdit = isAdmin || isRequester;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (canEdit) {
      navigate("/vendors/existing");
    } else {
      navigate("/vendors/all");
    }
  };

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const controller = new AbortController();

    async function loadVendor() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/vendors/${id}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil detail vendor.");
        }

        setVendor(result.data ?? result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Terjadi kesalahan.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadVendor();
    return () => controller.abort();
  }, [id, token]);

  const banks = vendor?.bank_accounts ?? vendor?.bankAccounts ?? [];
  const taxes = vendor?.withholding_taxes ?? vendor?.withholdingTaxes ?? [];
  const documents = vendor?.documents ?? [];

  const latestDocuments = useMemo(() => {
    const result = {};

    for (const document of documents) {
      const type = String(
        document.document_type ?? document.type ?? "",
      ).toUpperCase();

      if (
        !result[type] ||
        Number(document.version ?? 0) > Number(result[type].version ?? 0)
      ) {
        result[type] = document;
      }
    }

    return result;
  }, [documents]);

  const documentUrl = (path) => {
    if (!path) return null;

    const cleanPath = String(path)
      .replace(/^public\//, "")
      .replace(/^storage\//, "");

    return `${STORAGE_URL}/${cleanPath}`;
  };

  const showValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
  };

  const getMasterLabel = (item) => {
    if (!item) return "-";

    const code = item.code ?? item.kode;
    const name = item.name ?? item.nama ?? item.description;

    if (code && name && String(code) !== String(name)) {
      return `${code} - ${name}`;
    }

    return name ?? code ?? "-";
  };

  const readOnlyField = (
    label,
    value,
    { fullWidth = false, multiline = false } = {},
  ) => {
    const displayValue = showValue(value);

    return (
      <div
        className={`vendor-detail-field ${fullWidth ? "full-width" : ""}`}
        key={label}
      >
        <label className="vendor-detail-label">{label}</label>
        <div
          className={[
            "vendor-detail-value",
            displayValue === "-" ? "empty" : "",
            multiline ? "multiline" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {displayValue}
        </div>
      </div>
    );
  };

  const isOtherSelected = (relation, directValue, otherValue) => {
    const name = String(
      relation?.name ??
      relation?.nama ??
      relation?.description ??
      relation?.code ??
      directValue ??
      "",
    )
      .trim()
      .toLowerCase();

    return (
      name === "other" ||
      name.includes("other") ||
      String(otherValue ?? "").trim() !== ""
    );
  };

  const category = vendor?.kategori ?? vendor?.category;
  const paymentTerm = vendor?.payment_term ?? vendor?.paymentTerm;
  const accountGroup = vendor?.account_group ?? vendor?.accountGroup;
  const reconAccount = vendor?.recon_account ?? vendor?.reconAccount;

  const currencyIsOther =
    String(vendor?.order_currency ?? "")
      .trim()
      .toUpperCase() === "OTHER" ||
    String(vendor?.order_currency_other ?? "").trim() !== "";

  if (loading) {
    return (
      <div className="vendor-detail-page">
        <div className="vendor-detail-message">Memuat detail vendor...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="vendor-detail-page">
        <div className="vendor-detail-message">
          <p>{error || "Data vendor tidak ditemukan."}</p>
          <button
            type="button"
            className="vendor-detail-button vendor-detail-button-back"
            onClick={() => navigate("/vendors/existing")}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-detail-page">
      <div className="vendor-detail-card">
        <header className="vendor-detail-header">
          <div>
            <span className="vendor-detail-eyebrow">VENDOR MASTER DATA</span>
            <h4>Detail Existing Vendor</h4>
            <p>{vendor.nama_perusahaan || "Informasi vendor terdaftar"}</p>
          </div>
        </header>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Data Perusahaan</h5>
          <p className="vendor-detail-section-description">
            Informasi perusahaan dan identitas vendor.
          </p>

          <h6 className="vendor-detail-subsection-title">Informasi Vendor</h6>
          <div className="vendor-detail-grid">
            {readOnlyField(
              "No. Request",
              vendor.latest_request?.form_number ||
              vendor.latestRequest?.form_number ||
              "-",
            )}
            {readOnlyField(
              "Tipe Request",
              vendor.latest_request?.request_type ||
              vendor.latestRequest?.request_type ||
              (vendor.source_type === "EXISTING" ? "EXISTING" : "NEW"),
            )}
            {readOnlyField("Nama Perusahaan", vendor.nama_perusahaan)}
            {readOnlyField("Vendor Code", vendor.vendor_code)}
            {readOnlyField("Search Term", vendor.search_term)}
            {readOnlyField("Business Type", vendor.business_type)}
            {readOnlyField("Kategori Vendor", getMasterLabel(category))}

            {isOtherSelected(
              category,
              vendor.kategori,
              vendor.kategori_other,
            ) &&
              readOnlyField("Keterangan Kategori Other", vendor.kategori_other)}

            {readOnlyField("Street Address", vendor.address, {
              fullWidth: true,
              multiline: true,
            })}
            {readOnlyField("City", vendor.city)}
            {readOnlyField("Postal Code", vendor.postal_code)}
            {readOnlyField("Country", vendor.country)}
          </div>
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Contact Information</h5>
          <p className="vendor-detail-section-description">
            Informasi kontak utama perusahaan.
          </p>

          <div className="vendor-detail-grid">
            {readOnlyField("Contact Person", vendor.pic_vendor)}
            {readOnlyField("Email", vendor.email)}
            {readOnlyField("Telephone", vendor.phone)}
            {readOnlyField("Mobile Phone", vendor.mobile_phone)}
            {readOnlyField("Fax", vendor.fax)}
          </div>
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Requester</h5>
          <p className="vendor-detail-section-description">
            Informasi purchasing dan pembayaran vendor.
          </p>

          <div className="vendor-detail-grid">
            {readOnlyField("NPWP", vendor.npwp)}
            {readOnlyField("Due Date Payment", getMasterLabel(paymentTerm))}

            {isOtherSelected(
              paymentTerm,
              vendor.payment_term,
              vendor.payment_term_other,
            ) && readOnlyField("Payment Term Other", vendor.payment_term_other)}

            {readOnlyField("Order Currency", vendor.order_currency)}

            {currencyIsOther &&
              readOnlyField(
                "Keterangan Currency Other",
                vendor.order_currency_other,
              )}

            {readOnlyField(
              "Company Code / Purchasing Organization",
              vendor.company_code_purch_org,
              { fullWidth: true },
            )}
          </div>
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Data Bank</h5>
          <p className="vendor-detail-section-description">
            Informasi rekening bank dan pemilik rekening vendor.
          </p>

          {banks.length > 0 ? (
            <div className="vendor-detail-table-wrap">
              <table className="vendor-detail-table">
                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>Bank Account Number</th>
                    <th>Beneficiary</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank.id}>
                      <td>{showValue(bank.bank_name)}</td>
                      <td>{showValue(bank.account_number)}</td>
                      <td>{showValue(bank.account_name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="vendor-detail-empty">Belum ada rekening bank.</div>
          )}
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Data Accounting</h5>
          <p className="vendor-detail-section-description">
            Informasi accounting vendor.
          </p>

          <div className="vendor-detail-grid">
            {readOnlyField("Account Group", getMasterLabel(accountGroup))}

            {readOnlyField("Recon Account", getMasterLabel(reconAccount))}

            {readOnlyField("Payment Method", vendor.payment_method)}

            {isOtherSelected(
              accountGroup,
              vendor.account_group,
              vendor.account_group_other,
            ) &&
              readOnlyField(
                "Keterangan Account Group Other",
                vendor.account_group_other,
              )}

            {isOtherSelected(
              reconAccount,
              vendor.recon_account,
              vendor.recon_account_other,
            ) &&
              readOnlyField(
                "Keterangan Recon Account Other",
                vendor.recon_account_other,
              )}
          </div>
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Data Tax</h5>
          <p className="vendor-detail-section-description">
            Withholding Tax yang terdaftar untuk vendor.
          </p>

          {taxes.length > 0 ? (
            <div className="vendor-detail-tax-grid">
              {taxes.map((tax) => (
                <div className="vendor-detail-tax-item" key={tax.id}>
                  <span className="vendor-detail-tax-name">
                    {tax.code ? `${tax.code} - ` : ""}
                    {tax.name ?? tax.description ?? `Tax ${tax.id}`}
                  </span>
                  <span className="vendor-detail-tax-status">Terpilih ✓</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="vendor-detail-empty">
              Belum ada withholding tax.
            </div>
          )}
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Data SAP</h5>
          <p className="vendor-detail-section-description">
            Informasi identitas vendor di SAP.
          </p>

          <div className="vendor-detail-grid">
            {readOnlyField("Vendor Code", vendor.vendor_code)}
          </div>
        </section>

        <section className="vendor-detail-section">
          <h5 className="vendor-detail-section-title">Dokumen Vendor</h5>
          <p className="vendor-detail-section-description">
            Dokumen yang sudah tersimpan di sistem.
          </p>

          <div className="vendor-detail-document-grid">
            {DOCUMENT_TYPES.map((item) => {
              const document = latestDocuments[item.key];
              const url = documentUrl(document?.file_path);

              return (
                <div className="vendor-detail-document" key={item.key}>
                  <div className="vendor-detail-document-info">
                    <div className="vendor-detail-document-icon">DOC</div>
                    <div className="vendor-detail-document-text">
                      <div className="vendor-detail-document-label">
                        {item.label}
                      </div>
                      <div className="vendor-detail-document-name">
                        {document
                          ? (document.file_name ?? document.file_path)
                          : "Dokumen belum diunggah"}
                      </div>
                    </div>
                  </div>

                  {url && (
                    <a
                      className="vendor-detail-document-link"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lihat ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="vendor-detail-actions">
          <button
            type="button"
            className="vendor-detail-button vendor-detail-button-back"
            onClick={handleBack}
          >
            Kembali
          </button>

          {canEdit && (
            <button
              type="button"
              className="vendor-detail-button vendor-detail-button-edit"
              onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
            >
              Edit Vendor
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export default VendorDetail;
