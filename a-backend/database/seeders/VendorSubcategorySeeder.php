<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorSubcategory;

class VendorSubcategorySeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::with('kategori')->orderBy('id')->get();

        foreach ($vendors as $vendor) {
            $catId = $vendor->kategori_id ?? 1;
            $catCode = $vendor->kategori?->cat_code ?? 'VMS_001';

            $subcategories = [];

            if (in_array($catCode, ['VMS_001', 'VMS_002', 'VMS_008', 'VMS_009'])) {
                // DAS & RF, CME, Tower, Solar/Power -> Material & Jasa Instalasi
                $subcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Material'],
                    ['category_id' => $catId, 'subcategory' => 'Jasa'],
                ];
            } elseif (in_array($catCode, ['VMS_003', 'VMS_004', 'VMS_005'])) {
                // Fiber Optic, Enterprise IT, IoT -> Jasa & Material
                $subcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Jasa'],
                    ['category_id' => $catId, 'subcategory' => 'Material'],
                ];
            } elseif (in_array($catCode, ['VMS_006', 'VMS_007'])) {
                // General Supplier & Material Bakti -> Material
                $subcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Material'],
                ];
            } elseif (in_array($catCode, ['VMS_010', 'VMS_011', 'VMS_012', 'VMS_013', 'VMS_014', 'VMS_015'])) {
                // Logistik, Legal, BR Lahan, BR Perizinan Warga -> Jasa
                $subcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Jasa'],
                ];
            } else {
                $subcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Material'],
                    ['category_id' => $catId, 'subcategory' => 'Jasa'],
                ];
            }

            foreach ($subcategories as $item) {
                VendorSubcategory::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'category_id' => $item['category_id'],
                        'subcategory' => $item['subcategory'],
                    ],
                    [
                        'category_other' => null,
                    ]
                );
            }
        }
    }
}
