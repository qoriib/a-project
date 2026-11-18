<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\VendorBankAccount;
use App\Models\VendorDocument;
use App\Models\VendorRequest;
use App\Models\VendorCategory;
use App\Models\AccountGroup;
use App\Models\ReconAccount;
use App\Models\PaymentTerm;
use App\Models\WithholdingTax;
use App\Models\VendorSubcategory;

class Vendor extends Model
{
    protected $fillable = [
        'nama_perusahaan',
        'vendor_code',
        'source_type',
        'search_term',

        'pic_vendor',
        'email',
        'phone',
        'mobile_phone',
        'fax',

        'kategori_id',
        'kategori_other',
        'business_type',

        'npwp',

        'address',
        'city',
        'postal_code',
        'country',

        'account_group_id',
        'account_group_other',
        'recon_account_id',
        'recon_account_other',

        'payment_method',
        'company_code_purch_org',

        'payment_term_id',
        'payment_term_other',

        'order_currency',
        'order_currency_other',

        'created_by',
        'is_active',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];


    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    public function kategori()
    {
        return $this->belongsTo(
            VendorCategory::class,
            'kategori_id'
        );
    }

    public function documents()
    {
        return $this->hasMany(VendorDocument::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(VendorBankAccount::class);
    }


    /*
    |--------------------------------------------------------------------------
    | REQUEST
    |--------------------------------------------------------------------------
    */

    public function requests()
    {
        return $this->hasMany(VendorRequest::class);
    }

    public function vendorRequests()
    {
        return $this->hasMany(VendorRequest::class);
    }

    public function latestRequest()
    {
        return $this->hasOne(VendorRequest::class, 'vendor_id')
            ->latestOfMany();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATOR
    |--------------------------------------------------------------------------
    */

    public function creator()
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ACCOUNT GROUP
    |--------------------------------------------------------------------------
    */

    public function accountGroup()
    {
        return $this->belongsTo(
            AccountGroup::class,
            'account_group_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RECON ACCOUNT
    |--------------------------------------------------------------------------
    */

    public function reconAccount()
    {
        return $this->belongsTo(
            ReconAccount::class,
            'recon_account_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT TERM
    |--------------------------------------------------------------------------
    */

    public function paymentTerm()
    {
        return $this->belongsTo(
            PaymentTerm::class,
            'payment_term_id'
        );
    }

    public function withholdingTaxes()
    {
        return $this->belongsToMany(
            WithholdingTax::class,
            'vendor_withholding_taxes',
            'vendor_id',
            'withholding_tax_id'
        )->withTimestamps();
    }

    public function vendorSubcategories()
    {
        return $this->hasMany(
            VendorSubcategory::class,
            'vendor_id'
        );
    }
}
