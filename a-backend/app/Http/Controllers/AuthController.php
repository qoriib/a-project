<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use App\Models\MasterApproval;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Mengambil hak akses pengguna dari master_approvals.
     */
    private function getApprovalAccess(User $user): array
    {
        $today = now()->toDateString();

        $approval = MasterApproval::where('nik', $user->nik)
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderByDesc('start_date')
            ->first();

        // Jika pengguna tidak memiliki akses approval aktif
        if (!$approval) {
            return [
                'has_approval_access' => false,
                'approval_stage' => null,
                'permissions' => [
                    'can_view' => false,
                    'can_edit' => false,
                    'can_approve' => false,
                ],
            ];
        }

        return [
            'has_approval_access' => true,
            'approval_stage' => $approval->approval_stage,
            'permissions' => [
                'can_view' => $approval->can_view,
                'can_edit' => $approval->can_edit,
                'can_approve' => $approval->can_approve,
            ],
        ];
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        /*
        |--------------------------------------------------------------------------
        | LOGIN USER DUMMY / TESTING
        |--------------------------------------------------------------------------
        */

        if (Str::endsWith(strtolower($request->email), '@ibs.test')) {

            $localUser = User::where('email', $request->email)->first();

            if (!$localUser) {
                return response()->json([
                    'message' => 'User testing tidak ditemukan',
                ], 401);
            }

            if (!Hash::check($request->password, $localUser->password)) {
                return response()->json([
                    'message' => 'Email atau password salah',
                ], 401);
            }

            $isAdmin = Admin::where('nik', $localUser->nik)->exists();

            // Ambil hak akses berdasarkan NIK
            $approvalAccess = $this->getApprovalAccess($localUser);

            $token = $localUser->createToken('web')->plainTextToken;

            return response()->json([
                'message' => 'Login berhasil',
                'token' => $token,

                'user' => [
                    'email' => $localUser->email,
                    'name' => $localUser->name,
                    'nik' => $localUser->nik,

                    'role' => $isAdmin ? 'ADMIN' : 'USER',
                    'is_admin' => $isAdmin,
                    'role_id' => $localUser->role_id,

                    'employee_id' => $localUser->nik,

                    'division' => $localUser->division ?? '',
                    'position' => $localUser->position ?? '',
                    'department' => $localUser->department ?? '',

                    'depthead' => $localUser->depthead ?? null,
                    'divhead' => $localUser->divhead ?? null,
                    'director' => $localUser->director ?? null,

                    'directorate' => '',

                    'user_role' => null,
                    'access_level' => null,
                    'access_employee' => null,

                    'img_profile' => null,

                    // Hak akses dari master_approvals
                    ...$approvalAccess,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | LOGIN HRIS
        |--------------------------------------------------------------------------
        */

        try {

            $response = Http::withBasicAuth(
                env('HRIS_BASIC_USERNAME'),
                env('HRIS_BASIC_PASSWORD')
            )
                ->asMultipart()
                ->acceptJson()
                ->post(env('HRIS_API_URL'), [
                    'IBSW_KEY' => env('HRIS_IBSW_KEY'),
                    'datauser' => $request->email,
                    'passcode' => $request->password,
                ]);

            $data = $response->json();

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Tidak dapat terhubung ke server HRIS',
                ], 502);
            }

            if (!isset($data['status']) || $data['status'] !== true) {
                return response()->json([
                    'message' => 'Email atau password salah',
                ], 401);
            }

            $user = $data['data'] ?? [];

            if (isset($user['user']) && is_array($user['user'])) {
                $user = $user['user'];
            }

            Log::info('HRIS USER DATA NORMALIZED', [
                'user' => $user,
            ]);

            if (empty($user['nik'])) {
                return response()->json([
                    'message' => 'Data NIK pengguna tidak ditemukan',
                ], 500);
            }

            /*
            |--------------------------------------------------------------------------
            | SIMPAN / UPDATE USER DARI HRIS
            |--------------------------------------------------------------------------
            */

            $localUser = User::updateOrCreate(
                [
                    'nik' => $user['nik'],
                ],
                [
                    'name' => $user['name'] ?? '',
                    'email' => $user['user_email'] ?? $request->email,

                    'division' => $user['division'] ?? null,
                    'department' => $user['department'] ?? null,
                    'position' => $user['position'] ?? null,

                    'depthead' => $user['depthead'] ?? null,
                    'divhead' => $user['divhead'] ?? null,
                    'director' => $user['director'] ?? null,

                    'password' => Str::random(32),
                ]
            );

            $isAdmin = Admin::where('nik', $localUser->nik)->exists();

            // Ambil hak akses berdasarkan NIK dari HRIS
            $approvalAccess = $this->getApprovalAccess($localUser);

            $token = $localUser->createToken('web')->plainTextToken;

            return response()->json([
                'message' => 'Login berhasil',
                'token' => $token,

                'user' => [
                    'email' => $user['user_email'] ?? $request->email,
                    'name' => $user['name'] ?? '',
                    'nik' => $user['nik'],

                    'role' => $isAdmin ? 'ADMIN' : 'USER',
                    'is_admin' => $isAdmin,
                    'role_id' => $localUser->role_id,

                    'employee_id' => $user['employee_id'] ?? null,

                    'division' => $user['division'] ?? '',
                    'position' => $user['position'] ?? '',
                    'directorate' => $user['directorate'] ?? '',
                    'department' => $user['department'] ?? '',

                    'depthead' => $user['depthead'] ?? null,
                    'divhead' => $user['divhead'] ?? null,
                    'director' => $user['director'] ?? null,

                    'user_role' => $user['user_role'] ?? null,
                    'access_level' => $user['access_level'] ?? null,
                    'access_employee' => $user['access_employee'] ?? null,

                    'img_profile' => $user['img_profile'] ?? null,

                    // Hak akses dari master_approvals
                    ...$approvalAccess,
                ],
            ]);

        } catch (\Exception $e) {

            Log::error('HRIS Login Exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat menghubungi server HRIS',
            ], 500);
        }
    }
}
