<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountGroup;

class AccountGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['code' => 'Z010', 'name' => 'Vendor-SiteOwner'],
            ['code' => 'Z020', 'name' => 'Vendor-SupplierLocal3rd'],
            ['code' => 'Z030', 'name' => 'Vendor-SupplierOverseas3rd'],
            ['code' => 'Z040', 'name' => 'Vendor-Affiliated'],
            ['code' => 'Z050', 'name' => 'Vendor-Shareholder'],
            ['code' => 'Z060', 'name' => 'Vendor-FinancialInstitution'],
            ['code' => 'Z070', 'name' => 'Vendor-OneTime'],
            ['code' => 'Z080', 'name' => 'Employee-Internal'],
            ['code' => null,   'name' => 'Other'],
        ];

        foreach ($groups as $group) {
            AccountGroup::updateOrCreate(
                [
                    'code' => $group['code'],
                    'name' => $group['name'],
                ],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
