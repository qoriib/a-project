<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorApprovalHistory extends Model
{
    protected $fillable = [
        'vendor_request_id',
        'approval_stage',
        'acted_by',
        'acted_by_name',
        'acted_by_nik',
        'acted_by_email',
        'status',
        'notes',
        'acted_at',
        'signature_token',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    public function vendorRequest()
    {
        return $this->belongsTo(VendorRequest::class);
    }

    public function actor()
    {
        return $this->belongsTo(
            User::class,
            'acted_by_nik',
            'nik'
        );
    }
}
