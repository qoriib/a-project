<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequesterCategoryAccess;

class RequesterCategoryAccessSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['nik' => '20268888', 'category_type' => 'SCM'],
            ['nik' => '90000007', 'category_type' => 'SCM'],
            ['nik' => '90000007', 'category_type' => 'BR'],
            ['nik' => '90000000', 'category_type' => 'SCM'],
            ['nik' => '90000000', 'category_type' => 'BR'],
            ['nik' => '90000003', 'category_type' => 'BR'],
        ];

        foreach ($data as $item) {
            RequesterCategoryAccess::updateOrCreate(
                [
                    'nik' => $item['nik'],
                    'category_type' => $item['category_type'],
                ],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
