<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\VendorRequest;
use App\Models\User;

class VendorRequestSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::orderBy('id')->get();
        $requester = User::where('email', 'test.requester@ibs.test')->first() ?? User::first();

        $requests = [
            [
                'form_number' => '0001/SCM-N/2026',
                'request_type' => 'CREATE',
                'vendor_index' => 0,
                'internal_vendor_code' => 'VEND-001001',
                'sap_vendor_code' => 'SAP-1001',
                'cat_code' => 'VMS_001',
                'requested_by_nik' => $requester?->nik ?? '90000007',
                'requested_by_email' => $requester?->email ?? 'test.requester@ibs.test',
                'status' => 'APPROVED',
                'current_stage' => 'SAP',
                'submitted_at' => now()->subDays(5),
                'completed_at' => now()->subDay(),
                'final_pdf_path' => 'exports/pdf/vendor_approval_0001_SCM-N_2026.pdf',
            ],
            [
                'form_number' => '0002/SCM-N/2026',
                'request_type' => 'CREATE',
                'vendor_index' => 1,
                'internal_vendor_code' => 'VEND-001002',
                'sap_vendor_code' => null,
                'cat_code' => 'VMS_002',
                'requested_by_nik' => $requester?->nik ?? '90000007',
                'requested_by_email' => $requester?->email ?? 'test.requester@ibs.test',
                'status' => 'PENDING',
                'current_stage' => 'KADIV',
                'submitted_at' => now()->subDays(2),
                'completed_at' => null,
                'final_pdf_path' => null,
            ],
            [
                'form_number' => '0003/SCM-U/2026',
                'request_type' => 'UPDATE',
                'vendor_index' => 2,
                'internal_vendor_code' => 'VEND-001003',
                'sap_vendor_code' => 'SAP-1003',
                'cat_code' => 'VMS_003',
                'requested_by_nik' => $requester?->nik ?? '90000007',
                'requested_by_email' => $requester?->email ?? 'test.requester@ibs.test',
                'status' => 'PENDING',
                'current_stage' => 'ACCOUNTING',
                'submitted_at' => now()->subDays(3),
                'completed_at' => null,
                'final_pdf_path' => null,
            ],
            [
                'form_number' => '0004/SCM-N/2026',
                'request_type' => 'CREATE',
                'vendor_index' => 3,
                'internal_vendor_code' => 'VEND-001004',
                'sap_vendor_code' => null,
                'cat_code' => 'VMS_004',
                'requested_by_nik' => $requester?->nik ?? '90000007',
                'requested_by_email' => $requester?->email ?? 'test.requester@ibs.test',
                'status' => 'DRAFT',
                'current_stage' => 'REQUESTER',
                'submitted_at' => null,
                'completed_at' => null,
                'final_pdf_path' => null,
            ],
        ];

        foreach ($requests as $data) {
            $vendor = $vendors->get($data['vendor_index']);
            unset($data['vendor_index']);

            $data['vendor_id'] = $vendor?->id;

            VendorRequest::updateOrCreate(
                ['form_number' => $data['form_number']],
                $data
            );
        }
    }
}
