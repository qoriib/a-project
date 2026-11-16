<?php

namespace App\Http\Controllers;

use App\Models\VendorCategory;
use Illuminate\Support\Facades\DB;

use Illuminate\Http\Request;

class VendorCategoryController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();
        $user = $request->user();

        $query = VendorCategory::query()
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')
                    ->orWhereDate('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            });

        // Filter berdasarkan kategori yang boleh diakses oleh divisi/NIK Requester jika bukan request seluruh master
        $userRole = strtoupper((string) ($user->role ?? ''));
        $isRequester = in_array($userRole, ['REQUESTER', 'PROCUREMENT']);
        $bypassFilter = $request->boolean('all') || $request->input('all') === '1' || !$isRequester;

        if (!$bypassFilter && $user && $user->nik) {
            $allowedTypes = DB::table('requester_category_access')
                ->where('nik', $user->nik)
                ->whereDate('start_date', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $today);
                })
                ->pluck('category_type');

            if ($allowedTypes->isNotEmpty()) {
                $query->where(function ($q) use ($allowedTypes, $request) {
                    $q->whereIn('category_type', $allowedTypes);
                    if ($request->filled('include_id')) {
                        $q->orWhere('id', (int) $request->input('include_id'));
                    }
                });
            }
        }

        $categories = $query->orderBy('id')->get();

        return response()->json($categories);
    }

    /**
     * Menampilkan alur approval beserta pejabat/approver yang bertanggung jawab
     * berdasarkan kategori yang dipilih.
     */
    public function approvalLayer($catCode)
    {
        $today = now()->toDateString();

        $layers = DB::table('master_approval_layer')
            ->where('cat_code', $catCode)
            ->where('type', 'Approval')
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderBy('priority', 'asc')
            ->get();

        $enriched = $layers->map(function ($layer) {
            $user = DB::table('users')->where('nik', $layer->nik)->first();
            return [
                'priority' => $layer->priority,
                'stage' => $layer->stage,
                'nik' => $layer->nik,
                'email' => $layer->email,
                'name' => $user?->name ?? $layer->email,
                'position' => $user?->position ?? '-',
                'department' => $user?->department ?? '-',
                'division' => $user?->division ?? '-',
            ];
        });

        return response()->json([
            'cat_code' => $catCode,
            'approval_layers' => $enriched,
        ]);
    }
}
