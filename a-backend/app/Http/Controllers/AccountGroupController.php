<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;

class AccountGroupController extends Controller
{
    public function index()
    {
        $accountGroups = AccountGroup::query()
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

        return response()->json($accountGroups);
    }
}
