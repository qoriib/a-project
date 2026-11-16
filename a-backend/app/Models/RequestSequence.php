<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestSequence extends Model
{
    protected $table = 'request_sequences';

    protected $fillable = [
        'year',
        'form_type',
        'status',
        'last_number',
    ];

    protected $casts = [
        'year' => 'integer',
        'last_number' => 'integer',
    ];
}
