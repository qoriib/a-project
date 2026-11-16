<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WithholdingTax;

class WithholdingTaxSeeder extends Seeder
{
    public function run(): void
    {
        $taxes = [
            ['name' => 'l1 PPH4(2) - Inv.Deduction'],
            ['name' => 'l2 PPH21 - Inv.Deduction'],
            ['name' => 'l3 PPH23 - Inv.Deduction'],
            ['name' => 'l4 PPH26 - Inv.Deduction'],
        ];

        foreach ($taxes as $tax) {
            WithholdingTax::updateOrCreate(
                ['name' => $tax['name']],
                [
                    'start_date' => '2026-01-01',
                    'end_date' => null,
                ]
            );
        }
    }
}
