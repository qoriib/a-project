<?php

namespace App\Http\Controllers;

use App\Models\VendorDocument;
use App\Models\VendorRequest;
use App\Models\MasterApproval;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class VendorRequestController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP
    |--------------------------------------------------------------------------
    */

    private function vendorRelations()
    {
        return [
            'vendor.kategori', // sementara untuk kompatibilitas data lama
            'vendor.vendorSubcategories.category',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'requester',
            'details',
            'approvalHistories',
        ];
    }


    /**
     * Menyimpan kombinasi kategori dan subkategori vendor.
     */
    private function saveVendorSubcategories($vendor, array $items): void
    {
        foreach ($items as $item) {
            $vendor->vendorSubcategories()->create([
                'category_id' => $item['category_id'],
                'subcategory' => $item['subcategory'],
            ]);
        }
    }

    /**
     * Memastikan kombinasi kategori dan subkategori tidak duplikat.
     */
    private function validateVendorSubcategories(array $items): ?string
    {
        $combinations = [];

        foreach ($items as $item) {
            $key = $item['category_id'] . '-' . $item['subcategory'];

            if (in_array($key, $combinations, true)) {
                return 'Kombinasi kategori dan subkategori tidak boleh dipilih lebih dari satu kali.';
            }

            $combinations[] = $key;
        }

        return null;
    }


