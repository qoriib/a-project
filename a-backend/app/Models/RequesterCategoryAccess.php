<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequesterCategoryAccess extends Model
{
    protected $table = 'requester_category_access';

    protected $fillable = [
        'nik',
        'category_type',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}
