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
        $requests = VendorRequest::with('vendor')->get();

        $actors = [
            'REQUESTER_SCM' => User::where('nik', '90000007')->first(),
            'REQUESTER_BR'  => User::where('nik', '90000017')->first(),
            'ASISTEN_SCM'   => User::where('nik', '90000006')->first(),
            'ASISTEN_BR'    => User::where('nik', '90000016')->first(),
            'KADIV_SCM'     => User::where('nik', '90000001')->first(),
            'KADIV_BR'      => User::where('nik', '90000011')->first(),
            'ACCOUNTING'    => User::where('nik', '90000002')->first(),
            'TAX'           => User::where('nik', '90000003')->first(),
            'SAP'           => User::where('nik', '90000004')->first(),
        ];

        foreach ($requests as $req) {
            $status = strtoupper($req->status ?? '');
            $catCode = $req->cat_code ?? 'VMS_001';
            $isBr = in_array($catCode, ['VMS_013', 'VMS_014', 'VMS_015']);

            if ($status === 'DRAFT') {
                continue;
            }

            $requesterActor = $isBr ? ($actors['REQUESTER_BR'] ?? $actors['REQUESTER_SCM']) : $actors['REQUESTER_SCM'];
            $asistenActor   = $isBr ? ($actors['ASISTEN_BR'] ?? $actors['ASISTEN_SCM']) : $actors['ASISTEN_SCM'];
            $kadivActor     = $isBr ? ($actors['KADIV_BR'] ?? $actors['KADIV_SCM']) : $actors['KADIV_SCM'];
            $accActor       = $actors['ACCOUNTING'];
            $taxActor       = $actors['TAX'];
            $sapActor       = $actors['SAP'];

            $submittedAt = $req->submitted_at ?? now()->subDays(10);

            // 1. Level 0: Requester Submitted
            VendorApprovalHistory::updateOrCreate(
                [
                    'vendor_request_id' => $req->id,
                    'approval_stage' => 'REQUESTER',
                    'status' => 'Submitted',
                ],
                [
                    'acted_by' => $requesterActor?->id,
                    'acted_by_name' => $requesterActor?->name ?? 'Staff Requester',
                    'acted_by_nik' => $requesterActor?->nik ?? $req->requested_by_nik,
                    'acted_by_email' => $requesterActor?->email ?? $req->requested_by_email,
                    'notes' => 'Pengajuan registrasi vendor baru dikirim untuk verifikasi kelengkapan berkas.',
                    'acted_at' => $submittedAt,
                    'signature_token' => bin2hex(random_bytes(32)),
                ]
            );

            // 2. KASUS KHUSUS REJECTED
            if ($status === 'REJECTED') {
                $rejectionReason = $req->rejection_reason ?? 'Pengajuan ditolak.';
                $vendorName = $req->vendor?->nama_perusahaan ?? '';

                if (str_contains($vendorName, 'Berkah Jaya Mandiri')) {
                    // Ditolak di Level 1 oleh Asisten Kadiv
                    VendorApprovalHistory::updateOrCreate(
                        [
                            'vendor_request_id' => $req->id,
                            'approval_stage' => 'ASISTEN_KADIV',
                            'status' => 'REJECTED',
                        ],
                        [
                            'acted_by' => $asistenActor?->id,
                            'acted_by_name' => $asistenActor?->name,
                            'acted_by_nik' => $asistenActor?->nik,
                            'acted_by_email' => $asistenActor?->email,
                            'notes' => $rejectionReason,
                            'acted_at' => $submittedAt->copy()->addHours(3),
                            'signature_token' => bin2hex(random_bytes(32)),
                        ]
                    );
                } elseif (str_contains($vendorName, 'Sinar Abadi Towerindo')) {
                    // Level 1 Approved, Ditolak di Level 2 oleh Kadiv
                    VendorApprovalHistory::updateOrCreate(
                        [
                            'vendor_request_id' => $req->id,
                            'approval_stage' => 'ASISTEN_KADIV',
                            'status' => 'Approved',
                        ],
                        [
                            'acted_by' => $asistenActor?->id,
                            'acted_by_name' => $asistenActor?->name,
                            'acted_by_nik' => $asistenActor?->nik,
                            'acted_by_email' => $asistenActor?->email,
                            'notes' => 'Dokumen perizinan dan NIB terverifikasi valid.',
                            'acted_at' => $submittedAt->copy()->addHours(2),
                            'signature_token' => bin2hex(random_bytes(32)),
                        ]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        [
                            'vendor_request_id' => $req->id,
                            'approval_stage' => 'KADIV',
                            'status' => 'REJECTED',
                        ],
                        [
                            'acted_by' => $kadivActor?->id,
                            'acted_by_name' => $kadivActor?->name,
                            'acted_by_nik' => $kadivActor?->nik,
                            'acted_by_email' => $kadivActor?->email,
                            'notes' => $rejectionReason,
                            'acted_at' => $submittedAt->copy()->addHours(5),
                            'signature_token' => bin2hex(random_bytes(32)),
                        ]
                    );
                } elseif (str_contains($vendorName, 'Finansial Makmur Abadi')) {
                    // Level 1 & 2 Approved, Ditolak di Level 3 oleh Accounting
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ASISTEN_KADIV', 'status' => 'Approved'],
                        ['acted_by' => $asistenActor?->id, 'acted_by_name' => $asistenActor?->name, 'acted_by_nik' => $asistenActor?->nik, 'acted_by_email' => $asistenActor?->email, 'notes' => 'Berkas lengkap.', 'acted_at' => $submittedAt->copy()->addHours(2), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'KADIV', 'status' => 'Approved'],
                        ['acted_by' => $kadivActor?->id, 'acted_by_name' => $kadivActor?->name, 'acted_by_nik' => $kadivActor?->nik, 'acted_by_email' => $kadivActor?->email, 'notes' => 'Disetujui Kadiv SCM.', 'acted_at' => $submittedAt->copy()->addHours(4), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ACCOUNTING', 'status' => 'REJECTED'],
                        ['acted_by' => $accActor?->id, 'acted_by_name' => $accActor?->name, 'acted_by_nik' => $accActor?->nik, 'acted_by_email' => $accActor?->email, 'notes' => $rejectionReason, 'acted_at' => $submittedAt->copy()->addHours(7), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                } elseif (str_contains($vendorName, 'Pajak Suspended Pratama')) {
                    // Level 1, 2, 3 Approved, Ditolak di Level 4 oleh Tax
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ASISTEN_KADIV', 'status' => 'Approved'],
                        ['acted_by' => $asistenActor?->id, 'acted_by_name' => $asistenActor?->name, 'acted_by_nik' => $asistenActor?->nik, 'acted_by_email' => $asistenActor?->email, 'notes' => 'Berkas terverifikasi.', 'acted_at' => $submittedAt->copy()->addHours(2), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'KADIV', 'status' => 'Approved'],
                        ['acted_by' => $kadivActor?->id, 'acted_by_name' => $kadivActor?->name, 'acted_by_nik' => $kadivActor?->nik, 'acted_by_email' => $kadivActor?->email, 'notes' => 'Disetujui.', 'acted_at' => $submittedAt->copy()->addHours(4), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ACCOUNTING', 'status' => 'Approved'],
                        ['acted_by' => $accActor?->id, 'acted_by_name' => $accActor?->name, 'acted_by_nik' => $accActor?->nik, 'acted_by_email' => $accActor?->email, 'notes' => 'Account Group Z020 & Recon Account 31000310 disetujui.', 'acted_at' => $submittedAt->copy()->addHours(6), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'TAX', 'status' => 'REJECTED'],
                        ['acted_by' => $taxActor?->id, 'acted_by_name' => $taxActor?->name, 'acted_by_nik' => $taxActor?->nik, 'acted_by_email' => $taxActor?->email, 'notes' => $rejectionReason, 'acted_at' => $submittedAt->copy()->addHours(8), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                } elseif (str_contains($vendorName, 'Duplikasi Sarana Cemerlang')) {
                    // Level 1-4 Approved, Ditolak di Level 5 oleh SAP
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ASISTEN_KADIV', 'status' => 'Approved'],
                        ['acted_by' => $asistenActor?->id, 'acted_by_name' => $asistenActor?->name, 'acted_by_nik' => $asistenActor?->nik, 'acted_by_email' => $asistenActor?->email, 'notes' => 'Berkas valid.', 'acted_at' => $submittedAt->copy()->addHours(2), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'KADIV', 'status' => 'Approved'],
                        ['acted_by' => $kadivActor?->id, 'acted_by_name' => $kadivActor?->name, 'acted_by_nik' => $kadivActor?->nik, 'acted_by_email' => $kadivActor?->email, 'notes' => 'Disetujui.', 'acted_at' => $submittedAt->copy()->addHours(4), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'ACCOUNTING', 'status' => 'Approved'],
                        ['acted_by' => $accActor?->id, 'acted_by_name' => $accActor?->name, 'acted_by_nik' => $accActor?->nik, 'acted_by_email' => $accActor?->email, 'notes' => 'Accounting data confirmed.', 'acted_at' => $submittedAt->copy()->addHours(6), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'TAX', 'status' => 'Approved'],
                        ['acted_by' => $taxActor?->id, 'acted_by_name' => $taxActor?->name, 'acted_by_nik' => $taxActor?->nik, 'acted_by_email' => $taxActor?->email, 'notes' => 'Tax data confirmed.', 'acted_at' => $submittedAt->copy()->addHours(8), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                    VendorApprovalHistory::updateOrCreate(
                        ['vendor_request_id' => $req->id, 'approval_stage' => 'SAP', 'status' => 'REJECTED'],
                        ['acted_by' => $sapActor?->id, 'acted_by_name' => $sapActor?->name, 'acted_by_nik' => $sapActor?->nik, 'acted_by_email' => $sapActor?->email, 'notes' => $rejectionReason, 'acted_at' => $submittedAt->copy()->addHours(10), 'signature_token' => bin2hex(random_bytes(32))]
                    );
                }
                continue;
            }

            // 3. KASUS KHUSUS ROLLBACK / CANCEL APPROVE
            $vendorName = $req->vendor?->nama_perusahaan ?? '';
            if (str_contains($vendorName, 'Revisi Berkas Cepat')) {
                // Pernah disetujui Level 1, lalu di Level 2 Kadiv melakukan Cancel Approve
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'ASISTEN_KADIV', 'status' => 'Approved'],
                    ['acted_by' => $asistenActor?->id, 'acted_by_name' => $asistenActor?->name, 'acted_by_nik' => $asistenActor?->nik, 'acted_by_email' => $asistenActor?->email, 'notes' => 'Dokumen legalitas telah diverifikasi awal.', 'acted_at' => $submittedAt->copy()->addHours(2), 'signature_token' => bin2hex(random_bytes(32))]
                );
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'KADIV', 'status' => 'Cancel Approve'],
                    ['acted_by' => $kadivActor?->id, 'acted_by_name' => $kadivActor?->name, 'acted_by_nik' => $kadivActor?->nik, 'acted_by_email' => $kadivActor?->email, 'notes' => 'Dibatalkan oleh Kadiv SCM karena resolusi foto workshop dan dokumen KTP Direktur buram. Dikembalikan ke Level 1 untuk verifikasi ulang.', 'acted_at' => $submittedAt->copy()->addHours(5), 'signature_token' => bin2hex(random_bytes(32))]
                );
                continue;
            }

            if (str_contains($vendorName, 'Koreksi Akun Mandiri')) {
                // Pernah disetujui L1, L2, L3, lalu di L4 Tax melakukan Cancel Approve
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'ASISTEN_KADIV', 'status' => 'Approved'],
                    ['acted_by' => $asistenActor?->id, 'acted_by_name' => $asistenActor?->name, 'acted_by_nik' => $asistenActor?->nik, 'acted_by_email' => $asistenActor?->email, 'notes' => 'Dokumen lengkap.', 'acted_at' => $submittedAt->copy()->addHours(2), 'signature_token' => bin2hex(random_bytes(32))]
                );
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'KADIV', 'status' => 'Approved'],
                    ['acted_by' => $kadivActor?->id, 'acted_by_name' => $kadivActor?->name, 'acted_by_nik' => $kadivActor?->nik, 'acted_by_email' => $kadivActor?->email, 'notes' => 'Disetujui Kadiv SCM.', 'acted_at' => $submittedAt->copy()->addHours(4), 'signature_token' => bin2hex(random_bytes(32))]
                );
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'ACCOUNTING', 'status' => 'Approved'],
                    ['acted_by' => $accActor?->id, 'acted_by_name' => $accActor?->name, 'acted_by_nik' => $accActor?->nik, 'acted_by_email' => $accActor?->email, 'notes' => 'Account Group Z020 dialokasikan.', 'acted_at' => $submittedAt->copy()->addHours(6), 'signature_token' => bin2hex(random_bytes(32))]
                );
                VendorApprovalHistory::updateOrCreate(
                    ['vendor_request_id' => $req->id, 'approval_stage' => 'TAX', 'status' => 'Cancel Approve'],
                    ['acted_by' => $taxActor?->id, 'acted_by_name' => $taxActor?->name, 'acted_by_nik' => $taxActor?->nik, 'acted_by_email' => $taxActor?->email, 'notes' => 'Dibatalkan oleh Tax karena pemilihan Recon Account Trade vs Non-Trade perlu dikoreksi Accounting agar sinkron dengan Withholding Tax W3. Dikembalikan ke Level 3.', 'acted_at' => $submittedAt->copy()->addHours(8), 'signature_token' => bin2hex(random_bytes(32))]
                );
                continue;
            }

            // 4. ALUR NORMAL (BERTAHAP / COMPLETED)
            $stagesToRecord = [];

            if (in_array($status, ['COMPLETED', 'FORM_APPROVED'])) {
                $stagesToRecord = ['ASISTEN_KADIV', 'KADIV', 'ACCOUNTING', 'TAX', 'SAP_STEP1'];
                if ($status === 'COMPLETED') {
                    $stagesToRecord[] = 'SAP_STEP2';
                }
            } elseif ($status === 'PENDING_L5') {
                $stagesToRecord = ['ASISTEN_KADIV', 'KADIV', 'ACCOUNTING', 'TAX'];
            } elseif ($status === 'PENDING_L4') {
                $stagesToRecord = ['ASISTEN_KADIV', 'KADIV', 'ACCOUNTING'];
            } elseif ($status === 'PENDING_L3') {
                $stagesToRecord = ['ASISTEN_KADIV', 'KADIV'];
            } elseif ($status === 'PENDING_L2') {
                $stagesToRecord = ['ASISTEN_KADIV'];
            }

            $stepConfig = [
                'ASISTEN_KADIV' => [
                    'actor' => $asistenActor,
                    'stage' => 'ASISTEN_KADIV',
                    'status' => 'Approved',
                    'notes' => 'Kelengkapan dokumen legalitas (NPWP, KTP, NIB, Rekening Koran) telah diverifikasi dan valid.',
                    'hours' => 2,
                ],
                'KADIV' => [
                    'actor' => $kadivActor,
                    'stage' => 'KADIV',
                    'status' => 'Approved',
                    'notes' => 'Disetujui oleh Kepala Divisi untuk dilanjutkan ke proses input Account Group dan Pajak.',
                    'hours' => 4,
                ],
                'ACCOUNTING' => [
                    'actor' => $accActor,
                    'stage' => 'ACCOUNTING',
                    'status' => 'Approved',
                    'notes' => 'Data Account Group (Z020) dan Reconciliation Account (31000310) telah diinput dan disetujui.',
                    'hours' => 6,
                ],
                'TAX' => [
                    'actor' => $taxActor,
                    'stage' => 'TAX',
                    'status' => 'Approved',
                    'notes' => 'Withholding Tax (PPh 23 / PPh 4(2)) telah ditentukan dan disetujui oleh Tim Perpajakan.',
                    'hours' => 8,
                ],
                'SAP_STEP1' => [
                    'actor' => $sapActor,
                    'stage' => 'SAP',
                    'status' => 'Approved',
                    'notes' => 'Review formulir registrasi lengkap disetujui oleh SAP Team. Form Full Approved PDF telah dibuat.',
                    'hours' => 10,
                ],
                'SAP_STEP2' => [
                    'actor' => $sapActor,
                    'stage' => 'SAP',
                    'status' => 'Approved',
                    'notes' => 'Kode Vendor SAP [' . ($req->sap_vendor_code ?? '1000201') . '] berhasil di-submit dan diterbitkan. Registrasi selesai (COMPLETED).',
                    'hours' => 12,
                ],
            ];

            foreach ($stagesToRecord as $stgKey) {
                $cfg = $stepConfig[$stgKey] ?? null;
                if (!$cfg) continue;

                $actor = $cfg['actor'];
                $time = $submittedAt->copy()->addHours($cfg['hours']);

                VendorApprovalHistory::updateOrCreate(
                    [
                        'vendor_request_id' => $req->id,
                        'approval_stage' => $cfg['stage'],
                        'status' => $cfg['status'],
                        'notes' => $cfg['notes'],
                    ],
                    [
                        'acted_by' => $actor?->id,
                        'acted_by_name' => $actor?->name ?? 'Approver ' . $cfg['stage'],
                        'acted_by_nik' => $actor?->nik ?? '00000000',
                        'acted_by_email' => $actor?->email ?? 'approver@ibs.test',
                        'acted_at' => $time,
                        'signature_token' => bin2hex(random_bytes(32)),
                    ]
                );
            }
        }
    }
}
