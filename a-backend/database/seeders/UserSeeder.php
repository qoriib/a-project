<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password123');

        $users = [
            [
                'name' => 'Admin Testing',
                'nik' => '90000000',
                'email' => 'admin@ibs.test',
                'role' => 'ADMIN',
                'division' => 'IT',
                'department' => 'System',
                'position' => 'Administrator',
            ],
            [
                'name' => 'Kadiv Approver',
                'nik' => '90000001',
                'email' => 'test.kadiv@ibs.test',
                'role' => 'KADIV',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Kadiv',
            ],
            [
                'name' => 'Accounting Approver',
                'nik' => '90000002',
                'email' => 'test.accounting@ibs.test',
                'role' => 'ACCOUNTING',
                'division' => 'Finance',
                'department' => 'Accounting',
                'position' => 'Staff Accounting',
            ],
            [
                'name' => 'Tax Approver',
                'nik' => '90000003',
                'email' => 'test.tax@ibs.test',
                'role' => 'TAX',
                'division' => 'Finance',
                'department' => 'Tax',
                'position' => 'Staff Tax',
            ],
            [
                'name' => 'SAP Approver',
                'nik' => '90000004',
                'email' => 'test.sap@ibs.test',
                'role' => 'SAP',
                'division' => 'IT',
                'department' => 'ERP/SAP',
                'position' => 'Staff SAP',
            ],
            [
                'name' => 'Asisten Kadiv Approver',
                'nik' => '90000006',
                'email' => 'test.asisten@ibs.test',
                'role' => 'ASISTEN_KADIV',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Asisten Kadiv',
            ],
            [
                'name' => 'Requester User',
                'nik' => '90000007',
                'email' => 'test.requester@ibs.test',
                'role' => 'REQUESTER',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Staff Requester',
            ],
            [
                'name' => 'Staff Procurement',
                'nik' => '20268888',
                'email' => 'procurement@ibs.test',
                'role' => 'PROCUREMENT',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Staff Procurement',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);

            $role = Role::where('name', $roleName)->first();

            User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password' => $password,
                    'role_id' => $role?->id,
                ])
            );
        }
    }
}
