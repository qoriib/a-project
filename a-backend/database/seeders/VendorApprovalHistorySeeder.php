<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendorRequest;
use App\Models\VendorApprovalHistory;
use App\Models\User;

class VendorApprovalHistorySeeder extends Seeder
{
    public function run(): void
    {
        $approvedRequest = VendorRequest::where('status', 'APPROVED')->first();

        if (!$approvedRequest) {
            return;
        }

        $stages = [
            [
                'stage' => 'REQUESTER',
                'email' => 'test.requester@ibs.test',
                'nik' => '90000007',
                'status' => 'SUBMITTED',
                'notes' => 'Pengajuan pendaftaran vendor baru',
                'days_ago' => 5,
            ],
            [
                'stage' => 'ASISTEN_KADIV',
                'email' => 'test.asisten@ibs.test',
                'nik' => '90000006',
                'status' => 'APPROVED',
                'notes' => 'Kelengkapan dokumen telah diverifikasi',
                'days_ago' => 4,
            ],
            [
                'stage' => 'KADIV',
                'email' => 'test.kadiv@ibs.test',
                'nik' => '90000001',
                'status' => 'APPROVED',
                'notes' => 'Disetujui untuk proses akuntansi dan pajak',
                'days_ago' => 3,
            ],
            [
                'stage' => 'ACCOUNTING',
                'email' => 'test.accounting@ibs.test',
                'nik' => '90000002',
                'status' => 'APPROVED',
                'notes' => 'Data rekonsiliasi dan termin pembayaran sesuai',
                'days_ago' => 2,
            ],
            [
                'stage' => 'TAX',
                'email' => 'test.tax@ibs.test',
                'nik' => '90000003',
                'status' => 'APPROVED',
                'notes' => 'Validasi NPWP dan withholding tax selesai',
                'days_ago' => 2,
            ],
            [
                'stage' => 'SAP',
                'email' => 'test.sap@ibs.test',
                'nik' => '90000004',
                'status' => 'APPROVED',
                'notes' => 'Vendor code SAP berhasil di-generate',
                'days_ago' => 1,
            ],
        ];

        foreach ($stages as $item) {
            $user = User::where('nik', $item['nik'])->first();

            VendorApprovalHistory::updateOrCreate(
                [
                    'vendor_request_id' => $approvedRequest->id,
                    'approval_stage' => $item['stage'],
                ],
                [
                    'acted_by' => $user?->id,
                    'acted_by_nik' => $item['nik'],
                    'acted_by_email' => $item['email'],
                    'status' => $item['status'],
                    'notes' => $item['notes'],
                    'acted_at' => now()->subDays($item['days_ago']),
                    'signature_token' => bin2hex(random_bytes(32)),
                ]
            );
        }
    }
}