/*
|--------------------------------------------------------------------------
| MASTER APPROVAL ACCESS
|--------------------------------------------------------------------------
*/

    /**
     * Mengambil konfigurasi akses pegawai yang masih berlaku.
     */
    private function getMasterApproval(
        Request $request,
        string $stage,
        string $permission
    ): ?MasterApproval {
        $user = $request->user();

        if (!$user || !$user->nik) {
            return null;
        }

        // Admin tidak dibatasi Master Approval.
        if ($user->isAdmin()) {
            return null;
        }

        return MasterApproval::query()
            ->where('nik', $user->nik)
            ->where('approval_stage', strtoupper($stage))
            ->where($permission, true)
            ->where('can_view', true)
            ->whereDate('start_date', '<=', now()->toDateString())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', now()->toDateString());
            })
            ->first();
    }

    /**
     * Mengambil permission pengguna berdasarkan stage.
     */
    /**
     * Mengambil permission pengguna berdasarkan stage.
     */
    private function getStagePermissions(
        Request $request,
        string $stage
    ): array {
        $user = $request->user();

        $default = [
            'can_view' => false,
            'can_edit' => false,
            'can_approve' => false,
            'is_admin' => false,
        ];

        if (!$user) {
            return $default;
        }

        // Admin memiliki akses penuh.
        if ($user->isAdmin()) {
            return [
                'can_view' => true,
                'can_edit' => true,
                'can_approve' => true,
                'is_admin' => true,
            ];
        }

        $roleName = strtoupper($user->role?->name ?? '');
        $upperStage = strtoupper($stage);

        $hasRole = false;
        $canEdit = false;
        $canApprove = false;

        if ($upperStage === 'REQUESTER' && in_array($roleName, ['REQUESTER', 'PROCUREMENT'])) {
            $hasRole = true;
            $canEdit = true;
        } elseif ($upperStage === 'ASISTEN_KADIV' && $roleName === 'ASISTEN_KADIV') {
            $hasRole = true;
            $canApprove = true;
        } elseif ($upperStage === 'KADIV' && $roleName === 'KADIV') {
            $hasRole = true;
            $canApprove = true;
        } elseif ($upperStage === 'ACCOUNTING' && $roleName === 'ACCOUNTING') {
            $hasRole = true;
            $canEdit = true;
            $canApprove = true;
        } elseif ($upperStage === 'TAX' && $roleName === 'TAX') {
            $hasRole = true;
            $canEdit = true;
            $canApprove = true;
        } elseif ($upperStage === 'SAP' && $roleName === 'SAP') {
            $hasRole = true;
            $canEdit = true;
            $canApprove = true;
        }

        // Check master_approval_layer
        $today = now()->toDateString();
        $inLayer = DB::table('master_approval_layer')
            ->where('stage', $upperStage)
            ->where(function ($q) use ($user) {
                $q->where('nik', $user->nik);
                if (!empty($user->substitute_nik)) {
                    $q->orWhere('nik', $user->substitute_nik);
                }
            })
            ->whereDate('start_date', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $today);
            })
            ->exists();

        if ($inLayer) {
            $hasRole = true;
            $canApprove = true;
        }

        // Check master_approvals table
        $approvals = MasterApproval::query()
            ->where('nik', $user->nik)
            ->where('approval_stage', $upperStage)
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->get();

        if ($approvals->isNotEmpty()) {
            $canViewOld = $approvals->contains(fn($item) => (bool) $item->can_view);
            $canEdit = $canEdit || ($canViewOld && $approvals->contains(fn($item) => (bool) $item->can_edit));
            $canApprove = $canApprove || ($canViewOld && $approvals->contains(fn($item) => (bool) $item->can_approve));
            if ($canViewOld) {
                $hasRole = true;
            }
        }

        $canView = $hasRole || $canEdit || $canApprove;

        return [
            'can_view' => $canView,
            'can_edit' => $canEdit,
            'can_approve' => $canApprove,
            'is_admin' => false,
        ];
    }

    /**
     * Memastikan pengguna merupakan Staff/PIC
     * yang ditunjuk untuk stage tertentu.
     */
    private function ensureStaffAccess(
        Request $request,
        VendorRequest $vendorRequest,
        string $stage
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $isAdmin = $user->isAdmin();

        if (!$isAdmin) {
            $perms = $this->getStagePermissions($request, $stage);

            if (!$perms['can_edit'] && !$perms['can_view']) {
                return response()->json([
                    'message' => 'Anda tidak memiliki akses Staff/PIC pada tahap ini.',
                ], 403);
            }
        }

        if (
            strtoupper($vendorRequest->current_stage ?? '') !==
            strtoupper($stage)
        ) {
            return response()->json([
                'message' => 'Request tidak berada pada tahap yang sesuai (' . $vendorRequest->current_stage . ').',
            ], 422);
        }

        if (in_array(strtoupper($vendorRequest->status ?? ''), ['REJECTED', 'COMPLETED', 'DONE'])) {
            return response()->json([
                'message' => 'Request sudah berstatus ' . $vendorRequest->status . ' dan tidak dapat diedit.',
            ], 422);
        }

        return null;
    }

    /**
     * Mengambil Staff terakhir yang mengirimkan data
     * untuk stage yang sedang menunggu approval.
     */
    private function getSubmittedStaff(
        VendorRequest $vendorRequest,
        string $stage
    ): ?User {
        $history = $vendorRequest->approvalHistories()
            ->where('approval_stage', strtoupper($stage))
            ->where('status', 'Under Review')
            ->latest('acted_at')
            ->first();

        if (!$history || !$history->acted_by_nik) {
            return null;
        }

        return User::where('nik', $history->acted_by_nik)->first();
    }

    /**
     * Memastikan Kadiv yang login adalah divhead Staff
     * yang mengirimkan request dan mempunyai hak approve.
     */

    /**
     * Memastikan pengguna memiliki hak approval pada stage tertentu.
     * Tidak membatasi approval berdasarkan jabatan atau hubungan divhead.
     */
    private function ensureApprovalAccess(
        Request $request,
        VendorRequest $vendorRequest,
        string $stage
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $isAdmin = $user->isAdmin();

        if (!$isAdmin) {
            $perms = $this->getStagePermissions($request, $stage);

            if (!$perms['can_approve']) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak approval pada tahap ini.',
                ], 403);
            }
        }

        if (
            strtoupper($vendorRequest->current_stage ?? '') !== strtoupper($stage)
        ) {
            return response()->json([
                'message' => 'Request tidak berada pada tahap yang sesuai (' . $vendorRequest->current_stage . ').',
            ], 422);
        }

        if (in_array(strtoupper($vendorRequest->status ?? ''), ['REJECTED', 'COMPLETED', 'DONE'])) {
            return response()->json([
                'message' => 'Request sudah berstatus ' . $vendorRequest->status . ' dan tidak dapat diproses lagi.',
            ], 422);
        }

        return null;
    }




    /*
    |--------------------------------------------------------------------------
    | SEMUA REQUEST
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $requests = VendorRequest::with([
            'vendor.kategori',
            'vendor.vendorSubcategories.category',
            'requester',
        ])
            ->latest()
            ->get();

        return response()->json($requests);
    }


    /*
    |--------------------------------------------------------------------------
    | ALL NEW VENDOR REQUESTS
    |--------------------------------------------------------------------------
    |
    | Mengambil seluruh pengajuan New Vendor dari semua tahap.
    | Digunakan pada halaman Admin > New Vendor.
    |
*/


    public function allNewVendorRequests(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk melihat seluruh pengajuan New Vendor.',
            ], 403);
        }

        $requests = VendorRequest::with([
            'vendor.kategori',
            'vendor.vendorSubcategories.category',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'requester',
            'approvalHistories.actor',
        ])
            ->where('request_type', 'CREATE')
            ->whereHas('vendor', function ($query) {
                $query->where('source_type', 'NEW');
            })
            ->latest()
            ->get();

        // Tambahkan informasi penolakan terakhir.
        $requests->each(function ($vendorRequest) {
            $rejection = $vendorRequest->approvalHistories
                ->where('status', 'Rejected')
                ->sortByDesc('acted_at')
                ->first();

            if (!$rejection) {
                $vendorRequest->rejection_info = null;
                return;
            }

            $approval = \App\Models\MasterApproval::where(
                'nik',
                $rejection->acted_by_nik
            )
                ->where('approval_stage', $rejection->approval_stage)
                ->first();

            $roleLabel = 'Staff';

            if ($approval && $approval->can_approve) {
                $roleLabel = 'Kadiv';
            }

            $stageLabels = [
                'REQUESTER' => 'Requester',
                'ACCOUNTING' => 'Accounting',
                'TAX' => 'Tax',
                'SAP' => 'SAP',
            ];

            $vendorRequest->rejection_info = [
                'stage' => $rejection->approval_stage,
                'name' => $rejection->actor?->name,
                'role' => $roleLabel,
                'label' => 'Ditolak oleh ' . $roleLabel . ' ' .
                    ($stageLabels[$rejection->approval_stage] ?? ''),
                'notes' => $rejection->notes,
                'acted_at' => $rejection->acted_at,
            ];
        });

        // PENTING: Kembalikan response JSON ke React.
        return response()->json([
            'message' => 'Data pengajuan New Vendor berhasil diambil.',
            'data' => $requests,
        ], 200);
    }



    /*
    |--------------------------------------------------------------------------
    | REQUEST BERDASARKAN STAGE
    |--------------------------------------------------------------------------
    |
    */

    public function byStage(Request $request, $stage)
    {
        $allowedStages = ['REQUESTER', 'ASISTEN_KADIV', 'KADIV', 'ACCOUNTING', 'TAX', 'SAP'];

        $stage = strtoupper($stage);

        if (!in_array($stage, $allowedStages, true)) {
            return response()->json([
                'message' => 'Stage tidak valid.'
            ], 422);
        }

        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $permissions = $this->getStagePermissions($request, $stage);

        if (!$permissions['can_view'] && !$permissions['is_admin']) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk melihat request pada tahap ini.'
            ], 403);
        }

        $query = VendorRequest::with([
            'vendor.kategori',
            'vendor.vendorSubcategories.category',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'requester',
            'approvalHistories.actor',
        ])
            ->whereIn('request_type', ['CREATE', 'UPDATE'])
            ->where('current_stage', $stage);

        // Jika bukan admin, jangan tampilkan request yang sudah selesai di tahap lain
        if (!$permissions['is_admin']) {
            $query->whereNotIn('status', ['COMPLETED', 'DONE']);
        }

        $requests = $query->latest()->get();

        return response()->json([
            'data' => $requests,
            'permissions' => $permissions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL REQUEST
    |--------------------------------------------------------------------------
    */

    public function show(Request $request, $id)
    {
        $requestData = VendorRequest::with(
            $this->vendorRelations()
        )->findOrFail($id);

        // Hanya request CREATE yang menggunakan approval workflow.
        if ($requestData->request_type !== 'CREATE') {
            return response()->json([
                'message' => 'Request tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        $stage = strtoupper($requestData->current_stage);

        $allowedStages = [
            'REQUESTER',
            'ACCOUNTING',
            'TAX',
            'SAP',
        ];

        if (!in_array($stage, $allowedStages, true)) {
            return response()->json([
                'message' => 'Tahap request tidak valid.',
            ], 403);
        }

        // Ambil permission user pada stage request ini.
        $permissions = $this->getStagePermissions(
            $request,
            $stage
        );

        if (!$permissions['can_view']) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk melihat request ini.',
            ], 403);
        }

        return response()->json([
            'data' => $requestData,
            'permissions' => $permissions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROCUREMENT
    |--------------------------------------------------------------------------
    |
    |
    */

    public function updateProcurement(Request $request, $id)
    {
    /*
    |--------------------------------------------------------------------------
    | VALIDASI INPUT
    |--------------------------------------------------------------------------
    */

        $validated = $request->validate([
            // DATA PERUSAHAAN
            'nama_perusahaan' => 'required|string|max:255',
            'search_term' => 'nullable|string|max:255',
            'pic_vendor' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile_phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',

            // KATEGORI DAN SUBKATEGORI
            'vendor_subcategories' => [
                'required_if:action,submit',
                'array',
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

            'business_type' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:100',

            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',

            'action' => 'required|in:draft,submit',

            // BANK ACCOUNTS
            'bank_accounts' => [
                'required',
                'array',
                'min:1',
            ],

            'bank_accounts.*.id' => [
                'nullable',
                'integer',
                'distinct',
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
                'max:5120',
            ],

            // DATA PAYMENT DAN SAP
            'payment_method' => 'nullable|string|max:255',
            'company_code_purch_org' => 'nullable|string|max:255',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'payment_term_other' => 'nullable|string|max:255',
            'order_currency' => 'nullable|string|max:20',
            'order_currency_other' => 'nullable|string|max:255',

            // DOKUMEN UMUM VENDOR
            'dokumen_umum' => 'sometimes|array',

            'struktur_organisasi_files' => ['sometimes', 'array'],
            'struktur_organisasi_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'akta_pendirian_files' => ['sometimes', 'array'],
            'akta_pendirian_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'akta_perubahan_files' => ['sometimes', 'array'],
            'akta_perubahan_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'company_profile_files' => ['sometimes', 'array'],
            'company_profile_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'npwp_sppkp_files' => ['sometimes', 'array'],
            'npwp_sppkp_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'nib_files' => ['sometimes', 'array'],
            'nib_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'identitas_pengurus_files' => ['sometimes', 'array'],
            'identitas_pengurus_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'laporan_keuangan_files' => ['sometimes', 'array'],
            'laporan_keuangan_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'dokumentasi_lokasi_files' => ['sometimes', 'array'],
            'dokumentasi_lokasi_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'bpjs_ketenagakerjaan_files' => ['sometimes', 'array'],
            'bpjs_ketenagakerjaan_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'perizinan_pekerjaan_files' => ['sometimes', 'array'],
            'perizinan_pekerjaan_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'sertifikasi_kompetensi_files' => ['sometimes', 'array'],
            'sertifikasi_kompetensi_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'dokumen_pendukung_files' => ['sometimes', 'array'],
            'dokumen_pendukung_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
        ]);

        // CEK DUPLIKASI KATEGORI DAN SUBKATEGORI
        $subcategoryError = $this->validateVendorSubcategories(
            $validated['vendor_subcategories'] ?? []
        );

        if ($subcategoryError) {
            return response()->json([
                'message' => $subcategoryError,
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | AMBIL REQUEST
        |--------------------------------------------------------------------------
        */

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'REQUESTER'
        )) {
            return $response;
        }

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            $vendor = $vendorRequest->vendor;

            /*
        |--------------------------------------------------------------------------
        | 1. UPDATE DATA UTAMA VENDOR
        |--------------------------------------------------------------------------
        */

            $vendor->update([
                'nama_perusahaan' => $validated['nama_perusahaan'],
                'search_term' => $validated['search_term'] ?? null,
                'pic_vendor' => $validated['pic_vendor'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'mobile_phone' => $validated['mobile_phone'] ?? null,
                'fax' => $validated['fax'] ?? null,

                'business_type' => $validated['business_type'] ?? null,
                'npwp' => $validated['npwp'] ?? null,

                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? null,

                'company_code_purch_org' =>
                $validated['company_code_purch_org']
                    ?? '1200 / 1300 (All Comp. Code)',

                'payment_term_id' => $validated['payment_term_id'] ?? null,
                'payment_term_other' => $validated['payment_term_other'] ?? null,

                'order_currency' => $validated['order_currency'] ?? null,
                'order_currency_other' => $validated['order_currency_other'] ?? null,

                'payment_method' =>
                $validated['payment_method'] ?? 'Transfer',
            ]);

            // ==========================================
            // UPDATE KATEGORI DAN SUBKATEGORI
            // ==========================================

            if (array_key_exists('vendor_subcategories', $validated)) {

                // Hapus kombinasi lama.
                $vendor->vendorSubcategories()->delete();

                // Simpan kombinasi terbaru.
                $this->saveVendorSubcategories(
                    $vendor,
                    $validated['vendor_subcategories']
                );
            }

            /*
        |--------------------------------------------------------------------------
        | 2. HELPER MENYIMPAN DOKUMEN
        |--------------------------------------------------------------------------
        |
        | bank_account_id NULL = dokumen umum vendor.
        | bank_account_id berisi ID = dokumen rekening.
        |
        */

            $saveDocument = function (
                $file,
                string $documentType,
                ?int $bankAccountId = null
            ) use ($vendor, $request) {

                if (!$file || !$file->isValid()) {
                    return;
                }

                $versionQuery = VendorDocument::where(
                    'vendor_id',
                    $vendor->id
                )
                    ->where('document_type', $documentType);

                if ($bankAccountId === null) {
                    $versionQuery->whereNull('bank_account_id');
                } else {
                    $versionQuery->where(
                        'bank_account_id',
                        $bankAccountId
                    );
                }

                $nextVersion = (
                    (int) $versionQuery->max('version')
                ) + 1;

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
            };

            /*
        |--------------------------------------------------------------------------
        | 3. UPDATE DAN SIMPAN BANK ACCOUNTS
        |--------------------------------------------------------------------------
        */

            $bankAccounts = $validated['bank_accounts'] ?? [];

            $existingBankIds = $vendor->bankAccounts()
                ->pluck('id')
                ->map(fn($bankId) => (int) $bankId)
                ->all();

            foreach ($bankAccounts as $index => $bank) {

                // Lewati rekening yang benar-benar kosong saat Draft.
                if (
                    blank($bank['bank_name'] ?? null) &&
                    blank($bank['account_number'] ?? null) &&
                    blank($bank['account_name'] ?? null) &&
                    blank($bank['swift_code'] ?? null)
                ) {
                    continue;
                }

                $bankData = [
                    'bank_name' => $bank['bank_name'] ?? null,
                    'account_number' => $bank['account_number'] ?? null,
                    'account_name' => $bank['account_name'] ?? null,
                    'swift_code' => $bank['swift_code'] ?? null,
                ];

                // UPDATE REKENING LAMA
                if (!empty($bank['id'])) {

                    $bankId = (int) $bank['id'];

                    if (!in_array($bankId, $existingBankIds, true)) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'bank_accounts' => [
                                'Rekening yang dipilih tidak ditemukan pada vendor ini.',
                            ],
                        ]);
                    }

                    $bankAccount = $vendor->bankAccounts()
                        ->where('id', $bankId)
                        ->firstOrFail();

                    $bankAccount->update($bankData);
                } else {

                    // TAMBAH REKENING BARU
                    $bankAccount = $vendor->bankAccounts()
                        ->create($bankData);
                }

                /*
            |--------------------------------------------------------------------------
            | 4. SIMPAN DOKUMEN REKENING
            |--------------------------------------------------------------------------
            */

                $bankDocuments = $request->file(
                    "bank_accounts.{$index}.documents",
                    []
                );

                foreach ($bankDocuments as $file) {
                    $saveDocument(
                        $file,
                        'REKENING',
                        (int) $bankAccount->id
                    );
                }
            }

            /*
        |--------------------------------------------------------------------------
        | 5. SIMPAN DOKUMEN UMUM VENDOR
        |--------------------------------------------------------------------------
        */

            $generalDocuments = [
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

            foreach ($generalDocuments as $field => $documentType) {

                $files = $request->file($field, []);

                foreach ($files as $file) {
                    $saveDocument(
                        $file,
                        $documentType,
                        null
                    );
                }
            }

            /*
        |--------------------------------------------------------------------------
        | 6. DRAFT PROCUREMENT
        |--------------------------------------------------------------------------
        */

            if ($validated['action'] === 'draft') {

                $vendorRequest->update([
                    'status' => 'DRAFT',
                    'current_stage' => 'REQUESTER',
                    'submitted_at' => null,
                ]);

                DB::commit();

                return response()->json([
                    'message' => 'Draft Requester berhasil disimpan.',
                    'data' => $vendorRequest
                        ->fresh()
                        ->load($this->vendorRelations()),
                ]);
            }

            /*
        |--------------------------------------------------------------------------
        | 7. SUBMIT PROCUREMENT
        |--------------------------------------------------------------------------
        */

            $vendorRequest->update([
                'form_number' => $vendorRequest->form_number
                    ?: $this->createRequestNumber('CREATE'),

                'status' => 'PENDING_L1',
                'current_stage' => 'ASISTEN_KADIV',
                'submitted_at' => now(),
                'rejection_reason' => null,
            ]);

            $this->recordApprovalHistory(
                $vendorRequest,
                'REQUESTER',
                $this->getCurrentNik($request),
                'Submitted'
            );

            /*
            |--------------------------------------------------------------------------
            | 8. COMMIT
            |--------------------------------------------------------------------------
            */

            DB::commit();

            return response()->json([
                'message' => 'Vendor berhasil disubmit dan dikirim ke Kadiv.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
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
    | SAVE ACCOUNTING DRAFT
    |--------------------------------------------------------------------------
    */

    public function saveAccountingDraft(Request $request, $id)
    {
        $request->validate([
            'account_group_id' => 'nullable|exists:account_groups,id',
            'account_group_other' => 'nullable|string|max:255',
            'recon_account_id' => 'nullable|exists:recon_accounts,id',
            'recon_account_other' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:255',
        ]);

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        // Hanya Staff Accounting yang ditunjuk boleh menyimpan Draft.
        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'ACCOUNTING'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $vendorRequest->vendor->update([
                'account_group_id' => $request->account_group_id,
                'account_group_other' => $request->account_group_other,
                'recon_account_id' => $request->recon_account_id,
                'recon_account_other' => $request->recon_account_other,
                'payment_method' => $request->payment_method ?? 'Transfer',
            ]);

            $vendorRequest->update([
                'status' => 'Pending',
                'current_stage' => 'ACCOUNTING',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Draft Accounting berhasil disimpan.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyimpan Draft Accounting.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PROCESS ACCOUNTING
    |--------------------------------------------------------------------------
    |
    |
    */

    public function processAccounting(Request $request, $id)
    {
        $request->validate([
            'account_group_id' => 'nullable|exists:account_groups,id',
            'account_group_other' => 'nullable|string|max:255',
            'recon_account_id' => 'nullable|exists:recon_accounts,id',
            'recon_account_other' => 'nullable|string|max:255',
            'payment_method' => 'required|string|max:255',
        ]);

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        // Pastikan yang submit adalah Staff Accounting.
        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'ACCOUNTING'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $vendorRequest->vendor->update([
                'account_group_id' => $request->account_group_id,
                'account_group_other' => $request->account_group_other,
                'recon_account_id' => $request->recon_account_id,
                'recon_account_other' => $request->recon_account_other,
                'payment_method' => $request->payment_method,
            ]);

            // Sesuai alur workflow: Accounting approve -> lanjut ke Level 4 (Tax)
            $vendorRequest->update([
                'current_stage' => 'TAX',
                'status' => 'PENDING_L4',
                'rejection_reason' => null,
            ]);

            // History menandakan Accounting approve
            $this->recordApprovalHistory(
                $vendorRequest,
                'ACCOUNTING',
                $this->getCurrentNik($request),
                'Approved'
            );

            DB::commit();

            return response()->json([
                'message' => 'Data Accounting berhasil disimpan dan disetujui. Pengajuan diteruskan ke Tax.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal submit data Accounting.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



    /*
    |--------------------------------------------------------------------------
    | SAVE TAX DRAFT
    |--------------------------------------------------------------------------
    */

    public function saveTaxDraft(Request $request, $id)
    {
        $validated = $request->validate([
            'withholding_tax_ids' => ['nullable', 'array'],
            'withholding_tax_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:withholding_taxes,id',
            ],
        ]);

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        // Hanya Staff Tax yang boleh menyimpan Draft.
        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'TAX'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $taxIds = array_map(
                'intval',
                $validated['withholding_tax_ids'] ?? []
            );

            $vendorRequest->vendor
                ->withholdingTaxes()
                ->sync($taxIds);

            $vendorRequest->update([
                'status' => 'Pending',
                'current_stage' => 'TAX',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Draft Tax berhasil disimpan.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            \Illuminate\Support\Facades\Log::error(
                'Gagal menyimpan Draft Tax',
                [
                    'vendor_request_id' => $id,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'message' => 'Gagal menyimpan Draft Tax.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PROCESS TAX → SAP 
    |--------------------------------------------------------------------------
    */

    public function processTax(Request $request, $id)
    {
        $validated = $request->validate([
            'withholding_tax_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'withholding_tax_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:withholding_taxes,id',
            ],
        ]);

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        // Pastikan yang submit adalah Staff Tax.
        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'TAX'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $taxIds = array_map(
                'intval',
                $validated['withholding_tax_ids']
            );

            $vendorRequest->vendor
                ->withholdingTaxes()
                ->sync($taxIds);

            // Sesuai alur workflow: Tax approve -> lanjut ke Level 5 (SAP)
            $vendorRequest->update([
                'current_stage' => 'SAP',
                'status' => 'PENDING_L5',
                'rejection_reason' => null,
            ]);

            // Mencatat Tax yang melakukan approve.
            $this->recordApprovalHistory(
                $vendorRequest,
                'TAX',
                $this->getCurrentNik($request),
                'Approved'
            );

            DB::commit();

            return response()->json([
                'message' => 'Data Tax berhasil disimpan dan disetujui. Pengajuan diteruskan ke SAP.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            \Illuminate\Support\Facades\Log::error(
                'Gagal submit data Tax',
                [
                    'vendor_request_id' => $id,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'message' => 'Gagal submit data Tax.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE SAP DRAFT
    |--------------------------------------------------------------------------
    */


    public function saveSapDraft(Request $request, $id)
    {
        $validated = $request->validate([
            'vendor_code' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'SAP'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $vendorRequest->vendor->update([
                'vendor_code' => $validated['vendor_code'] ?? null,
            ]);

            $vendorRequest->update([
                'status' => 'Pending',
                'current_stage' => 'SAP',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Draft SAP berhasil disimpan.',
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menyimpan Draft SAP.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



    public function approve(Request $request, $id)
    {
        $vendorRequest = VendorRequest::with(
            $this->vendorRelations()
        )->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request tidak valid.',
            ], 422);
        }

        $stage = strtoupper(
            $vendorRequest->current_stage ?? ''
        );

        $nextStage = [
            'REQUESTER' => [
                'stage' => 'ASISTEN_KADIV',
                'status' => 'PENDING_L1',
                'label' => 'Level 1 (Asisten Kadiv)',
            ],
            'ASISTEN_KADIV' => [
                'stage' => 'KADIV',
                'status' => 'PENDING_L2',
                'label' => 'Level 2 (Kadiv SCM)',
            ],
            'KADIV' => [
                'stage' => 'ACCOUNTING',
                'status' => 'PENDING_L3',
                'label' => 'Level 3 (Accounting)',
            ],
            'ACCOUNTING' => [
                'stage' => 'TAX',
                'status' => 'PENDING_L4',
                'label' => 'Level 4 (Tax)',
            ],
            'TAX' => [
                'stage' => 'SAP',
                'status' => 'PENDING_L5',
                'label' => 'Level 5 (SAP)',
            ],
            'SAP' => [
                'stage' => 'SAP',
                'status' => 'FORM_APPROVED',
                'label' => 'Form Full Approved (Menunggu Pengisian Vendor Code SAP)',
            ],
        ];

        if (!array_key_exists($stage, $nextStage)) {
            return response()->json([
                'message' => "Approval tidak tersedia pada tahap {$stage}.",
            ], 422);
        }

        if ($response = $this->ensureApprovalAccess(
            $request,
            $vendorRequest,
            $stage
        )) {
            return $response;
        }

        DB::beginTransaction();

        try {
            // Catat approval pada tahap saat ini.
            $this->recordApprovalHistory(
                $vendorRequest,
                $stage,
                $this->getCurrentNik($request),
                'Approved'
            );

            // Lanjutkan ke tahap berikutnya.
            $destination = $nextStage[$stage];

            $vendorRequest->update([
                'current_stage' => $destination['stage'],
                'status' => $destination['status'],
                'rejection_reason' => null,
            ]);

            // Update FormApproval stage saat ini menjadi APPROVED
            \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                ->where('stage', $stage)
                ->update(['status' => 'APPROVED']);

            // Update FormApproval stage berikutnya menjadi IN_PROGRESS
            if (isset($destination['stage'])) {
                \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                    ->where('stage', $destination['stage'])
                    ->where('status', 'WAITING')
                    ->update(['status' => 'IN_PROGRESS']);
            }

            // Jika SAP (Level 5 Step 1: SAP Approval), buat PDF final
            if ($stage === 'SAP') {
                $this->generateFinalVendorPdf($vendorRequest->id);
            }

            DB::commit();

            return response()->json([
                'message' => "Approval {$stage} berhasil. Status sekarang: {$destination['status']} ({$destination['label']}).",
                'data' => $vendorRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            \Illuminate\Support\Facades\Log::error(
                'Gagal approval vendor request',
                [
                    'vendor_request_id' => $id,
                    'stage' => $stage,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'message' => 'Gagal memproses approval.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancelApprove(Request $request, $id)
    {
        $vendorRequest = VendorRequest::with(
            $this->vendorRelations()
        )->findOrFail($id);

        $stage = strtoupper(
            $vendorRequest->current_stage ?? ''
        );

        $rollbackMap = [
            'ASISTEN_KADIV' => [
                'target_stage' => 'REQUESTER',
                'target_status' => 'DRAFT',
                'message' => 'Cancel Approve berhasil. Pengajuan dikembalikan ke Draft.',
            ],
            'KADIV' => [
                'target_stage' => 'ASISTEN_KADIV',
                'target_status' => 'PENDING_L1',
                'message' => 'Cancel Approve berhasil. Pengajuan di-rollback ke Level 1 (Asisten Kadiv).',
            ],
            'ACCOUNTING' => [
                'target_stage' => 'KADIV',
                'target_status' => 'PENDING_L2',
                'message' => 'Cancel Approve berhasil. Pengajuan di-rollback ke Level 2 (Kadiv SCM).',
            ],
            'TAX' => [
                'target_stage' => 'ACCOUNTING',
                'target_status' => 'PENDING_L3',
                'message' => 'Cancel Approve berhasil. Pengajuan di-rollback ke Level 3 (Accounting).',
            ],
            'SAP' => [
                'target_stage' => 'TAX',
                'target_status' => 'PENDING_L4',
                'message' => 'Cancel Approve berhasil. Pengajuan di-rollback ke Level 4 (Tax).',
            ],
        ];

        if (!array_key_exists($stage, $rollbackMap)) {
            return response()->json([
                'message' => "Cancel Approve tidak tersedia pada tahap {$stage}.",
            ], 422);
        }

        if ($response = $this->ensureApprovalAccess(
            $request,
            $vendorRequest,
            $stage
        )) {
            return $response;
        }

        $reason = $request->input('reason') ?? $request->input('notes') ?? ('Cancel Approve oleh ' . $stage);

        DB::beginTransaction();

        try {
            $this->recordApprovalHistory(
                $vendorRequest,
                $stage,
                $this->getCurrentNik($request),
                'CANCEL_APPROVE',
                $reason
            );

            $target = $rollbackMap[$stage];

            $vendorRequest->update([
                'current_stage' => $target['target_stage'],
                'status' => $target['target_status'],
                'cancellation_reason' => $reason,
            ]);

            // Update FormApproval stage saat ini menjadi CANCEL_APPROVE
            \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                ->where('stage', $stage)
                ->update(['status' => 'CANCEL_APPROVE']);

            // Update FormApproval stage target rollback menjadi IN_PROGRESS
            \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                ->where('stage', $target['target_stage'])
                ->update(['status' => 'IN_PROGRESS']);

            DB::commit();

            return response()->json([
                'message' => $target['message'],
                'data' => $vendorRequest->fresh()->load($this->vendorRelations()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal memproses Cancel Approve.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }




    /*
    |--------------------------------------------------------------------------
    | PROCESS SAP
    |--------------------------------------------------------------------------
    |
    | SAP Staff:
    | - Input Vendor Code
    | - Submit ke Kadiv SAP
    | - Request tetap di SAP
    | - Status Under Review
    | - Tidak generate PDF
    |
    */

    public function processSap(Request $request, $id)
    {
        $vendorRequest = VendorRequest::with('vendor')
            ->findOrFail($id);

        if (!in_array(strtoupper($vendorRequest->request_type), ['CREATE', 'UPDATE'], true)) {
            return response()->json([
                'message' => 'Request ini bukan pengajuan vendor yang valid.',
            ], 422);
        }

        if ($response = $this->ensureStaffAccess(
            $request,
            $vendorRequest,
            'SAP'
        )) {
            return $response;
        }

        if (!$vendorRequest->vendor) {
            return response()->json([
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'vendor_code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('vendors', 'vendor_code')
                    ->ignore($vendorRequest->vendor_id),
            ],
        ]);

        DB::beginTransaction();

        try {
            // Simpan Vendor Code dari SAP.
            $vendorRequest->vendor->update([
                'vendor_code' => trim($validated['vendor_code']),
            ]);

            // Jika UPDATE, terapkan perubahan data dari vendor_request_details ke vendor master
            if (strtoupper($vendorRequest->request_type) === 'UPDATE') {
                $detail = $vendorRequest->details()->latest()->first();
                if ($detail && is_array($detail->new_data)) {
                    $newPayload = $detail->new_data;
                    $mainData = collect($newPayload)->except([
                        'bank_accounts', 'vendor_subcategories', 'withholding_tax_ids'
                    ])->all();
                    $vendorRequest->vendor->update($mainData);

                    if (!empty($newPayload['vendor_subcategories'])) {
                        $vendorRequest->vendor->vendorSubcategories()->delete();
                        foreach ($newPayload['vendor_subcategories'] as $sc) {
                            $vendorRequest->vendor->vendorSubcategories()->create([
                                'category_id' => $sc['category_id'],
                                'subcategory' => $sc['subcategory'],
                                'category_other' => $sc['category_other'] ?? null,
                            ]);
                        }
                    }
                }
            }

            // SAP adalah tahap terakhir: langsung COMPLETED.
            $vendorRequest->update([
                'current_stage' => 'COMPLETED',
                'status' => 'COMPLETED',
                'completed_at' => now(),
                'rejection_reason' => null,
            ]);

            // Update FormApproval stage SAP menjadi APPROVED
            \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                ->where('stage', 'SAP')
                ->update(['status' => 'APPROVED']);

            // Catat SAP sebagai Approved, bukan Under Review.
            $this->recordApprovalHistory(
                $vendorRequest,
                'SAP',
                $this->getCurrentNik($request),
                'Approved'
            );

            // Buat PDF final beserta QR Code.
            $finalRequest = $this->generateFinalVendorPdf(
                $vendorRequest->id
            );

            DB::commit();

            return response()->json([
                'message' => 'Vendor Code berhasil disimpan. Pengajuan vendor telah selesai dan PDF final berhasil dibuat.',
                'data' => $finalRequest
                    ->fresh()
                    ->load($this->vendorRelations()),
                'pdf_url' => url(
                    '/api/vendor-requests/'
                        . $finalRequest->id
                        . '/pdf'
                ),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            \Illuminate\Support\Facades\Log::error(
                'Gagal menyelesaikan proses SAP',
                [
                    'vendor_request_id' => $id,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'message' => 'Gagal menyelesaikan proses SAP.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Generate PDF final vendor beserta QR Code approval.
     */
    private function generateFinalVendorPdf($vendorRequestId)
    {
        $finalRequest = VendorRequest::with([
            'vendor.kategori',
            'vendor.vendorSubcategories.category',
            'vendor.bankAccounts',
            'vendor.documents',
            'vendor.accountGroup',
            'vendor.reconAccount',
            'vendor.paymentTerm',
            'vendor.withholdingTaxes',
            'requester',
            'details',
            'approvalHistories.actor',
        ])->findOrFail($vendorRequestId);

        $frontendUrl = rtrim(
            env('FRONTEND_URL', 'http://localhost:5173'),
            '/'
        );

        $qrCodes = [];

        foreach ($finalRequest->approvalHistories as $approval) {
            if (empty($approval->signature_token)) {
                continue;
            }

            $payload = $frontendUrl
                . '/verify-vendor/'
                . urlencode($approval->signature_token);

            $qrCode = new QrCode(
                data: $payload,
                size: 120,
                margin: 2
            );

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            $qrCodes[$approval->id] =
                'data:image/png;base64,'
                . base64_encode($result->getString());
        }

        $logoPath = public_path('images/IBS.png');
        $logoDataUri = null;
        if (is_file($logoPath)) {
            $logoDataUri = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $pdf = Pdf::loadView('pdf.vendor-master', [
            'vendorRequest' => $finalRequest,
            'vendor' => $finalRequest->vendor,
            'approvals' => $finalRequest->approvalHistories,
            'qrCodes' => $qrCodes,
            'logoDataUri' => $logoDataUri,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $pdfPath = 'vendor-pdfs/vendor-request-'
            . $finalRequest->id
            . '.pdf';

        Storage::disk('public')->makeDirectory('vendor-pdfs');
        $saved = Storage::disk('public')->put(
            $pdfPath,
            $pdf->output()
        );

        if (!$saved) {
            throw new \RuntimeException(
                'PDF final gagal disimpan.'
            );
        }

        $finalRequest->final_pdf_path = $pdfPath;
        $finalRequest->save();

        return $finalRequest;
    }

    public function completed()
    {
        $requests = VendorRequest::with([
            'vendor.kategori',
            'vendor.vendorSubcategories.category',
            'requester',
            'approvalHistories.actor',
        ])
            ->where('request_type', 'CREATE')
            ->where('current_stage', 'COMPLETED')
            ->where('status', 'Approved')
            ->latest('completed_at')
            ->get();

        return response()->json($requests);
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT VENDOR REQUEST
    |--------------------------------------------------------------------------
    */



    public function reject(Request $request, $id)
    {
        // 1. Validasi alasan penolakan
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        // 2. Ambil data request
        $vendorRequest = VendorRequest::with(
            $this->vendorRelations()
        )->findOrFail($id);

        $currentStage = strtoupper(
            $vendorRequest->current_stage ?? ''
        );

        // 3. Tahap yang boleh melakukan Reject
        $allowedStages = [
            'REQUESTER',
            'ASISTEN_KADIV',
            'KADIV',
            'ACCOUNTING',
            'TAX',
            'SAP',
        ];

        if (!in_array($currentStage, $allowedStages, true)) {
            return response()->json([
                'message' => 'Pengajuan tidak dapat ditolak pada tahap ini.',
            ], 422);
        }

        // 4. Periksa hak akses approval
        if ($response = $this->ensureApprovalAccess(
            $request,
            $vendorRequest,
            $currentStage
        )) {
            return $response;
        }

        $reason = trim($validated['rejection_reason']);
        $nik = $this->getCurrentNik($request);

        // 5. Simpan perubahan dan approval history
        DB::transaction(function () use (
            $vendorRequest,
            $currentStage,
            $reason,
            $nik
        ) {
            $vendorRequest->update([
                'current_stage' => 'REJECTED',
                'status' => 'REJECTED',
                'rejection_reason' => $reason,
            ]);

            // Update FormApproval stage saat ini menjadi REJECTED
            \App\Models\FormApproval::where('vendor_request_id', $vendorRequest->id)
                ->where('stage', $currentStage)
                ->update(['status' => 'REJECTED']);

            $this->recordApprovalHistory(
                $vendorRequest,
                $currentStage,
                $nik,
                'REJECTED',
                $reason
            );
        });

        // 6. Response
        return response()->json([
            'message' => 'Pengajuan berhasil ditolak.',
            'data' => $vendorRequest
                ->fresh()
                ->load($this->vendorRelations()),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PROCESS KADIV
    |--------------------------------------------------------------------------
    |
    */

    // public function processKadiv(Request $request, $id)
    // {
    //     $vendorRequest = VendorRequest::with(
    //         $this->vendorRelations()
    //     )->findOrFail($id);


    //     /*
    //     |--------------------------------------------------------------------------
    //     | CEK REQUEST TYPE
    //     |--------------------------------------------------------------------------
    //     */

    //     if ($vendorRequest->request_type !== 'CREATE') {
    //         return response()->json([
    //             'message' =>
    //             'Request ini bukan pengajuan New Vendor.',
    //         ], 422);
    //     }

    //     if ($response = $this->ensureRequestIsActive($vendorRequest)) {
    //         return $response;
    //     }


    //     /*
    //     |--------------------------------------------------------------------------
    //     | CEK STAGE
    //     |--------------------------------------------------------------------------
    //     */

    //     if ($vendorRequest->current_stage !== 'KADIV') {
    //         return response()->json([
    //             'message' =>
    //             'Request ini tidak sedang berada di tahap Kadiv.',
    //         ], 422);
    //     }


    //     DB::beginTransaction();

    //     try {
    //         /*
    //         |--------------------------------------------------------------------------
    //         | KADIV → ACCOUNTING
    //         |--------------------------------------------------------------------------
    //         */

    //         $vendorRequest->update([
    //             'current_stage' =>
    //             'ACCOUNTING',

    //             'status' =>
    //             'Under Review',
    //         ]);


    //         /*
    //         |--------------------------------------------------------------------------
    //         | SIMPAN HISTORY KADIV
    //         |--------------------------------------------------------------------------
    //         */

    //         $this->recordApprovalHistory(
    //             $vendorRequest,
    //             'KADIV',
    //             $this->getCurrentNik($request),
    //             'Approved'
    //         );


    //         DB::commit();

    //         return response()->json([
    //             'message' =>
    //             'Approval Kadiv berhasil. Vendor dikirim ke Accounting.',

    //             'data' =>
    //             $vendorRequest
    //                 ->fresh()
    //                 ->load($this->vendorRelations()),
    //         ]);
    //     } catch (\Throwable $e) {
    //         DB::rollBack();

    //         return response()->json([
    //             'message' =>
    //             'Gagal memproses approval Kadiv.',

    //             'error' =>
    //             $e->getMessage(),
    //         ], 500);
    //     }
    // }

    // public function rejectKadiv(Request $request, $id)
    // {
    //     // Validasi alasan penolakan
    //     $validated = $request->validate([
    //         'rejection_reason' => 'required|string|max:2000',
    //     ]);

    //     $vendorRequest = VendorRequest::with(
    //         $this->vendorRelations()
    //     )->findOrFail($id);

    //     /*
    // |--------------------------------------------------------------------------
    // | CEK REQUEST TYPE
    // |--------------------------------------------------------------------------
    // */

    //     if ($vendorRequest->request_type !== 'CREATE') {
    //         return response()->json([
    //             'message' => 'Request ini bukan pengajuan New Vendor.',
    //         ], 422);
    //     }

    //     // Request yang sudah ditolak atau selesai tidak boleh diproses lagi.
    //     if ($response = $this->ensureRequestIsActive($vendorRequest)) {
    //         return $response;
    //     }

    //     /*
    //     |--------------------------------------------------------------------------
    //     | CEK STAGE
    //     |--------------------------------------------------------------------------
    //     */

    //     if ($vendorRequest->current_stage !== 'KADIV') {
    //         return response()->json([
    //             'message' => 'Request ini tidak sedang berada di tahap Kadiv.',
    //         ], 422);
    //     }

    //     DB::beginTransaction();

    //     try {
    //         /*
    //     |--------------------------------------------------------------------------
    //     | KADIV REJECT → PROCUREMENT
    //     |--------------------------------------------------------------------------
    //     */

    //         $vendorRequest->update([
    //             'current_stage' => 'REQUESTER',
    //             'status' => 'Rejected',
    //             'rejection_reason' => trim($validated['rejection_reason']),
    //         ]);

    //         /*
    //     |--------------------------------------------------------------------------
    //     | SIMPAN HISTORY PENOLAKAN KADIV
    //     |--------------------------------------------------------------------------
    //     */

    //         $this->recordApprovalHistory(
    //             $vendorRequest,
    //             'KADIV',
    //             $this->getCurrentNik($request),
    //             'Rejected',
    //             trim($validated['rejection_reason'])
    //         );

    //         DB::commit();

    //         return response()->json([
    //             'message' => 'Pengajuan vendor ditolak dan dikembalikan ke Requester.',
    //             'data' => $vendorRequest
    //                 ->fresh()
    //                 ->load($this->vendorRelations()),
    //         ]);
    //     } catch (\Throwable $e) {
    //         DB::rollBack();

    //         return response()->json([
    //             'message' => 'Gagal menolak pengajuan vendor.',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

    /*
    |--------------------------------------------------------------------------
    | PROCESS WORKFLOW UMUM
    |--------------------------------------------------------------------------
    |
    | Method ini dipertahankan agar route frontend lama yang menggunakan
    | /process tidak langsung rusak.
    |
    */

    // public function process(Request $request, $id)
    // {
    //     $vendorRequest = VendorRequest::with(
    //         $this->vendorRelations()
    //     )->findOrFail($id);


    //     if ($vendorRequest->current_stage === 'KADIV') {
    //         return $this->processKadiv(
    //             $request,
    //             $id
    //         );
    //     }


    //     return response()->json([
    //         'message' =>
    //         'Proses tahap ini harus menggunakan endpoint proses yang sesuai.',
    //     ], 422);
    // }



    /**
     * Membuat nomor request VMS.
     *
     * CREATE / NEW:
     * HRIS-VMS-N-YYYYMMDD01
     *
     * UPDATE:
     * HRIS-VMS-U-YYYYMMDD01
     *
     * Harus dipanggil di dalam DB transaction.
     */
    private function createRequestNumber(string $requestType): string
    {
        $now = now();

        $year = (int) $now->format('Y');

        // Tanggal request pertama kali disubmit
        $date = $now->format('Ymd');

        $formType = 'VMS';

        // Tentukan jenis request
        $status = match (strtoupper($requestType)) {
            'CREATE', 'NEW' => 'NEW',
            'UPDATE' => 'UPDATE',

            default => throw new \InvalidArgumentException(
                'Jenis request tidak valid.'
            ),
        };

        // Prefix nomor request
        $prefix = $status === 'NEW' ? 'N' : 'U';

        // Pastikan sequence tersedia
        DB::table('request_sequences')->insertOrIgnore([
            'year' => $year,
            'form_type' => $formType,
            'status' => $status,
            'last_number' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Ambil sequence berdasarkan tahun, form, dan jenis request
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

        // Nomor berikutnya
        $nextNumber = (int) $sequence->last_number + 1;

        // Update counter
        DB::table('request_sequences')
            ->where('id', $sequence->id)
            ->update([
                'last_number' => $nextNumber,
                'updated_at' => $now,
            ]);

        // Format:
        // HRIS-VMS-N-20261027000015
        return sprintf(
            'HRIS-%s-%s-%s%03d',
            //  'HRIS-%s-%s-%s%d',
            $formType,
            $prefix,
            $date,
            $nextNumber
        );
    }



    private function ensureRequestIsActive(VendorRequest $vendorRequest)
    {
        if (!in_array($vendorRequest->status, [
            'Pending',
            'Under Review',
        ], true)) {
            return response()->json([
                'message' =>
                'Pengajuan ini sudah tidak aktif dan tidak dapat diproses lagi.',
            ], 422);
        }

        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | RECORD APPROVAL HISTORY
    |--------------------------------------------------------------------------
    |
    | Approval history menggunakan NIK sebagai acted_by.
    |
    */

    private function recordApprovalHistory(
        VendorRequest $vendorRequest,
        string $stage,
        ?string $nik,
        string $status,
        ?string $notes = null
    ) {
        if (!$nik) {
            throw new \RuntimeException(
                'NIK pengguna tidak ditemukan. Riwayat approval tidak dapat disimpan.'
            );
        }

        $user = \App\Models\User::where('nik', $nik)->first();

        return $vendorRequest->approvalHistories()->create([
            'approval_stage' => strtoupper($stage),
            'acted_by' => $user?->id,
            'acted_by_name' => $user?->name,
            'acted_by_nik' => $nik,
            'acted_by_email' => $user?->email,
            'status' => $status,
            'notes' => $notes,
            'acted_at' => now(),
            'signature_token' => bin2hex(random_bytes(32)),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | GET CURRENT USER NIK
    |--------------------------------------------------------------------------
    */

    private function getCurrentNik(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        return $user->nik ?? null;
    }
}
