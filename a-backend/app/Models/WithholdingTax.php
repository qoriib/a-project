<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Vendor;

class WithholdingTax extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function vendors()
    {
        return $this->belongsToMany(
            Vendor::class,
            'vendor_withholding_taxes',
            'withholding_tax_id',
            'vendor_id'
        )->withTimestamps();
    }
}
