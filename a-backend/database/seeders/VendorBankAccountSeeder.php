<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorBankAccount;

class VendorBankAccountSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::orderBy('id')->get();

        $bankOptions = [
            ['bank' => 'Bank Central Asia (BCA)', 'swift' => 'CENAIDJA'],
            ['bank' => 'Bank Mandiri (Persero) Tbk', 'swift' => 'BMRIIDJA'],
            ['bank' => 'Bank Negara Indonesia (BNI)', 'swift' => 'BNINIDJA'],
            ['bank' => 'Bank Rakyat Indonesia (BRI)', 'swift' => 'BRINIDJA'],
            ['bank' => 'Bank Permata Tbk', 'swift' => 'BBBAIDJA'],
            ['bank' => 'Bank CIMB Niaga Tbk', 'swift' => 'BNIAIDJA'],
            ['bank' => 'Bank Danamon Indonesia', 'swift' => 'BDINIDJA'],
            ['bank' => 'Bank Syariah Indonesia (BSI)', 'swift' => 'BSMDIDJA'],
        ];

        foreach ($vendors as $index => $vendor) {
            $primaryBank = $bankOptions[$index % count($bankOptions)];
            $accNumber = sprintf('%010d', 1000000000 + ($index + 1) * 38291);

            // Rekening Utama
            VendorBankAccount::updateOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'account_number' => $accNumber,
                ],
                [
                    'bank_name' => $primaryBank['bank'],
                    'account_name' => $vendor->nama_perusahaan,
                    'swift_code' => $primaryBank['swift'],
                    'is_primary' => true,
                ]
            );

            // Rekening Sekunder untuk sebagian vendor (setiap kelipatan 2)
            if ($index % 2 === 0) {
                $secondaryBank = $bankOptions[($index + 3) % count($bankOptions)];
                $secondaryAccNumber = sprintf('%010d', 2000000000 + ($index + 1) * 94712);

                VendorBankAccount::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'account_number' => $secondaryAccNumber,
                    ],
                    [
                        'bank_name' => $secondaryBank['bank'],
                        'account_name' => $vendor->nama_perusahaan,
                        'swift_code' => $secondaryBank['swift'],
                        'is_primary' => false,
                    ]
                );
            }
        }
    }
}
