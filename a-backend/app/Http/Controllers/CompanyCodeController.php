<?php

namespace App\Http\Controllers;

use App\Models\CompanyCode;

class CompanyCodeController extends Controller
{
    public function index()
    {
        $companyCodes = CompanyCode::query()
            ->where(function ($query) {
                $query->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->orderBy('code')
            ->get();

        return response()->json($companyCodes);
    }
}
