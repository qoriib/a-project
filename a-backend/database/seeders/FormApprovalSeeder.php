<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendorRequest;
use App\Models\FormApproval;

class FormApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $requests = VendorRequest::with('vendor')->get();

        $scmChain = [
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

        $brChain = [
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

        $stageToPriority = [
            'ASISTEN_KADIV' => 1,
            'PENDING_L1' => 1,
            'KADIV' => 2,
            'PENDING_L2' => 2,
            'ACCOUNTING' => 3,
            'PENDING_L3' => 3,
            'TAX' => 4,
            'PENDING_L4' => 4,
            'SAP' => 5,
            'PENDING_L5' => 5,
            'FORM_APPROVED' => 5,
        ];

        foreach ($requests as $req) {
            $reqStatus = strtoupper($req->status ?? '');
            $reqStage = strtoupper($req->current_stage ?? '');
            $catCode = $req->cat_code ?? 'VMS_001';
            $isBr = in_array($catCode, ['VMS_013', 'VMS_014', 'VMS_015']);

            if ($reqStatus === 'DRAFT') {
                continue;
            }

            $chain = $isBr ? $brChain : $scmChain;
            $vendorName = $req->vendor?->nama_perusahaan ?? '';

            // Tentukan prioritas penolakan jika REJECTED
            $rejectAtPriority = null;
            if ($reqStatus === 'REJECTED') {
                if (str_contains($vendorName, 'Berkah Jaya Mandiri')) {
                    $rejectAtPriority = 1;
                } elseif (str_contains($vendorName, 'Sinar Abadi Towerindo') || str_contains($vendorName, 'Mitra Perizinan Nusantara') || (str_contains($vendorName, 'Borneo Sarana Komunika') && $req->request_type === 'UPDATE')) {
                    $rejectAtPriority = 2;
                } elseif (str_contains($vendorName, 'Finansial Makmur Abadi') || str_contains($vendorName, 'Prima Daya Cemerlang')) {
                    $rejectAtPriority = 3;
                } elseif (str_contains($vendorName, 'Pajak Suspended Pratama')) {
                    $rejectAtPriority = 4;
                } elseif (str_contains($vendorName, 'Duplikasi Sarana Cemerlang')) {
                    $rejectAtPriority = 5;
                } else {
                    $rejectAtPriority = 1;
                }
            }

            $currentPriority = $stageToPriority[$reqStatus] ?? $stageToPriority[$reqStage] ?? 1;

            foreach ($chain as $item) {
                $priority = $item['priority'];
                $status = 'WAITING';

                if ($reqStatus === 'REJECTED') {
                    if ($priority < $rejectAtPriority) {
                        $status = 'APPROVED';
                    } elseif ($priority === $rejectAtPriority) {
                        $status = 'REJECTED';
                    } else {
                        $status = 'WAITING';
                    }
                } elseif ($reqStatus === 'COMPLETED') {
                    $status = 'APPROVED';
                } elseif ($reqStatus === 'FORM_APPROVED') {
                    $status = ($priority === 5) ? 'IN_PROGRESS' : 'APPROVED';
                } else {
                    if ($priority < $currentPriority) {
                        $status = 'APPROVED';
                    } elseif ($priority === $currentPriority) {
                        $status = 'IN_PROGRESS';
                    } else {
                        $status = 'WAITING';
                    }
                }

                FormApproval::updateOrCreate(
                    [
                        'vendor_request_id' => $req->id,
                        'priority' => $priority,
                    ],
                    [
                        'stage' => $item['stage'],
                        'nik' => $item['nik'],
                        'email' => $item['email'],
                        'status' => $status,
                    ]
                );
            }
        }
    }
}
