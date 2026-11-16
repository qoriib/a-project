<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\VendorBankAccount;
use App\Models\VendorRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

class NewVendorImportController extends Controller
{
    /**
     * Import pengajuan New Vendor dari Excel.
     *
     * Sheet wajib:
     * - Vendors
     * - BankAccounts
     *
     * Semua vendor yang berhasil diimpor langsung diajukan
     * ke tahap REQUESTER untuk menunggu persetujuan Kadiv Requester.
     *
     * Vendor Code tetap NULL sampai tahap SAP.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls,csv',
                'max:10240',
            ],
        ]);

        $user = $request->user();

        if (!$user || blank($user->nik)) {
            return response()->json([
                'message' => 'NIK pengguna tidak ditemukan. Import tidak dapat dilakukan.',
            ], 422);
        }

        try {
            $spreadsheet = IOFactory::load(
                $request->file('file')->getRealPath()
            );

            $vendorSheet = $spreadsheet->getSheetByName('Vendors');
            $bankSheet = $spreadsheet->getSheetByName('BankAccounts');

            if (!$vendorSheet || !$bankSheet) {
                return response()->json([
                    'message' => 'Excel wajib memiliki sheet Vendors dan BankAccounts.',
                ], 422);
            }

            $vendorRows = $this->readSheet($vendorSheet);
            $bankRows = $this->readSheet($bankSheet);

            if (empty($vendorRows)) {
                return response()->json([
                    'message' => 'Sheet Vendors tidak memiliki data.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | 1. VALIDASI HEADER
            |--------------------------------------------------------------------------
            */

            $requiredVendorHeaders = [
                'vendor_ref',
                'nama_perusahaan',
                'address',
                'city',
                'postal_code',
                'country',
                'phone',
                'mobile_phone',
                'fax',
                'pic_vendor',
                'email',
                'npwp',
                'payment_term_code',
                'order_currency',
            ];

            $requiredBankHeaders = [
                'vendor_ref',
                'bank_name',
                'account_number',
            ];

            $vendorHeaders = $this->readHeaders($vendorSheet);
            $bankHeaders = $this->readHeaders($bankSheet);

            $missingVendorHeaders = array_diff(
                $requiredVendorHeaders,
                $vendorHeaders
            );

            if (!in_array('kategori_code', $vendorHeaders) && !in_array('kategori_id', $vendorHeaders)) {
                $missingVendorHeaders[] = 'kategori_code';
            }

            $missingBankHeaders = array_diff(
                $requiredBankHeaders,
                $bankHeaders
            );

            if (!in_array('account_name', $bankHeaders) && !in_array('beneficiary', $bankHeaders)) {
                $missingBankHeaders[] = 'account_name';
            }

