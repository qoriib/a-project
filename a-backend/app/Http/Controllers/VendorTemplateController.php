<?php

namespace App\Http\Controllers;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorTemplateController extends Controller
{
    /**
     * Download Template Excel untuk New Vendor Import.
     * Sheets: Vendors, BankAccounts
     */
    public function downloadNewVendorTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();

        // Sheet 1: Vendors
        $vendorSheet = $spreadsheet->getActiveSheet();
        $vendorSheet->setTitle('Vendors');

        $vendorHeaders = [
            'vendor_ref',
            'nama_perusahaan',
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
            'payment_method',
            'payment_term_code',
            'order_currency',
            'search_term',
        ];
        $vendorSheet->fromArray($vendorHeaders, null, 'A1');

        $vendorSample = [
            'REF001',
            'PT Cahaya Sukses Mandiri',
            'Jl. Jendral Sudirman No. 123',
            'Jakarta Selatan',
            '12190',
            'Indonesia',
            '021-5551234',
            '081234567890',
            '021-5551235',
            'Budi Santoso',
            'budi@cahayasukses.test',
            '01.234.567.8-012.000',
            'Swasta',
            'VMS_001',
            'Transfer',
            'Z001',
            'IDR',
            'CAHAYA',
        ];
        $vendorSheet->fromArray($vendorSample, null, 'A2');

        // Sheet 2: BankAccounts
        $bankSheet = $spreadsheet->createSheet();
        $bankSheet->setTitle('BankAccounts');

        $bankHeaders = [
            'vendor_ref',
            'bank_name',
            'account_number',
            'beneficiary',
            'swift_code',
        ];
        $bankSheet->fromArray($bankHeaders, null, 'A1');

        $bankSample = [
            'REF001',
            'BCA',
            '1234567890',
            'PT CAHAYA SUKSES MANDIRI',
            'CENAIDJA',
        ];
        $bankSheet->fromArray($bankSample, null, 'A2');

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
            'Z001',
            '110100',
            'Transfer',
            '1200 / 1300 (PROJECT BAKTI)',
            'Z001',
            'IDR',
        ];
        $vendorSheet->fromArray($vendorSample, null, 'A2');

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
            'L1',
        ];
        $taxSheet->fromArray($taxSample, null, 'A2');

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
