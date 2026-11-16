<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorCategory extends Model
{
    protected $fillable = [
        'cat_code',
        'category_type',
        'category_desc',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['name'];

    /**
     * Accessor agar $category->name selalu mengembalikan deskripsi kategori
     */
    public function getNameAttribute(): string
    {
        return (string) ($this->category_desc ?? $this->cat_code ?? '');
    }

    public function vendorSubcategories()
    {
        return $this->hasMany(
            VendorSubcategory::class,
            'category_id'
        );
    }

    public function vendors()
    {
        return $this->hasMany(
            Vendor::class,
            'kategori_id'
        );
    }
}
