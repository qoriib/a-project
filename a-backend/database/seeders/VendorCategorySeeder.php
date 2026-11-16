<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VendorCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'cat_code' => 'VMS_001',
                'category_type' => 'SCM',
                'category_desc' => 'IBS DAS & RF (Distributed Antenna System & Radio Frequency)',
            ],
            [
                'cat_code' => 'VMS_002',
                'category_type' => 'SCM',
                'category_desc' => 'CME & IBC (Civil, Mechanical, Electrical & In-Building Coverage)',
            ],
            [
                'cat_code' => 'VMS_003',
                'category_type' => 'SCM',
                'category_desc' => 'GPON, WIFI & Fiber Optic Rollout',
            ],
            [
                'cat_code' => 'VMS_004',
                'category_type' => 'SCM',
                'category_desc' => 'IT Infrastructure, Hardware & Enterprise Software',
            ],
            [
                'cat_code' => 'VMS_005',
                'category_type' => 'SCM',
                'category_desc' => 'IoT, Smart Metering, Sensor & Telemetry',
            ],
            [
                'cat_code' => 'VMS_006',
                'category_type' => 'SCM',
                'category_desc' => 'General Supplier, Consumables & Office Facilities',
            ],
            [
                'cat_code' => 'VMS_007',
                'category_type' => 'SCM',
                'category_desc' => 'Project Bakti Kominfo Wilayah 3T',
            ],
            [
                'cat_code' => 'VMS_008',
                'category_type' => 'SCM',
                'category_desc' => 'Tower Infrastructure, Guyed Mast & Colocation CME',
            ],
            [
                'cat_code' => 'VMS_009',
                'category_type' => 'SCM',
                'category_desc' => 'Power Systems, Genset, Rectifier & Solar Panel Hybrid',
            ],
            [
                'cat_code' => 'VMS_010',
                'category_type' => 'SCM',
                'category_desc' => 'Logistics, Heavy Transport, Freight Forwarding & Warehouse',
            ],
            [
                'cat_code' => 'VMS_011',
                'category_type' => 'SCM',
                'category_desc' => 'Legal Advisory, Notary, Audit & Professional Consulting',
            ],
            [
                'cat_code' => 'VMS_012',
                'category_type' => 'SCM',
                'category_desc' => 'SCM - Other / Special Project Services',
            ],
            [
                'cat_code' => 'VMS_013',
                'category_type' => 'BR',
                'category_desc' => 'BR - Land Acquisition & Site Hunting (Pengadaan Lahan)',
            ],
            [
                'cat_code' => 'VMS_014',
                'category_type' => 'BR',
                'category_desc' => 'BR - Community Permit, ROW & Local Government Relations (Perizinan Warga)',
            ],
            [
                'cat_code' => 'VMS_015',
                'category_type' => 'BR',
                'category_desc' => 'BR - Other Commercial Business Representative',
            ],
        ];

        foreach ($categories as $category) {
            $existing = DB::table('vendor_categories')
                ->where('cat_code', $category['cat_code'])
                ->first();

            $data = [
                'category_type' => $category['category_type'],
                'category_desc' => $category['category_desc'],
                'start_date' => '2026-01-01',
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
