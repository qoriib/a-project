<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyCode;

class CompanyCodeSeeder extends Seeder
{
    public function run(): void
    {
        $codes = [
            ['code' => '1000', 'name' => 'Company Code 1000 (Holding)'],
            ['code' => '1100', 'name' => 'Company Code 1100'],
            ['code' => '1200', 'name' => 'Company Code 1200'],
            ['code' => '1300', 'name' => 'Company Code 1300 (All Comp. Code)'],
            ['code' => '1400', 'name' => 'Company Code 1400'],
        ];

        foreach ($codes as $item) {
            CompanyCode::updateOrCreate(
                ['code' => $item['code']],
                [
                    'name' => $item['name'],
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
