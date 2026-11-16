<?php

namespace App\Http\Controllers;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorTemplateController extends Controller
{
    /**
     * Download Template Excel untuk New Vendor Import.
     * Sheets: Vendors, BankAccounts, Panduan_Master_Data
     */
    public function downloadNewVendorTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();

        // ---------------------------------------------------------------------
        // Sheet 1: Vendors
        // ---------------------------------------------------------------------
        $vendorSheet = $spreadsheet->getActiveSheet();
        $vendorSheet->setTitle('Vendors');

        $vendorHeaders = [
            'vendor_ref',
            'nama_perusahaan',
            'search_term',
            'address',
            'city',
            'postal_code',
            'country',
            'phone',
            'mobile_phone',
            'fax',
            'pic_vendor',
            'email',
            'npwp',
            'business_type',
            'kategori_code',
            'kategori_other',
            'subcategory',
            'payment_term_code',
            'payment_term_other',
            'order_currency',
            'order_currency_other',
        ];
        $vendorSheet->fromArray($vendorHeaders, null, 'A1');

        $vendorSamples = [
            [
                'REF001',
                'PT Contoh Solusi Mandiri',
                'SOLUSI',
                'Jl. TB Simatupang No. 18',
                'Jakarta Selatan',
                '12430',
                'Indonesia',
                '021-7891234',
                '081234567890',
                '021-7891235',
                'Budi Santoso',
                'budi@contohsolusi.test',
                '99.345.678.9-012.000',
                'PT',
                'VMS_001',
                '',
                'Material & Jasa',
                'AP04',
                '',
                'IDR',
                '',
            ],
            [
                'REF002',
                'CV Contoh Digital Kreasi',
                'DIGIKREASI',
                'Jl. Gatot Subroto Kav. 52',
                'Jakarta Selatan',
                '12950',
                'Indonesia',
                '021-5239900',
                '081198765432',
                '021-5239901',
                'Rina Handayani',
                'rina@contohdigi.test',
                '99.456.789.0-015.000',
                'CV',
                'VMS_004',
                '',
                'Jasa',
                'AP02',
                '',
                'IDR',
                '',
            ],
        ];
        $vendorSheet->fromArray($vendorSamples, null, 'A2');

        $vendorSheet->getStyle('A1:U1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '17385F'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);
        $vendorSheet->getRowDimension(1)->setRowHeight(28);

        foreach (range('A', 'U') as $col) {
            $vendorSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ---------------------------------------------------------------------
        // Sheet 2: BankAccounts
        // ---------------------------------------------------------------------
        $bankSheet = $spreadsheet->createSheet();
        $bankSheet->setTitle('BankAccounts');

        $bankHeaders = [
            'vendor_ref',
            'bank_name',
            'account_number',
            'account_name',
            'swift_code',
        ];
        $bankSheet->fromArray($bankHeaders, null, 'A1');

        $bankSamples = [
            [
                'REF001',
                'Bank Central Asia (BCA)',
                '8801928371',
                'PT CONTOH SOLUSI MANDIRI',
                'CENAIDJA',
            ],
            [
                'REF002',
                'Bank Mandiri',
                '1370019283741',
                'CV CONTOH DIGITAL KREASI',
                'BMRIIDJA',
            ],
        ];
        $bankSheet->fromArray($bankSamples, null, 'A2');

        $bankSheet->getStyle('A1:E1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '17385F'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);
        $bankSheet->getRowDimension(1)->setRowHeight(28);

        foreach (range('A', 'E') as $col) {
            $bankSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ---------------------------------------------------------------------
        // Sheet 3: Panduan_Master_Data
        // ---------------------------------------------------------------------
        $refSheet = $spreadsheet->createSheet();
        $refSheet->setTitle('Panduan_Master_Data');

        $refSheet->setCellValue('A1', 'KODE KATEGORI (kategori_code)');
        $refSheet->setCellValue('B1', 'DIVISI');
        $refSheet->setCellValue('C1', 'NAMA KATEGORI / DESKRIPSI');

        $categories = \Illuminate\Support\Facades\DB::table('vendor_categories')
            ->orderBy('id')
            ->get();

        $catRow = 2;
        foreach ($categories as $cat) {
            $refSheet->setCellValue('A' . $catRow, $cat->cat_code);
            $refSheet->setCellValue('B' . $catRow, $cat->category_type);
            $refSheet->setCellValue('C' . $catRow, $cat->category_desc);
            $catRow++;
        }

        $refSheet->setCellValue('E1', 'KODE PAYMENT TERM (payment_term_code)');
        $refSheet->setCellValue('F1', 'KETERANGAN TEMPO PEMBAYARAN');

        $paymentTerms = \Illuminate\Support\Facades\DB::table('payment_terms')
            ->orderBy('id')
            ->get();

        $ptRow = 2;
        foreach ($paymentTerms as $pt) {
            $refSheet->setCellValue('E' . $ptRow, $pt->code ?: 'OTHER');
            $refSheet->setCellValue('F' . $ptRow, $pt->name);
            $ptRow++;
        }

        $refSheet->setCellValue('H1', 'PILIHAN SUBCATEGORY');
        $refSheet->setCellValue('H2', 'Material');
        $refSheet->setCellValue('H3', 'Jasa');
        $refSheet->setCellValue('H4', 'Material & Jasa');

        $refSheet->setCellValue('J1', 'PILIHAN ORDER CURRENCY');
        $refSheet->setCellValue('J2', 'IDR');
        $refSheet->setCellValue('J3', 'USD');
        $refSheet->setCellValue('J4', 'OTHER (Wajib isi order_currency_other)');

        $refSheet->getStyle('A1:C1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '17385F']],
        ]);
        $refSheet->getStyle('E1:F1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '17385F']],
        ]);
        $refSheet->getStyle('H1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '17385F']],
        ]);
        $refSheet->getStyle('J1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '17385F']],
        ]);

