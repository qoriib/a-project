<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Role;
use App\Models\Admin;


#[Fillable(['name', 'nik', 'email', 'division', 'department', 'position', 'depthead', 'divhead', 'director', 'role_id', 'is_active', 'substitute_nik', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'nik', 'nik');
    }

    public function masterApproval()
    {
        return $this->hasOne(MasterApproval::class, 'nik', 'nik');
    }

    public function createdVendors()
    {
        return $this->hasMany(Vendor::class, 'created_by');
    }

    public function vendorRequests()
    {
        return $this->hasMany(VendorRequest::class, 'requested_by_nik', 'nik');
    }

    public function isAdmin(): bool
    {
        if (!$this->nik) {
            return false;
        }

        return Admin::where('nik', $this->nik)->exists();
    }
}
