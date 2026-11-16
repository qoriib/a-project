<?php

namespace App\Http\Controllers;

use App\Models\MasterApproval;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MasterApprovalController extends Controller
{
    /**
     * Stage yang tersedia pada workflow VMS.
     */
    private const ALLOWED_STAGES = [
        'REQUESTER',
        'ACCOUNTING',
        'TAX',
        'SAP',
    ];

    /**
     * Menampilkan seluruh konfigurasi master approval.
     */
    public function index()
    {
        $approvals = MasterApproval::with('user')
            ->orderBy('approval_stage')
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $approvals,
        ]);
    }

    /**
     * Membuat konfigurasi Staff atau Kadiv.
     */
    public function store(Request $request)
    {
        $validated = $this->validateApproval($request);

        $this->validateUserEmail($validated);

        $this->validatePermissionCombination($validated);

        $this->validateAssignmentAvailability($validated);

        $approval = MasterApproval::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Master approval berhasil ditambahkan.',
            'data' => $approval->load('user'),
        ], 201);
    }

    /**
     * Menampilkan satu konfigurasi.
     */
    public function show(MasterApproval $masterApproval)
    {
        return response()->json([
            'success' => true,
            'data' => $masterApproval->load('user'),
        ]);
    }

    /**
     * Mengubah konfigurasi.
     */
    public function update(
        Request $request,
        MasterApproval $masterApproval
    ) {
        $validated = $this->validateApproval($request);

        $this->validateUserEmail($validated);

        $this->validatePermissionCombination($validated);

        $this->validateAssignmentAvailability(
            $validated,
            $masterApproval->id
        );

        $masterApproval->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Master approval berhasil diperbarui.',
            'data' => $masterApproval->fresh()->load('user'),
        ]);
    }

    /**
     * Menghapus konfigurasi.
     */
    public function destroy(MasterApproval $masterApproval)
    {
        $masterApproval->delete();

        return response()->json([
            'success' => true,
            'message' => 'Master approval berhasil dihapus.',
        ]);
    }

    /**
     * Validasi input.
     */
    private function validateApproval(Request $request): array
    {
        return $request->validate([
            'nik' => [
                'required',
                'string',
                'exists:users,nik',
            ],

            'email' => [
                'required',
                'email',
            ],

            'approval_stage' => [
                'required',
                Rule::in(self::ALLOWED_STAGES),
            ],

            'can_view' => [
                'required',
                'boolean',
            ],

            'can_edit' => [
                'required',
                'boolean',
            ],

            'can_approve' => [
                'required',
                'boolean',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
        ]);
    }

    /**
     * Pastikan email sesuai dengan NIK pegawai.
     */
    private function validateUserEmail(array $validated): void
    {
        $user = User::where('nik', $validated['nik'])->first();

        if (!$user || strcasecmp(
            $user->email,
            $validated['email']
        ) !== 0) {
            throw ValidationException::withMessages([
                'email' => [
                    'Email tidak sesuai dengan NIK pegawai.',
                ],
            ]);
        }
    }

    /**
     * Staff hanya boleh edit.
     * Kadiv hanya boleh approve.
     */
    private function validatePermissionCombination(
        array $validated
    ): void {
        $canEdit = (bool) $validated['can_edit'];
        $canApprove = (bool) $validated['can_approve'];
        $canView = (bool) $validated['can_view'];

        if (!$canView) {
            throw ValidationException::withMessages([
                'can_view' => [
                    'Pegawai yang ditunjuk harus memiliki akses melihat.',
                ],
            ]);
        }

        if ($canEdit === $canApprove) {
            throw ValidationException::withMessages([
                'can_edit' => [
                    'Pilih salah satu: Staff/PIC dengan akses edit atau Kadiv dengan akses approve.',
                ],
            ]);
        }
    }

    /**
     * Cegah dua Staff aktif atau dua Kadiv aktif
     * pada stage yang sama dalam periode yang bertabrakan.
     */
    private function validateAssignmentAvailability(
        array $validated,
        ?int $ignoreId = null
    ): void {
        $isEditAssignment = (bool) $validated['can_edit'];

        $query = MasterApproval::where(
            'approval_stage',
            $validated['approval_stage']
        )
            ->where('can_edit', $isEditAssignment)
            ->where('can_approve', !$isEditAssignment);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $newStart = $validated['start_date'];
        $newEnd = $validated['end_date'] ?? null;

        $query->where(function ($q) use ($newStart) {
            $q->whereNull('end_date')
                ->orWhereDate('end_date', '>=', $newStart);
        });

        if ($newEnd) {
            $query->whereDate('start_date', '<=', $newEnd);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'approval_stage' => [
                    'Sudah ada pegawai lain yang ditunjuk untuk posisi ini pada stage dan periode tersebut.',
                ],
            ]);
        }
    }
}
