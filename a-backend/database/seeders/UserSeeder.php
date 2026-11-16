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
        $password = Hash::make('password');

        $users = [
            // =========================================================
            // 1. AKUN TESTING UTAMA IBS (@ibs.test) - SCM & BACK OFFICE
            // =========================================================
            [
                'name' => 'Admin Testing IBS',
                'nik' => '90000000',
                'email' => 'admin@ibs.test',
                'role' => 'ADMIN',
                'division' => 'IT',
                'department' => 'Enterprise System',
                'position' => 'Senior System Administrator',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Dwi Handayani, S.T. (Asisten Kadiv SCM)',
                'nik' => '90000006',
                'email' => 'test.asisten@ibs.test',
                'role' => 'ASISTEN_KADIV',
                'division' => 'SCM',
                'department' => 'Procurement & Vendor Management',
                'position' => 'Assistant Head of SCM / VM Verifikator',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Hendro Prasetyo, S.T. (Kadiv SCM)',
                'nik' => '90000001',
                'email' => 'test.kadiv@ibs.test',
                'role' => 'KADIV',
                'division' => 'SCM',
                'department' => 'Supply Chain Management',
                'position' => 'Head of SCM Division',
                'is_active' => true,
                'substitute_nik' => '90000006', // Pengganti cuti: Asisten Kadiv SCM
            ],
            [
                'name' => 'Bambang Sudarsono, S.E., Ak. (Accounting Lead)',
                'nik' => '90000002',
                'email' => 'test.accounting@ibs.test',
                'role' => 'ACCOUNTING',
                'division' => 'Finance & Accounting',
                'department' => 'Financial Accounting',
                'position' => 'Senior Accounting Lead',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Citra Anggraini, S.E. (Tax Specialist)',
                'nik' => '90000003',
                'email' => 'test.tax@ibs.test',
                'role' => 'TAX',
                'division' => 'Finance & Accounting',
                'department' => 'Corporate Tax',
                'position' => 'Corporate Tax Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Rizky Pratama, M.Kom. (SAP Consultant)',
                'nik' => '90000004',
                'email' => 'test.sap@ibs.test',
                'role' => 'SAP',
                'division' => 'IT & Enterprise Architecture',
                'department' => 'SAP ERP COE',
                'position' => 'Lead SAP MM/FI Consultant',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Fajar Nugraha (Staff Requester SCM)',
                'nik' => '90000007',
                'email' => 'test.requester@ibs.test',
                'role' => 'REQUESTER',
                'division' => 'SCM',
                'department' => 'Procurement Operations',
                'position' => 'Procurement Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Bayu Setiawan (Staff Procurement)',
                'nik' => '20268888',
                'email' => 'procurement@ibs.test',
                'role' => 'PROCUREMENT',
                'division' => 'SCM',
                'department' => 'Strategic Sourcing',
                'position' => 'Sourcing Officer',
                'is_active' => true,
                'substitute_nik' => null,
            ],

            // =========================================================
            // 2. AKUN TESTING IBS (@ibs.test) - DIVISI BR (BUSINESS REP)
            // =========================================================
            [
                'name' => 'Irfan Hakim, S.T. (Asisten Kadiv BR)',
                'nik' => '90000016',
                'email' => 'test.asisten.br@ibs.test',
                'role' => 'ASISTEN_KADIV',
                'division' => 'BR',
                'department' => 'Land Acquisition & Permit',
                'position' => 'Assistant Head of BR / BR Verifikator',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Suryono Hadi, M.M. (Kadiv BR)',
                'nik' => '90000011',
                'email' => 'test.kadiv.br@ibs.test',
                'role' => 'KADIV',
                'division' => 'BR',
                'department' => 'Business Representative',
                'position' => 'Head of BR Division',
                'is_active' => true,
                'substitute_nik' => '90000016', // Pengganti cuti: Asisten Kadiv BR
            ],
            [
                'name' => 'Dimas Anggara (Staff Requester BR)',
                'nik' => '90000017',
                'email' => 'test.requester.br@ibs.test',
                'role' => 'REQUESTER',
                'division' => 'BR',
                'department' => 'Site Acquisition & Permit Operations',
                'position' => 'Land Acquisition Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],

            // =========================================================
            // 3. STAFF PENDUKUNG REVIEWER (MULTI-USER TESTING)
            // =========================================================
            [
                'name' => 'Laila Fitriani, S.E. (Accounting Staff)',
                'nik' => '90000022',
                'email' => 'accounting2@ibs.test',
                'role' => 'ACCOUNTING',
                'division' => 'Finance & Accounting',
                'department' => 'Financial Accounting',
                'position' => 'Accounting Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Wahyu Ramadhan, S.E. (Tax Reviewer)',
                'nik' => '90000023',
                'email' => 'tax2@ibs.test',
                'role' => 'TAX',
                'division' => 'Finance & Accounting',
                'department' => 'Corporate Tax',
                'position' => 'Tax Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Bayu Wicaksono (SAP MM Specialist)',
                'nik' => '90000024',
                'email' => 'sap2@ibs.test',
                'role' => 'SAP',
                'division' => 'IT & Enterprise Architecture',
                'department' => 'SAP ERP COE',
                'position' => 'SAP MM Master Data Specialist',
                'is_active' => true,
                'substitute_nik' => null,
            ],

            // =========================================================
            // 4. AKUN DEMO CEPAT (@example.com)
            // =========================================================
            [
                'name' => 'Super Administrator Demo',
                'nik' => 'ADM001',
                'email' => 'admin@example.com',
                'role' => 'ADMIN',
                'division' => 'IT',
                'department' => 'System Administration',
                'position' => 'Admin VMS',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Requester SCM Demo',
                'nik' => 'REQ001',
                'email' => 'requester@example.com',
                'role' => 'REQUESTER',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Requester SCM',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Asisten Kadiv SCM Demo (Verifikator)',
                'nik' => 'AKD001',
                'email' => 'asisten.kadiv@example.com',
                'role' => 'ASISTEN_KADIV',
                'division' => 'SCM',
                'department' => 'Vendor Management',
                'position' => 'VM Verifikator',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Kadiv SCM Demo (Approver Level 2)',
                'nik' => 'KDV001',
                'email' => 'kadiv@example.com',
                'role' => 'KADIV',
                'division' => 'SCM',
                'department' => 'Supply Chain Management',
                'position' => 'Kadiv SCM',
                'is_active' => true,
                'substitute_nik' => 'AKD001',
            ],
            [
                'name' => 'Requester BR Demo',
                'nik' => 'REQ002',
                'email' => 'requester.br@example.com',
                'role' => 'REQUESTER',
                'division' => 'BR',
                'department' => 'Business Representative',
                'position' => 'Requester BR',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Asisten Kadiv BR Demo (Verifikator)',
                'nik' => 'AKD002',
                'email' => 'asisten.br@example.com',
                'role' => 'ASISTEN_KADIV',
                'division' => 'BR',
                'department' => 'Business Representative',
                'position' => 'BR Verifikator',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Kadiv BR Demo (Approver Level 2)',
                'nik' => 'KDV002',
                'email' => 'kadiv.br@example.com',
                'role' => 'KADIV',
                'division' => 'BR',
                'department' => 'Business Representative',
                'position' => 'Kadiv BR',
                'is_active' => true,
                'substitute_nik' => 'AKD002',
            ],
            [
                'name' => 'Accounting Approver Demo (Level 3)',
                'nik' => 'ACC001',
                'email' => 'accounting@example.com',
                'role' => 'ACCOUNTING',
                'division' => 'Finance',
                'department' => 'Accounting',
                'position' => 'Staff Accounting',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Tax Approver Demo (Level 4)',
                'nik' => 'TAX001',
                'email' => 'tax@example.com',
                'role' => 'TAX',
                'division' => 'Finance',
                'department' => 'Taxation',
                'position' => 'Staff Tax',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'SAP Team Approver Demo (Level 5)',
                'nik' => 'SAP001',
                'email' => 'sap@example.com',
                'role' => 'SAP',
                'division' => 'IT',
                'department' => 'ERP SAP',
                'position' => 'Staff SAP MM',
                'is_active' => true,
                'substitute_nik' => null,
            ],

            // =========================================================
            // 5. USER PENGGANTI CUTI & USER NONAKTIF
            // =========================================================
            [
                'name' => 'Maya Indraswari (Pejabat Pengganti Cuti)',
                'nik' => 'SUB001',
                'email' => 'substitute.kadiv@ibs.test',
                'role' => 'KADIV',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Acting Kadiv SCM',
                'is_active' => true,
                'substitute_nik' => null,
            ],
            [
                'name' => 'Joko Susilo (Karyawan Non-Aktif / Resign)',
                'nik' => 'INACT001',
                'email' => 'inactive.user@ibs.test',
                'role' => 'REQUESTER',
                'division' => 'SCM',
                'department' => 'Procurement',
                'position' => 'Ex-Staff Requester',
                'is_active' => false,
                'substitute_nik' => null,
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
