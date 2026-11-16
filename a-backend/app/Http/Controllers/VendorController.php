<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\VendorDocument;
use App\Models\VendorRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | KONFIGURASI DOKUMEN
    |--------------------------------------------------------------------------
    */

    private const GENERAL_DOCUMENTS = [
        'struktur_organisasi_files' => 'STRUKTUR_ORGANISASI',
        'akta_pendirian_files' => 'AKTA_PENDIRIAN',
        'akta_perubahan_files' => 'AKTA_PERUBAHAN',
        'company_profile_files' => 'COMPANY_PROFILE',
        'npwp_sppkp_files' => 'NPWP_SPPKP',
        'nib_files' => 'NIB',
        'identitas_pengurus_files' => 'IDENTITAS_PENGURUS',
        'laporan_keuangan_files' => 'LAPORAN_KEUANGAN',
        'dokumentasi_lokasi_files' => 'DOKUMENTASI_LOKASI',
        'bpjs_ketenagakerjaan_files' => 'BPJS_KETENAGAKERJAAN',
        'perizinan_pekerjaan_files' => 'PERIZINAN_PEKERJAAN',
        'sertifikasi_kompetensi_files' => 'SERTIFIKASI_KOMPETENSI',
        'dokumen_pendukung_files' => 'DOKUMEN_PENDUKUNG',
    ];

    /*
    |--------------------------------------------------------------------------
    | VALIDASI DOKUMEN UMUM
    |--------------------------------------------------------------------------
    */

    private function generalDocumentRules(): array
    {
        $rules = [];

        foreach (self::GENERAL_DOCUMENTS as $field => $type) {
            $rules[$field] = ['sometimes', 'array'];
            $rules[$field . '.*'] = [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ];
        }

        return $rules;
    }

    /*
    |--------------------------------------------------------------------------
    | SIMPAN DOKUMEN DAN BUAT VERSI
    |--------------------------------------------------------------------------
    */

    private function saveDocument(
        Vendor $vendor,
        $file,
        string $documentType,
        ?int $bankAccountId,
        Request $request
    ): void {
        if (!$file || !$file->isValid()) {
            return;
        }

        $versionQuery = VendorDocument::where('vendor_id', $vendor->id)
            ->where('document_type', $documentType);

        if ($bankAccountId === null) {
            $versionQuery->whereNull('bank_account_id');
        } else {
            $versionQuery->where('bank_account_id', $bankAccountId);
        }

        $latestVersion = $versionQuery
            ->lockForUpdate()
            ->max('version');

        $nextVersion = ((int) $latestVersion) + 1;

        $folderPath = 'vendor-documents/' . $vendor->id . '/' . strtolower(preg_replace('/[^A-Za-z0-9_\-]/', '_', $documentType));

        $filePath = $file->store(
            $folderPath,
            'public'
        );

        VendorDocument::create([
            'vendor_id' => $vendor->id,
            'bank_account_id' => $bankAccountId,
            'document_type' => $documentType,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'version' => $nextVersion,
            'uploaded_by' => $request->user()?->id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SIMPAN SELURUH DOKUMEN UMUM
    |--------------------------------------------------------------------------
    */

    private function saveGeneralDocuments(
        Vendor $vendor,
        Request $request
    ): void {
        foreach (self::GENERAL_DOCUMENTS as $field => $documentType) {
            $files = $request->file($field, []);

            foreach ($files as $file) {
                $this->saveDocument(
                    $vendor,
                    $file,
                    $documentType,
                    null,
                    $request
                );
            }
        }
    }


    /*
|--------------------------------------------------------------------------
| VALIDASI PILIHAN KATEGORI DAN SUBKATEGORI
|--------------------------------------------------------------------------
*/

    private function validateVendorSubcategories(array $items): ?string
    {
        $combinations = [];

        foreach ($items as $item) {
            $key = $item['category_id'] . '-' . $item['subcategory'];

            // Cegah kombinasi kategori dan subkategori duplikat.
            if (in_array($key, $combinations, true)) {
                return 'Kategori dan subkategori yang sama tidak boleh dipilih lebih dari satu kali.';
            }

            $combinations[] = $key;

            // Periksa apakah kategori yang dipilih adalah Other.
            $category = DB::table('vendor_categories')
                ->where('id', $item['category_id'])
                ->first();

            if (!$category) {
                return 'Kategori yang dipilih tidak ditemukan.';
            }

            if (strtolower(trim($category->name)) === 'other') {
                if (blank($item['category_other'] ?? null)) {
                    return 'Nama kategori Other wajib diisi.';
                }
            } elseif (!blank($item['category_other'] ?? null)) {
                return 'Nama kategori lainnya hanya boleh diisi jika memilih Other.';
            }
        }

        return null;
    }

    /*
|--------------------------------------------------------------------------
| SIMPAN KATEGORI DAN SUBKATEGORI VENDOR
|--------------------------------------------------------------------------
*/

    private function saveVendorSubcategories(
        Vendor $vendor,
        array $items
    ): void {
        foreach ($items as $item) {
            $category = DB::table('vendor_categories')
                ->where('id', $item['category_id'])
                ->first();

            $vendor->vendorSubcategories()->create([
                'category_id' => $item['category_id'],

                'category_other' =>
                strtolower(trim($category->name)) === 'other'
                    ? trim($item['category_other'])
                    : null,

                'subcategory' => $item['subcategory'],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL ACTIVE VENDORS
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $vendors = Vendor::with([
            'kategori',
            'vendorSubcategories.category',
            'bankAccounts.documents',
            'documents',
            'creator',
            'accountGroup',
            'reconAccount',
            'latestRequest',
        ])
            ->whereNotNull('vendor_code')
            ->where('vendor_code', '!=', '')
            ->where(function ($query) {
                $query->where('source_type', 'EXISTING')
                    ->orWhere(function ($newQuery) {
                        $newQuery->where('source_type', 'NEW')
                            ->whereHas('requests', function ($requestQuery) {
                                $requestQuery
                                    ->whereIn('status', ['Approved', 'COMPLETED', 'DONE'])
                                    ->where('current_stage', 'COMPLETED');
                            });
                    });
            })
            ->latest()
            ->get();

        return response()->json($vendors);
    }

    /*
    |--------------------------------------------------------------------------
    | GET EXISTING VENDORS
    |--------------------------------------------------------------------------
    */

    public function existingIndex()
    {
        $vendors = Vendor::with([
            'kategori',
            'vendorSubcategories.category',
            'bankAccounts.documents',
            'documents',
            'creator',
            'accountGroup',
            'reconAccount',
        ])
            ->where('source_type', 'EXISTING')
            ->whereNotNull('vendor_code')
            ->where('vendor_code', '!=', '')
            ->orderBy('nama_perusahaan')
            ->get();

        return response()->json($vendors);
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE REQUEST NUMBER
    |--------------------------------------------------------------------------
    */

    private function createRequestNumber(string $requestType): string
    {
        $year = (int) date('Y');
        $formType = 'VMS';

        $status = match (strtoupper($requestType)) {
            'CREATE', 'NEW' => 'NEW',
            'UPDATE' => 'UPDATE',
            default => throw new \InvalidArgumentException(
                'Jenis request tidak valid.'
            ),
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

        if (!$sequence) {
            throw new \RuntimeException(
                'Gagal mendapatkan request sequence.'
            );
        }

        $reqnum = $sequence->last_number + 1;

        DB::table('request_sequences')
            ->where('id', $sequence->id)
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

    /*
    |--------------------------------------------------------------------------
    | CREATE VENDOR
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $action = $request->input('action', 'submit');

        $request->merge([
            'action' => $action,
        ]);

        $rules = [
            'action' => ['required', 'in:draft,submit'],

            // DATA PERUSAHAAN
            'nama_perusahaan' => 'required_if:action,submit|string|max:255',
            'search_term' => 'nullable|string|max:255',
            'address' => 'required_if:action,submit|string',
            'city' => 'required_if:action,submit|string|max:100',
            'postal_code' => 'required_if:action,submit|string|max:20',
            'country' => 'required_if:action,submit|string|max:100',

            // CONTACT
            'phone' => 'required_if:action,submit|string|max:50',
            'mobile_phone' => 'required_if:action,submit|string|max:50',
            'fax' => 'required_if:action,submit|string|max:50',
            'pic_vendor' => 'required_if:action,submit|string|max:255',
            'email' => 'required_if:action,submit|email|max:255',

            // DATA PROCUREMENT
            'npwp' => 'required_if:action,submit|string|max:100',
            'business_type' => 'nullable|string|max:255',

            // KATEGORI DAN SUBKATEGORI
            'vendor_subcategories' => [
                'required_if:action,submit',
                'array',
                'min:1',
            ],

            'vendor_subcategories.*.category_id' => [
                'required',
                'integer',
                'exists:vendor_categories,id',
            ],

            'vendor_subcategories.*.subcategory' => [
                'required',
                'in:Material,Jasa',
            ],

            'vendor_subcategories.*.category_other' => [
                'nullable',
                'string',
                'max:255',
            ],

            // PAYMENT
            'payment_term_id' => 'required_if:action,submit|exists:payment_terms,id',
            'payment_term_other' => 'nullable|string|max:255',

            'order_currency' => 'required_if:action,submit|in:IDR,USD,OTHER',
            'order_currency_other' => 'nullable|string|max:255',

            // BANK ACCOUNTS
            'bank_accounts' => [
                'required_if:action,submit',
                'array',
            ],

            'bank_accounts.*.bank_name' => [
                'required_if:action,submit',
                'string',
                'max:255',
            ],

            'bank_accounts.*.account_number' => [
                'required_if:action,submit',
                'string',
                'max:100',
            ],

            'bank_accounts.*.account_name' => [
                'required_if:action,submit',
                'string',
                'max:255',
            ],

            'bank_accounts.*.swift_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            // DOKUMEN REKENING
            'bank_accounts.*.documents' => [
                'sometimes',
                'array',
            ],

            'bank_accounts.*.documents.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],
        ];

        $validated = $request->validate(
            array_merge($rules, $this->generalDocumentRules())
        );
        $subcategoryError = $this->validateVendorSubcategories(
            $validated['vendor_subcategories'] ?? []
        );

        if ($subcategoryError) {
            return response()->json([
                'message' => $subcategoryError,
                'errors' => [
                    'vendor_subcategories' => [$subcategoryError],
                ],
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI FIELD OTHER
        |--------------------------------------------------------------------------
        */

        if ($action === 'submit') {
            $otherErrors = [];


            if (!empty($validated['payment_term_id'])) {
                $paymentTerm = DB::table('payment_terms')
                    ->where('id', $validated['payment_term_id'])
                    ->first();

                if (
                    strtolower(trim($paymentTerm->name ?? '')) === 'other'
                    && blank($validated['payment_term_other'] ?? null)
                ) {
                    $otherErrors['payment_term_other'] = [
                        'Due Date Payment Other wajib diisi.',
                    ];
                }
            }

            if (
                ($validated['order_currency'] ?? '') === 'OTHER'
                && blank($validated['order_currency_other'] ?? null)
            ) {
                $otherErrors['order_currency_other'] = [
                    'Keterangan Order Currency Other wajib diisi.',
                ];
            }

            if (!empty($otherErrors)) {
                return response()->json([
                    'message' => 'Mohon lengkapi field yang wajib diisi.',
                    'errors' => $otherErrors,
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            /*
            |--------------------------------------------------------------------------
            | 1. DATA UTAMA VENDOR
            |--------------------------------------------------------------------------
            */

            $user = $request->user();

            if (!$user) {
                throw new \RuntimeException(
                    'Pengguna belum terautentikasi.'
                );
            }

            $vendor = Vendor::create([
                'nama_perusahaan' => $validated['nama_perusahaan'] ?? null,
                'vendor_code' => null,
                'search_term' => $validated['search_term'] ?? null,
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? null,

                'phone' => $validated['phone'] ?? null,
                'mobile_phone' => $validated['mobile_phone'] ?? null,
                'fax' => $validated['fax'] ?? null,
                'pic_vendor' => $validated['pic_vendor'] ?? null,
                'email' => $validated['email'] ?? null,

                'npwp' => $validated['npwp'] ?? null,
                'business_type' => $validated['business_type'] ?? null,



                'company_code_purch_org' =>
                '1200 / 1300 (All Comp. Code)',

                'payment_term_id' => $validated['payment_term_id'] ?? null,
                'payment_term_other' =>
                $validated['payment_term_other'] ?? null,

                'order_currency' => $validated['order_currency'] ?? null,
                'order_currency_other' =>
                $validated['order_currency_other'] ?? null,

                'created_by' => $user->id,
            ]);

            $this->saveVendorSubcategories(
                $vendor,
                $validated['vendor_subcategories'] ?? []
            );

            /*
            |--------------------------------------------------------------------------
            | 2. STATUS REQUEST
            |--------------------------------------------------------------------------
            */

            if ($action === 'draft') {
                $requestStatus = 'DRAFT';
                $currentStage = 'REQUESTER';
                $submittedAt = null;
            } else {
                $requestStatus = 'PENDING_L1';
                $currentStage = 'ASISTEN_KADIV';
                $submittedAt = now();
            }

            if ($action === 'submit' && empty($user->nik)) {
                throw new \RuntimeException(
                    'NIK Requester tidak ditemukan. Pengajuan tidak dapat dikirim.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 3. BUAT VENDOR REQUEST
            |--------------------------------------------------------------------------
            */

            $firstSubcat = collect($validated['vendor_subcategories'] ?? [])->first();
            $catId = $firstSubcat['category_id'] ?? null;
            $catCode = null;
            if ($catId) {
                $cat = DB::table('vendor_categories')->find($catId);
                $catCode = $cat->cat_code ?? null;
            }

            $vendorRequest = VendorRequest::create([
                'vendor_id' => $vendor->id,
                'request_type' => 'CREATE',
                'cat_code' => $catCode,
                'form_number' => $action === 'submit'
                    ? $this->createRequestNumber('CREATE')
                    : null,

                'requested_by_nik' => $user->nik,
                'requested_by_email' => $user->email,
                'status' => $requestStatus,
                'current_stage' => $currentStage,
                'submitted_at' => $submittedAt,
            ]);

            /*
            |--------------------------------------------------------------------------
            | 4. RIWAYAT APPROVAL REQUESTER & FORM APPROVALS
            |--------------------------------------------------------------------------
            */

            if ($action === 'submit') {
                $vendorRequest->approvalHistories()->create([
                    'approval_stage' => 'REQUESTER',
                    'acted_by' => $user->id,
                    'acted_by_name' => $user->name,
                    'acted_by_nik' => $user->nik,
                    'acted_by_email' => $user->email,
                    'status' => 'Submitted',
                    'notes' => 'Pengajuan vendor baru disubmit oleh Requester.',
                    'acted_at' => now(),
                    'signature_token' => bin2hex(random_bytes(32)),
                ]);

                // Generate Form Approvals dari Master Approval Layer
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
                                'status' => $layer->priority === 1 ? 'IN_PROGRESS' : 'WAITING',
                            ]
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 5. SIMPAN BANK ACCOUNT DAN DOKUMEN REKENING
            |--------------------------------------------------------------------------
            */

            $bankAccounts = $validated['bank_accounts'] ?? [];

            foreach ($bankAccounts as $index => $bank) {
                // Lewati baris rekening yang benar-benar kosong saat Draft.
                if (
                    blank($bank['bank_name'] ?? null) &&
                    blank($bank['account_number'] ?? null) &&
                    blank($bank['account_name'] ?? null) &&
                    blank($bank['swift_code'] ?? null)
                ) {
                    continue;
                }

                $bankAccount = $vendor->bankAccounts()->create([
                    'bank_name' => $bank['bank_name'] ?? '',
                    'account_number' => $bank['account_number'] ?? '',
                    'account_name' => $bank['account_name'] ?? null,
                    'swift_code' => $bank['swift_code'] ?? null,
                ]);

                $bankDocuments = $request->file(
                    "bank_accounts.{$index}.documents",
                    []
                );

                foreach ($bankDocuments as $file) {
                    $this->saveDocument(
                        $vendor,
                        $file,
                        'REKENING',
                        (int) $bankAccount->id,
                        $request
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 6. SIMPAN 13 KATEGORI DOKUMEN UMUM
            |--------------------------------------------------------------------------
            */

            $this->saveGeneralDocuments($vendor, $request);

            DB::commit();

            /*
            |--------------------------------------------------------------------------
            | 7. RESPONSE
            |--------------------------------------------------------------------------
            */

            $vendor->load([
                'kategori',
                'vendorSubcategories.category',
                'bankAccounts.documents',
                'documents',
                'creator',
                'accountGroup',
                'reconAccount',
            ]);

            return response()->json([
                'message' => 'Vendor berhasil disimpan.',
                'data' => $vendor,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            report($e);

            return response()->json([
                'message' => 'Gagal menyimpan vendor.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan saat menyimpan data vendor.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET DETAIL VENDOR
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $vendor = Vendor::with([
            'kategori',
            'vendorSubcategories.category',
            'paymentTerm',
            'bankAccounts.documents',
            'documents',
            'creator',
            'accountGroup',
            'reconAccount',
            'withholdingTaxes',
        ])->findOrFail($id);

        return response()->json($vendor);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE VENDOR
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        if (blank($vendor->vendor_code)) {
            return response()->json([
                'message' => 'Update hanya dapat dilakukan pada vendor yang sudah memiliki Vendor Code SAP.',
            ], 422);
        }

        $rules = [
            // DATA PERUSAHAAN
            'nama_perusahaan' => ['required', 'string', 'max:255'],

            'vendor_code' => [
                'nullable',
                'string',
                'max:255',
                'unique:vendors,vendor_code,' . $vendor->id,
            ],

            'search_term' => ['nullable', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:100'],

            // CONTACT
            'phone' => ['required', 'string', 'max:50'],
            'mobile_phone' => ['required', 'string', 'max:50'],
            'fax' => ['required', 'string', 'max:50'],
            'pic_vendor' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],

            // DATA PERPAJAKAN
            'npwp' => ['required', 'string', 'max:100'],
            'business_type' => ['nullable', 'string', 'max:255'],

            // KATEGORI DAN SUBKATEGORI
            'vendor_subcategories' => [
                'required',
                'array',
                'min:1',
            ],

            'vendor_subcategories.*.category_id' => [
                'required',
                'integer',
                'exists:vendor_categories,id',
            ],

            'vendor_subcategories.*.subcategory' => [
                'required',
                'in:Material,Jasa',
            ],
            'vendor_subcategories.*.category_other' => [
                'nullable',
                'string',
                'max:255',
            ],

            // PAYMENT
            'payment_term_id' => [
                'required',
                'exists:payment_terms,id',
            ],

            'payment_term_other' => ['nullable', 'string', 'max:255'],
            'order_currency' => ['required', 'in:IDR,USD,OTHER'],
            'order_currency_other' => ['nullable', 'string', 'max:255'],

            // DATA SAP
            'company_code_purch_org' => [
                'required',
                'string',
                'max:255',
            ],

            'account_group_id' => [
                'required',
                'exists:account_groups,id',
            ],

            'recon_account_id' => [
                'required',
                'exists:recon_accounts,id',
            ],

            'payment_method' => [
                'required',
                'string',
                'max:100',
            ],

            // BANK ACCOUNTS
            'bank_accounts' => ['required', 'array', 'min:1'],

            'bank_accounts.*.id' => [
                'nullable',
                'integer',
                'distinct',
            ],

            'bank_accounts.*.bank_name' => [
                'required',
                'string',
                'max:255',
            ],

            'bank_accounts.*.account_number' => [
                'required',
                'string',
                'max:100',
            ],

            'bank_accounts.*.account_name' => [
                'required',
                'string',
                'max:255',
            ],

            'bank_accounts.*.swift_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            // DOKUMEN REKENING
            'bank_accounts.*.documents' => [
                'sometimes',
                'array',
            ],

            'bank_accounts.*.documents.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],

            // WITHHOLDING TAX
            'withholding_tax_ids' => ['present', 'array'],

            'withholding_tax_ids.*' => [
                'integer',
                'distinct',
                'exists:withholding_taxes,id',
            ],
        ];

        $validated = $request->validate(
            array_merge($rules, $this->generalDocumentRules())
        );

        $subcategoryError = $this->validateVendorSubcategories(
            $validated['vendor_subcategories']
        );

        if ($subcategoryError) {
            return response()->json([
                'message' => $subcategoryError,
                'errors' => [
                    'vendor_subcategories' => [$subcategoryError],
                ],
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI KEPEMILIKAN REKENING
        |--------------------------------------------------------------------------
        */

        $submittedBankIds = collect($validated['bank_accounts'])
            ->pluck('id')
            ->filter(fn($bankId) => $bankId !== null && $bankId !== '')
            ->map(fn($bankId) => (int) $bankId)
            ->values();

        $existingBankIds = $vendor->bankAccounts()
            ->pluck('id')
            ->map(fn($bankId) => (int) $bankId);

        $bankIdsToDelete = $existingBankIds->diff($submittedBankIds);

        $hasDocuments = VendorDocument::whereIn(
            'bank_account_id',
            $bankIdsToDelete
        )->exists();

        if ($hasDocuments) {
            return response()->json([
                'message' => 'Rekening tidak dapat dihapus karena masih memiliki dokumen.',
                'errors' => [
                    'bank_accounts' => [
                        'Hapus atau pindahkan dokumen rekening terlebih dahulu.',
                    ],
                ],
            ], 422);
        }

        if ($submittedBankIds->diff($existingBankIds)->isNotEmpty()) {
            return response()->json([
                'message' => 'Ada rekening bank yang bukan milik vendor ini.',
                'errors' => [
                    'bank_accounts' => [
                        'Muat ulang halaman dan periksa kembali rekening bank.',
                    ],
                ],
            ], 422);
        }

        DB::beginTransaction();

        try {
            /*
            |--------------------------------------------------------------------------
            | 1. SIAPKAN DATA LAMA (OLD) DAN DATA BARU (NEW) BESERTA DIFF
            |--------------------------------------------------------------------------
            |
            | Perubahan data baru diterapkan ke tabel vendors setelah disetujui
            | hingga tahap SAP (COMPLETED). Tabel vendor_request_details menyimpan
            | riwayat lengkap perbandingan old_data, new_data, dan diff_data.
            |
            */

            $documentFields = array_keys(self::GENERAL_DOCUMENTS);

            $vendorData = collect($validated)
                ->except(array_merge(
                    [
                        'bank_accounts',
                        'withholding_tax_ids',
                        'vendor_subcategories',
                    ],
                    $documentFields
                ))
                ->all();

            $oldSnapshot = $vendor->toArray();
            $newPayload = array_merge($vendorData, [
                'vendor_subcategories' => $validated['vendor_subcategories'] ?? [],
                'bank_accounts' => $validated['bank_accounts'] ?? [],
                'withholding_tax_ids' => $validated['withholding_tax_ids'] ?? [],
            ]);

            // Hitung perbedaan field antara data lama dan data baru
            $diffData = [];
            foreach ($vendorData as $k => $v) {
                $oldVal = $oldSnapshot[$k] ?? null;
                if ((string)$oldVal !== (string)$v) {
                    $diffData[$k] = [
                        'field' => $k,
                        'old' => $oldVal,
                        'new' => $v,
                    ];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 2. CATAT REQUEST UPDATE DAN RIWAYAT PERUBAHAN
            |--------------------------------------------------------------------------
            */

            $formNumber = $this->createRequestNumber('UPDATE');

            $firstSubcat = collect($validated['vendor_subcategories'] ?? [])->first();
            $catId = $firstSubcat['category_id'] ?? $vendor->kategori_id;
            $catCode = null;
            if ($catId) {
                $cat = DB::table('vendor_categories')->find($catId);
                $catCode = $cat->cat_code ?? null;
            }

            $updateRequest = VendorRequest::create([
                'vendor_id' => $vendor->id,
                'request_type' => 'UPDATE',
                'cat_code' => $catCode,
                'form_number' => $formNumber,
                'requested_by_nik' => $user->nik ?? '90000000',
                'requested_by_email' => $user->email ?? null,
                'status' => 'PENDING_L1',
                'current_stage' => 'ASISTEN_KADIV',
                'submitted_at' => now(),
            ]);

            \App\Models\VendorRequestDetail::create([
                'vendor_request_id' => $updateRequest->id,
                'old_data' => $oldSnapshot,
                'new_data' => $newPayload,
                'diff_data' => $diffData,
                'changed_by_nik' => $user->nik ?? null,
                'changed_by_email' => $user->email ?? null,
            ]);

            $updateRequest->approvalHistories()->create([
                'approval_stage' => 'REQUESTER',
                'acted_by' => $user->id,
                'acted_by_name' => $user->name,
                'acted_by_nik' => $user->nik ?? null,
                'acted_by_email' => $user->email ?? null,
                'status' => 'Submitted',
                'notes' => 'Pengajuan perbaikan/update data vendor dikirim oleh Requester.',
                'acted_at' => now(),
                'signature_token' => bin2hex(random_bytes(32)),
            ]);

            // Inisialisasi Form Approvals untuk alur update ini
            if ($catCode) {
                $layers = DB::table('master_approval_layer')
                    ->where('cat_code', $catCode)
                    ->where('type', 'Approval')
                    ->orderBy('priority')
                    ->get();

                foreach ($layers as $layer) {
                    \App\Models\FormApproval::firstOrCreate(
                        [
                            'vendor_request_id' => $updateRequest->id,
                            'priority' => $layer->priority,
                        ],
                        [
                            'stage' => $layer->stage,
                            'nik' => $layer->nik,
                            'email' => $layer->email,
                            'status' => $layer->priority === 1 ? 'IN_PROGRESS' : 'WAITING',
                        ]
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 3. HAPUS REKENING YANG DIHAPUS DARI FORM
            |--------------------------------------------------------------------------
            */

            $vendor->bankAccounts()
                ->get()
                ->each(function ($bankAccount) use ($submittedBankIds) {
                    if (!$submittedBankIds->contains((int) $bankAccount->id)) {
                        $bankAccount->delete();
                    }
                });

            /*
            |--------------------------------------------------------------------------
            | 4. UPDATE ATAU TAMBAHKAN REKENING
            |--------------------------------------------------------------------------
            */

            foreach ($validated['bank_accounts'] as $index => $bank) {
                $bankData = [
                    'bank_name' => $bank['bank_name'],
                    'account_number' => $bank['account_number'],
                    'account_name' => $bank['account_name'],
                    'swift_code' => $bank['swift_code'] ?? null,
                    'is_primary' => false,
                ];

                if (!empty($bank['id'])) {
                    $bankAccount = $vendor->bankAccounts()
                        ->where('id', $bank['id'])
                        ->firstOrFail();

                    $bankAccount->update($bankData);
                } else {
                    $bankAccount = $vendor->bankAccounts()
                        ->create($bankData);
                }

                /*
                | Simpan dokumen rekening.
                | Setiap file menjadi record REKENING tersendiri.
                */

                $bankDocuments = $request->file(
                    "bank_accounts.{$index}.documents",
                    []
                );

                foreach ($bankDocuments as $file) {
                    $this->saveDocument(
                        $vendor,
                        $file,
                        'REKENING',
                        (int) $bankAccount->id,
                        $request
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 5. SIMPAN WITHHOLDING TAX
            |--------------------------------------------------------------------------
            */

            $vendor->withholdingTaxes()->sync(
                $validated['withholding_tax_ids']
            );

            /*
            |--------------------------------------------------------------------------
            | 6. SIMPAN DOKUMEN UMUM VENDOR
            |--------------------------------------------------------------------------
            |
            | Dokumen baru akan menjadi versi berikutnya.
            | Dokumen lama tetap tersimpan.
            |
            */

            $this->saveGeneralDocuments($vendor, $request);

            DB::commit();

            /*
            |--------------------------------------------------------------------------
            | 7. RESPONSE
            |--------------------------------------------------------------------------
            */

            $updatedVendor = $vendor->fresh()->load([
                'kategori',
                'vendorSubcategories.category',
                'paymentTerm',
                'bankAccounts.documents',
                'documents',
                'creator',
                'accountGroup',
                'reconAccount',
                'withholdingTaxes',
            ]);

            return response()->json([
                'message' => 'Vendor berhasil diperbarui.',
                'vendor' => $updatedVendor,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            report($e);

            return response()->json([
                'message' => 'Gagal memperbarui vendor.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan saat menyimpan data vendor.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE VENDOR
    |--------------------------------------------------------------------------
    */

    public function destroy($id)
    {
        $vendor = Vendor::findOrFail($id);

        $vendor->delete();

        return response()->json([
            'message' => 'Vendor berhasil dihapus.',
        ]);
    }
}
