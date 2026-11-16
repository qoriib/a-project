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

            // 4. Data Master Vendor
            VendorSeeder::class,
            VendorSubcategorySeeder::class,
            VendorBankAccountSeeder::class,
            VendorDocumentSeeder::class,
            VendorWithholdingTaxSeeder::class,

            // 5. Transaksi Permohonan & Riwayat Approval
            VendorRequestSeeder::class,
            VendorRequestDetailSeeder::class,
            VendorApprovalHistorySeeder::class,
            FormApprovalSeeder::class,
        ]);
    }
}
