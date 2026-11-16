import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AddVendor.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function AddExistingVendor() {
  const navigate = useNavigate();

  // ==========================================
  // DATA MASTER
  // ==========================================

  const [categoryList, setCategoryList] = useState([]);
  const [paymentTermList, setPaymentTermList] = useState([]);

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    // Data Existing Vendor
    vendorCode: "",
    namaPerusahaan: "",
    searchTerm: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",

    // Contact
    phone: "",
    fax: "",
    picVendor: "",
    email: "",

    // Procurement
    npwp: "",
    businessType: "",
    kategoriId: "",
    kategoriOther: "",
    dueDatePayment: "",
    orderCurrency: "",
    salesperson: "",

    // Bank
    bankName: "",
    rekening: "",

    // Dokumen
    npwpFile: null,
    rekeningFile: null,
    nibFile: null,
    siupFile: null,
    companyProfile: null,
    sertifikat: null,
  });

  // ==========================================
  // AMBIL DATA KATEGORI
  // ==========================================

  useEffect(() => {
    fetch(`${API_BASE_URL}/vendor-categories`, {
      headers: getAuthHeaders(false),
    })
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        setCategoryList(list);
      })
      .catch((error) => {
        console.error("Gagal mengambil kategori:", error);
      });
  }, []);

  // ==========================================
  // AMBIL DATA PAYMENT TERM
  // ==========================================

  useEffect(() => {
    fetch(`${API_BASE_URL}/payment-terms`, {
      headers: getAuthHeaders(false),
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPaymentTermList(data);
        } else {
          console.error("Data payment term bukan array:", data);

          setPaymentTermList([]);
        }
      })
      .catch((error) => {
        console.error("Gagal mengambil payment terms:", error);
      });
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
  // INPUT FILE
  // ==========================================

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files[0] || null,
    }));
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    // ==========================================
    // VENDOR CODE
    // ==========================================

    data.append("vendor_code", formData.vendorCode);

    // ==========================================
    // DATA UTAMA VENDOR
    // ==========================================

    data.append("nama_perusahaan", formData.namaPerusahaan);

    data.append("search_term", formData.searchTerm);

    data.append("address", formData.address);

    data.append("city", formData.city);

    data.append("postal_code", formData.postalCode);

    data.append("country", formData.country);

    // ==========================================
    // CONTACT
    // ==========================================

    data.append("phone", formData.phone);

    data.append("fax", formData.fax);

    data.append("pic_vendor", formData.picVendor);

    data.append("email", formData.email);

    // ==========================================
    // PROCUREMENT
    // ==========================================

    data.append("npwp", formData.npwp);

    data.append("business_type", formData.businessType);

    // ==========================================
    // KATEGORI
    // ==========================================

    data.append("kategori_id", formData.kategoriId);

    if (formData.kategoriOther) {
      data.append("kategori_other", formData.kategoriOther);
    }

    // ==========================================
    // COMPANY CODE & PURCH ORG
    // ==========================================

    // Backend otomatis menyimpan:
    // 1200 / 1300 (PROJECT BAKTI)

    // ==========================================
    // PAYMENT TERM
    // ==========================================

    if (formData.dueDatePayment) {
      data.append("payment_term_id", formData.dueDatePayment);
    }

    // ==========================================
    // ORDER CURRENCY
    // ==========================================

    data.append("order_currency", formData.orderCurrency);

    // ==========================================
    // SALESPERSON
    // ==========================================

    data.append("salesperson", formData.salesperson);

    // ==========================================
    // BANK
    // ==========================================

    data.append("bank_name", formData.bankName);

    data.append("rekening", formData.rekening);

    // ==========================================
    // DOKUMEN
    // ==========================================

    if (formData.npwpFile) {
      data.append("npwp_file", formData.npwpFile);
    }

    if (formData.rekeningFile) {
      data.append("rekening_file", formData.rekeningFile);
    }

    if (formData.nibFile) {
      data.append("nib_file", formData.nibFile);
    }

    if (formData.siupFile) {
      data.append("siup_file", formData.siupFile);
    }

    if (formData.companyProfile) {
      data.append("company_profile_file", formData.companyProfile);
    }

    if (formData.sertifikat) {
      data.append("sertifikat_file", formData.sertifikat);
    }

    // ==========================================
    // KIRIM KE BACKEND
    // ==========================================

    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error:", result);

        alert(result.message || "Gagal menyimpan existing vendor");

        return;
      }

      console.log("Existing vendor berhasil disimpan:", result);

      alert("Existing vendor berhasil disimpan");

      navigate("/vendors/existing");
    } catch (error) {
      console.error("Error:", error);

      alert("Terjadi kesalahan saat menyimpan existing vendor");
    }
  };

  return (
    <div className="add-vendor-page">
      <div className="add-vendor-card">
        {/* ==========================================
            HEADER
            ========================================== */}

        <div className="add-vendor-header">
          <h4>Tambah Existing Vendor</h4>

          <p>Tambahkan data vendor yang sudah terdaftar</p>
        </div>

        {/* ==========================================
            FORM
            ========================================== */}

        <form className="add-vendor-form" onSubmit={handleSubmit}>
          <div className="row add-vendor-row">
            {/* =====================================
                VENDOR CODE
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Vendor Code</label>

              <input
                type="text"
                name="vendorCode"
                className="add-vendor-input"
                value={formData.vendorCode}
                onChange={handleChange}
                placeholder="Masukkan vendor code"
                required
              />
            </div>

            {/* =====================================
                NAMA PERUSAHAAN
                ===================================== */}

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

            {/* =====================================
                SEARCH TERM
                ===================================== */}

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

            {/* =====================================
                CONTACT PERSON
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Contact Person</label>

              <input
                type="text"
                name="picVendor"
                className="add-vendor-input"
                value={formData.picVendor}
                onChange={handleChange}
                placeholder="Masukkan nama contact person"
              />
            </div>

            {/* =====================================
                EMAIL
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Email</label>

              <input
                type="email"
                name="email"
                className="add-vendor-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="vendor@email.com"
              />
            </div>

            {/* =====================================
                NOMOR TELEPON
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Nomor Telepon</label>

              <input
                type="text"
                name="phone"
                className="add-vendor-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Masukkan nomor telepon"
              />
            </div>

            {/* =====================================
                FAX
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">FAX</label>

              <input
                type="text"
                name="fax"
                className="add-vendor-input"
                value={formData.fax}
                onChange={handleChange}
                placeholder="Masukkan nomor FAX"
              />
            </div>

            {/* =====================================
                NPWP
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">NPWP</label>

              <input
                type="text"
                name="npwp"
                className="add-vendor-input"
                value={formData.npwp}
                onChange={handleChange}
                placeholder="Masukkan NPWP"
              />
            </div>

            {/* =====================================
                NAMA BANK
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Nama BANK</label>

              <input
                type="text"
                name="bankName"
                className="add-vendor-input"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="Masukkan nama BANK"
              />
            </div>

            {/* =====================================
                NO REKENING
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">No. Rekening</label>

              <input
                type="text"
                name="rekening"
                className="add-vendor-input"
                value={formData.rekening}
                onChange={handleChange}
                placeholder="Masukkan nomor rekening"
              />
            </div>

            {/* =====================================
                CITY
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">City</label>

              <input
                type="text"
                name="city"
                className="add-vendor-input"
                value={formData.city}
                onChange={handleChange}
                placeholder="Masukkan city"
              />
            </div>

            {/* =====================================
                POSTAL CODE
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Postal Code</label>

              <input
                type="text"
                name="postalCode"
                className="add-vendor-input"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="Masukkan postal code"
              />
            </div>

            {/* =====================================
                COUNTRY
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Country</label>

              <input
                type="text"
                name="country"
                className="add-vendor-input"
                value={formData.country}
                onChange={handleChange}
                placeholder="Masukkan country"
              />
            </div>

            {/* =====================================
                BUSINESS TYPE
                ===================================== */}

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

            {/* =====================================
                KATEGORI
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Kategori</label>

              <select
                name="kategoriId"
                className="add-vendor-input add-vendor-select"
                value={formData.kategoriId}
                onChange={handleChange}
                required
              >
                <option value="">Pilih Kategori</option>

                {categoryList.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_desc || category.name || category.cat_code}
                  </option>
                ))}
              </select>
            </div>

            {/* =====================================
                COMPANY CODE & PURCH ORG
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">
                Company Code & Purch Org
              </label>

              <input
                type="text"
                className="add-vendor-input"
                value="1200 / 1300 (PROJECT BAKTI)"
                readOnly
              />
            </div>

            {/* =====================================
                DUE DATE PAYMENT
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Due Date Payment</label>

              <select
                name="dueDatePayment"
                className="add-vendor-input add-vendor-select"
                value={formData.dueDatePayment}
                onChange={handleChange}
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
            </div>

            {/* =====================================
                ORDER CURRENCY
                ===================================== */}

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
              </select>
            </div>

            {/* =====================================
                SALESPERSON
                ===================================== */}

            <div className="col-md-6 add-vendor-field">
              <label className="add-vendor-label">Salesperson</label>

              <input
                type="text"
                name="salesperson"
                className="add-vendor-input"
                value={formData.salesperson}
                onChange={handleChange}
                placeholder="Masukkan nama salesperson"
              />
            </div>

            {/* =====================================
                ALAMAT
                ===================================== */}

            <div className="col-12 add-vendor-field">
              <label className="add-vendor-label">
                Alamat / Street Address
              </label>

              <textarea
                name="address"
                className="add-vendor-input add-vendor-textarea"
                rows="4"
                value={formData.address}
                onChange={handleChange}
                placeholder="Masukkan alamat vendor"
              />
            </div>

            {/* =====================================
                UPLOAD DOKUMEN
                ===================================== */}

            <div className="col-12">
              <div className="add-vendor-document-section">
                <h5 className="add-vendor-document-title">Upload Dokumen</h5>

                <p className="add-vendor-document-description">
                  Upload dokumen pendukung vendor
                </p>

                <div className="row">
                  {/* DOKUMEN NPWP */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">
                      Dokumen NPWP
                    </label>

                    <input
                      type="file"
                      name="npwpFile"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>

                  {/* DOKUMEN REKENING */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">
                      Dokumen Rekening
                    </label>

                    <input
                      type="file"
                      name="rekeningFile"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>

                  {/* DOKUMEN NIB */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">Dokumen NIB</label>

                    <input
                      type="file"
                      name="nibFile"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>

                  {/* DOKUMEN SIUP */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">
                      Dokumen SIUP
                    </label>

                    <input
                      type="file"
                      name="siupFile"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>

                  {/* DOKUMEN COMPANY PROFILE */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">
                      Dokumen Company Profile
                    </label>

                    <input
                      type="file"
                      name="companyProfile"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>

                  {/* DOKUMEN SERTIFIKAT */}

                  <div className="col-md-6 add-vendor-field">
                    <label className="add-vendor-file-label">
                      Dokumen Sertifikat Pendukung
                    </label>

                    <input
                      type="file"
                      name="sertifikat"
                      className="add-vendor-file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <small className="add-vendor-file-info">
                      Format: PDF, JPG, JPEG, PNG
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              BUTTON
              ========================================== */}

          <div className="add-vendor-actions">
            <button
              type="button"
              className="add-vendor-cancel"
              onClick={() => navigate("/vendors/existing")}
            >
              Batal
            </button>

            <button type="submit" className="add-vendor-save">
              Simpan Existing Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExistingVendor;
