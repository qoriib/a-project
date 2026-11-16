<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ReconAccount;

class ReconAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['code' => '31000310', 'name' => 'Trade A/P-3rd Party'],
            ['code' => '31000320', 'name' => 'Trade A/P-Affiliated'],
            ['code' => '32000210', 'name' => 'Non Trade A/P-3rd Party'],
            ['code' => '32000220', 'name' => 'Non Trade A/P-Affiliated'],
            ['code' => '34000510', 'name' => 'Employee Payable'],
            ['code' => null,       'name' => 'Other'],
        ];

        foreach ($accounts as $account) {
            ReconAccount::updateOrCreate(
                [
                    'code' => $account['code'],
                    'name' => $account['name'],
                ],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
