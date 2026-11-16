<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorCategory;
use App\Models\AccountGroup;
use App\Models\ReconAccount;
use App\Models\PaymentTerm;
use App\Models\User;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $cat1 = VendorCategory::where('cat_code', 'VMS_001')->first();
        $cat2 = VendorCategory::where('cat_code', 'VMS_002')->first();
        $cat3 = VendorCategory::where('cat_code', 'VMS_003')->first();
        $cat4 = VendorCategory::where('cat_code', 'VMS_004')->first();
        $cat6 = VendorCategory::where('cat_code', 'VMS_006')->first();

        $accGroupLocal = AccountGroup::where('code', 'Z020')->first();
        $accGroupAffil = AccountGroup::where('code', 'Z040')->first();

        $reconTrade = ReconAccount::where('code', '31000310')->first();
        $reconNonTrade = ReconAccount::where('code', '32000210')->first();

        $term30 = PaymentTerm::where('code', 'AP04')->first();
        $term14 = PaymentTerm::where('code', 'AP02')->first();

        $creator = User::where('email', 'admin@ibs.test')->first() ?? User::first();

        $vendors = [
            [
                'nama_perusahaan' => 'PT Telekomunikasi Nusantara Abadi',
                'vendor_code' => 'VEND-001001',
                'source_type' => 'EXISTING',
                'search_term' => 'TELKOM NUSANTARA',
                'pic_vendor' => 'Budi Santoso',
                'email' => 'contact@telkom-nusantara.co.id',
                'phone' => '021-5551234',
                'mobile_phone' => '081234567890',
                'fax' => '021-5551235',
                'kategori_id' => $cat1?->id,
                'business_type' => 'Telecommunication',
                'npwp' => '01.234.567.8-012.000',
                'address' => 'Jl. Gatot Subroto No. 45 Kav. 12',
                'city' => 'Jakarta Selatan',
                'postal_code' => '12930',
                'country' => 'Indonesia',
                'account_group_id' => $accGroupLocal?->id,
                'recon_account_id' => $reconTrade?->id,
                'payment_method' => 'transfer',
                'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
                'payment_term_id' => $term30?->id,
                'order_currency' => 'IDR',
                'created_by' => $creator?->id,
                'start_date' => '2026-01-01',
            ],
            [
                'nama_perusahaan' => 'CV Multi Sarana Teknik Mandiri',
                'vendor_code' => 'VEND-001002',
                'source_type' => 'NEW',
                'search_term' => 'MULTI SARANA',
                'pic_vendor' => 'Ahmad Fauzi',
                'email' => 'sales@multisarana.id',
                'phone' => '022-7778901',
                'mobile_phone' => '081398765432',
                'fax' => '022-7778902',
                'kategori_id' => $cat2?->id,
                'business_type' => 'Civil & Mechanical Engineering',
                'npwp' => '02.345.678.9-429.000',
                'address' => 'Kawasan Industri Cikarang Blok B No. 8',
                'city' => 'Bekasi',
                'postal_code' => '17530',
                'country' => 'Indonesia',
                'account_group_id' => $accGroupLocal?->id,
                'recon_account_id' => $reconTrade?->id,
                'payment_method' => 'transfer',
                'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
                'payment_term_id' => $term14?->id,
                'order_currency' => 'IDR',
                'created_by' => $creator?->id,
                'start_date' => '2026-02-15',
            ],
            [
                'nama_perusahaan' => 'PT Global Network Solusindo',
                'vendor_code' => 'VEND-001003',
                'source_type' => 'EXISTING',
                'search_term' => 'GLOBAL NETWORK',
                'pic_vendor' => 'Dewi Lestari',
                'email' => 'info@globalnetwork.co.id',
                'phone' => '031-8889900',
                'mobile_phone' => '081122334455',
                'fax' => '031-8889901',
                'kategori_id' => $cat3?->id,
                'business_type' => 'Fiber Optic & Wireless',
                'npwp' => '03.456.789.0-604.000',
                'address' => 'Jl. Pemuda No. 108',
                'city' => 'Surabaya',
                'postal_code' => '60271',
                'country' => 'Indonesia',
                'account_group_id' => $accGroupAffil?->id,
                'recon_account_id' => $reconNonTrade?->id,
                'payment_method' => 'transfer',
                'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
                'payment_term_id' => $term30?->id,
                'order_currency' => 'IDR',
                'created_by' => $creator?->id,
                'start_date' => '2026-03-01',
            ],
            [
                'nama_perusahaan' => 'PT Cipta Teknologi Pratama',
                'vendor_code' => 'VEND-001004',
                'source_type' => 'NEW',
                'search_term' => 'CIPTA TEKNO',
                'pic_vendor' => 'Rian Hidayat',
                'email' => 'admin@ciptatekno.com',
                'phone' => '021-3334455',
                'mobile_phone' => '081788990011',
                'fax' => null,
                'kategori_id' => $cat4?->id,
                'business_type' => 'Information Technology',
                'npwp' => '04.567.890.1-055.000',
                'address' => 'Cyber 2 Tower Lt. 18, Jl. HR Rasuna Said',
                'city' => 'Jakarta Selatan',
                'postal_code' => '12950',
                'country' => 'Indonesia',
                'account_group_id' => $accGroupLocal?->id,
                'recon_account_id' => $reconTrade?->id,
                'payment_method' => 'transfer',
                'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
                'payment_term_id' => $term30?->id,
                'order_currency' => 'IDR',
                'created_by' => $creator?->id,
                'start_date' => '2026-04-10',
            ],
            [
                'nama_perusahaan' => 'CV Prima Daya Cemerlang',
                'vendor_code' => 'VEND-001005',
                'source_type' => 'EXISTING',
                'search_term' => 'PRIMA DAYA',
                'pic_vendor' => 'Siti Nurhaliza',
                'email' => 'sales@primadaya.id',
                'phone' => '021-8881234',
                'mobile_phone' => '081566778899',
                'fax' => null,
                'kategori_id' => $cat6?->id,
                'business_type' => 'General Supplier & Electrical',
                'npwp' => '05.678.901.2-088.000',
                'address' => 'Jl. Daan Mogot KM 12 No. 88',
                'city' => 'Jakarta Barat',
                'postal_code' => '11730',
                'country' => 'Indonesia',
                'account_group_id' => $accGroupLocal?->id,
                'recon_account_id' => $reconTrade?->id,
                'payment_method' => 'transfer',
                'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
                'payment_term_id' => $term30?->id,
                'order_currency' => 'IDR',
                'created_by' => $creator?->id,
                'start_date' => '2026-05-01',
            ],
        ];

        foreach ($vendors as $vendorData) {
            Vendor::updateOrCreate(
                ['nama_perusahaan' => $vendorData['nama_perusahaan']],
                $vendorData
            );
        }
    }
}
