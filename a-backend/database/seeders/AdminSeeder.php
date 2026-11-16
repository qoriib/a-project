<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminNiks = [
            '90000000', // Admin Testing
            'ADM001',   // Admin Demo
        ];

        foreach ($adminNiks as $nik) {
            Admin::firstOrCreate(['nik' => $nik]);
        }
    }
}
