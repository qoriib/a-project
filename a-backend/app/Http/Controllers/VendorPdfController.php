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
    public static function buildPdfData(VendorRequest $vendorRequest): array
    {
        $vendorRequest->loadMissing([
            'vendor.kategori',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'vendor.vendorSubcategories.category',
            'requester',
            'details',
            'approvalHistories.actor',
        ]);

        $vendor = $vendorRequest->vendor;

        if (!$vendor) {
            abort(404, 'Data vendor tidak ditemukan.');
        }

        $isUpdate = in_array(
            strtoupper($vendorRequest->request_type ?? ''),
            ['UPDATE', 'EXISTING', 'IMPORT_EXISTING'],
            true
        );

        $detail = $vendorRequest->relationLoaded('details')
            ? $vendorRequest->details->sortByDesc('id')->first()
            : $vendorRequest->details()->latest()->first();

        // Siapkan objek vendor efektif
        $effectiveVendor = clone $vendor;
        $effectiveBankAccounts = $vendor->bankAccounts ?? collect();
        $effectiveSubcategories = $vendor->vendorSubcategories ? $vendor->vendorSubcategories->pluck('subcategory') : collect();
        $effectiveTaxes = $vendor->withholdingTaxes ?? collect();

        if ($isUpdate && $detail && is_array($detail->new_data)) {
            $newData = $detail->new_data;
            $oldData = $detail->old_data ?? [];

            // 1. OVERRIDE FIELD DATA UMUM / TUNGGAL DENGAN DATA TERBARU
            $singleFields = [
                'nama_perusahaan', 'search_term', 'address', 'city', 'postal_code',
                'country', 'phone', 'mobile_phone', 'fax', 'pic_vendor', 'email',
                'npwp', 'business_type', 'payment_method', 'company_code_purch_org',
                'account_group_other', 'recon_account_other', 'payment_term_other',
                'order_currency', 'order_currency_other', 'kategori_other'
            ];

            foreach ($singleFields as $field) {
                if (array_key_exists($field, $newData) && $newData[$field] !== null) {
                    $effectiveVendor->{$field} = $newData[$field];
                }
            }

            if (!empty($newData['kategori_id']) && $newData['kategori_id'] != $vendor->kategori_id) {
                $cat = \App\Models\VendorCategory::find($newData['kategori_id']);
                if ($cat) {
                    $effectiveVendor->setRelation('kategori', $cat);
                    $effectiveVendor->kategori_id = $cat->id;
                }
            }

            if (!empty($newData['account_group_id'])) {
                $ag = \App\Models\AccountGroup::find($newData['account_group_id']);
                if ($ag) {
                    $effectiveVendor->setRelation('accountGroup', $ag);
                    $effectiveVendor->account_group_id = $ag->id;
                }
            }

            if (!empty($newData['recon_account_id'])) {
                $ra = \App\Models\ReconAccount::find($newData['recon_account_id']);
                if ($ra) {
                    $effectiveVendor->setRelation('reconAccount', $ra);
                    $effectiveVendor->recon_account_id = $ra->id;
                }
            }

            if (!empty($newData['payment_term_id'])) {
                $pt = \App\Models\PaymentTerm::find($newData['payment_term_id']);
                if ($pt) {
                    $effectiveVendor->setRelation('paymentTerm', $pt);
                    $effectiveVendor->payment_term_id = $pt->id;
                }
            }

            // 2. MULTI-VALUE FIELD 1: REKENING BANK
            // "misal di rekening bank ada data lama kemudian ada penambahan rekening baru, buatlah tampilkan yang baru saja"
            $newBanks = $newData['bank_accounts'] ?? [];
            $oldBanks = $oldData['bank_accounts'] ?? [];

            if (!empty($newBanks) && is_array($newBanks)) {
                $addedOrModifiedBanks = collect($newBanks)->filter(function ($nBank) use ($oldBanks) {
                    $isOldIdentical = collect($oldBanks)->contains(function ($oBank) use ($nBank) {
                        return trim(strtolower($oBank['bank_name'] ?? '')) === trim(strtolower($nBank['bank_name'] ?? ''))
                            && trim((string)($oBank['account_number'] ?? '')) === trim((string)($nBank['account_number'] ?? ''))
                            && trim(strtolower($oBank['account_name'] ?? '')) === trim(strtolower($nBank['account_name'] ?? ''))
                            && trim(strtolower($oBank['swift_code'] ?? '')) === trim(strtolower($nBank['swift_code'] ?? ''));
                    });
                    return !$isOldIdentical;
                })->values();

                if ($addedOrModifiedBanks->isNotEmpty()) {
                    $effectiveBankAccounts = $addedOrModifiedBanks;
                } else {
                    $effectiveBankAccounts = collect($newBanks);
                }
            }

            // 3. MULTI-VALUE FIELD 2: SUBKATEGORI VENDOR
            // "bukan hanya rekening bank, tetapi inputan yang bisa dipilih lebih dari 1"
            $newSubcatsRaw = $newData['vendor_subcategories'] ?? [];
            $oldSubcatsRaw = $oldData['vendor_subcategories'] ?? [];

            $newSubcats = collect($newSubcatsRaw)->map(function ($s) {
                return is_array($s) ? ($s['subcategory'] ?? '') : (string)$s;
            })->filter()->values();

            $oldSubcats = collect($oldSubcatsRaw)->map(function ($s) {
                return is_array($s) ? ($s['subcategory'] ?? '') : (string)$s;
            })->filter()->values();

            if ($newSubcats->isNotEmpty()) {
                $addedSubcats = $newSubcats->filter(function ($sub) use ($oldSubcats) {
                    return !$oldSubcats->contains($sub);
                })->values();

                if ($addedSubcats->isNotEmpty()) {
                    $effectiveSubcategories = $addedSubcats;
                } else {
                    $effectiveSubcategories = $newSubcats;
                }
            }

            // 4. MULTI-VALUE FIELD 3: WITHHOLDING TAX (PPh)
            // "bukan hanya rekening bank, tetapi inputan yang bisa dipilih lebih dari 1"
            $newTaxIds = collect($newData['withholding_tax_ids'] ?? [])->map(fn($id) => (int)$id)->filter()->values();
            $oldTaxIds = collect($oldData['withholding_tax_ids'] ?? [])->map(fn($id) => (int)$id)->filter()->values();

            if ($newTaxIds->isNotEmpty()) {
                $addedTaxIds = $newTaxIds->filter(function ($id) use ($oldTaxIds) {
                    return !$oldTaxIds->contains($id);
                })->values();

                if ($oldTaxIds->isNotEmpty() && $addedTaxIds->isNotEmpty()) {
                    $targetTaxIds = $addedTaxIds;
                } else {
                    $targetTaxIds = $newTaxIds;
                }

                $effectiveTaxes = \App\Models\WithholdingTax::whereIn('id', $targetTaxIds)->get();
            }
        }

        // Normalisasi bank accounts agar dapat diakses baik objek maupun array
        $normalizedBanks = collect($effectiveBankAccounts)->map(function ($b) use ($effectiveVendor) {
            if (is_array($b)) {
                return (object) [
                    'id' => $b['id'] ?? null,
                    'bank_name' => $b['bank_name'] ?? '',
                    'account_number' => $b['account_number'] ?? ($b['rekening'] ?? ''),
                    'account_name' => $b['account_name'] ?? ($b['benificiary'] ?? ''),
                    'currency' => $b['currency'] ?? ($effectiveVendor->order_currency ?? 'IDR'),
                    'swift_code' => $b['swift_code'] ?? '',
                ];
            }
            return $b;
        });

        $effectiveVendor->setRelation('bankAccounts', $normalizedBanks);
        $effectiveVendor->setRelation('withholdingTaxes', $effectiveTaxes);

        return [
            'vendorRequest' => $vendorRequest,
            'vendor' => $effectiveVendor,
            'bankAccounts' => $normalizedBanks,
            'subcategories' => $effectiveSubcategories,
            'selectedTaxes' => $effectiveTaxes,
        ];
    }

    public function show(Request $request, $id)
    {
        $vendorRequest = VendorRequest::findOrFail($id);
        $pdfData = self::buildPdfData($vendorRequest);

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

        $pdfData['approvals'] = $approvals;
        $pdfData['qrCodes'] = $qrCodes;
        $pdfData['logoDataUri'] = $logoDataUri;

        $pdf = Pdf::loadView('pdf.vendor-master', $pdfData);

        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream(
            'vendor-master-' . $vendorRequest->id . '.pdf'
        );
    }
}
