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
        $typeAliases = [
            'NPWP_SPPKP' => ['NPWP_SPPKP', 'NPWP', 'SPPKP'],
            'IDENTITAS_PENGURUS' => ['IDENTITAS_PENGURUS', 'KTP', 'PASPOR'],
            'DOKUMENTASI_LOKASI' => ['DOKUMENTASI_LOKASI', 'SURAT_KETERANGAN_DOMISILI', 'FOTO_TEMPAT_USAHA', 'DOMISILI'],
            'PERIZINAN_PEKERJAAN' => ['PERIZINAN_PEKERJAAN', 'SIUP', 'SBU'],
            'SERTIFIKASI_KOMPETENSI' => ['SERTIFIKASI_KOMPETENSI', 'SERTIFIKAT'],
            'DOKUMEN_PENDUKUNG' => ['DOKUMEN_PENDUKUNG', 'LAINNYA'],
        ];

        foreach (self::GENERAL_DOCUMENTS as $field => $documentType) {
            $files = $request->file($field, []);
            if (!is_array($files)) {
                $files = $files ? [$files] : [];
            }

            // Jika field kosong, periksa format documents[TYPE] dan aliasnya
            if (empty($files)) {
                $aliases = $typeAliases[$documentType] ?? [$documentType];
                foreach ($aliases as $alias) {
                    $docFile = $request->file("documents.{$alias}");
                    if ($docFile) {
                        $files = is_array($docFile) ? $docFile : [$docFile];
                        break;
                    }
                }
            }

            foreach ($files as $file) {
                if ($file && $file->isValid()) {
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

        // Tangani dokumen tambahan jika ada di format documents[CUSTOM_TYPE]
        $processedTypes = array_values(self::GENERAL_DOCUMENTS);
        $allDocFiles = $request->file('documents', []);
        if (is_array($allDocFiles)) {
            foreach ($allDocFiles as $customType => $fileList) {
                $customTypeUpper = strtoupper((string) $customType);
                $isHandled = false;
                foreach ($typeAliases as $mainType => $aliasList) {
                    if (in_array($customTypeUpper, $aliasList, true)) {
                        $isHandled = true;
                        break;
                    }
                }
                if ($isHandled || in_array($customTypeUpper, $processedTypes, true)) {
                    continue;
                }

                $files = is_array($fileList) ? $fileList : [$fileList];
                foreach ($files as $f) {
                    if ($f && $f->isValid()) {
                        $this->saveDocument(
                            $vendor,
                            $f,
                            $customTypeUpper,
                            null,
                            $request
                        );
                    }
                }
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

            $isOther = $this->isCategoryOther($category);

            if ($isOther) {
                if (blank($item['category_other'] ?? null)) {
                    return 'Nama kategori Other wajib diisi.';
                }
            } elseif (!blank($item['category_other'] ?? null)) {
                return 'Nama kategori lainnya hanya boleh diisi jika memilih Other.';
            }
        }

        return null;
    }

    /**
     * Mengecek apakah kategori merupakan kategori 'Other' / khusus
     */
    private function isCategoryOther($category): bool
    {
        if (!$category) {
            return false;
        }

        $desc = strtolower(trim((string) ($category->category_desc ?? $category->name ?? '')));
        $catCode = strtoupper(trim((string) ($category->cat_code ?? '')));

        return str_contains($desc, 'other') || in_array($catCode, ['VMS_012', 'VMS_015']);
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

            $isOther = $this->isCategoryOther($category);

            $vendor->vendorSubcategories()->create([
                'category_id' => $item['category_id'],
                'category_other' => $isOther && !blank($item['category_other'] ?? null)
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
            'latestRequest',
            'requests',
        ])
            ->whereNotNull('vendor_code')
            ->where('vendor_code', '!=', '')
            ->where(function ($query) {
                $query->where('source_type', 'EXISTING')
                    ->orWhereHas('requests', function ($rq) {
                        $rq->where('current_stage', 'COMPLETED')
                            ->orWhere('status', 'COMPLETED');
                    });
            })
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
        $now = now();
        $year = (int) $now->format('Y');
        $dateStr = $now->format('Ymd');
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
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $sequence = DB::table('request_sequences')
            ->where('year', $year)
            ->where('form_type', $formType)
            ->where('status', $status)
            ->lockForUpdate()
            ->first();

        $reqnum = $sequence ? ((int) $sequence->last_number + 1) : 1;

        // Pastikan nomor request benar-benar unik dan belum ada di vendor_requests
        do {
            $candidate = sprintf(
                'HRIS-VMS-%s-%s%03d',
                $prefix,
                $dateStr,
                $reqnum
            );
            $exists = DB::table('vendor_requests')
                ->where('form_number', $candidate)
                ->exists();
            if ($exists) {
                $reqnum++;
            }
        } while ($exists);

        if ($sequence) {
            DB::table('request_sequences')
                ->where('id', $sequence->id)
                ->update([
                    'last_number' => $reqnum,
                    'updated_at' => $now,
                ]);
        }

        return $candidate;
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

        if ($action === 'draft') {
            $rules = [
                'action' => ['required', 'in:draft,submit'],

                // DATA PERUSAHAAN (Untuk draft, hanya nama_perusahaan yang wajib)
                'nama_perusahaan' => 'required|string|max:255',
                'search_term' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:100',

                // CONTACT
                'phone' => 'nullable|string|max:50',
                'mobile_phone' => 'nullable|string|max:50',
                'fax' => 'nullable|string|max:50',
                'pic_vendor' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',

                // DATA PROCUREMENT
                'npwp' => 'nullable|string|max:100',
                'business_type' => 'nullable|string|max:255',

                // KATEGORI DAN SUBKATEGORI
                'vendor_subcategories' => [
                    'nullable',
                    'array',
                ],
                'vendor_subcategories.*.category_id' => [
                    'nullable',
                    'integer',
                    'exists:vendor_categories,id',
                ],
                'vendor_subcategories.*.subcategory' => [
                    'nullable',
                    'in:Material,Jasa',
                ],
                'vendor_subcategories.*.category_other' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                // PAYMENT
                'payment_term_id' => 'nullable|exists:payment_terms,id',
                'payment_term_other' => 'nullable|string|max:255',
                'order_currency' => 'nullable|in:IDR,USD,OTHER',
                'order_currency_other' => 'nullable|string|max:255',

                // BANK ACCOUNTS
                'bank_accounts' => [
                    'nullable',
                    'array',
                ],
                'bank_accounts.*.bank_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'bank_accounts.*.account_number' => [
                    'nullable',
                    'string',
                    'max:100',
                ],
                'bank_accounts.*.account_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'bank_accounts.*.swift_code' => [
                    'nullable',
                    'string',
                    'max:50',
                ],
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
        } else {
            $rules = [
                'action' => ['required', 'in:draft,submit'],

                // DATA PERUSAHAAN
                'nama_perusahaan' => 'required|string|max:255',
                'search_term' => 'nullable|string|max:255',
                'address' => 'required|string',
                'city' => 'required|string|max:100',
                'postal_code' => 'required|string|max:20',
                'country' => 'nullable|string|max:100',

                // CONTACT
                'phone' => 'required|string|max:50',
                'mobile_phone' => 'required|string|max:50',
                'fax' => 'nullable|string|max:50',
                'pic_vendor' => 'required|string|max:255',
                'email' => 'required|email|max:255',

                // DATA PROCUREMENT
                'npwp' => 'required|string|max:100',
                'business_type' => 'nullable|string|max:255',

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
                'payment_term_id' => 'nullable|exists:payment_terms,id',
                'payment_term_other' => 'nullable|string|max:255',
                'order_currency' => 'nullable|in:IDR,USD,OTHER',
                'order_currency_other' => 'nullable|string|max:255',

                // BANK ACCOUNTS
                'bank_accounts' => [
                    'required',
                    'array',
                    'min:1',
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
        }

        $messages = [
            'nama_perusahaan.required' => 'Nama Perusahaan wajib diisi.',
            'address.required' => 'Alamat (Street Address) wajib diisi.',
            'city.required' => 'Kota wajib diisi.',
            'postal_code.required' => 'Kode Pos wajib diisi.',
            'phone.required' => 'Nomor Telepon wajib diisi.',
            'mobile_phone.required' => 'Nomor Handphone wajib diisi.',
            'pic_vendor.required' => 'Nama PIC Vendor wajib diisi.',
            'email.required' => 'Email PIC Vendor wajib diisi.',
            'email.email' => 'Format email PIC Vendor tidak valid.',
            'npwp.required' => 'Nomor NPWP wajib diisi.',
            'vendor_subcategories.required' => 'Pilih minimal satu Kategori dan Subkategori Vendor.',
            'bank_accounts.required' => 'Minimal satu data Rekening Bank wajib diisi.',
            'bank_accounts.*.bank_name.required' => 'Nama Bank wajib diisi.',
            'bank_accounts.*.account_number.required' => 'Nomor Rekening wajib diisi.',
            'bank_accounts.*.account_name.required' => 'Nama Pemilik Rekening wajib diisi.',
        ];

        $validated = $request->validate(
            array_merge($rules, $this->generalDocumentRules()),
            $messages
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

            $firstSubcat = collect($validated['vendor_subcategories'] ?? [])->first();
            $catId = $firstSubcat['category_id'] ?? $request->input('kategori_id');
            $catOther = $firstSubcat['category_other'] ?? $request->input('kategori_other');

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
                'kategori_id' => $catId,
                'kategori_other' => $catOther,

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
                'form_number' => $this->createRequestNumber('CREATE'),

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
            'latestRequest',
        ])->findOrFail($id);

        if (empty($vendor->kategori_id) && $vendor->vendorSubcategories->isNotEmpty()) {
            $firstSub = $vendor->vendorSubcategories->first();
            $vendor->kategori_id = $firstSub->category_id;
            if (!$vendor->kategori && $firstSub->category) {
                $vendor->setRelation('kategori', $firstSub->category);
            }
        }

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
        $user = $request->user() ?: \Illuminate\Support\Facades\Auth::user();
        if (!$user && auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
        }
        if (!$user) {
            $user = \App\Models\User::first();
        }

        $role = strtoupper($user->role?->name ?? $user->role ?? '');
        $isAdmin = (bool) ($user->is_admin ?? false) || $role === 'ADMIN';
        $canUpdate = $isAdmin || in_array($role, ['REQUESTER', 'PROCUREMENT']);
        if (!$canUpdate) {
            return response()->json([
                'message' => 'Hanya Administrator dan Requester yang memiliki hak akses untuk mengedit data vendor.',
            ], 403);
        }

        if ($vendor->is_active === false && !$isAdmin) {
            return response()->json([
                'message' => 'Vendor ini sedang dinonaktifkan dan tidak dapat diajukan perbaikan. Hubungi Administrator untuk mengaktifkan kembali.',
            ], 403);
        }

        if (blank($vendor->vendor_code)) {
            return response()->json([
                'message' => 'Update hanya dapat dilakukan pada vendor yang sudah memiliki Vendor Code SAP.',
            ], 422);
        }

        // Normalisasi vendor_subcategories jika dikirim melalui kategori_id dan subcategories
        if (!$request->has('vendor_subcategories') && $request->filled('kategori_id')) {
            $catId = (int) $request->input('kategori_id');
            $catOther = $request->input('kategori_other');
            $subs = $request->input('subcategories', ['Material', 'Jasa']);
            if (is_string($subs)) {
                $subs = explode(',', $subs);
            }
            $vendorSubcategories = [];
            foreach ((array) $subs as $sub) {
                $sub = trim((string) $sub);
                if ($sub !== '') {
                    $vendorSubcategories[] = [
                        'category_id' => $catId,
                        'subcategory' => $sub,
                        'category_other' => $catOther,
                    ];
                }
            }
            if (empty($vendorSubcategories)) {
                $vendorSubcategories = [
                    ['category_id' => $catId, 'subcategory' => 'Material', 'category_other' => $catOther],
                    ['category_id' => $catId, 'subcategory' => 'Jasa', 'category_other' => $catOther],
                ];
            }
            $request->merge(['vendor_subcategories' => $vendorSubcategories]);
        }

        // Normalisasi string kosong pada field nullable
        $nullableFields = [
            'account_group_id',
            'recon_account_id',
            'payment_method',
            'payment_term_other',
            'order_currency_other',
            'business_type',
            'search_term',
            'kategori_other',
        ];
        $merges = [];
        foreach ($nullableFields as $field) {
            if ($request->has($field) && $request->input($field) === '') {
                $merges[$field] = null;
            }
        }
        if (!empty($merges)) {
            $request->merge($merges);
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
            'fax' => ['nullable', 'string', 'max:50'],
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

            // DATA SAP / ACCOUNTING
            'company_code_purch_org' => [
                'nullable',
                'string',
                'max:255',
            ],

            'account_group_id' => [
                'nullable',
                'exists:account_groups,id',
            ],

            'recon_account_id' => [
                'nullable',
                'exists:recon_accounts,id',
            ],

            'payment_method' => [
                'nullable',
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
            'withholding_tax_ids' => ['nullable', 'array'],

            'withholding_tax_ids.*' => [
                'integer',
                'distinct',
                'exists:withholding_taxes,id',
            ],
        ];

        $validated = $request->validate(
            array_merge($rules, $this->generalDocumentRules())
        );

        // Field SAP dikunci dan dijaga dari data vendor
        if (!$isAdmin) {
            $validated['company_code_purch_org'] = $vendor->company_code_purch_org ?: '1200 / 1300 (PROJECT BAKTI)';
            $validated['vendor_code'] = $vendor->vendor_code;
        }

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
        | VALIDASI KEPEMILIKAN REKENING (KHUSUS ADMIN DIRECT UPDATE)
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

        if ($isAdmin) {
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
        }

        DB::beginTransaction();

        try {
            /*
            |--------------------------------------------------------------------------
            | 1. SIAPKAN DATA LAMA (OLD) DAN DATA BARU (NEW) BESERTA DIFF
            |--------------------------------------------------------------------------
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

            $fieldMeta = [
                'nama_perusahaan' => ['label' => 'Nama Perusahaan', 'role' => 'REQUESTER'],
                'search_term' => ['label' => 'Search Term', 'role' => 'REQUESTER'],
                'business_type' => ['label' => 'Business Type', 'role' => 'REQUESTER'],
                'address' => ['label' => 'Alamat Perusahaan', 'role' => 'REQUESTER'],
                'city' => ['label' => 'Kota', 'role' => 'REQUESTER'],
                'postal_code' => ['label' => 'Kode Pos', 'role' => 'REQUESTER'],
                'country' => ['label' => 'Negara', 'role' => 'REQUESTER'],
                'phone' => ['label' => 'Nomor Telepon', 'role' => 'REQUESTER'],
                'mobile_phone' => ['label' => 'No. Handphone / PIC', 'role' => 'REQUESTER'],
                'fax' => ['label' => 'Fax', 'role' => 'REQUESTER'],
                'pic_vendor' => ['label' => 'Contact Person / PIC', 'role' => 'REQUESTER'],
                'email' => ['label' => 'Email Perusahaan', 'role' => 'REQUESTER'],
                'npwp' => ['label' => 'NPWP', 'role' => 'REQUESTER'],
                'payment_term_id' => ['label' => 'Term of Payment', 'role' => 'REQUESTER'],
                'order_currency' => ['label' => 'Mata Uang (Order Currency)', 'role' => 'REQUESTER'],
                'account_group_id' => ['label' => 'Account Group', 'role' => 'ACCOUNTING'],
                'recon_account_id' => ['label' => 'Recon Account', 'role' => 'ACCOUNTING'],
                'payment_method' => ['label' => 'Payment Method', 'role' => 'ACCOUNTING'],
                'company_code_purch_org' => ['label' => 'Company Code / Purch Org', 'role' => 'SAP'],
                'vendor_code' => ['label' => 'Vendor Code SAP', 'role' => 'SAP'],
            ];

            $oldSnapshot = $vendor->toArray();
            $oldSnapshot['bank_accounts'] = $vendor->bankAccounts->map(fn($b) => [
                'bank_name' => $b->bank_name,
                'account_number' => $b->account_number,
                'account_name' => $b->account_name,
                'swift_code' => $b->swift_code,
            ])->toArray();
            $oldSnapshot['vendor_subcategories'] = $vendor->vendorSubcategories->pluck('subcategory')->toArray();
            $oldSnapshot['withholding_tax_ids'] = $vendor->withholdingTaxes->pluck('id')->map(fn($id) => (int)$id)->toArray();

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
                        'label' => $fieldMeta[$k]['label'] ?? ucwords(str_replace('_', ' ', $k)),
                        'role' => $fieldMeta[$k]['role'] ?? 'REQUESTER',
                        'old' => $oldVal,
                        'new' => $v,
                    ];
                }
            }

            // Cek perbedaan Rekening Bank
            $oldBankList = collect($oldSnapshot['bank_accounts'])->map(fn($b) => "{$b['bank_name']} - {$b['account_number']} ({$b['account_name']})")->values();
            $newBankList = collect($validated['bank_accounts'] ?? [])->map(fn($b) => "{$b['bank_name']} - {$b['account_number']} ({$b['account_name']})")->values();
            if ($oldBankList->join('|') !== $newBankList->join('|')) {
                $diffData['bank_accounts'] = [
                    'field' => 'bank_accounts',
                    'label' => 'Rekening Bank',
                    'role' => 'REQUESTER',
                    'old' => $oldBankList->join("\n") ?: 'Belum ada rekening',
                    'new' => $newBankList->join("\n") ?: 'Belum ada rekening',
                    'old_items' => $oldSnapshot['bank_accounts'],
                    'new_items' => $validated['bank_accounts'] ?? [],
                ];
            }

            // Cek perbedaan Subkategori
            $oldSubcats = collect($oldSnapshot['vendor_subcategories'])->join(', ');
            $newSubcats = collect($validated['vendor_subcategories'] ?? [])->pluck('subcategory')->join(', ');
            if ($oldSubcats !== $newSubcats) {
                $diffData['vendor_subcategories'] = [
                    'field' => 'vendor_subcategories',
                    'label' => 'Subkategori',
                    'role' => 'REQUESTER',
                    'old' => $oldSubcats ?: '-',
                    'new' => $newSubcats ?: '-',
                ];
            }

            // Cek perbedaan Withholding Tax
            $oldTaxIds = collect($oldSnapshot['withholding_tax_ids'] ?? [])->map(fn($id) => (int)$id)->sort()->values();
            $newTaxIds = collect($validated['withholding_tax_ids'] ?? [])->map(fn($id) => (int)$id)->sort()->values();
            if ($oldTaxIds->join(',') !== $newTaxIds->join(',')) {
                $oldTaxLabels = DB::table('withholding_taxes')->whereIn('id', $oldTaxIds)->pluck('name')->join(', ');
                $newTaxLabels = DB::table('withholding_taxes')->whereIn('id', $newTaxIds)->pluck('name')->join(', ');
                $diffData['withholding_tax_ids'] = [
                    'field' => 'withholding_tax_ids',
                    'label' => 'Withholding Tax (PPH)',
                    'role' => 'TAX',
                    'old' => $oldTaxLabels ?: 'Belum ada pajak',
                    'new' => $newTaxLabels ?: 'Belum ada pajak',
                    'old_items' => $oldTaxIds->toArray(),
                    'new_items' => $newTaxIds->toArray(),
                ];
            }

            $updateRequest = null;
            $formNumber = null;

            if ($isAdmin) {
                /*
                |--------------------------------------------------------------------------
                | DIRECT UPDATE OLEH ADMINISTRATOR
                |--------------------------------------------------------------------------
                */
                $vendor->update($vendorData);

                $vendor->vendorSubcategories()->delete();
                $vendor->vendorSubcategories()->createMany(
                    $validated['vendor_subcategories']
                );

                $vendor->bankAccounts()
                    ->get()
                    ->each(function ($bankAccount) use ($submittedBankIds) {
                        if (!$submittedBankIds->contains((int) $bankAccount->id)) {
                            $bankAccount->delete();
                        }
                    });

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

                $vendor->withholdingTaxes()->sync(
                    $validated['withholding_tax_ids']
                );
            } else {
                /*
                |--------------------------------------------------------------------------
                | PENGAJUAN UPDATE OLEH REQUESTER (MELALUI ALUR APPROVAL)
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

                $actedById = $user?->id ?? 1;
                $actedByName = $user?->name ?? 'Requester';
                $actedByNik = $user?->nik ?? '90000000';
                $actedByEmail = $user?->email ?? null;

                $updateRequest = VendorRequest::create([
                    'vendor_id' => $vendor->id,
                    'request_type' => 'UPDATE',
                    'cat_code' => $catCode,
                    'form_number' => $formNumber,
                    'requested_by_nik' => $actedByNik,
                    'requested_by_email' => $actedByEmail,
                    'status' => 'PENDING_L1',
                    'current_stage' => 'ASISTEN_KADIV',
                    'submitted_at' => now(),
                ]);

                \App\Models\VendorRequestDetail::create([
                    'vendor_request_id' => $updateRequest->id,
                    'old_data' => $oldSnapshot,
                    'new_data' => $newPayload,
                    'diff_data' => $diffData,
                    'changed_by_nik' => $actedByNik,
                    'changed_by_email' => $actedByEmail,
                ]);

                $updateRequest->approvalHistories()->create([
                    'approval_stage' => 'REQUESTER',
                    'acted_by' => $actedById,
                    'acted_by_name' => $actedByName,
                    'acted_by_nik' => $actedByNik,
                    'acted_by_email' => $actedByEmail,
                    'status' => 'Submitted',
                    'notes' => 'Pengajuan perbaikan/update data vendor dikirim oleh Requester.',
                    'acted_at' => now(),
                    'signature_token' => bin2hex(random_bytes(32)),
                ]);

                // Tentukan approval stages yang dibutuhkan untuk alur update ini
                $accountingFields = [
                    'account_group_id',
                    'account_group_other',
                    'recon_account_id',
                    'recon_account_other',
                    'payment_method',
                ];
                $hasAccountingChange = false;
                foreach ($accountingFields as $af) {
                    if (isset($diffData[$af])) {
                        $hasAccountingChange = true;
                        break;
                    }
                }

                // Terkhusus rekening bank, meskipun diinput requester, tetap memerlukan persetujuan dari Tim Tax
                $hasTaxChange = isset($diffData['withholding_tax_ids']) || isset($diffData['bank_accounts']);

                $requiredStages = ['ASISTEN_KADIV', 'KADIV'];
                if ($hasAccountingChange) {
                    $requiredStages[] = 'ACCOUNTING';
                }
                if ($hasTaxChange) {
                    $requiredStages[] = 'TAX';
                }
                $requiredStages[] = 'SAP';

                // Inisialisasi Form Approvals dinamis untuk alur update ini
                if ($catCode) {
                    $layers = DB::table('master_approval_layer')
                        ->where('cat_code', $catCode)
                        ->where('type', 'Approval')
                        ->orderBy('priority')
                        ->get();

                    $filteredLayers = $layers->filter(function ($layer) use ($requiredStages) {
                        return in_array($layer->stage, $requiredStages, true);
                    })->values();

                    $seqPriority = 1;
                    foreach ($filteredLayers as $layer) {
                        \App\Models\FormApproval::create([
                            'vendor_request_id' => $updateRequest->id,
                            'stage' => $layer->stage,
                            'priority' => $seqPriority,
                            'nik' => $layer->nik,
                            'email' => $layer->email,
                            'status' => $seqPriority === 1 ? 'IN_PROGRESS' : 'WAITING',
                        ]);
                        $seqPriority++;
                    }
                }
            }

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
                'message' => $isAdmin
                    ? 'Data vendor berhasil diperbarui secara langsung oleh Administrator.'
                    : 'Pengajuan perubahan data vendor berhasil dikirim ke antrean approval (Level 1: Asisten Kadiv).',
                'vendor' => $updatedVendor,
                'request_id' => $updateRequest->id ?? null,
                'form_number' => $formNumber ?? null,
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
    | TOGGLE STATUS (ACTIVE / NONACTIVE) - ADMIN ONLY
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya Administrator yang berhak mengubah status aktif/nonaktif vendor.',
            ], 403);
        }

        $vendor = Vendor::findOrFail($id);

        if ($request->has('is_active')) {
            $vendor->is_active = $request->boolean('is_active');
        } else {
            $vendor->is_active = !$vendor->is_active;
        }

        $vendor->save();

        $statusText = $vendor->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'message' => "Vendor {$vendor->nama_perusahaan} berhasil {$statusText}.",
            'data' => $vendor->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE VENDOR (DISABLED)
    |--------------------------------------------------------------------------
    */

    public function destroy($id)
    {
        return response()->json([
            'message' => 'Vendor tidak dapat dihapus. Status vendor dapat diubah menjadi Aktif atau Nonaktif hanya oleh Administrator.',
        ], 403);
    }
}
