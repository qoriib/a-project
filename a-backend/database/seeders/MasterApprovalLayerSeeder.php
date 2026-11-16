<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterApprovalLayer;

class MasterApprovalLayerSeeder extends Seeder
{
    public function run(): void
    {
        // Seluruh kategori SCM
        $categories = [
            'VMS_001',
            'VMS_002',
            'VMS_003',
            'VMS_004',
            'VMS_005',
            'VMS_006',
            'VMS_007',
            'VMS_008',
        ];

        // Daftar approver dan urutan approval
        $approvers = [
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

        foreach ($categories as $catCode) {
            foreach ($approvers as $approver) {
                MasterApprovalLayer::firstOrCreate(
                    [
                        'cat_code' => $catCode,
                        'type' => 'Approval',
                        'priority' => $approver['priority'],
                        'stage' => $approver['stage'],
                        'start_date' => '2026-11-10',
                    ],
                    [
                        'nik' => $approver['nik'],
                        'email' => $approver['email'],
                        'end_date' => null,
                    ]
                );
            }
        }
    }
}
