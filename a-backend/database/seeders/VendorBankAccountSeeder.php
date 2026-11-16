<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorBankAccount;

class VendorBankAccountSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::all();

        $banks = [
            ['bank_name' => 'Bank Central Asia (BCA)', 'swift_code' => 'CENAIDJA'],
            ['bank_name' => 'Bank Mandiri', 'swift_code' => 'BMRIIDJA'],
            ['bank_name' => 'Bank Negara Indonesia (BNI)', 'swift_code' => 'BNINIDJA'],
            ['bank_name' => 'Bank Rakyat Indonesia (BRI)', 'swift_code' => 'BRINIDJA'],
            ['bank_name' => 'Bank CIMB Niaga', 'swift_code' => 'BNIAIDJA'],
        ];

        foreach ($vendors as $index => $vendor) {
            $bank = $banks[$index % count($banks)];

            VendorBankAccount::updateOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'account_number' => '123' . str_pad((string)$vendor->id, 7, '0', STR_PAD_LEFT),
                ],
                [
                    'bank_name' => $bank['bank_name'],
                    'account_name' => $vendor->nama_perusahaan,
                    'swift_code' => $bank['swift_code'],
                    'is_primary' => true,
                ]
            );
        }
    }
}
