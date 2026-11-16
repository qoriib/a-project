<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorDocument extends Model
{
    protected $fillable = [
        'vendor_id',
        'document_type',
        'bank_account_id',
        'file_name',
        'file_path',
        'version',
        'uploaded_by',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    public function bankAccount()
    {
        return $this->belongsTo(VendorBankAccount::class, 'bank_account_id');
    }
}
