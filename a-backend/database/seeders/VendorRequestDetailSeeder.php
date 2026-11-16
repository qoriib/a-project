<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendorRequest;
use App\Models\VendorRequestDetail;

class VendorRequestDetailSeeder extends Seeder
{
    public function run(): void
    {
        $requests = VendorRequest::with('vendor')->get();

        foreach ($requests as $request) {
            $vendor = $request->vendor;

            $newData = [
                'nama_perusahaan' => $vendor?->nama_perusahaan,
                'search_term' => $vendor?->search_term,
                'email' => $vendor?->email,
                'phone' => $vendor?->phone,
                'npwp' => $vendor?->npwp,
                'address' => $vendor?->address,
                'city' => $vendor?->city,
                'order_currency' => $vendor?->order_currency,
                'company_code_purch_org' => $vendor?->company_code_purch_org,
            ];

            $oldData = ($request->request_type === 'UPDATE') ? [
                'nama_perusahaan' => $vendor?->nama_perusahaan,
                'email' => 'old_email@vendor.com',
                'phone' => '021-000000',
            ] : null;

            VendorRequestDetail::updateOrCreate(
                ['vendor_request_id' => $request->id],
                [
                    'old_data' => $oldData,
                    'new_data' => $newData,
                    'changed_by_nik' => $request->requested_by_nik,
                    'changed_by_email' => $request->requested_by_email,
                ]
            );
        }
    }
}
