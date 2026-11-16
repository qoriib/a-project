<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorWithholdingTax extends Model
{
    protected $table = 'vendor_withholding_taxes';

    protected $fillable = [
        'vendor_id',
        'withholding_tax_id',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function withholdingTax()
    {
        return $this->belongsTo(WithholdingTax::class);
    }
}
