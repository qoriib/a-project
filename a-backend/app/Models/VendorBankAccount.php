<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBankAccount extends Model
{
    protected $fillable = [
        'vendor_id',
        'bank_name',
        'account_number',
        'account_name',
        'swift_code',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function documents()
    {
        return $this->hasMany(
            VendorDocument::class,
            'bank_account_id'
        );
    }
}