        foreach (['A', 'B', 'C', 'E', 'F', 'H', 'J'] as $col) {
            $refSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Set active sheet back to first sheet
        $spreadsheet->setActiveSheetIndex(0);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'template-new-vendor.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Download Template Excel untuk Existing Vendor Import.
     * Sheets: Vendors, BankAccounts, WithholdingTaxes
     */
    public function downloadExistingVendorTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();

        // Sheet 1: Vendors
        $vendorSheet = $spreadsheet->getActiveSheet();
        $vendorSheet->setTitle('Vendors');

        $vendorHeaders = [
            'vendor_code',
            'nama_perusahaan',
            'search_term',
            'address',
            'city',
            'postal_code',
            'country',
            'phone',
            'mobile_phone',
            'fax',
            'pic_vendor',
            'email',
            'npwp',
            'business_type',
            'kategori_code',
            'account_group',
            'recon_account',
            'payment_method',
            'company_code_purch_org',
            'payment_term',
            'order_currency',
        ];
        $vendorSheet->fromArray($vendorHeaders, null, 'A1');

        $vendorSample = [
            'VEND001',
            'PT Sinergi Mandiri Abadi',
            'SINERGI',
            'Jl. MH Thamrin No. 45',
            'Jakarta Pusat',
            '10350',
            'Indonesia',
            '021-333111',
            '0811999888',
            '021-333222',
            'Andi Wijaya',
            'andi@sinergi.test',
            '01.999.888.7-011.000',
            'Swasta',
            'VMS_001',
            'Z010',
            '31000310',
            'Transfer',
            '1200 / 1300 (PROJECT BAKTI)',
            'AP04',
            'IDR',
        ];
        $vendorSheet->fromArray($vendorSample, null, 'A2');

        $vendorSheet->getStyle('A1:U1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '17385F'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);
        $vendorSheet->getRowDimension(1)->setRowHeight(28);

        foreach (range('A', 'U') as $col) {
            $vendorSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Sheet 2: BankAccounts
        $bankSheet = $spreadsheet->createSheet();
        $bankSheet->setTitle('BankAccounts');

        $bankHeaders = [
            'vendor_code',
            'bank_name',
            'account_number',
            'beneficiary',
        ];
        $bankSheet->fromArray($bankHeaders, null, 'A1');

        $bankSample = [
            'VEND001',
            'Bank Mandiri',
            '1370001234567',
            'PT SINERGI MANDIRI ABADI',
        ];
        $bankSheet->fromArray($bankSample, null, 'A2');

        $bankSheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '17385F'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);
        $bankSheet->getRowDimension(1)->setRowHeight(28);
        foreach (range('A', 'D') as $col) {
            $bankSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Sheet 3: WithholdingTaxes
        $taxSheet = $spreadsheet->createSheet();
        $taxSheet->setTitle('WithholdingTaxes');

        $taxHeaders = [
            'vendor_code',
            'wht_code',
        ];
        $taxSheet->fromArray($taxHeaders, null, 'A1');

        $taxSample = [
            'VEND001',
            'W3',
        ];
        $taxSheet->fromArray($taxSample, null, 'A2');

        $taxSheet->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '17385F'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);
        $taxSheet->getRowDimension(1)->setRowHeight(28);
        foreach (range('A', 'B') as $col) {
            $taxSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Sheet 4: Panduan_Master_Data
        $refSheet = $spreadsheet->createSheet();
        $refSheet->setTitle('Panduan_Master_Data');

        $refSheet->setCellValue('A1', 'KATEGORI VENDOR');
        $refSheet->setCellValue('A2', 'kategori_code');
        $refSheet->setCellValue('B2', 'Kategori');

        $cats = \Illuminate\Support\Facades\DB::table('vendor_categories')->get();
        $r = 3;
        foreach ($cats as $cat) {
            $refSheet->setCellValue("A{$r}", $cat->cat_code);
            $refSheet->setCellValue("B{$r}", $cat->category_desc);
            $r++;
        }

        $refSheet->setCellValue('D1', 'ACCOUNT GROUP');
        $refSheet->setCellValue('D2', 'account_group');
        $refSheet->setCellValue('E2', 'Nama');
        $groups = \Illuminate\Support\Facades\DB::table('account_groups')->whereNotNull('code')->get();
        $r = 3;
        foreach ($groups as $g) {
            $refSheet->setCellValue("D{$r}", $g->code);
            $refSheet->setCellValue("E{$r}", $g->name);
            $r++;
        }

        $refSheet->setCellValue('G1', 'RECON ACCOUNT');
        $refSheet->setCellValue('G2', 'recon_account');
        $refSheet->setCellValue('H2', 'Nama');
        $recons = \Illuminate\Support\Facades\DB::table('recon_accounts')->whereNotNull('code')->get();
        $r = 3;
        foreach ($recons as $rec) {
            $refSheet->setCellValue("G{$r}", $rec->code);
            $refSheet->setCellValue("H{$r}", $rec->name);
            $r++;
        }

        $refSheet->setCellValue('J1', 'PAYMENT TERM');
        $refSheet->setCellValue('J2', 'payment_term');
        $refSheet->setCellValue('K2', 'Deskripsi');
        $terms = \Illuminate\Support\Facades\DB::table('payment_terms')->whereNotNull('code')->where('code', '!=', '')->get();
        $r = 3;
        foreach ($terms as $pt) {
            $refSheet->setCellValue("J{$r}", $pt->code);
            $refSheet->setCellValue("K{$r}", $pt->name);
            $r++;
        }

        $refSheet->setCellValue('M1', 'WITHHOLDING TAX (PPh)');
        $refSheet->setCellValue('M2', 'wht_code');
        $refSheet->setCellValue('N2', 'Deskripsi Pajak');
        $taxes = \Illuminate\Support\Facades\DB::table('withholding_taxes')->get();
        $r = 3;
        foreach ($taxes as $tx) {
            $firstWord = explode(' ', trim($tx->name))[0] ?? 'W1';
            $refSheet->setCellValue("M{$r}", $firstWord);
            $refSheet->setCellValue("N{$r}", $tx->name);
            $r++;
        }

        foreach (['A', 'B', 'D', 'E', 'G', 'H', 'J', 'K', 'M', 'N'] as $col) {
            $refSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Set active sheet back to first sheet
        $spreadsheet->setActiveSheetIndex(0);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'template-existing-vendor.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