            if ($missingVendorHeaders || $missingBankHeaders) {
                return response()->json([
                    'message' => 'Header Excel belum sesuai template.',
                    'errors' => [
                        'Vendors' => array_values($missingVendorHeaders),
                        'BankAccounts' => array_values($missingBankHeaders),
                    ],
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | 2. VALIDASI DATA VENDOR DAN BANK
            |--------------------------------------------------------------------------
            */

            $errors = [];
            $vendorsByRef = [];

            foreach ($vendorRows as $row) {
                $rowNumber = $row['_row'];
                unset($row['_row']);

                $ref = trim((string) ($row['vendor_ref'] ?? ''));

                if ($ref === '') {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'vendor_ref',
                        'message' => 'vendor_ref wajib diisi.',
                    ];
                    continue;
                }

                if (isset($vendorsByRef[$ref])) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'vendor_ref',
                        'message' => "vendor_ref '{$ref}' duplikat.",
                    ];
                    continue;
                }

                $vendorsByRef[$ref] = $row;

                $validator = Validator::make($row, [
                    'nama_perusahaan' => 'required|string|max:255',
                    'search_term' => 'nullable|string|max:255',
                    'address' => 'required|string',
                    'city' => 'required|string|max:100',
                    'postal_code' => 'required|string|max:20',
                    'country' => 'required|string|max:100',
                    'phone' => 'required|string|max:50',
                    'mobile_phone' => 'required|string|max:50',
                    'fax' => 'required|string|max:50',
                    'pic_vendor' => 'required|string|max:255',
                    'email' => 'required|email|max:255',
                    'npwp' => 'required|string|max:100',
                    'business_type' => 'nullable|string|max:255',
                    'kategori_other' => 'nullable|string|max:255',
                    'payment_term_code' => 'required|string|max:50',
                    'payment_term_other' => 'nullable|string|max:255',
                    'order_currency' => 'required|in:IDR,USD,OTHER',
                    'order_currency_other' => 'nullable|string|max:255',
                ]);

                if ($validator->fails()) {
                    foreach ($validator->errors()->messages() as $field => $messages) {
                        foreach ($messages as $message) {
                            $errors[] = [
                                'sheet' => 'Vendors',
                                'row' => $rowNumber,
                                'field' => $field,
                                'message' => $message,
                            ];
                        }
                    }
                    continue;
                }

                // Resolusi Kategori: bisa berdasarkan kategori_code (VMS_001) atau kategori_id (angka)
                $catIdentifier = $row['kategori_code'] ?? $row['kategori_id'] ?? null;

                if (empty($catIdentifier)) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'kategori_code',
                        'message' => 'Kolom kategori_code (misal VMS_001) wajib diisi.',
                    ];
                    continue;
                }

                $category = DB::table('vendor_categories')
                    ->where('cat_code', strtoupper(trim((string) $catIdentifier)))
                    ->orWhere('id', $catIdentifier)
                    ->first();

                if (!$category) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'kategori_code',
                        'message' => "Kode Kategori '{$catIdentifier}' tidak ditemukan di master database.",
                    ];
                    continue;
                }

                $vendorsByRef[$ref]['kategori_id'] = $category->id;
                $vendorsByRef[$ref]['cat_code'] = $category->cat_code;

                $catDesc = strtolower(trim((string) ($category->category_desc ?? $category->name ?? '')));
                $isCatOther = str_contains($catDesc, 'other') || in_array($category->cat_code ?? '', ['VMS_012', 'VMS_015']);

                if (
                    $isCatOther
                    && blank($row['kategori_other'] ?? null)
                ) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'kategori_other',
                        'message' => 'Kategori Other wajib diisi.',
                    ];
                }

                $paymentTermCode = strtoupper(
                    trim((string) ($row['payment_term_code'] ?? ''))
                );

                if ($paymentTermCode === 'OTHER') {
                    $paymentTerm = DB::table('payment_terms')
                        ->whereNull('code')
                        ->whereRaw('LOWER(name) = ?', ['other'])
                        ->first();
                } else {
                    $paymentTerm = DB::table('payment_terms')
                        ->where('code', $paymentTermCode)
                        ->first();
                }

                if (!$paymentTerm) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'row' => $rowNumber,
                        'field' => 'payment_term_code',
                        'message' => "Kode Payment Term '{$paymentTermCode}' tidak ditemukan di master database.",
                    ];
                } else {
                    if (
                        strtolower(trim($paymentTerm->name)) === 'other'
                        && blank($row['payment_term_other'] ?? null)
                    ) {
                        $errors[] = [
                            'sheet' => 'Vendors',
                            'row' => $rowNumber,
                            'field' => 'payment_term_other',
                            'message' => 'Payment Term Other wajib diisi.',
                        ];
                    }

                    // Simpan ID database hasil pencarian berdasarkan kode Excel.
                    $vendorsByRef[$ref]['payment_term_id'] = $paymentTerm->id;
                }
            }

            $bankRowsByRef = [];

            foreach ($bankRows as $row) {
                $rowNumber = $row['_row'];
                unset($row['_row']);

                $ref = trim((string) ($row['vendor_ref'] ?? ''));

                if ($ref === '' || !isset($vendorsByRef[$ref])) {
                    $errors[] = [
                        'sheet' => 'BankAccounts',
                        'row' => $rowNumber,
                        'field' => 'vendor_ref',
                        'message' => 'vendor_ref harus sesuai dengan data di sheet Vendors.',
                    ];
                    continue;
                }

                $bankRowsByRef[$ref][] = $row;

                $validator = Validator::make($row, [
                    'bank_name' => 'required|string|max:255',
                    'account_number' => 'required|string|max:100',
                    'account_name' => 'required|string|max:255',
                ]);

                if ($validator->fails()) {
                    foreach ($validator->errors()->messages() as $field => $messages) {
                        foreach ($messages as $message) {
                            $errors[] = [
                                'sheet' => 'BankAccounts',
                                'row' => $rowNumber,
                                'field' => $field,
                                'message' => $message,
                            ];
                        }
                    }
                }
            }

            foreach ($vendorsByRef as $ref => $row) {
                if (empty($bankRowsByRef[$ref])) {
                    $errors[] = [
                        'sheet' => 'BankAccounts',
                        'vendor_ref' => $ref,
                        'message' => 'Setiap vendor wajib memiliki minimal satu rekening bank.',
                    ];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | CEK NPWP DUPLIKAT DI DATABASE
            |--------------------------------------------------------------------------
            */

            $npwpRows = [];

            foreach ($vendorsByRef as $ref => $row) {
                $npwp = trim((string) ($row['npwp'] ?? ''));

                // Normalisasi agar perbedaan spasi dan tanda baca
                // tidak membuat NPWP yang sama lolos dari pemeriksaan.
                $normalizedNpwp = strtoupper(
                    preg_replace('/[^A-Z0-9]/i', '', $npwp)
                );

                if ($normalizedNpwp === '') {
                    continue;
                }

                // Cek duplikat NPWP di dalam file Excel itu sendiri.
                if (isset($npwpRows[$normalizedNpwp])) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'field' => 'npwp',
                        'vendor_ref' => $ref,
                        'message' => "NPWP '{$npwp}' duplikat dengan vendor_ref '{$npwpRows[$normalizedNpwp]}'.",
                    ];
                } else {
                    $npwpRows[$normalizedNpwp] = $ref;
                }
            }

            // Ambil vendor yang NPWP-nya sudah tercatat di database.
            $existingVendors = DB::table('vendors')
                ->select('npwp', 'nama_perusahaan')
                ->whereNotNull('npwp')
                ->where('npwp', '<>', '')
                ->get();

            $existingNpwp = [];

            foreach ($existingVendors as $existingVendor) {
                $normalizedNpwp = strtoupper(
                    preg_replace(
                        '/[^A-Z0-9]/i',
                        '',
                        trim((string) $existingVendor->npwp)
                    )
                );

                if ($normalizedNpwp !== '') {
                    $existingNpwp[$normalizedNpwp] = $existingVendor->nama_perusahaan;
                }
            }

            // Tolak vendor baru yang NPWP-nya sudah terdaftar.
            foreach ($vendorsByRef as $ref => $row) {
                $npwp = trim((string) ($row['npwp'] ?? ''));

                $normalizedNpwp = strtoupper(
                    preg_replace('/[^A-Z0-9]/i', '', $npwp)
                );

                if (
                    $normalizedNpwp !== '' &&
                    isset($existingNpwp[$normalizedNpwp])
                ) {
                    $errors[] = [
                        'sheet' => 'Vendors',
                        'field' => 'npwp',
                        'vendor_ref' => $ref,
                        'message' =>
                        "NPWP '{$npwp}' sudah terdaftar atas nama '{$existingNpwp[$normalizedNpwp]}'. Vendor tidak dapat diimpor kembali.",
                    ];
                }
            }

            // Batalkan seluruh import jika ditemukan kesalahan.
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'Import dibatalkan. Ditemukan data vendor duplikat atau tidak valid.',
                    'errors' => $errors,
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | 3. SIMPAN SEMUA DATA DALAM SATU TRANSAKSI
            |--------------------------------------------------------------------------
            |
            | Jika ada kegagalan ketika menyimpan salah satu vendor,
            | semua perubahan pada file ini akan di-rollback.
            |
            */

            $imported = [];

            DB::transaction(function () use (
                $vendorsByRef,
                $bankRowsByRef,
                $user,
                &$imported
            ) {
                foreach ($vendorsByRef as $ref => $row) {
                    $vendor = Vendor::create([
                        'nama_perusahaan' => $row['nama_perusahaan'],
                        'vendor_code' => null,
                        'source_type' => 'NEW',

                        'search_term' => $row['search_term'] ?? null,
                        'address' => $row['address'],
                        'city' => $row['city'],
                        'postal_code' => $row['postal_code'],
                        'country' => $row['country'],

                        'phone' => $row['phone'],
                        'mobile_phone' => $row['mobile_phone'],
                        'fax' => $row['fax'],
                        'pic_vendor' => $row['pic_vendor'],
                        'email' => $row['email'],

                        'npwp' => $row['npwp'],
                        'business_type' => $row['business_type'] ?? null,

                        'kategori_id' => $row['kategori_id'],
                        'kategori_other' => $row['kategori_other'] ?? null,

                        'company_code_purch_org' =>
                        '1200 / 1300 (All Comp. Code)',

                        'payment_term_id' => $row['payment_term_id'],
                        'payment_term_other' =>
                        $row['payment_term_other'] ?? null,

                        'order_currency' => strtoupper(
                            trim((string) $row['order_currency'])
                        ),
                        'order_currency_other' =>
                        $row['order_currency_other'] ?? null,

                        'created_by' => $user->id,
                    ]);

                    // Simpan subkategori vendor
                    $subcatRaw = strtolower(trim((string) ($row['subcategory'] ?? '')));
                    $subcategories = ['Material', 'Jasa'];
                    if ($subcatRaw === 'material') {
                        $subcategories = ['Material'];
                    } elseif ($subcatRaw === 'jasa') {
                        $subcategories = ['Jasa'];
                    }

                    foreach ($subcategories as $sub) {
                        \App\Models\VendorSubcategory::create([
                            'vendor_id' => $vendor->id,
                            'category_id' => $row['kategori_id'],
                            'category_other' => $row['kategori_other'] ?? null,
                            'subcategory' => $sub,
                        ]);
                    }

                    foreach ($bankRowsByRef[$ref] as $bank) {
                        VendorBankAccount::create([
                            'vendor_id' => $vendor->id,
                            'bank_name' => $bank['bank_name'],
                            'account_number' => $bank['account_number'],
                            'account_name' => $bank['account_name'] ?? $bank['beneficiary'] ?? '',
                            'swift_code' => $bank['swift_code'] ?? null,
                        ]);
                    }

                    $catCode = $row['cat_code'] ?? null;

                    $vendorRequest = VendorRequest::create([
                        'vendor_id' => $vendor->id,
                        'request_type' => 'CREATE',
                        'cat_code' => $catCode,
                        'form_number' => $this->createRequestNumber('CREATE'),
                        'requested_by_nik' => $user->nik,
                        'requested_by_email' => $user->email,
                        'status' => 'PENDING_L1',
                        'current_stage' => 'ASISTEN_KADIV',
                        'submitted_at' => now(),
                    ]);

                    $vendorRequest->approvalHistories()->create([
                        'approval_stage' => 'REQUESTER',
                        'acted_by' => $user->id,
                        'acted_by_name' => $user->name,
                        'acted_by_nik' => $user->nik,
                        'acted_by_email' => $user->email,
                        'status' => 'Submitted',
                        'notes' => 'Pengajuan New Vendor dikirim melalui import Excel.',
                        'acted_at' => now(),
                        'signature_token' => bin2hex(random_bytes(32)),
                    ]);

                    // Generate Form Approvals untuk Level 1 s/d Level 5
                    if ($catCode) {
                        $layers = DB::table('master_approval_layer')
                            ->where('cat_code', $catCode)
                            ->where('type', 'Approval')
                            ->orderBy('priority')
                            ->get();

                        foreach ($layers as $layer) {
                            \App\Models\FormApproval::firstOrCreate(
                                [
                                    'vendor_request_id' => $vendorRequest->id,
                                    'priority' => $layer->priority,
                                ],
                                [
                                    'stage' => $layer->stage,
                                    'nik' => $layer->nik,
                                    'email' => $layer->email,
                                    'status' => $layer->priority === 1 ? 'Under Review' : 'Pending',
                                ]
                            );
                        }
                    }

                    $imported[] = [
                        'vendor_ref' => $ref,
                        'vendor_id' => $vendor->id,
                        'nama_perusahaan' => $vendor->nama_perusahaan,
                        'form_number' => $vendorRequest->form_number,
                        'vendor_code' => null,
                        'status' => $vendorRequest->status,
                        'current_stage' => $vendorRequest->current_stage,
                    ];
                }
            });

            return response()->json([
                'message' => 'Import New Vendor berhasil. Seluruh pengajuan telah masuk ke antrean Level 1 (Verifikasi Dokumen).',
                'total_imported' => count($imported),
                'data' => $imported,
            ], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Import New Vendor gagal.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan saat membaca atau menyimpan file.',
            ], 500);
        }
    }


    /**
     * Menormalkan nama header Excel.
     *
     * beneficiary dan account_name dianggap sebagai kolom yang sama.
     */
    private function normalizeHeader($value): string
    {
        // Hilangkan BOM jika ada, lalu normalkan spasi dan huruf.
        $header = preg_replace('/^\xEF\xBB\xBF/', '', (string) $value);
        $header = strtolower(trim($header));
        $header = preg_replace('/\s+/', '_', $header);

        // Alias header Excel ke nama kolom yang digunakan backend.
        $aliases = [
            'beneficiary' => 'account_name',
            'account_holder' => 'account_name',
            'nama_pemilik_rekening' => 'account_name',
            'nama_rekening' => 'account_name',
            'kode_kategori' => 'kategori_code',
            'cat_code' => 'kategori_code',
            'category_code' => 'kategori_code',
        ];

        return $aliases[$header] ?? $header;
    }

    /**
     * Membaca header sheet dan menormalkan namanya.
     */
    private function readHeaders($sheet): array
    {
        $rows = $sheet->toArray(null, true, true, true);
        $headers = [];

        foreach (($rows[1] ?? []) as $value) {
            $header = $this->normalizeHeader($value);

            if ($header !== '') {
                $headers[] = $header;
            }
        }

        return $headers;
    }

    /**
     * Mengubah isi sheet menjadi associative array berdasarkan header.
     */
    private function readSheet($sheet): array
    {
        $rows = $sheet->toArray(null, true, true, true);
        $headerRow = array_shift($rows);

        $headers = [];

        foreach ($headerRow ?? [] as $column => $value) {
            $header = $this->normalizeHeader($value);

            if ($header !== '') {
                $headers[$column] = $header;
            }
        }

        $result = [];

        foreach ($rows as $index => $row) {
            $mapped = [];
            $hasData = false;

            foreach ($headers as $column => $header) {
                $value = $row[$column] ?? null;

                if (is_string($value)) {
                    $value = trim($value);
                }

                if ($value === '') {
                    $value = null;
                }

                $mapped[$header] = $value;

                if ($value !== null) {
                    $hasData = true;
                }
            }

            if ($hasData) {
                $mapped['_row'] = $index + 1;
                $result[] = $mapped;
            }
        }

        return $result;
    }


    /**
     * Membuat nomor pengajuan mengikuti VendorController.
     * Format: HRIS-VMS-N-YYYYMMDDXXX
     */
    private function createRequestNumber(string $requestType): string
    {
        $year = (int) date('Y');
        $formType = 'VMS';

        $status = match (strtoupper($requestType)) {
            'CREATE', 'NEW' => 'NEW',
            'UPDATE' => 'UPDATE',
            default => 'NEW',
        };

        $prefix = $status === 'NEW' ? 'N' : 'U';

        DB::table('request_sequences')->insertOrIgnore([
            'year' => $year,
            'form_type' => $formType,
            'status' => $status,
            'last_number' => 0,
        ]);

        $sequence = DB::table('request_sequences')
            ->where('year', $year)
            ->where('form_type', $formType)
            ->where('status', $status)
            ->lockForUpdate()
            ->first();

        $reqnum = $sequence ? ($sequence->last_number + 1) : 1;

        DB::table('request_sequences')
            ->where('year', $year)
            ->where('form_type', $formType)
            ->where('status', $status)
            ->update([
                'last_number' => $reqnum,
                'updated_at' => now(),
            ]);

        return sprintf(
            'HRIS-VMS-%s-%s%03d',
            $prefix,
            now()->format('Ymd'),
            $reqnum
        );
    }
}
