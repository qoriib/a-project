<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorSubcategory;

class VendorSubcategorySeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::all();

        foreach ($vendors as $vendor) {
            if (!$vendor->kategori_id) {
                continue;
            }

            VendorSubcategory::updateOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'category_id' => $vendor->kategori_id,
                    'subcategory' => 'Material',
                ],
                [
                    'category_other' => null,
                ]
            );

            VendorSubcategory::updateOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'category_id' => $vendor->kategori_id,
                    'subcategory' => 'Jasa',
                ],
                [
                    'category_other' => null,
                ]
            );
        }
    }
}
