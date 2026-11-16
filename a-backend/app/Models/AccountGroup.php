<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountGroup extends Model
{
    protected $table = 'account_groups';

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
        return $this->hasMany(Vendor::class, 'account_group_id');
    }
}
