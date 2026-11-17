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
                            'role' => 'REQUESTER',
                            'old' => 'Hendra Wijaya S.',
                            'new' => $vendor->pic_vendor,
                        ],
                        'mobile_phone' => [
                            'field' => 'mobile_phone',
                            'label' => 'Nomor HP PIC',
                            'role' => 'REQUESTER',
                            'old' => '081299990000',
                            'new' => $vendor->mobile_phone,
                        ],
                        'email' => [
                            'field' => 'email',
                            'label' => 'Email Kontak',
                            'role' => 'REQUESTER',
                            'old' => 'old_kontak@grahalahan.co.id',
                            'new' => $vendor->email,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260425001') {
                    // Update 4: Tahap KADIV SCM (PT Cipta Teknologi Pratama)
                    $oldData = array_merge($newData, [
                        'phone' => '021-3334400',
                        'pic_vendor' => 'Rian Hidayat, S.Kom.',
                        'mobile_phone' => '081399887766',
                    ]);

                    $diffData = [
                        'phone' => [
                            'field' => 'phone',
                            'label' => 'Nomor Telepon Kantor',
                            'role' => 'REQUESTER',
                            'old' => '021-3334400',
                            'new' => $vendor->phone,
                        ],
                        'pic_vendor' => [
                            'field' => 'pic_vendor',
                            'label' => 'Person in Charge (PIC)',
                            'role' => 'REQUESTER',
                            'old' => 'Rian Hidayat, S.Kom.',
                            'new' => $vendor->pic_vendor,
                        ],
                        'mobile_phone' => [
                            'field' => 'mobile_phone',
                            'label' => 'Nomor Handphone PIC',
                            'role' => 'REQUESTER',
                            'old' => '081399887766',
                            'new' => $vendor->mobile_phone,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260425002') {
                    // Update 5: Tahap TAX (PT Bangun Menara Harmoni)
                    $oldData = array_merge($newData, [
                        'npwp' => '01.234.567.8-009.000',
                        'address' => 'Jl. TB Simatupang No. 12, Jakarta Selatan',
                    ]);

                    $diffData = [
                        'npwp' => [
                            'field' => 'npwp',
                            'label' => 'NPWP Perusahaan',
                            'role' => 'TAX',
                            'old' => '01.234.567.8-009.000',
                            'new' => $vendor->npwp,
                        ],
                        'address' => [
                            'field' => 'address',
                            'label' => 'Alamat Domisili Kantor',
                            'role' => 'REQUESTER',
                            'old' => 'Jl. TB Simatupang No. 12, Jakarta Selatan',
                            'new' => $vendor->address,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260425003') {
                    // Update 6: Tahap SAP (CV Multi Sarana Teknik Mandiri)
                    $oldData = array_merge($newData, [
                        'bank_name' => 'Bank Mandiri (Persero) Tbk',
                        'account_number' => '1230009876543',
                        'swift_code' => 'BMRIIDJA',
                    ]);

                    $newData['bank_name'] = 'Bank Central Asia (BCA)';
                    $newData['account_number'] = '8800112233';
                    $newData['swift_code'] = 'CENAIDJA';

                    $diffData = [
                        'bank_name' => [
                            'field' => 'bank_name',
                            'label' => 'Nama Bank',
                            'role' => 'REQUESTER',
                            'old' => 'Bank Mandiri (Persero) Tbk',
                            'new' => 'Bank Central Asia (BCA)',
                        ],
                        'account_number' => [
                            'field' => 'account_number',
                            'label' => 'Nomor Rekening Bank',
                            'role' => 'REQUESTER',
                            'old' => '1230009876543',
                            'new' => '8800112233',
                        ],
                        'swift_code' => [
                            'field' => 'swift_code',
                            'label' => 'SWIFT Code',
                            'role' => 'REQUESTER',
                            'old' => 'BMRIIDJA',
                            'new' => 'CENAIDJA',
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260425004') {
                    // Update 7: Ditolak (CV Prima Daya Cemerlang)
                    $oldData = array_merge($newData, [
                        'bank_name' => 'Bank CIMB Niaga',
                        'account_number' => '700123456789',
                    ]);

                    $newData['bank_name'] = 'Bank Danamon';
                    $newData['account_number'] = '003344556677';

                    $diffData = [
                        'bank_name' => [
                            'field' => 'bank_name',
                            'label' => 'Nama Bank',
                            'role' => 'REQUESTER',
                            'old' => 'Bank CIMB Niaga',
                            'new' => 'Bank Danamon',
                        ],
                        'account_number' => [
                            'field' => 'account_number',
                            'label' => 'Nomor Rekening',
                            'role' => 'REQUESTER',
                            'old' => '700123456789',
                            'new' => '003344556677',
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260426001') {
                    // Update 8: DRAFT Requester (PT Surya Energi Persada)
                    $oldData = array_merge($newData, [
                        'email' => 'old_surya@energi.co.id',
                        'phone' => '021-5250001',
                    ]);

                    $diffData = [
                        'email' => [
                            'field' => 'email',
                            'label' => 'Email Resmi Perusahaan',
                            'role' => 'REQUESTER',
                            'old' => 'old_surya@energi.co.id',
                            'new' => $vendor->email,
                        ],
                        'phone' => [
                            'field' => 'phone',
                            'label' => 'Nomor Telepon Kantor',
                            'role' => 'REQUESTER',
                            'old' => '021-5250001',
                            'new' => $vendor->phone,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260426002') {
                    // Update 9: PENDING_L1 Asisten Kadiv SCM (PT Bakti Mega Konstruksi)
                    $oldData = array_merge($newData, [
                        'pic_vendor' => 'Wahyudi P. (Lama)',
                        'mobile_phone' => '081288881111',
                    ]);

                    $diffData = [
                        'pic_vendor' => [
                            'field' => 'pic_vendor',
                            'label' => 'Nama Person in Charge (PIC)',
                            'role' => 'REQUESTER',
                            'old' => 'Wahyudi P. (Lama)',
                            'new' => $vendor->pic_vendor,
                        ],
                        'mobile_phone' => [
                            'field' => 'mobile_phone',
                            'label' => 'Nomor Handphone PIC',
                            'role' => 'REQUESTER',
                            'old' => '081288881111',
                            'new' => $vendor->mobile_phone,
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260426003') {
                    // Update 10: REJECTED di Level 2 Kadiv BR (CV Mitra Perizinan Nusantara)
                    $oldData = array_merge($newData, [
                        'address' => 'Jl. Kaliurang KM 5 No. 10, Sleman, Yogyakarta',
                        'city' => 'Sleman',
                    ]);

                    $newData['address'] = 'Jl. Palagan Tentara Pelajar No. 88, Sleman';

                    $diffData = [
                        'address' => [
                            'field' => 'address',
                            'label' => 'Alamat Domisili Kantor',
                            'role' => 'REQUESTER',
                            'old' => 'Jl. Kaliurang KM 5 No. 10, Sleman, Yogyakarta',
                            'new' => 'Jl. Palagan Tentara Pelajar No. 88, Sleman',
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260415001') {
                    // Update 11: COMPLETED Selesai Update (PT Lintas Logistik Nusantara)
                    $oldData = array_merge($newData, [
                        'bank_name' => 'Bank Mandiri (Persero) Tbk',
                        'account_number' => '1220008889991',
                    ]);

                    $newData['bank_name'] = 'Bank Central Asia (BCA)';
                    $newData['account_number'] = '5410987654';

                    $diffData = [
                        'bank_name' => [
                            'field' => 'bank_name',
                            'label' => 'Nama Bank',
                            'role' => 'REQUESTER',
                            'old' => 'Bank Mandiri (Persero) Tbk',
                            'new' => 'Bank Central Asia (BCA)',
                        ],
                        'account_number' => [
                            'field' => 'account_number',
                            'label' => 'Nomor Rekening',
                            'role' => 'REQUESTER',
                            'old' => '1220008889991',
                            'new' => '5410987654',
                        ],
                    ];
                } elseif ($request->form_number === 'HRIS-VMS-U-20260420001') {
                    // Update 12: REJECTED di Kadiv SCM (CV Borneo Sarana Komunika)
                    $oldData = array_merge($newData, [
                        'bank_name' => 'Bank Mandiri (Persero) Tbk',
                        'account_number' => '1480011223344',
                    ]);

                    $newData['bank_name'] = 'Bank Central Asia (BCA)';
                    $newData['account_number'] = '8001122334';

                    $diffData = [
                        'bank_name' => [
                            'field' => 'bank_name',
                            'label' => 'Nama Bank',
                            'role' => 'REQUESTER',
                            'old' => 'Bank Mandiri (Persero) Tbk',
                            'new' => 'Bank Central Asia (BCA)',
                        ],
                        'account_number' => [
                            'field' => 'account_number',
                            'label' => 'Nomor Rekening',
                            'role' => 'REQUESTER',
                            'old' => '1480011223344',
                            'new' => '8001122334',
                        ],
                    ];
                } else {
                    // Fallback UPDATE umum
                    $oldData = array_merge($newData, [
                        'phone' => '021-99990000',
                        'pic_vendor' => $vendor->pic_vendor . ' (Lama)',
                    ]);

                    $diffData = [
                        'pic_vendor' => [
                            'field' => 'pic_vendor',
                            'label' => 'Contact Person / PIC Vendor',
                            'role' => 'REQUESTER',
                            'old' => $vendor->pic_vendor . ' (Lama)',
                            'new' => $vendor->pic_vendor,
                        ],
                        'phone' => [
                            'field' => 'phone',
                            'label' => 'Nomor Telepon Kantor',
                            'role' => 'REQUESTER',
                            'old' => '021-99990000',
                            'new' => $vendor->phone,
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
