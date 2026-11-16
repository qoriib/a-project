<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ReconAccount;

class ReconAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['code' => '31000310', 'name' => '31000310 - Trade A/P-3rd Party (Hutang Usaha Pihak Ketiga)'],
            ['code' => '31000320', 'name' => '31000320 - Trade A/P-Affiliated (Hutang Usaha Afiliasi / Grup)'],
            ['code' => '32000210', 'name' => '32000210 - Non Trade A/P-3rd Party (Hutang Non-Usaha Pihak Ketiga)'],
            ['code' => '32000220', 'name' => '32000220 - Non Trade A/P-Affiliated (Hutang Non-Usaha Afiliasi)'],
            ['code' => '33000100', 'name' => '33000100 - Advance Payment to Vendor (Uang Muka Pembelian)'],
            ['code' => '34000510', 'name' => '34000510 - Employee Payable (Hutang Operasional Karyawan)'],
            ['code' => '35000100', 'name' => '35000100 - Accrued Expenses - Project Bakti (Beban Akrual)'],
            ['code' => '36000200', 'name' => '36000200 - Retention Payable - Civil Contractors (Retensi Proyek)'],
            ['code' => null,       'name' => 'Other'],
        ];

        foreach ($accounts as $account) {
            ReconAccount::updateOrCreate(
                [
                    'code' => $account['code'],
                    'name' => $account['name'],
                ],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
