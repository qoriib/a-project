<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'ADMIN', 'start_date' => '2026-01-01'],
            ['name' => 'KADIV', 'start_date' => '2026-01-01'],
            ['name' => 'ACCOUNTING', 'start_date' => '2026-01-01'],
            ['name' => 'TAX', 'start_date' => '2026-01-01'],
            ['name' => 'SAP', 'start_date' => '2026-01-01'],
            ['name' => 'ASISTEN_KADIV', 'start_date' => '2026-01-01'],
            ['name' => 'REQUESTER', 'start_date' => '2026-01-01'],
            ['name' => 'PROCUREMENT', 'start_date' => '2026-01-01'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                [
                    'start_date' => $role['start_date'],
                    'end_date' => null,
                ]
            );
        }
    }
}
