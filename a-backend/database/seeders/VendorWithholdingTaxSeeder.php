<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\WithholdingTax;
use App\Models\VendorWithholdingTax;

class VendorWithholdingTaxSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::all();
        $taxes = WithholdingTax::all();

        if ($taxes->isEmpty()) {
            return;
        }

        foreach ($vendors as $index => $vendor) {
            $tax = $taxes[$index % $taxes->count()];

            VendorWithholdingTax::firstOrCreate([
                'vendor_id' => $vendor->id,
                'withholding_tax_id' => $tax->id,
            ]);
        }
    }
}
