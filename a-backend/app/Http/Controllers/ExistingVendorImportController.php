<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;
use Throwable;

class ExistingVendorImportController extends Controller
{
    /**
     * Import data Existing Vendor dari Excel.
     *
     * Sheet wajib:
     * - Vendors
     * - BankAccounts
     * - WithholdingTaxes
     */
    public function import(Request $request)
    {
        $user = $request->user() ?: \Illuminate\Support\Facades\Auth::user();
        if (!$user && auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
        }
        $isAdmin = (bool) ($user?->is_admin ?? false) || strtoupper($user?->role?->name ?? $user?->role ?? '') === 'ADMIN';
        if (!$isAdmin) {
            return response()->json([
                'message' => 'Hanya Administrator yang memiliki hak akses untuk mengimpor data Existing Vendor via Excel.',
            ], 403);
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240',
            ],
        ]);

        try {
            $spreadsheet = IOFactory::load(
                $request->file('file')->getRealPath()
            );

            $requiredSheets = [
                'Vendors',
                'BankAccounts',
                'WithholdingTaxes',
            ];

            foreach ($requiredSheets as $sheetName) {
                if (!$spreadsheet->sheetNameExists($sheetName)) {
                    throw ValidationException::withMessages([
                        'file' => [
                            "Sheet {$sheetName} tidak ditemukan dalam Excel.",
                        ],
                    ]);
                }
            }

            $vendors = $this->readSheet(
                $spreadsheet->getSheetByName('Vendors')
            );

            $bankAccounts = $this->readSheet(
                $spreadsheet->getSheetByName('BankAccounts')
            );

            $withholdingTaxes = $this->readSheet(
                $spreadsheet->getSheetByName('WithholdingTaxes')
            );

            if (empty($vendors)) {
                throw ValidationException::withMessages([
                    'file' => ['Sheet Vendors tidak memiliki data.'],
                ]);
            }

            $errors = [];
            $vendorMap = [];
            $skippedVendorCodes = [];
            $seenCodes = [];

            /*
             * 1. Validasi dan kelompokkan vendor.
             */
            foreach ($vendors as $index => $row) {
                $rowNumber = $index + 2;

                $code = trim(
                    (string) ($row['vendor_code'] ?? '')
                );

                $name = trim(
                    (string) ($row['nama_perusahaan'] ?? '')
                );

                if ($code === '') {
                    $errors[] =
                        "Vendors baris {$rowNumber}: vendor_code wajib diisi.";
                    continue;
                }

                if (isset($seenCodes[$code])) {
                    $errors[] =
                        "Vendors baris {$rowNumber}: vendor_code {$code} duplikat dalam Excel.";
                    continue;
                }

                $seenCodes[$code] = true;

                // Vendor yang sudah terdaftar tidak diimpor ulang.
                $exists = DB::table('vendors')
                    ->where('vendor_code', $code)
                    ->exists();

                if ($exists) {
                    $skippedVendorCodes[$code] = true;
                    continue;
                }

                if ($name === '') {
                    $errors[] =
                        "Vendors baris {$rowNumber}: nama_perusahaan wajib diisi.";
                    continue;
                }

                $vendorMap[$code] = [
                    'row' => $row,
                    'row_number' => $rowNumber,
                ];
            }

            /*
             * 2. Validasi kategori dan master data vendor.
             */
            foreach ($vendorMap as $code => $vendorData) {
                $row = $vendorData['row'];
                $rowNumber = $vendorData['row_number'];

                $categoryVal = trim(
                    (string) ($row['kategori_code'] ?? $row['kategori_id'] ?? '')
                );

                if ($categoryVal === '') {
                    $errors[] =
                        "Vendors baris {$rowNumber}: kategori_code atau kategori_id wajib diisi.";
                } else {
                    $catExists = DB::table('vendor_categories')
                        ->whereRaw('LOWER(TRIM(cat_code)) = ?', [mb_strtolower($categoryVal)])
                        ->orWhere('id', $categoryVal)
                        ->exists();

                    if (!$catExists) {
                        $errors[] =
                            "Vendors baris {$rowNumber}: kategori '{$categoryVal}' tidak ditemukan di master vendor_categories.";
                    }
                }

                $this->validateMaster(
                    $row,
                    'account_group',
                    'account_groups',
                    'code',
                    'Vendors',
                    $rowNumber,
                    $errors
                );

                $this->validateMaster(
                    $row,
                    'recon_account',
                    'recon_accounts',
                    'code',
                    'Vendors',
                    $rowNumber,
                    $errors
                );

                $this->validateMaster(
                    $row,
                    'payment_term',
                    'payment_terms',
                    'code',
                    'Vendors',
                    $rowNumber,
                    $errors
                );
            }


            /*
             * 3. Kelompokkan rekening berdasarkan vendor_code.
             * Tidak ada rekening utama; semua rekening diperlakukan sama.
             */
            $banksByVendor = [];

            foreach ($bankAccounts as $index => $row) {
                $rowNumber = $index + 2;

                if ($this->isEmptyRow($row)) {
                    continue;
                }

                $code = trim(
                    (string) ($row['vendor_code'] ?? '')
                );

                // Rekening vendor yang sudah terdaftar ikut dilewati.
                if (
                    $code !== ''
                    && isset($skippedVendorCodes[$code])
                ) {
                    continue;
                }

                if ($code === '' || !isset($vendorMap[$code])) {
                    $errors[] =
                        "BankAccounts baris {$rowNumber}: vendor_code kosong atau tidak ada di sheet Vendors.";
                    continue;
                }

                $bankName = trim(
                    (string) ($row['bank_name'] ?? '')
                );

                $accountNumber = trim(
                    (string) ($row['account_number'] ?? '')
                );

                $accountName = trim(
                    (string) ($row['beneficiary'] ?? '')
                );

                if (
                    $bankName === ''
                    || $accountNumber === ''
                    || $accountName === ''
                ) {
                    $errors[] =
                        "BankAccounts baris {$rowNumber}: bank_name, account_number, dan beneficiary wajib diisi.";
                    continue;
                }

                $banksByVendor[$code][] = [
                    'bank_name' => $bankName,
                    'account_number' => $accountNumber,
                    'account_name' => $accountName,
                ];
            }


            /*
             * 4. Kelompokkan withholding tax berdasarkan vendor_code.
             *
             * Excel berisi kode L1/L2/L3/L4.
             * Database menyimpan nama lengkap, misalnya:
             * L1 PPH4(2) - Inv.Deduction
             */
            $taxesByVendor = [];

            foreach ($withholdingTaxes as $index => $row) {
                $rowNumber = $index + 2;

                if ($this->isEmptyRow($row)) {
                    continue;
                }

                $code = trim(
                    (string) ($row['vendor_code'] ?? '')
                );

                $taxInput = trim(
                    (string) ($row['withholding_tax'] ?? $row['wht_code'] ?? $row['wht'] ?? $row['code'] ?? '')
                );

                // Tax milik vendor yang sudah ada ikut dilewati.
                if (
                    $code !== ''
                    && isset($skippedVendorCodes[$code])
                ) {
                    continue;
                }

                if ($code === '' || !isset($vendorMap[$code])) {
                    $errors[] =
                        "WithholdingTaxes baris {$rowNumber}: vendor_code kosong atau tidak ada di sheet Vendors.";
                    continue;
                }

                if ($taxInput === '') {
                    continue;
                }

                // Cari berdasarkan ID atau nama lengkap yang diawali kode tax (W1, W2, dll)
                $matches = DB::table('withholding_taxes')
                    ->where('id', $taxInput)
                    ->orWhereRaw('UPPER(TRIM(name)) LIKE ?', [strtoupper($taxInput) . ' %'])
                    ->orWhereRaw('UPPER(TRIM(name)) LIKE ?', [strtoupper($taxInput) . '-%'])
                    ->orWhereRaw('UPPER(TRIM(name)) LIKE ?', ['%' . strtoupper($taxInput) . '%'])
                    ->get();

                if ($matches->isEmpty()) {
                    $errors[] =
                        "WithholdingTaxes baris {$rowNumber}: master withholding tax '{$taxInput}' tidak ditemukan.";
                    continue;
                }

                $tax = $matches->first();

                // Gunakan ID master untuk tabel pivot.
                // Array ini juga mencegah ID tax yang sama tercatat dua kali.
                $taxesByVendor[$code][$tax->id] = true;
            }

            /*
             * 5. Jika ada kesalahan validasi, hentikan sebelum menyimpan.
             */
            if (!empty($errors)) {
                throw ValidationException::withMessages([
                    'file' => $errors,
                ]);
            }

            /*
             * 6. Simpan vendor, rekening, dan withholding tax.
             */
            $imported = DB::transaction(function () use (
                $vendorMap,
                $banksByVendor,
                $taxesByVendor,
                $request
            ) {
                $count = 0;

                foreach ($vendorMap as $code => $vendorData) {
                    $row = $vendorData['row'];

                    $categoryVal = trim(
                        (string) ($row['kategori_code'] ?? $row['kategori_id'] ?? '')
                    );

                    $category = DB::table('vendor_categories')
                        ->whereRaw('LOWER(TRIM(cat_code)) = ?', [mb_strtolower($categoryVal)])
                        ->orWhere('id', $categoryVal)
                        ->first();

                    $accountGroup = $this->findMaster(
                        'account_groups',
                        'code',
                        $row['account_group'] ?? null
                    );

                    $reconAccount = $this->findMaster(
                        'recon_accounts',
                        'code',
                        $row['recon_account'] ?? null
                    );

                    $paymentTerm = $this->findMaster(
                        'payment_terms',
                        'code',
                        $row['payment_term'] ?? null
                    );

                    $now = now();

                    $vendorId = DB::table('vendors')->insertGetId([
                        'vendor_code' => $code,
                        'source_type' => 'EXISTING',
                        'nama_perusahaan' => trim(
                            (string) $row['nama_perusahaan']
                        ),

                        'search_term' => $this->value($row, 'search_term'),
                        'address' => $this->value($row, 'address'),
                        'city' => $this->value($row, 'city'),
                        'postal_code' => $this->value($row, 'postal_code'),
                        'country' => $this->value($row, 'country')
                            ?? 'Indonesia',

                        'phone' => $this->value($row, 'phone'),
                        'mobile_phone' => $this->value($row, 'mobile_phone'),
                        'fax' => $this->value($row, 'fax'),
                        'pic_vendor' => $this->value($row, 'pic_vendor'),
                        'email' => $this->value($row, 'email'),
                        'npwp' => $this->value($row, 'npwp'),
                        'business_type' => $this->value($row, 'business_type'),

                        'kategori_id' => $category->id ?? null,
                        'kategori_other' => $this->value(
                            $row,
                            'kategori_other'
                        ),

                        'account_group_id' => $accountGroup->id ?? null,
                        'account_group_other' => $this->value(
                            $row,
                            'account_group_other'
                        ),

                        'recon_account_id' => $reconAccount->id ?? null,
                        'recon_account_other' => $this->value(
                            $row,
                            'recon_account_other'
                        ),

                        'payment_method' => $this->value(
                            $row,
                            'payment_method'
                        ) ?? 'Transfer',

                        'company_code_purch_org' => $this->value(
                            $row,
                            'company_code_purch_org'
                        ) ?? '1200 / 1300 (PROJECT BAKTI)',

                        'payment_term_id' => $paymentTerm->id ?? null,
                        'payment_term_other' => $this->value(
                            $row,
                            'payment_term_other'
                        ),

                        'order_currency' => $this->value(
                            $row,
                            'order_currency'
                        ),

                        'order_currency_other' => $this->value(
                            $row,
                            'order_currency_other'
                        ),

                        'created_by' => $request->user()?->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);


                    /*
                     * Simpan semua rekening vendor.
                     * Tidak menggunakan is_primary.
                     */
                    $bankRows = $banksByVendor[$code] ?? [];

                    foreach ($bankRows as $bank) {
                        DB::table('vendor_bank_accounts')->insert([
                            'vendor_id' => $vendorId,
                            'bank_name' => $bank['bank_name'],
                            'account_number' => $bank['account_number'],
                            'account_name' => $bank['account_name'],
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }

                    /*
                     * Simpan banyak withholding tax ke tabel pivot.
                     */
                    foreach (
                        array_keys($taxesByVendor[$code] ?? [])
                        as $taxId
                    ) {
                        DB::table('vendor_withholding_taxes')->insert([
                            'vendor_id' => $vendorId,
                            'withholding_tax_id' => $taxId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }

                    // Existing vendor yang diimpor via Excel langsung berstatus COMPLETED tanpa perlu approval
                    $formNumber = $this->createRequestNumber('UPDATE');
                    DB::table('vendor_requests')->insert([
                        'vendor_id' => $vendorId,
                        'request_type' => 'IMPORT_EXISTING',
                        'form_number' => $formNumber,
                        'internal_vendor_code' => $code,
                        'sap_vendor_code' => $code,
                        'requested_by_nik' => $request->user()?->nik ?? '90000000',
                        'requested_by_email' => $request->user()?->email,
                        'status' => 'COMPLETED',
                        'current_stage' => 'COMPLETED',
                        'submitted_at' => $now,
                        'completed_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);

                    $count++;
                }

                return $count;
            });

            $skipped = count($skippedVendorCodes);

            $message = $imported > 0
                ? 'Import Existing Vendor berhasil.'
                : (
                    $skipped > 0
                    ? 'Tidak ada vendor baru. Semua vendor dalam file sudah terdaftar.'
                    : 'Import selesai.'
                );

            return response()->json([
                'message' => $message,
                'imported' => $imported,
                'skipped' => $skipped,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Import gagal. Tidak ada data yang disimpan.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan saat membaca atau menyimpan file.',
            ], 500);
        }
    }

    /**
     * Import dokumen vendor dari ZIP.
     *
     * Format ZIP:
     * vendor_code/NPWP.pdf
     * vendor_code/REKENING.pdf
     * vendor_code/NIB.pdf
     */
    public function importDocuments(Request $request)
    {
        $user = $request->user() ?: \Illuminate\Support\Facades\Auth::user();
        if (!$user && auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
        }
        $isAdmin = (bool) ($user?->is_admin ?? false) || strtoupper($user?->role?->name ?? $user?->role ?? '') === 'ADMIN';
        if (!$isAdmin) {
            return response()->json([
                'message' => 'Hanya Administrator yang memiliki hak akses untuk mengimpor dokumen Existing Vendor.',
            ], 403);
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:zip',
                'max:51200',
            ],
        ]);

        $zip = new ZipArchive();

        $opened = $zip->open(
            $request->file('file')->getRealPath()
        );

        if ($opened !== true) {
            throw ValidationException::withMessages([
                'file' => ['File ZIP tidak dapat dibuka.'],
            ]);
        }

        $disk = Storage::disk('public');
        $storedPaths = [];
        $errors = [];
        $documents = [];

        $maxFiles = 500;
        $maxTotalBytes = 100 * 1024 * 1024;
        $totalBytes = 0;

        $allowedTypes = [
            'NPWP' => 'NPWP',
            'REKENING' => 'REKENING',
            'NIB' => 'NIB',
            'SIUP' => 'SIUP',
            'COMPANY_PROFILE' => 'COMPANY_PROFILE',
            'SERTIFIKAT' => 'SERTIFIKAT',
        ];

        try {
            if ($zip->numFiles > $maxFiles) {
                throw ValidationException::withMessages([
                    'file' => ['ZIP maksimal berisi 500 entri file.'],
                ]);
            }

            /*
             * Validasi seluruh dokumen sebelum menyimpan file.
             */
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                $entryName = $entry['name'] ?? '';

                if (str_ends_with($entryName, '/')) {
                    continue;
                }

                $normalized = str_replace('\\', '/', $entryName);
                $segments = explode('/', $normalized);

                if (
                    count($segments) !== 2 ||
                    in_array('', $segments, true) ||
                    in_array('.', $segments, true) ||
                    in_array('..', $segments, true) ||
                    str_starts_with($normalized, '/')
                ) {
                    $errors[] =
                        "Format path '{$entryName}' tidak valid.";
                    continue;
                }

                $vendorCode = trim($segments[0]);
                $fileName = $segments[1];

                $extension = strtolower(
                    pathinfo($fileName, PATHINFO_EXTENSION)
                );

                $documentKey = strtoupper(
                    pathinfo($fileName, PATHINFO_FILENAME)
                );

                if (!isset($allowedTypes[$documentKey])) {
                    $errors[] =
                        "Jenis dokumen '{$fileName}' tidak dikenal.";
                    continue;
                }

                if (!in_array(
                    $extension,
                    ['pdf', 'jpg', 'jpeg', 'png'],
                    true
                )) {
                    $errors[] =
                        "Format file '{$fileName}' tidak didukung.";
                    continue;
                }

                $size = (int) ($entry['size'] ?? 0);
                $totalBytes += $size;

                if ($size <= 0 || $totalBytes > $maxTotalBytes) {
                    $errors[] =
                        'Total ukuran dokumen ZIP maksimal 100 MB dan file tidak boleh kosong.';
                    continue;
                }

                $vendor = DB::table('vendors')
                    ->where('vendor_code', $vendorCode)
                    ->first();

                if (!$vendor) {
                    $errors[] =
                        "Vendor Code '{$vendorCode}' tidak ditemukan.";
                    continue;
                }

                $stream = $zip->getStream($entryName);

                if ($stream === false) {
                    $errors[] =
                        "File '{$entryName}' tidak dapat dibaca.";
                    continue;
                }

                $contents = stream_get_contents($stream);
                fclose($stream);

                if ($contents === false || $contents === '') {
                    $errors[] =
                        "File '{$entryName}' kosong atau gagal dibaca.";
                    continue;
                }

                $validSignature = match ($extension) {
                    'pdf' => str_starts_with($contents, '%PDF-'),
                    'jpg', 'jpeg' => str_starts_with(
                        $contents,
                        "\xFF\xD8\xFF"
                    ),
                    'png' => str_starts_with(
                        $contents,
                        "\x89PNG\r\n\x1A\n"
                    ),
                    default => false,
                };

                if (!$validSignature) {
                    $errors[] =
                        "Isi file '{$entryName}' tidak sesuai dengan formatnya.";
                    continue;
                }

                $documents[] = [
                    'vendor_id' => $vendor->id,
                    'vendor_code' => $vendorCode,
                    'document_type' => $allowedTypes[$documentKey],
                    'file_name' => $fileName,
                    'extension' => $extension,
                    'contents' => $contents,
                ];
            }

            if (empty($documents) && empty($errors)) {
                $errors[] =
                    'ZIP tidak berisi dokumen yang dapat diimpor.';
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages([
                    'file' => $errors,
                ]);
            }

            $imported = DB::transaction(function () use (
                $documents,
                $request,
                $disk,
                &$storedPaths
            ) {
                $count = 0;

                foreach ($documents as $document) {
                    $vendor = DB::table('vendors')
                        ->where('id', $document['vendor_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$vendor) {
                        throw new \RuntimeException(
                            'Vendor tidak ditemukan saat penyimpanan.'
                        );
                    }

                    $lastVersion = DB::table('vendor_documents')
                        ->where('vendor_id', $vendor->id)
                        ->where(
                            'document_type',
                            $document['document_type']
                        )
                        ->max('version');

                    $version = ((int) $lastVersion) + 1;

                    $path = sprintf(
                        'vendor-documents/%s/%s_v%d_%s.%s',
                        $vendor->id,
                        $document['document_type'],
                        $version,
                        bin2hex(random_bytes(6)),
                        $document['extension']
                    );

                    if (!$disk->put($path, $document['contents'])) {
                        throw new \RuntimeException(
                            "Gagal menyimpan {$document['file_name']}."
                        );
                    }

                    $storedPaths[] = $path;

                    DB::table('vendor_documents')->insert([
                        'vendor_id' => $vendor->id,
                        'document_type' => $document['document_type'],
                        'file_name' => $document['file_name'],
                        'file_path' => $path,
                        'version' => $version,
                        'uploaded_by' => $request->user()?->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $count++;
                }

                return $count;
            });

            return response()->json([
                'message' => 'Import dokumen Existing Vendor berhasil.',
                'imported' => $imported,
            ]);
        } catch (ValidationException $e) {
            foreach ($storedPaths as $path) {
                $disk->delete($path);
            }

            throw $e;
        } catch (Throwable $e) {
            foreach ($storedPaths as $path) {
                $disk->delete($path);
            }

            report($e);

            return response()->json([
                'message' => 'Import dokumen gagal. Periksa format ZIP dan database.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan saat menyimpan dokumen.',
            ], 500);
        } finally {
            $zip->close();
        }
    }

    private function normalizeHeader($value): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', (string) $value);
        $header = strtolower(trim($header));
        $header = preg_replace('/[\s\-\.]+/', '_', $header);

        $aliases = [
            'vendor_ref' => 'vendor_code',
            'ref' => 'vendor_code',
            'no_ref' => 'vendor_code',
            'kode_vendor' => 'vendor_code',
            'no' => 'vendor_code',
            'payment_term_code' => 'payment_term',
            'kode_payment_term' => 'payment_term',
            'due_date_payment' => 'payment_term',
            'termin_pembayaran' => 'payment_term',
            'top' => 'payment_term',
            'beneficiary' => 'beneficiary',
            'account_name' => 'beneficiary',
            'account_holder' => 'beneficiary',
            'nama_pemilik_rekening' => 'beneficiary',
            'nama_rekening' => 'beneficiary',
            'cat_code' => 'kategori_code',
            'category_code' => 'kategori_code',
            'kategori' => 'kategori_code',
            'category' => 'kategori_code',
            'no_rekening' => 'account_number',
            'nomor_rekening' => 'account_number',
            'currency' => 'order_currency',
            'mata_uang' => 'order_currency',
        ];

        return $aliases[$header] ?? $header;
    }

    /**
     * Membaca sheet Excel dan menggunakan baris pertama sebagai header.
     */
    private function readSheet($sheet): array
    {
        $rows = $sheet->toArray(null, true, true, false);

        if (empty($rows)) {
            return [];
        }

        $headers = array_map(
            fn($header) => $this->normalizeHeader($header),
            array_shift($rows)
        );

        $result = [];

        foreach ($rows as $row) {
            $mapped = [];

            foreach ($headers as $index => $header) {
                if ($header !== '') {
                    $mapped[$header] = $row[$index] ?? null;
                }
            }

            if (!$this->isEmptyRow($mapped)) {
                $result[] = $mapped;
            }
        }

        return $result;
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function value(array $row, string $key): ?string
    {
        $value = trim((string) ($row[$key] ?? ''));

        return $value === '' ? null : $value;
    }

    private function toBoolean(mixed $value): bool
    {
        return in_array(
            strtolower(trim((string) $value)),
            ['1', 'true', 'yes', 'ya', 'y'],
            true
        );
    }

    private function findMaster(
        string $table,
        string $column,
        mixed $value
    ): ?object {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        return DB::table($table)
            ->whereRaw("LOWER(TRIM({$column})) = ?", [
                mb_strtolower($value),
            ])
            ->first();
    }

    private function validateMaster(
        array $row,
        string $field,
        string $table,
        string $column,
        string $sheet,
        int $rowNumber,
        array &$errors
    ): void {
        $value = trim((string) ($row[$field] ?? ''));

        if ($value === '') {
            return;
        }

        if (!$this->findMaster($table, $column, $value)) {
            $errors[] =
                "{$sheet} baris {$rowNumber}: {$field} '{$value}' tidak ditemukan di master {$table}.";
        }
    }

    private function createRequestNumber(string $requestType): string
    {
        $now = now();
        $year = (int) $now->format('Y');
        $formType = 'VMS';
        $status = strtoupper($requestType) === 'CREATE' ? 'NEW' : 'UPDATE';
        $prefix = $status === 'NEW' ? 'N' : 'U';

        DB::table('request_sequences')->insertOrIgnore([
            'year' => $year,
            'form_type' => $formType,
            'status' => $status,
            'last_number' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $sequence = DB::table('request_sequences')
            ->where('year', $year)
            ->where('form_type', $formType)
            ->where('status', $status)
            ->lockForUpdate()
            ->first();

        $nextNumber = (int) ($sequence?->last_number ?? 0) + 1;

        do {
            $candidate = sprintf(
                'HRIS-%s-%s-%s%03d',
                $formType,
                $prefix,
                $now->format('Ymd'),
                $nextNumber
            );
            $exists = DB::table('vendor_requests')
                ->where('form_number', $candidate)
                ->exists();
            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        if ($sequence) {
            DB::table('request_sequences')
                ->where('id', $sequence->id)
                ->update([
                    'last_number' => $nextNumber,
                    'updated_at' => $now,
                ]);
        }

        return $candidate;
    }
}
