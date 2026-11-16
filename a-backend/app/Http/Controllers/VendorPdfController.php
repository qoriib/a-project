<?php

namespace App\Http\Controllers;

use App\Models\VendorRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VendorPdfController extends Controller
{
    public function show(Request $request, $id)
    {
        $vendorRequest = VendorRequest::with([
            'vendor.kategori',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'requester',
            'details',
            'approvalHistories.actor',
        ])->findOrFail($id);

        $vendor = $vendorRequest->vendor;

        if (!$vendor) {
            abort(404, 'Data vendor tidak ditemukan.');
        }

        $stageOrder = [
            'REQUESTER' => 0,
            'ASISTEN_KADIV' => 1,
            'PROCUREMENT' => 1, // data legacy
            'KADIV' => 2,
            'ACCOUNTING' => 3,
            'TAX' => 4,
            'SAP' => 5,
        ];


        $approvals = $vendorRequest->approvalHistories
            ->sortBy(function ($approval) use ($stageOrder) {
                return $stageOrder[strtoupper($approval->approval_stage ?? '')] ?? 99;
            })
            ->values();

        $frontendUrl = rtrim(
            env('FRONTEND_URL', 'http://localhost:5173'),
            '/'
        );

        // Lokasi logo: a-backend/public/images/IBS.png
        $logoPath = public_path('images/IBS.png');

        $logoDataUri = null;

        if (is_file($logoPath)) {
            $logoDataUri = 'data:image/png;base64,' .
                base64_encode(file_get_contents($logoPath));
        } else {
            Log::warning('Logo IBS tidak ditemukan.', [
                'path' => $logoPath,
            ]);
        }

        $qrCodes = [];
        $writer = new PngWriter();

        foreach ($approvals as $approval) {
            if (empty($approval->signature_token)) {
                continue;
            }

            try {
                $verificationUrl = $frontendUrl
                    . '/verify-vendor/'
                    . rawurlencode($approval->signature_token);

                // Buat QR dalam resolusi tinggi.
                $qrCode = new QrCode(
                    data: $verificationUrl,
                    size: 300,
                    margin: 2
                );

                $qrResult = $writer->write($qrCode);
                $qrBinary = $qrResult->getString();

                // Tanpa GD, tetap gunakan QR asli.
                if (
                    extension_loaded('gd') &&
                    is_file($logoPath)
                ) {
                    $qrImage = imagecreatefromstring($qrBinary);
                    $logoImage = imagecreatefromstring(
                        file_get_contents($logoPath)
                    );


                    if ($qrImage !== false && $logoImage !== false) {
                        $qrWidth = imagesx($qrImage);
                        $qrHeight = imagesy($qrImage);



                        // Logo maksimal sekitar 16% dari lebar QR.
                        $logoSize = (int) round($qrWidth * 0.30);
                        $padding = max(4, (int) round($logoSize * 0.15));

                        // Kotak putih sebagai latar logo.
                        $boxSize = $logoSize + ($padding * 2);
                        $left = (int) round(($qrWidth - $boxSize) / 2);
                        $top = (int) round(($qrHeight - $boxSize) / 2);

                        $white = imagecolorallocate(
                            $qrImage,
                            255,
                            255,
                            255
                        );

                        imagefilledrectangle(
                            $qrImage,
                            $left,
                            $top,
                            $left + $boxSize - 1,
                            $top + $boxSize - 1,
                            $white
                        );

                        // Pertahankan rasio asli logo.
                        $originalWidth = imagesx($logoImage);
                        $originalHeight = imagesy($logoImage);

                        $scale = min(
                            $logoSize / $originalWidth,
                            $logoSize / $originalHeight
                        );

                        $newWidth = max(
                            1,
                            (int) round($originalWidth * $scale)
                        );

                        $newHeight = max(
                            1,
                            (int) round($originalHeight * $scale)
                        );

                        // Pusatkan logo secara matematis.
                        $logoX = (int) round(
                            ($qrWidth - $newWidth) / 2
                        );

                        $logoY = (int) round(
                            ($qrHeight - $newHeight) / 2
                        );

                        imagecopyresampled(
                            $qrImage,
                            $logoImage,
                            $logoX,
                            $logoY,
                            0,
                            0,
                            $newWidth,
                            $newHeight,
                            $originalWidth,
                            $originalHeight
                        );

                        // Simpan QR + logo menjadi satu gambar PNG.
                        ob_start();
                        imagepng($qrImage);
                        $qrBinary = ob_get_clean();

                        imagedestroy($qrImage);
                        imagedestroy($logoImage);
                    }
                }

                $qrCodes[$approval->id] =
                    'data:image/png;base64,' .
                    base64_encode($qrBinary);
            } catch (\Throwable $e) {
                Log::error('Gagal membuat QR approval vendor.', [
                    'approval_id' => $approval->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $pdf = Pdf::loadView('pdf.vendor-master', [
            'vendorRequest' => $vendorRequest,
            'vendor' => $vendor,
            'approvals' => $approvals,
            'qrCodes' => $qrCodes,
            'logoDataUri' => $logoDataUri,
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->stream(
            'vendor-master-' . $vendorRequest->id . '.pdf'
        );
    }
}
