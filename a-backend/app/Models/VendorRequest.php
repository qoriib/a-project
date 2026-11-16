<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorRequest extends Model
{
    protected $fillable = [
        'vendor_id',
        'request_type',
        'form_number',
        'internal_vendor_code',
        'sap_vendor_code',
        'cat_code',
        'requested_by_nik',
        'requested_by_email',
        'status',
        'current_stage',
        'submitted_at',
        'completed_at',
        'final_pdf_path',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function requester()
    {
        return $this->belongsTo(
            User::class,
            'requested_by_nik',
            'nik'
        );
    }

    public function details()
    {
        return $this->hasMany(VendorRequestDetail::class);
    }

    public function approvalHistories()
    {
        return $this->hasMany(
            VendorApprovalHistory::class,
            'vendor_request_id'
        );
    }
    public function formApprovals()
    {
        return $this->hasMany(
            FormApproval::class,
            'vendor_request_id'
        )->orderBy('priority');
    }
}
