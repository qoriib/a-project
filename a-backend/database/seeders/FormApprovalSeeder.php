<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendorRequest;
use App\Models\FormApproval;

class FormApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $pendingRequests = VendorRequest::where('status', 'PENDING')->get();

        $approvalChain = [
            [
                'priority' => 1,
                'stage' => 'ASISTEN_KADIV',
                'nik' => '90000006',
                'email' => 'test.asisten@ibs.test',
            ],
            [
                'priority' => 2,
                'stage' => 'KADIV',
                'nik' => '90000001',
                'email' => 'test.kadiv@ibs.test',
            ],
            [
                'priority' => 3,
                'stage' => 'ACCOUNTING',
                'nik' => '90000002',
                'email' => 'test.accounting@ibs.test',
            ],
            [
                'priority' => 4,
                'stage' => 'TAX',
                'nik' => '90000003',
                'email' => 'test.tax@ibs.test',
            ],
            [
                'priority' => 5,
                'stage' => 'SAP',
                'nik' => '90000004',
                'email' => 'test.sap@ibs.test',
            ],
        ];

        foreach ($pendingRequests as $req) {
            foreach ($approvalChain as $chain) {
                $status = ($chain['stage'] === $req->current_stage) ? 'IN_PROGRESS' : 'WAITING';

                FormApproval::updateOrCreate(
                    [
                        'vendor_request_id' => $req->id,
                        'priority' => $chain['priority'],
                    ],
                    [
                        'stage' => $chain['stage'],
                        'nik' => $chain['nik'],
                        'email' => $chain['email'],
                        'status' => $status,
                    ]
                );
            }
        }
    }
}
