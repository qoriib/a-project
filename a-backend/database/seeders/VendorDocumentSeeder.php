<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use App\Models\Vendor;
use App\Models\VendorDocument;
use App\Models\VendorRequest;
use App\Models\User;

class VendorDocumentSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::with('bankAccounts')->orderBy('id')->get();
        $uploader = User::where('email', 'admin@ibs.test')->first() ?? User::first();

        $documentTypes = [
            'NPWP' => 'scan_npwp_perusahaan.pdf',
            'KTP' => 'scan_ktp_direktur.pdf',
            'NIB' => 'dokumen_nib_oss_rba.pdf',
            'SPPKP' => 'surat_pengukuhan_pkp.pdf',
            'AKTA_PENDIRIAN' => 'akta_pendirian_notaris.pdf',
            'AKTA_PERUBAHAN' => 'akta_perubahan_terakhir_kemenkumham.pdf',
            'FOTO_TEMPAT_USAHA' => 'foto_lokasi_kantor_dan_workshop.png',
            'SURAT_KETERANGAN_DOMISILI' => 'surat_keterangan_domisili_usaha.pdf',
        ];

        // Valid Minimal PDF Template
        $minimalPdf = "%PDF-1.4\n"
            . "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            . "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            . "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
            . "4 0 obj\n<< /Length 58 >>\nstream\nBT\n/F1 20 Tf\n80 700 Td\n(Dokumen Resmi VMS IBS - Terverifikasi) Tj\nET\nendstream\nendobj\n"
            . "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            . "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000353 00000 n \n"
            . "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n430\n%%EOF\n";

        // Valid Minimal PNG Image (1x1 pixel)
        $minimalPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        foreach ($vendors as $vendor) {
            foreach ($documentTypes as $type => $fileName) {
                $relPath = "vendor-documents/{$vendor->id}/{$type}/{$fileName}";

                // 1. Catat di database
                VendorDocument::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'document_type' => $type,
                    ],
                    [
                        'bank_account_id' => null,
                        'file_path' => $relPath,
                        'file_name' => $fileName,
                        'version' => 1,
                        'uploaded_by' => $uploader?->id,
                    ]
                );

                // 2. Tulis file fisik ke storage publik agar preview & download berhasil
                if (str_ends_with($fileName, '.pdf')) {
                    Storage::disk('public')->put($relPath, $minimalPdf);
                } else {
                    Storage::disk('public')->put($relPath, $minimalPng);
                }
            }

            // Rekening Koran untuk rekening utama vendor
            $primaryBank = $vendor->bankAccounts->where('is_primary', true)->first();
            if ($primaryBank) {
                $rekPath = "vendor-documents/{$vendor->id}/REKENING/rekening_koran_3_bulan_terakhir.pdf";
                $rekName = 'rekening_koran_3_bulan_terakhir.pdf';

                VendorDocument::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'bank_account_id' => $primaryBank->id,
                        'document_type' => 'REKENING',
                    ],
                    [
                        'file_path' => $rekPath,
                        'file_name' => $rekName,
                        'version' => 1,
                        'uploaded_by' => $uploader?->id,
                    ]
                );

                Storage::disk('public')->put($rekPath, $minimalPdf);
            }
        }

        // Tulis file fisik PDF registrasi untuk semua request yang berstatus COMPLETED atau FORM_APPROVED
        $completedRequests = VendorRequest::whereNotNull('final_pdf_path')->get();
        foreach ($completedRequests as $cr) {
            if ($cr->final_pdf_path) {
                Storage::disk('public')->put($cr->final_pdf_path, $minimalPdf);
            }
        }
    }
}
