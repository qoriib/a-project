<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountGroup;

class AccountGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['code' => 'Z010', 'name' => 'Vendor-SiteOwner (Pemilik Lahan / Menara)'],
            ['code' => 'Z020', 'name' => 'Vendor-SupplierLocal3rd (Pemasok Lokal Pihak Ketiga)'],
            ['code' => 'Z030', 'name' => 'Vendor-SupplierOverseas3rd (Pemasok Luar Negeri / Import)'],
            ['code' => 'Z040', 'name' => 'Vendor-Affiliated (Perusahaan Afiliasi / Grup IBS)'],
            ['code' => 'Z050', 'name' => 'Vendor-Shareholder (Pemegang Saham Perusahaan)'],
            ['code' => 'Z060', 'name' => 'Vendor-FinancialInstitution (Perbankan & Lembaga Keuangan)'],
            ['code' => 'Z070', 'name' => 'Vendor-OneTime (Vendor Transaksi Sekali Pakai)'],
            ['code' => 'Z080', 'name' => 'Employee-Internal (Reimbursement & Operasional Karyawan)'],
            ['code' => 'Z090', 'name' => 'Vendor-Government & BUMN (Instansi Pemerintah & BUMN)'],
            ['code' => 'Z100', 'name' => 'Vendor-ProfessionalServices (Konsultan Hukum & Keuangan)'],
            ['code' => null,   'name' => 'Other'],
        ];

        foreach ($groups as $group) {
            AccountGroup::updateOrCreate(
                [
                    'code' => $group['code'],
                    'name' => $group['name'],
                ],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
