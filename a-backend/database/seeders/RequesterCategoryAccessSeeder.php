<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequesterCategoryAccess;

class RequesterCategoryAccessSeeder extends Seeder
{
    public function run(): void
    {
        // Hak akses kategori berdasarkan NIK requester
        $accessRules = [
            // Admin (Akses Penuh SCM & BR)
            '90000000' => ['SCM', 'BR'],
            'ADM001'   => ['SCM', 'BR'],

            // Staff Requester SCM
            '90000007' => ['SCM'],
            'REQ001'   => ['SCM'],
            '20268888' => ['SCM'],

            // Staff Requester BR
            '90000017' => ['BR'],
            'REQ002'   => ['BR'],
        ];

        foreach ($accessRules as $nik => $types) {
            foreach ($types as $type) {
                RequesterCategoryAccess::updateOrCreate(
                    [
                        'nik' => $nik,
                        'category_type' => $type,
                    ],
                    [
                        'start_date' => '2026-01-01',
                        'end_date' => null,
                    ]
                );
            }
        }
    }
}
