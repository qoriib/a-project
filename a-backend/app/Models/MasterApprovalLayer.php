<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterApprovalLayer extends Model
{
    protected $table = 'master_approval_layer';

    protected $fillable = [
        'cat_code',
        'type',
        'priority',
        'stage',
        'email',
        'nik',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'priority' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}
