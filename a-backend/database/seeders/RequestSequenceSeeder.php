<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequestSequence;

class RequestSequenceSeeder extends Seeder
{
    public function run(): void
    {
        $sequences = [
            [
                'year' => 2026,
                'form_type' => 'N',
                'status' => 'ACTIVE',
                'last_number' => 10,
            ],
            [
                'year' => 2026,
                'form_type' => 'U',
                'status' => 'ACTIVE',
                'last_number' => 5,
            ],
        ];

        foreach ($sequences as $seq) {
            RequestSequence::updateOrCreate(
                [
                    'year' => $seq['year'],
                    'form_type' => $seq['form_type'],
                ],
                [
                    'status' => $seq['status'],
                    'last_number' => $seq['last_number'],
                ]
            );
        }
    }
}
