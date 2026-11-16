<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Master Data Vendor Requester</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 18px 19px 17px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #20252b;
            font-size: 7px;
            margin: 0;
        }

        table {
            border-collapse: collapse;
        }

        .topbar {
            width: 100%;
            height: 31px;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .logo-cell {
            width: 43px;
            border: 1px solid #d3d9e0;
            text-align: center;
            vertical-align: middle;
        }

        .logo {
            max-width: 38px;
            max-height: 28px;
            object-fit: contain;
        }

        .company-cell {
            background: #17385f;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            padding: 7px 10px;
            vertical-align: middle;
        }

        .doc-title {
            width: 33%;
            background: #17385f;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            padding: 6px 8px;
            vertical-align: middle;
        }

        .intro {
            font-size: 6px;
            font-style: italic;
            line-height: 1.35;
            padding: 3px 6px;
            color: #555;
        }

        .action-table {
            width: 100%;
            margin: 3px 0 5px;
            font-size: 6px;
        }

        .action-table td {
            padding: 2px 3px;
            border-bottom: 1px solid #b5c2ce;
        }

        .vendor-code {
            border-bottom: 1px solid #777;
            min-width: 150px;
            display: inline-block;
            min-height: 5px;
            padding: 2px 5px 1px;
            vertical-align: middle;
            line-height: 1.4;
            position: relative;
            top: 0;
        }

        .vendor-code-label {
            display: inline-block;
            vertical-align: middle;
            padding: 2px 0;
            font-weight: bold;
        }

        .section {
            background: #17385f;
            color: #fff;
            font-weight: bold;
            font-size: 7px;
            padding: 3px 5px;
            margin-top: 4px;
        }

        .general {
            width: 100%;
            table-layout: fixed;
        }

        .general td {
            padding: 3px 5px;
            border-bottom: 1px solid #cbd1d7;
            vertical-align: middle;
            line-height: 1.3;
        }

        .num {
            width: 17px;
            text-align: center;
            color: #4d5965;
        }

        .label {
            width: 92px;
            font-weight: bold;
        }

        .value {
            border-bottom: 1px solid #d7dce1;
            overflow-wrap: anywhere;
        }

        .general .field-num {
            width: 17px;
        }

        .general .field-label {
            width: 92px;
            font-weight: bold;
        }

        .general .field-value {
            width: auto;
            overflow-wrap: anywhere;
        }

        .required {
            float: right;
            color: #4b5968;
            font-size: 6px;
        }

        .account-grid {
            width: 100%;
            table-layout: fixed;
        }

        .account-grid td {
            border-bottom: 1px solid #d7dce1;
            padding: 3px 4px;
            vertical-align: top;
        }

        .subhead {
            font-weight: bold;
            padding: 3px 4px;
            background: #f1f4f7;
            border-bottom: 1px solid #b6c3cf;
        }

        .small {
            font-size: 5.7px;
            line-height: 1.35;
        }

        .tax-title {
            font-weight: bold;
            margin: 1px 0 3px;
        }

        .tax-table {
            width: 100%;
            table-layout: fixed;
            font-size: 5.3px;
        }

        .tax-table td {
            border: 0;
            padding: 1px 2px;
            vertical-align: top;
        }

        .check {
            font-size: 7px;
            font-weight: bold;
        }

        .company-data {
            width: 100%;
            table-layout: fixed;
        }

        .company-data td {
            padding: 3px 4px;
            border-bottom: 1px solid #cbd1d7;
        }

        .bank-table {
            width: 100%;
            table-layout: fixed;
            margin: 5px 0 7px;
            font-size: 6px;
        }

        .bank-table th {
            background: #17385f;
            color: #fff;
            font-weight: bold;
            padding: 4px 2px;
            border: 1px solid #aab6c2;
        }

        .bank-table td {
            border: 1px solid #aab6c2;
            height: 15px;
            padding: 3px;
            text-align: center;
        }

        .approval-table {
            width: 100%;
            table-layout: fixed;
            margin-top: 5px;
        }

        .approval-table th {
            border: 1px solid #687887;
            font-size: 6px;
            text-align: center;
            height: 27px;
            padding: 3px 2px;
            vertical-align: middle;
        }

        .approval-table td {
            border: 1px solid #687887;
            height: 75px;
            padding: 2px;
            vertical-align: top;
        }

        .sign {
            height: 48px;
            text-align: center;
            vertical-align: middle;
            padding-top: 2px;
        }

        .sign img {
            width: 42px;
            height: 42px;
        }

        .sign-label {
            font-size: 5px;
            color: #7b8792;
            font-style: italic;
        }

        .person {
            border-top: 1px solid #c7cfd6;
            padding: 2px;
            font-size: 5.5px;
            line-height: 1.3;
        }

        .footer {
            font-size: 5px;
            color: #7d8791;
            text-align: right;
            margin-top: 4px;
        }


        .qr-logo-wrapper {
            width: 60px;
            height: 60px;
            margin: 0 auto;
            text-align: center;
        }

        .qr-image {
            display: block;
            width: 90px;
            height: 90px;
            margin: 0 auto;
        }

        .qr-center-logo {
            position: absolute;
            width: 70px;
            height: 70px;
            left: 18px;
            top: 18px;
            padding: 1px;
            background-color: #ffffff;
        }
    </style>
</head>

<body>

    @php
    // LOGO PDF
    $logoSrc = $logoDataUri ?? null;

    // DATA BANK DAN TAX
    $firstBank = $vendor->bankAccounts->first();
    $selectedTaxes = $vendor->withholdingTaxes ?? collect();

    // KOLOM APPROVAL
    $approvalStages = [
    'REQUESTER',
    'KADIV_REQUESTER',
    'KADIV_ACCOUNTING',
    'KADIV_TAX',
    'SAP',
    ];

    $stageMap = [
    'REQUESTER' => 'Requested by,<br>Requester',
    'KADIV_REQUESTER' => 'Approved by,<br>Kadiv Requester',
    'KADIV_ACCOUNTING' => 'Approved by,<br>Kadiv Accounting',
    'KADIV_TAX' => 'Approved by,<br>Kadiv Tax',
    'SAP' => 'Accepted by,<br>SAP',
    ];

    $approvalByStage = collect($approvals)->groupBy(function ($approval) {
    $stage = strtoupper($approval->approval_stage ?? '');
    $status = $approval->status ?? '';

    if ($stage === 'PROCUREMENT' || $stage === 'REQUESTER') {
    if ($status === 'Under Review') {
    return 'REQUESTER';
    }

    if ($status === 'Approved') {
    return 'KADIV_REQUESTER';
    }
    }

    if ($stage === 'ACCOUNTING') {
    if ($status === 'Under Review') {
    return 'ACCOUNTING';
    }

    if ($status === 'Approved') {
    return 'KADIV_ACCOUNTING';
    }
    }

    if ($stage === 'TAX') {
    if ($status === 'Under Review') {
    return 'TAX';
    }

    if ($status === 'Approved') {
    return 'KADIV_TAX';
    }
    }

    if ($stage === 'KADIV') {
    return 'KADIV_REQUESTER';
    }

    if ($stage === 'SAP' && $status === 'Approved') {
    return 'SAP';
    }

    return null;
    })->filter(function ($items, $key) {
    return $key !== null;
    })->map(function ($items) {
    return $items->sortByDesc('acted_at')->first();
    });
    @endphp



    <table class="topbar">
        <tr>
            <td class="logo-cell">
                @if($logoSrc)
                <img class="logo" src="{{ $logoSrc }}" alt="IBS">
                @else
                <span style="color:#bd2340;font-weight:bold;font-size:8px;">IBS</span>
                @endif
            </td>
            <td class="company-cell">PT. Infrastruktur Bisnis Sejahtera</td>
        </tr>
    </table>

    <table style="width:100%; table-layout:fixed;">
        <tr>
            <td class="doc-title">Master Data Vendor Request</td>
            <td class="intro">
                Diisi dengan informasi vendor yang lengkap agar vendor master data dapat digunakan untuk kebutuhan analisa atau lainnya.<br>
                [R] Isi tanda silang pada kolom yang sesuai untuk data yang diperlukan.
            </td>
        </tr>
    </table>


    <table class="action-table">
        <tr>
            <td style="width:24%;">☒ New</td>
            <td style="width:34%;">☐ Change (*Vendor Code is required)</td>
            <td style="width:23%;">☐ Delete/In Active (*Vendor Code is required)</td>
            <td style="width:19%;">☐ Block (*Vendor Code is required)</td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="vendor-code-label">Request Number:</span>
                <span class="vendor-code">
                    {{ $vendorRequest->form_number ?? '-' }}
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="4">
                <span class="vendor-code-label">Vendor Code*:</span>
                <span class="vendor-code">
                    {{ $vendor->vendor_code ?: 'Belum diisi oleh SAP' }}
                </span>
            </td>
        </tr>
    </table>


    <div class="section">General Data</div>
    <table class="general">
        <tr>
            <td class="num">1.</td>
            <td class="label">Name</td>
            <td class="value" colspan="2">{{ $vendor->nama_perusahaan ?? '-' }}</td>
            <td class="num">2.</td>
            <td class="label">Search Term</td>
            <td class="value" colspan="2">{{ $vendor->search_term ?? '-' }}</td>
        </tr>
        <tr>
            <td class="num">3.</td>
            <td class="label">Street Address</td>
            <td class="value" colspan="2">{{ $vendor->address ?? '-' }}</td>
            <td class="num">4.</td>
            <td class="label">City</td>
            <td class="value" colspan="2">{{ $vendor->city ?? '-' }}</td>
        </tr>
        <tr>
            <td class="num">5.</td>
            <td class="label">Postal Code</td>
            <td class="value" colspan="2">{{ $vendor->postal_code ?? '-' }}</td>
            <td class="num">6.</td>
            <td class="label">Country</td>
            <td class="value" colspan="2">{{ $vendor->country ?? 'Indonesia' }}</td>
        </tr>
        <tr>
            <td class="num">7.</td>
            <td class="label">Telephone</td>
            <td class="value" colspan="2">{{ $vendor->phone ?? '-' }}</td>
            <td class="num">8.</td>
            <td class="label">Fax</td>
            <td class="value" colspan="2">{{ $vendor->fax ?? '-' }}</td>
        </tr>
        <tr>
            <td class="num">9.</td>
            <td class="label">Contact Person</td>
            <td class="value" colspan="2">{{ $vendor->pic_vendor ?? '-' }}</td>
            <td class="num">10.</td>
            <td class="label">NPWP</td>
            <td class="value" colspan="2">{{ $vendor->npwp ?? '-' }}</td>
        </tr>
        <tr>
            <td class="num">11.</td>
            <td class="label">Email</td>
            <td class="value" colspan="2">{{ $vendor->email ?? '-' }}</td>
            <td class="num">12.</td>
            <td class="label">Business Type</td>
            <td class="value" colspan="2">{{ $vendor->business_type ?? '-' }}</td>
        </tr>
        <tr>
            <td class="num">13.</td>
            <td class="label">Kategori</td>
            <td class="value" colspan="2">
                @php
                $kategoriName = $vendor->kategori->name ?? null;

                if (strtolower(trim($kategoriName ?? '')) === 'other') {
                $kategoriName = $vendor->kategori_other ?: 'Other';
                }
                @endphp

                {{ $kategoriName ?? '-' }}
            </td>
        </tr>
    </table>

    <div class="section">Company Code Data (Accounting Dept)</div>
    <table class="account-grid">
        <tr>
            <td style="width:22%;"><b>1. Account Group</b></td>
            <td colspan="3">
                @if($vendor->accountGroup)
                {{ $vendor->accountGroup->code ?? '' }}@if(!empty($vendor->accountGroup->code) && !empty($vendor->accountGroup->name)) - @endif{{ $vendor->accountGroup->name ?? '' }}
                @elseif(!empty($vendor->account_group_other))
                {{ $vendor->account_group_other }}
                @else
                -
                @endif
            </td>
        </tr>
        <tr>
            <td><b>2. Recon. account</b></td>
            <td colspan="3">
                @if($vendor->reconAccount)
                {{ $vendor->reconAccount->code ?? '' }}@if(!empty($vendor->reconAccount->code) && !empty($vendor->reconAccount->name)) - @endif{{ $vendor->reconAccount->name ?? '' }}
                @elseif(!empty($vendor->recon_account_other))
                {{ $vendor->recon_account_other }}
                @else
                -
                @endif
            </td>
        </tr>
        <tr>
            <td><b>3. Payment Method</b></td>
            <td colspan="3">
                @if(!empty($vendor->payment_method_code)){{ $vendor->payment_method_code }}@if(!empty($vendor->payment_method)) - @endif @endif{{ $vendor->payment_method ?? 'Transfer' }}
            </td>
        </tr>
        <tr>

            <td><b>4. Withholding tax &amp; type code</b><br>
                <span class="small">(diisi oleh bagian pajak)</span>
            </td>

            <td colspan="2">
                @if($selectedTaxes->isNotEmpty())
                <div class="tax-container">
                    @foreach($selectedTaxes as $tax)
                    <div class="tax-item">
                        {{ $tax->name ?? $tax->description ?? '-' }}
                    </div>
                    @endforeach
                </div>
                @elseif(!empty($vendor->withholding_tax))
                <div class="tax-container">
                    <div class="tax-item">
                        {{ $vendor->withholding_tax }}
                    </div>
                </div>
                @else
                <span class="tax-item">Tax belum dipilih</span>
                @endif
            </td>
        </tr>
    </table>

    <div class="section">Company Code Data (Purch Dept)</div>
    <table class="company-data">
        <tr>
            <td style="width:26%;">1. Company Code &amp; Purch Org</td>
            <td style="width:37%;">☒ 1200 &nbsp; Company Code 1200</td>
            <td style="width:37%;">☒ 1300 &nbsp; Company Code 1300 (PROJECT BAKTI)</td>
        </tr>
        <tr>
            <td>2. Due Date Payment</td>
            <td colspan="2">
                @if($vendor->paymentTerm)
                {{ $vendor->paymentTerm->code ?? '' }}@if(!empty($vendor->paymentTerm->code) && !empty($vendor->paymentTerm->name)) - @endif{{ $vendor->paymentTerm->name ?? '' }}
                @elseif(!empty($vendor->payment_term_other))
                {{ $vendor->payment_term_other }}
                @else
                -
                @endif
            </td>
        </tr>
    </table>

    <div class="section">Purchasing Organization Data</div>
    <table class="company-data">
        <tr>
            <td style="width:26%;">1. Order Currency</td>
            <td style="width:37%;">
                @if(($vendor->order_currency ?? '') === 'IDR') ☒ @else ☐ @endif IDR
                &nbsp;&nbsp;&nbsp;
                @if(($vendor->order_currency ?? '') === 'USD') ☒ @else ☐ @endif USD
            </td>
            <td style="width:37%;">Others, Mention: {{ $vendor->order_currency_other ?? (($vendor->order_currency === 'Other') ? 'Other' : '') }}</td>
        </tr>
        <tr>
            <td>2. Salesperson</td>
            <td colspan="2">{{ $vendor->salesperson ?? $vendor->pic_vendor ?? '-' }}</td>
        </tr>
    </table>

    <div class="section">Payment Transactions</div>
    <table class="bank-table">
        <thead>
            <tr>
                <th style="width:20%;">Bank Name</th>
                <th style="width:20%;">Bank Account Number</th>
                <th style="width:28%;">Beneficiary</th>
                <th style="width:14%;">Currency (USD/IDR)</th>
                <th style="width:18%;">Swift Code</th>
            </tr>
        </thead>
        <tbody>
            @forelse($vendor->bankAccounts as $bank)
            <tr>
                <td>{{ $bank->bank_name ?? '-' }}</td>
                <td>{{ $bank->account_number ?? '-' }}</td>
                <td>{{ $bank->account_name ?? '-' }}</td>
                <td>{{ $bank->currency ?? $vendor->order_currency ?? 'IDR' }}</td>
                <td>{{ $bank->swift_code ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endforelse
            @for($i = $vendor->bankAccounts->count(); $i < 3; $i++)
                <tr>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                </tr>
                @endfor
        </tbody>
    </table>


    <table class="approval-table">
        <thead>
            <tr>
                @foreach($approvalStages as $stage)
                <th>{!! $stageMap[$stage] !!}</th>
                @endforeach
            </tr>
        </thead>

        <tbody>
            <tr>
                @foreach($approvalStages as $stage)
                @php
                $approval = $approvalByStage->get($stage);
                $actor = $approval->actor ?? null;

                $isQrStage = in_array($stage, [
                'REQUESTER',
                'KADIV_REQUESTER',
                'KADIV_ACCOUNTING',
                'KADIV_TAX',
                'SAP',
                ]);

                // Requester mendapatkan QR setelah submit.
                // Approval lainnya mendapatkan QR setelah disetujui.
                $hasQrStatus = $approval && (
                ($stage === 'REQUESTER' && $approval->status === 'Under Review')
                ||
                ($stage !== 'REQUESTER' && $approval->status === 'Approved')
                );

                $qr = ($isQrStage && $hasQrStatus)
                ? ($qrCodes[$approval->id] ?? null)
                : null;
                @endphp

                <td>
                    <div class="sign">
                        @if($isQrStage && $hasQrStatus && $qr)
                        <div class="qr-logo-wrapper">
                            <img
                                src="{{ $qr }}"
                                class="qr-image"
                                alt="QR Approval">
                        </div>
                        @elseif($approval && $approval->status === 'Rejected')
                        <span class="sign-label">Rejected</span>
                        @else
                        <span class="sign-label">Menunggu Approval</span>
                        @endif
                    </div>

                    <div class="person">
                        Name: {{ $actor->name ?? '-' }}<br>

                        Date &amp; Time:
                        {{ $approval && $approval->acted_at
                            ? $approval->acted_at
                                ->timezone('Asia/Jakarta')
                                ->format('d/m/Y H:i')
                            : '-' }}
                        WIB
                    </div>
                </td>
                @endforeach
            </tr>
        </tbody>
    </table>

    <div class="footer">Vendor System — PT Infrastruktur Bisnis Sejahtera</div>
</body>

</html>