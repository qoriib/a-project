<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyCode;

class CompanyCodeSeeder extends Seeder
{
    public function run(): void
    {
        $codes = [
            ['code' => '1000', 'name' => '1000 - PT Inti Bangun Sejahtera Tbk (Holding)'],
            ['code' => '1100', 'name' => '1100 - PT IBS Tower Solutions'],
            ['code' => '1200', 'name' => '1200 - PT IBS Project Division'],
            ['code' => '1300', 'name' => '1300 - PT IBS / BAKTI Nusantara Project'],
            ['code' => '1400', 'name' => '1400 - PT IBS Fiber Optic Network'],
            ['code' => '1500', 'name' => '1500 - PT IBS Micro Data Center'],
            ['code' => '1600', 'name' => '1600 - PT IBS Power & Green Energy'],
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
