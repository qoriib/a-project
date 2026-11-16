<?php

namespace App\Http\Controllers;

use App\Models\VendorCategory;
use Illuminate\Support\Facades\DB;

class VendorCategoryController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        $categories = VendorCategory::query()
            ->where(function ($query) use ($today) {
                $query->whereNull('start_date')
                    ->orWhereDate('start_date', '<=', $today);
            })
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderBy('id')
            ->get();

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
