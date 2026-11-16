<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendorRequest;
use App\Models\VendorRequestDetail;

class VendorRequestDetailSeeder extends Seeder
{
    public function run(): void
    {
        $requests = VendorRequest::with('vendor.bankAccounts', 'vendor.vendorSubcategories')->get();

        foreach ($requests as $request) {
            $vendor = $request->vendor;
            if (!$vendor) {
                continue;
            }

            $primaryBank = $vendor->bankAccounts->firstWhere('is_primary', true);

            $newData = [
                'nama_perusahaan' => $vendor->nama_perusahaan,
                'search_term' => $vendor->search_term,
                'email' => $vendor->email,
                'phone' => $vendor->phone,
                'mobile_phone' => $vendor->mobile_phone,
                'fax' => $vendor->fax,
                'pic_vendor' => $vendor->pic_vendor,
                'npwp' => $vendor->npwp,
                'address' => $vendor->address,
                'city' => $vendor->city,
                'postal_code' => $vendor->postal_code,
                'country' => $vendor->country,
                'business_type' => $vendor->business_type,
                'order_currency' => $vendor->order_currency,
                'company_code_purch_org' => $vendor->company_code_purch_org,
                'payment_term_id' => $vendor->payment_term_id,
                'account_group_id' => $vendor->account_group_id,
                'recon_account_id' => $vendor->recon_account_id,
                'bank_name' => $primaryBank?->bank_name,
                'account_number' => $primaryBank?->account_number,
                'account_name' => $primaryBank?->account_name,
                'swift_code' => $primaryBank?->swift_code,
            ];

            $oldData = null;
            $diffData = null;

            if ($request->request_type === 'UPDATE') {
                if ($request->form_number === 'HRIS-VMS-U-20260401001') {
                    // Update 1: Perubahan Rekening Bank (PT Telkom Nusantara)
                    $oldData = array_merge($newData, [
                        'bank_name' => 'Bank Central Asia (BCA)',
                        'account_number' => '1000038291',
                        'swift_code' => 'CENAIDJA',
                    ]);

                    $newData['bank_name'] = 'Bank Mandiri (Persero) Tbk';
                    $newData['account_number'] = '1370001889922';
                    $newData['swift_code'] = 'BMRIIDJA';

                    $diffData = [
                        'bank_name' => [
                            'field' => 'bank_name',
                            'label' => 'Nama Bank',
                            'old' => 'Bank Central Asia (BCA)',
                            'new' => 'Bank Mandiri (Persero) Tbk',
                        ],
                        'account_number' => [
                            'field' => 'account_number',
                            'label' => 'Nomor Rekening',
                            'old' => '1000038291',
                            'new' => '1370001889922',
                        ],
                        'swift_code' => [
                            'field' => 'swift_code',
                            'label' => 'SWIFT Code',
                            'old' => 'CENAIDJA',
                            'new' => 'BMRIIDJA',
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260405001') {
                    // Update 2: Perubahan Alamat & Kontak (PT Global Network Solusindo)
                    $oldData = array_merge($newData, [
                        'email' => 'old_info@globalnetwork.co.id',
                        'phone' => '031-8880000',
                        'address' => 'Gedung Graha Famili Blok A-1, Surabaya Barat',
                        'city' => 'Surabaya',
                        'postal_code' => '60225',
                    ]);

                    $diffData = [
                        'email' => [
                            'field' => 'email',
                            'label' => 'Email Perusahaan',
                            'old' => 'old_info@globalnetwork.co.id',
                            'new' => $vendor->email,
                        ],
                        'phone' => [
                            'field' => 'phone',
                            'label' => 'Nomor Telepon Kantor',
                            'old' => '031-8880000',
                            'new' => $vendor->phone,
                        ],
                        'address' => [
                            'field' => 'address',
                            'label' => 'Alamat Domisili',
                            'old' => 'Gedung Graha Famili Blok A-1, Surabaya Barat',
                            'new' => $vendor->address,
                        ],
                        'postal_code' => [
                            'field' => 'postal_code',
                            'label' => 'Kode Pos',
                            'old' => '60225',
                            'new' => $vendor->postal_code,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260410002') {
                    // Update 3: Perubahan PIC & Telepon (PT Graha Lahan Mandiri - BR)
                    $oldData = array_merge($newData, [
                        'pic_vendor' => 'Hendra Wijaya S.',
                        'mobile_phone' => '081299990000',
                        'email' => 'old_kontak@grahalahan.co.id',
                    ]);

                    $diffData = [
                        'pic_vendor' => [
                            'field' => 'pic_vendor',
                            'label' => 'Person in Charge (PIC)',
                            'old' => 'Hendra Wijaya S.',
                            'new' => $vendor->pic_vendor,
                        ],
                        'mobile_phone' => [
                            'field' => 'mobile_phone',
                            'label' => 'Nomor HP PIC',
                            'old' => '081299990000',
                            'new' => $vendor->mobile_phone,
                        ],
                        'email' => [
                            'field' => 'email',
                            'label' => 'Email Kontak',
                            'old' => 'old_kontak@grahalahan.co.id',
                            'new' => $vendor->email,
                        ],
                    ];
                }
            }

            VendorRequestDetail::updateOrCreate(
                ['vendor_request_id' => $request->id],
                [
                    'old_data' => $oldData,
                    'new_data' => $newData,
                    'diff_data' => $diffData,
                    'changed_by_nik' => $request->requested_by_nik,
                    'changed_by_email' => $request->requested_by_email,
                ]
            );
        }
    }
}
