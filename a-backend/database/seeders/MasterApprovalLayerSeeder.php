<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterApprovalLayer;

class MasterApprovalLayerSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Kategori SCM (VMS_001 - VMS_012)
        $scmCategories = [
            'VMS_001', 'VMS_002', 'VMS_003', 'VMS_004', 'VMS_005',
            'VMS_006', 'VMS_007', 'VMS_008', 'VMS_009', 'VMS_010',
            'VMS_011', 'VMS_012',
        ];

        // 2. Kategori BR (Business Representative / Land Acquisition) (VMS_013 - VMS_015)
        $brCategories = [
            'VMS_013', 'VMS_014', 'VMS_015',
        ];

        // Alur SCM: Asisten Kadiv SCM -> Kadiv SCM -> Accounting -> Tax -> SAP
        $scmApprovers = [
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

        // Alur BR: Asisten Kadiv BR -> Kadiv BR -> Accounting -> Tax -> SAP
        $brApprovers = [
            [
                'priority' => 1,
                'stage' => 'ASISTEN_KADIV',
                'nik' => '90000016',
                'email' => 'test.asisten.br@ibs.test',
            ],
            [
                'priority' => 2,
                'stage' => 'KADIV',
                'nik' => '90000011',
                'email' => 'test.kadiv.br@ibs.test',
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

        // Seed alur SCM
        foreach ($scmCategories as $catCode) {
            foreach ($scmApprovers as $approver) {
                MasterApprovalLayer::updateOrCreate(
                    [
                        'cat_code' => $catCode,
                        'type' => 'Approval',
                        'priority' => $approver['priority'],
                    ],
                    [
                        'stage' => $approver['stage'],
                        'nik' => $approver['nik'],
                        'email' => $approver['email'],
                        'start_date' => '2026-01-01',
                        'end_date' => null,
                    ]
                );
            }
        }

        // Seed alur BR
        foreach ($brCategories as $catCode) {
            foreach ($brApprovers as $approver) {
                MasterApprovalLayer::updateOrCreate(
                    [
                        'cat_code' => $catCode,
                        'type' => 'Approval',
                        'priority' => $approver['priority'],
                    ],
                    [
                        'stage' => $approver['stage'],
                        'nik' => $approver['nik'],
                        'email' => $approver['email'],
                        'start_date' => '2026-01-01',
                        'end_date' => null,
                    ]
                );
            }
        }
    }
}
