<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RequesterCategoryController extends Controller
{
    public function index(Request $request)
    {
        // Ambil NIK dari user yang sedang login
        $user = $request->user();

        if (!$user || !$user->nik) {
            return response()->json([
                'message' => 'NIK pengguna tidak ditemukan.',
            ], 401);
        }

        $today = now()->toDateString();

        // Ambil kategori SCM/BRD yang boleh diakses oleh Requester
        $allowedTypes = DB::table('requester_category_access')
            ->where('nik', $user->nik)
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->distinct()
            ->pluck('category_type');

        if ($allowedTypes->isEmpty()) {
            return response()->json([
                'message' => 'Anda belum memiliki akses kategori vendor.',
                'categories' => [],
            ]);
        }

        // Ambil daftar kategori yang masih berlaku
        $categories = DB::table('vendor_categories')
            ->whereIn('category_type', $allowedTypes)
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderBy('category_type')
            ->orderBy('category_desc')
            ->get([
                'cat_code',
                'category_type',
                'category_desc',
            ]);

        return response()->json([
            'message' => 'Kategori berhasil diambil.',
            'allowed_category_types' => $allowedTypes->values(),
            'categories' => $categories,
        ]);
    }
}