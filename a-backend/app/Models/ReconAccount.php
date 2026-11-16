<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconAccount extends Model
{
    protected $table = 'recon_accounts';

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

    public function vendors()
    {
        return $this->hasMany(Vendor::class, 'recon_account_id');
    }
}
