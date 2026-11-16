<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorCategoryController;
use App\Http\Controllers\PaymentTermController;
use App\Http\Controllers\CompanyCodeController;
use App\Http\Controllers\AccountGroupController;
use App\Http\Controllers\ReconAccountController;
use App\Http\Controllers\AccountingController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\VendorRequestController;
use App\Http\Controllers\WithholdingTaxController;
use App\Http\Controllers\MasterApprovalController;
use App\Http\Controllers\VendorPdfController;
use App\Http\Controllers\VendorVerificationController;
use App\Http\Controllers\ExistingVendorImportController;
use App\Http\Controllers\NewVendorImportController;
use App\Http\Controllers\RequesterCategoryController;
use App\Http\Controllers\VendorTemplateController;


/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
| Route yang dapat diakses tanpa login.
|--------------------------------------------------------------------------
*/

Route::post('/login', [
    AuthController::class,
    'login'
]);

Route::get(
    '/vendor-verifications/{token}',
    [VendorVerificationController::class, 'show']
)->name('vendor-verifications.show');

Route::get('/vendors/template/new', [
    VendorTemplateController::class,
    'downloadNewVendorTemplate'
]);

Route::get('/vendors/template/existing', [
    VendorTemplateController::class,
    'downloadExistingVendorTemplate'
]);


/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
| Semua route di dalam group ini membutuhkan login/token Sanctum.
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | AUTH / PROFILE
    |--------------------------------------------------------------------------
    */

    Route::get('/me', function (Request $request) {
        return response()->json([
            'message' => 'Token valid',
            'user' => $request->user(),
        ]);
    });

    Route::get('/dashboard', function (Request $request) {
        return response()->json([
            'message' => 'Berhasil mengakses dashboard',
            'user' => $request->user(),
        ]);
    });

    Route::get(
        '/vendor-requests/{id}/pdf',
        [VendorPdfController::class, 'show']
    );

     Route::get(
        '/requester/available-categories',
        [RequesterCategoryController::class, 'index']
    );

    /*
|--------------------------------------------------------------------------
| EXISTING VENDOR
|--------------------------------------------------------------------------
*/

    Route::get(
        '/existing-vendors',
        [VendorController::class, 'existingIndex']
    );

    Route::post(
        '/existing-vendors/import',
        [ExistingVendorImportController::class, 'import']
    );

    Route::post(
        '/existing-vendors/import-documents',
        [ExistingVendorImportController::class, 'importDocuments']
    );

    /*
    |--------------------------------------------------------------------------
    | USER MANAGEMENT
    |--------------------------------------------------------------------------
    */

    Route::prefix('users')->group(function () {

        Route::get('/', [
            UserManagementController::class,
            'index'
        ]);

        Route::get('/{id}', [
            UserManagementController::class,
            'show'
        ]);

        Route::put('/{id}', [
            UserManagementController::class,
            'update'
        ]);

        Route::put('/{id}/role', [
            UserManagementController::class,
            'updateRole'
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | ROLES
    |--------------------------------------------------------------------------
    */

    Route::get('/roles', [
        RoleController::class,
        'index'
    ]);


    /*
    |--------------------------------------------------------------------------
    | MASTER APPROVAL
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'master-approvals',
        MasterApprovalController::class
    );


    /*
    |--------------------------------------------------------------------------
    | VENDOR
    |--------------------------------------------------------------------------
    */

    Route::prefix('vendors')->group(function () {

        Route::get('/', [
            VendorController::class,
            'index'
        ]);

        Route::post('/import', [
            NewVendorImportController::class,
            'import'
        ]);

        Route::get('/{id}', [
            VendorController::class,
            'show'
        ]);

        Route::post('/', [
            VendorController::class,
            'store'
        ]);

        Route::put('/{id}', [
            VendorController::class,
            'update'
        ]);

        Route::delete('/{id}', [
            VendorController::class,
            'destroy'
        ]);
    });


    /*
|--------------------------------------------------------------------------
| VENDOR REQUEST
|--------------------------------------------------------------------------
*/

    Route::prefix('vendor-requests')->group(function () {

        // GENERAL
        Route::get('/', [
            VendorRequestController::class,
            'index'
        ]);

        // SEMUA NEW VENDOR - KHUSUS ADMIN
        Route::get('/new-vendors', [
            VendorRequestController::class,
            'allNewVendorRequests'
        ]);

        Route::get('/stage/{stage}', [
            VendorRequestController::class,
            'byStage'
        ]);

        Route::get('/stage/{stage}', [
            VendorRequestController::class,
            'byStage'
        ]);

        Route::get('/completed', [
            VendorRequestController::class,
            'completed'
        ]);

        Route::get('/{id}', [
            VendorRequestController::class,
            'show'
        ]);

        // REQUESTER
        Route::put('/{id}/procurement', [
            VendorRequestController::class,
            'updateProcurement'
        ]);

        // APPROVAL: REQUESTER, ACCOUNTING, TAX, SAP
        Route::post('/{id}/approve', [
            VendorRequestController::class,
            'approve'
        ]);

        Route::post('/{id}/reject', [
            VendorRequestController::class,
            'reject'
        ]);

        Route::post('/{id}/cancel-approve', [
            VendorRequestController::class,
            'cancelApprove'
        ]);

        // ACCOUNTING
        Route::post('/{id}/accounting', [
            VendorRequestController::class,
            'processAccounting'
        ]);

        Route::post('/{id}/accounting/draft', [
            VendorRequestController::class,
            'saveAccountingDraft'
        ]);

        // TAX
        Route::post('/{id}/tax', [
            VendorRequestController::class,
            'processTax'
        ]);

        Route::post('/{id}/tax/draft', [
            VendorRequestController::class,
            'saveTaxDraft'
        ]);

        // SAP
        Route::post('/{id}/sap', [
            VendorRequestController::class,
            'processSap'
        ]);

        Route::post('/{id}/sap/draft', [
            VendorRequestController::class,
            'saveSapDraft'
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | ACCOUNTING
    |--------------------------------------------------------------------------
    */

    Route::prefix('accounting')->group(function () {

        Route::get('/options', [
            AccountingController::class,
            'options'
        ]);

        Route::get('/vendors/{vendorId}', [
            AccountingController::class,
            'show'
        ]);

        Route::put('/vendors/{vendorId}', [
            AccountingController::class,
            'update'
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    |
    | URL LAMA DIPERTAHANKAN agar frontend tidak perlu diubah.
    |--------------------------------------------------------------------------
    */

    Route::get('/vendor-categories', [
        VendorCategoryController::class,
        'index'
    ]);

    Route::get('/vendor-categories/{catCode}/approval-layer', [
        VendorCategoryController::class,
        'approvalLayer'
    ]);

    Route::get('/payment-terms', [
        PaymentTermController::class,
        'index'
    ]);

    Route::get('/company-codes', [
        CompanyCodeController::class,
        'index'
    ]);

    Route::get('/account-groups', [
        AccountGroupController::class,
        'index'
    ]);

    Route::get('/recon-accounts', [
        ReconAccountController::class,
        'index'
    ]);

    Route::get('/withholding-taxes', [
        WithholdingTaxController::class,
        'index'
    ]);
});
