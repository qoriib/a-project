<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VendorCategorySeeder extends Seeder
{
    public function run(): void
    {
        // Perbaiki data Other lama yang masih NULL.
        // Data lama digunakan sebagai Other untuk SCM.
        $oldOther = DB::table('vendor_categories')
            ->whereNull('cat_code')
            ->whereNull('category_type')
            ->where('category_desc', 'Other')
            ->orderBy('id')
            ->first();

        if ($oldOther) {
            DB::table('vendor_categories')
                ->where('id', $oldOther->id)
                ->update([
                    'cat_code' => 'VMS_008',
                    'category_type' => 'SCM',
                    'category_desc' => 'Other',
                    'start_date' => '2026-09-29',
                    'end_date' => null,
                    'updated_at' => now(),
                ]);
        }

        $categories = [
            [
                'cat_code' => 'VMS_001',
                'category_type' => 'SCM',
                'category_desc' => 'IBS DAS & RF',
            ],
            [
                'cat_code' => 'VMS_002',
                'category_type' => 'SCM',
                'category_desc' => 'CME & IBC',
            ],
            [
                'cat_code' => 'VMS_003',
                'category_type' => 'SCM',
                'category_desc' => 'GPON/WIFI',
            ],
            [
                'cat_code' => 'VMS_004',
                'category_type' => 'SCM',
                'category_desc' => 'IT & System',
            ],
            [
                'cat_code' => 'VMS_005',
                'category_type' => 'SCM',
                'category_desc' => 'IoT & Smart',
            ],
            [
                'cat_code' => 'VMS_006',
                'category_type' => 'SCM',
                'category_desc' => 'General Vendor',
            ],
            [
                'cat_code' => 'VMS_007',
                'category_type' => 'SCM',
                'category_desc' => 'Project Bakti',
            ],
            [
                'cat_code' => 'VMS_008',
                'category_type' => 'SCM',
                'category_desc' => 'Other',
            ],
            [
                'cat_code' => 'VMS_009',
                'category_type' => 'BR',
                'category_desc' => 'Other',
            ],
        ];

        foreach ($categories as $category) {
            $existing = DB::table('vendor_categories')
                ->where('cat_code', $category['cat_code'])
                ->first();

            $data = [
                'category_type' => $category['category_type'],
                'category_desc' => $category['category_desc'],
                'start_date' => '2026-09-29',
                'end_date' => null,
                'updated_at' => now(),
            ];

            if ($existing) {
                DB::table('vendor_categories')
                    ->where('id', $existing->id)
                    ->update($data);
            } else {
                DB::table('vendor_categories')->insert([
                    ...$data,
                    'cat_code' => $category['cat_code'],
                    'created_at' => now(),
                ]);
            }
        }
    }
}
