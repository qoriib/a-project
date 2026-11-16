<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormApproval extends Model
{
    protected $fillable = [
        'vendor_request_id',
        'priority',
        'status',
        'stage',
        'nik',
        'email'
    ];

    protected $casts = [
        'priority' => 'integer',
    ];

    public function vendorRequest()
    {
        return $this->belongsTo(
            VendorRequest::class,
            'vendor_request_id'
        );
    }

    public function approver()
    {
        return $this->belongsTo(
            User::class,
            'nik',
            'nik'
        );
    }
}
