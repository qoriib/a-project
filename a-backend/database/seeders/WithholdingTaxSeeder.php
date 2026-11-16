<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WithholdingTax;

class WithholdingTaxSeeder extends Seeder
{
    public function run(): void
    {
        $taxes = [
            ['name' => 'W1 - PPh 21 Tenaga Ahli / Professional (Tarif Efektif)'],
            ['name' => 'W2 - PPh 21 Upah Pegawai Tidak Tetap / Borongan'],
            ['name' => 'W3 - PPh 23 Jasa Teknik, Manajemen, Konsultan (2%)'],
            ['name' => 'W4 - PPh 23 Sewa & Penghasilan Penggunaan Harta (2%)'],
            ['name' => 'W5 - PPh 23 Jasa Pemeliharaan / CME Maintenance (2%)'],
            ['name' => 'W6 - PPh 23 Jasa Ekspedisi, Logistik & Pengangkutan (2%)'],
            ['name' => 'W7 - PPh 4(2) Final Sewa Tanah dan/atau Bangunan / Site Lease (10%)'],
            ['name' => 'W8 - PPh 4(2) Final Jasa Konstruksi Kualifikasi Kecil (1.75%)'],
            ['name' => 'W9 - PPh 4(2) Final Jasa Konstruksi Kualifikasi Menengah/Besar (2.65%)'],
            ['name' => 'W10 - PPh 4(2) Final Jasa Perencanaan / Pengawasan Konstruksi (3.5%)'],
            ['name' => 'W11 - PPh 22 Pembelian Material Telekomunikasi / BUMN (1.5%)'],
            ['name' => 'W12 - PPh 26 Wajib Pajak Luar Negeri / Non-Resident Royalty (20%)'],
            ['name' => 'W13 - PPh 26 Tax Treaty Benefit Reduced Rate (10%)'],
        ];

        foreach ($taxes as $tax) {
            WithholdingTax::updateOrCreate(
                ['name' => $tax['name']],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
