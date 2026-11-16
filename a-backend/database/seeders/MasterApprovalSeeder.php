<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterApproval;

class MasterApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $approvals = [
            // =========================================================
            // 1. IBS TEST USERS (@ibs.test)
            // =========================================================
            [
                'nik' => '90000000',
                'email' => 'admin@ibs.test',
                'approval_stage' => 'ADMIN',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            // SCM Approval Hierarchy
            [
                'nik' => '90000006',
                'email' => 'test.asisten@ibs.test',
                'approval_stage' => 'ASISTEN_KADIV',
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
            // BR Approval Hierarchy
            [
                'nik' => '90000016',
                'email' => 'test.asisten.br@ibs.test',
                'approval_stage' => 'ASISTEN_KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000011',
                'email' => 'test.kadiv.br@ibs.test',
                'approval_stage' => 'KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            // Finance, Tax, SAP
            [
                'nik' => '90000002',
                'email' => 'test.accounting@ibs.test',
                'approval_stage' => 'ACCOUNTING',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => '90000022',
                'email' => 'accounting2@ibs.test',
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
                'nik' => '90000023',
                'email' => 'tax2@ibs.test',
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
                'nik' => '90000024',
                'email' => 'sap2@ibs.test',
                'approval_stage' => 'SAP',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            // Requesters
            [
                'nik' => '90000007',
                'email' => 'test.requester@ibs.test',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
            ],
            [
                'nik' => '90000017',
                'email' => 'test.requester.br@ibs.test',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
            ],
            [
                'nik' => '20268888',
                'email' => 'procurement@ibs.test',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
            ],

            // =========================================================
            // 2. DEMO USERS (@example.com)
            // =========================================================
            [
                'nik' => 'ADM001',
                'email' => 'admin@example.com',
                'approval_stage' => 'ADMIN',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'AKD001',
                'email' => 'asisten.kadiv@example.com',
                'approval_stage' => 'ASISTEN_KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'KDV001',
                'email' => 'kadiv@example.com',
                'approval_stage' => 'KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'AKD002',
                'email' => 'asisten.br@example.com',
                'approval_stage' => 'ASISTEN_KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'KDV002',
                'email' => 'kadiv.br@example.com',
                'approval_stage' => 'KADIV',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'ACC001',
                'email' => 'accounting@example.com',
                'approval_stage' => 'ACCOUNTING',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'TAX001',
                'email' => 'tax@example.com',
                'approval_stage' => 'TAX',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'SAP001',
                'email' => 'sap@example.com',
                'approval_stage' => 'SAP',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
            ],
            [
                'nik' => 'REQ001',
                'email' => 'requester@example.com',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
            ],
            [
                'nik' => 'REQ002',
                'email' => 'requester.br@example.com',
                'approval_stage' => 'REQUESTER',
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => false,
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
