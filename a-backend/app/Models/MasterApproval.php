<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterApproval extends Model
{
    protected $fillable = [
        'nik',
        'email',
        'approval_stage',
        'can_view',
        'can_edit',
        'can_approve',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_edit' => 'boolean',
        'can_approve' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'nik', 'nik');
    }
}