<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\WithholdingTax;

class VendorWithholdingTaxSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::orderBy('id')->get();
        $taxes = WithholdingTax::all()->keyBy(function ($item) {
            // Extract the tax code e.g. "W3" from "W3 - PPh 23 ..."
            preg_match('/^(W\d+)/', $item->name, $matches);
            return $matches[1] ?? $item->name;
        });

        if ($taxes->isEmpty()) {
            return;
        }

        foreach ($vendors as $vendor) {
            // Pasang WHT untuk vendor yang sudah melalui Level 4, Level 5, atau COMPLETED/EXISTING
            $catCode = $vendor->kategori?->cat_code ?? 'VMS_001';
            $attachTaxIds = [];

            if (in_array($catCode, ['VMS_002', 'VMS_007', 'VMS_008'])) {
                // CME, Konstruksi 3T, Menara Tower -> PPh 4(2) Konstruksi (W9) & PPh 23 CME (W5)
                if (isset($taxes['W9'])) $attachTaxIds[] = $taxes['W9']->id;
                if (isset($taxes['W5'])) $attachTaxIds[] = $taxes['W5']->id;
            } elseif (in_array($catCode, ['VMS_001', 'VMS_003', 'VMS_004', 'VMS_005', 'VMS_011'])) {
                // DAS, Fiber, IT, IoT, Legal Consulting -> PPh 23 Jasa Teknik / Konsultan (W3)
                if (isset($taxes['W3'])) $attachTaxIds[] = $taxes['W3']->id;
            } elseif (in_array($catCode, ['VMS_010'])) {
                // Logistik & Freight Forwarding -> PPh 23 Ekspedisi / Pengangkutan (W6)
                if (isset($taxes['W6'])) $attachTaxIds[] = $taxes['W6']->id;
            } elseif (in_array($catCode, ['VMS_013', 'VMS_014', 'VMS_015'])) {
                // BR - Lahan & Perizinan Sewa Menara -> PPh 4(2) Final Sewa Tanah / Site Lease (W7)
                if (isset($taxes['W7'])) $attachTaxIds[] = $taxes['W7']->id;
            } else {
                // Default General Supplier / CME Tools
                if (isset($taxes['W3'])) $attachTaxIds[] = $taxes['W3']->id;
            }

            // Sync hanya untuk vendor yang sudah lewat tahap Tax (bukan draft, PENDING_L1, PENDING_L2, PENDING_L3)
            // Cek apakah vendor punya request aktif yang belum sampai level 4
            $latestRequest = $vendor->vendorRequests()->latest('id')->first();
            $status = strtoupper($latestRequest?->status ?? '');

            if (!in_array($status, ['DRAFT', 'PENDING_L1', 'PENDING_L2', 'PENDING_L3'])) {
                $vendor->withholdingTaxes()->sync(array_filter($attachTaxIds));
            }
        }
    }
}
