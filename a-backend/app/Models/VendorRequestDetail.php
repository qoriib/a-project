<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorRequestDetail extends Model
{
    protected $fillable = [
        'vendor_request_id',
        'old_data',
        'new_data',
        'changed_by_nik',
        'changed_by_email',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function vendorRequest()
    {
        return $this->belongsTo(VendorRequest::class);
    }
}
