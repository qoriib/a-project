<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterApproval;

class MasterApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $approvals = [
            [
                'nik' => '90000000',
                'email' => 'admin@ibs.test',
                'approval_stage' => 'ADMIN',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000001',
                'email' => 'test.kadiv@ibs.test',
                'approval_stage' => 'KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000002',
                'email' => 'test.accounting@ibs.test',
                'approval_stage' => 'ACCOUNTING',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000003',
                'email' => 'test.tax@ibs.test',
                'approval_stage' => 'TAX',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000004',
                'email' => 'test.sap@ibs.test',
                'approval_stage' => 'SAP',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000006',
                'email' => 'test.asisten@ibs.test',
                'approval_stage' => 'ASISTEN_KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000007',
                'email' => 'test.requester@ibs.test',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
            ],
            [
                'nik' => '20268888',
                'email' => 'procurement@ibs.test',
                'approval_stage' => 'PROCUREMENT',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
        ];

        foreach ($approvals as $approval) {
            MasterApproval::updateOrCreate(
                [
                    'nik' => $approval['nik'],
                    'approval_stage' => $approval['approval_stage'],
                ],
                [
                    'email' => $approval['email'],
                    'can_view' => $approval['can_view'],
                    'can_edit' => $approval['can_edit'],
                    'can_approve' => $approval['can_approve'],
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
