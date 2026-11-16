<?php

namespace App\Http\Controllers;

use App\Models\VendorCategory;

class VendorCategoryController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        $categories = VendorCategory::query()
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderBy('id')
            ->get();

        return response()->json($categories);
    }
}
