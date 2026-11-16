<?php

namespace App\Http\Controllers;

use App\Models\PaymentTerm;

class PaymentTermController extends Controller
{
    public function index()
    {
        $paymentTerms = PaymentTerm::query()
            ->where(function ($query) {
                $query->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->orderBy('name')
            ->get();

        return response()->json($paymentTerms);
    }
}
