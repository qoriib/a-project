<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentTermSeeder extends Seeder
{
    public function run(): void
    {
        $paymentTerms = [
            ['code' => 'AP00', 'name' => 'AP-Due Net Immediately (Bayar Langsung / Tunai)'],
            ['code' => 'AP01', 'name' => 'AP-Due Net in 7 days (Tempo 7 Hari)'],
            ['code' => 'AP02', 'name' => 'AP-Due Net 14 days (Tempo 14 Hari)'],
            ['code' => 'AP03', 'name' => 'AP-Due Net 21 days (Tempo 21 Hari)'],
            ['code' => 'AP04', 'name' => 'AP-Due Net 30 days (Tempo 30 Hari Standar)'],
            ['code' => 'AP05', 'name' => 'AP-Due Net 45 days (Tempo 45 Hari)'],
            ['code' => 'AP06', 'name' => 'AP-Due Net 60 days (Tempo 60 Hari)'],
            ['code' => 'AP07', 'name' => 'AP-Due Net 90 days (Tempo 90 Hari - Kontrak Khusus)'],
            ['code' => 'AP08', 'name' => 'AP-DP 30% Net 30 days (Uang Muka 30% Pelunasan 30 Hari)'],
            ['code' => 'AP09', 'name' => 'AP-Cash Before Delivery (CBD / Bayar Sebelum Kirim)'],
            ['code' => 'AP10', 'name' => 'AP-Cash On Delivery (COD / Bayar Saat Terima)'],
        ];

        foreach ($paymentTerms as $term) {
            DB::table('payment_terms')->updateOrInsert(
                ['code' => $term['code']],
                [
                    'name' => $term['name'],
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Pertahankan opsi Other dengan code NULL
        $otherExists = DB::table('payment_terms')
            ->whereNull('code')
            ->where('name', 'Other')
            ->exists();

        if (!$otherExists) {
            DB::table('payment_terms')->insert([
                'code' => null,
                'name' => 'Other',
                'start_date' => '2026-01-01',
                'end_date' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
