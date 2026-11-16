<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\AccountGroup;
use App\Models\ReconAccount;
use App\Models\VendorRequest;
use App\Models\VendorApprovalHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    /**
     * Mengambil master data untuk form Accounting.
     */
    public function options()
    {
        return response()->json([
            'account_groups' => AccountGroup::orderBy('id')->get(),
            'recon_accounts' => ReconAccount::orderBy('id')->get(),
            'payment_methods' => [
                [
                    'value' => 'transfer',
                    'label' => 'Transfer',
                ],
            ],
        ]);
    }

    /**
     * Mengambil data vendor untuk halaman Accounting.
     */
    public function show(int $vendorId)
    {
        $vendor = Vendor::with([
            'kategori',
            'accountGroup',
            'reconAccount',
        ])->findOrFail($vendorId);

        return response()->json([
            'vendor' => $vendor,
        ]);
    }

    /**
     * Menyimpan data Accounting.
     */
    public function update(Request $request, int $vendorId)
    {
        $validated = $request->validate([
            'account_group_id' => [
                'required',
                'exists:account_groups,id',
            ],

            'recon_account_id' => [
                'required',
                'exists:recon_accounts,id',
            ],

            'payment_method' => [
                'required',
                'string',
                'max:50',
            ],
        ]);

        DB::transaction(function () use ($validated, $vendorId) {

            $vendor = Vendor::findOrFail($vendorId);

            $vendor->update([
                'account_group_id' => $validated['account_group_id'],
                'recon_account_id' => $validated['recon_account_id'],
                'payment_method' => $validated['payment_method'],
            ]);

            $vendorRequest = VendorRequest::where(
                'vendor_id',
                $vendor->id
            )
                ->latest()
                ->first();

            if ($vendorRequest) {

                $vendorRequest->update([
                    'status' => 'Under Review',
                ]);

                VendorApprovalHistory::create([
                    'vendor_request_id' => $vendorRequest->id,
                    'approval_stage' => 'Accounting',
                    'status' => 'Approved',
                    'acted_by' => Auth::id(),
                    'acted_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => 'Data Accounting berhasil disimpan.',
        ]);
    }
}
