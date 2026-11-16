<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorSubcategory extends Model
{
    protected $table = 'vendor_subcategory';

    protected $fillable = [
        'vendor_id',
        'category_id',
        'category_other',
        'subcategory',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function category()
    {
        return $this->belongsTo(VendorCategory::class, 'category_id');
    }
}