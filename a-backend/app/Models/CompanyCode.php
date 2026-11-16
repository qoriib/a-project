<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyCode extends Model
{
    protected $table = 'company_codes';

    protected $fillable = [
        'code',
        'name',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}
