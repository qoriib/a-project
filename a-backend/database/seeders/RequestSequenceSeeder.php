<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequestSequence;

class RequestSequenceSeeder extends Seeder
{
    public function run(): void
    {
        $year = (int) date('Y');

        $sequences = [
            [
                'year' => $year,
                'form_type' => 'VMS',
                'status' => 'NEW',
                'last_number' => 25,
            ],
            [
                'year' => $year,
                'form_type' => 'VMS',
                'status' => 'UPDATE',
                'last_number' => 15,
            ],
        ];

        foreach ($sequences as $seq) {
            RequestSequence::updateOrCreate(
                [
                    'year' => $seq['year'],
                    'form_type' => $seq['form_type'],
                    'status' => $seq['status'],
                ],
                [
                    'last_number' => $seq['last_number'],
                ]
            );
        }
    }
}
