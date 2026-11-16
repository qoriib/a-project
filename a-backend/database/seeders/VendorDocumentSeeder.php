<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorDocument;
use App\Models\User;

class VendorDocumentSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::with('bankAccounts')->get();
        $uploader = User::first();

        $docTypes = [
            'NPWP' => 'npwp_document.pdf',
            'NIB' => 'nib_document.pdf',
            'KTP' => 'ktp_direktur.pdf',
            'REKENING_KORAN' => 'rekening_koran.pdf',
            'COMPANY_PROFILE' => 'company_profile.pdf',
        ];

        foreach ($vendors as $vendor) {
            $primaryBank = $vendor->bankAccounts->first();

            foreach ($docTypes as $type => $fileName) {
                VendorDocument::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'document_type' => $type,
                    ],
                    [
                        'bank_account_id' => ($type === 'REKENING_KORAN') ? $primaryBank?->id : null,
                        'file_name' => strtolower($vendor->search_term ?? 'vendor') . '_' . $fileName,
                        'file_path' => 'documents/vendors/' . $vendor->id . '/' . $fileName,
                        'version' => 1,
                        'uploaded_by' => $uploader?->id,
                    ]
                );
            }
        }
    }
}
