<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentTermSeeder extends Seeder
{
    public function run(): void
    {
        $paymentTerms = [
            [
                'code' => 'AP00',
                'name' => 'AP-Due Net Immediately',
            ],
            [
                'code' => 'AP01',
                'name' => 'AP-Due Net in 7 days',
            ],
            [
                'code' => 'AP02',
                'name' => 'AP-Due Net 14 days',
            ],
            [
                'code' => 'AP03',
                'name' => 'AP-Due Net 21 days',
            ],
            [
                'code' => 'AP04',
                'name' => 'AP-Due Net 30 days',
            ],
            [
                'code' => 'AP05',
                'name' => 'AP-Due Net 60 days',
            ],
        ];

        foreach ($paymentTerms as $term) {
            DB::table('payment_terms')->updateOrInsert(
                ['code' => $term['code']],
                [
                    'name' => $term['name'],
                    'start_date' => '2026-09-29',
                    'end_date' => null,
                ]
            );
        }

        // Pertahankan data Other dengan code NULL.
        $otherExists = DB::table('payment_terms')
            ->whereNull('code')
            ->where('name', 'Other')
            ->exists();

        if (!$otherExists) {
            DB::table('payment_terms')->insert([
                'code' => null,
                'name' => 'Other',
                'start_date' => '2026-09-29',
                'end_date' => null,
            ]);
        }
    }
}
