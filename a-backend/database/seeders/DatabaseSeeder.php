<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1. Hak Akses & User
            RoleSeeder::class,
            UserSeeder::class,
            AdminSeeder::class,
            MasterApprovalSeeder::class,

            // 2. Master Data Referensi
            VendorCategorySeeder::class,
            AccountGroupSeeder::class,
            ReconAccountSeeder::class,
            CompanyCodeSeeder::class,
            PaymentTermSeeder::class,
            WithholdingTaxSeeder::class,

            // 3. Konfigurasi Alur Persetujuan & Penomoran
            MasterApprovalLayerSeeder::class,
            RequesterCategoryAccessSeeder::class,
            RequestSequenceSeeder::class,

            // 4. Data Master Vendor & Profil Bank
            VendorSeeder::class,
            VendorSubcategorySeeder::class,
            VendorBankAccountSeeder::class,

            // 5. Transaksi Permohonan & Detail Riwayat Perubahan (Diff)
            VendorRequestSeeder::class,
            VendorRequestDetailSeeder::class,

            // 6. Dokumen Legalitas, Pajak, & Riwayat Approval Lengkap
            VendorWithholdingTaxSeeder::class,
            VendorDocumentSeeder::class,
            VendorApprovalHistorySeeder::class,
            FormApprovalSeeder::class,
        ]);
    }
}
