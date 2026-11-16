<?php

namespace App\Http\Controllers;

use App\Models\WithholdingTax;

class WithholdingTaxController extends Controller
{
    public function index()
    {
        $taxes = WithholdingTax::query()
            ->whereDate('start_date', '<=', now()->toDateString())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', now()->toDateString());
            })
            ->orderBy('id')
            ->get();

        return response()->json($taxes);
    }
}
