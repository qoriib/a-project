<?php

namespace App\Http\Controllers;

use App\Models\ReconAccount;

class ReconAccountController extends Controller
{
    public function index()
    {
        $reconAccounts = ReconAccount::query()
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

        return response()->json($reconAccounts);
    }
}
