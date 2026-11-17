<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequestSequence;
use Illuminate\Support\Facades\DB;

class RequestSequenceSeeder extends Seeder
{
    public function run(): void
    {
        $year = (int) date('Y');

        $maxNew = 30;
        $maxUpdate = 30;

        $existingNew = DB::table('vendor_requests')
            ->where('form_number', 'like', 'HRIS-%-N-%')
            ->pluck('form_number');
        foreach ($existingNew as $fn) {
            if (preg_match('/(\d{3,})$/', $fn, $matches)) {
                $num = (int) substr($matches[1], -3);
                if ($num > $maxNew) {
                    $maxNew = $num;
                }
            }
        }

        $existingUpdate = DB::table('vendor_requests')
            ->where('form_number', 'like', 'HRIS-%-U-%')
            ->pluck('form_number');
        foreach ($existingUpdate as $fn) {
            if (preg_match('/(\d{3,})$/', $fn, $matches)) {
                $num = (int) substr($matches[1], -3);
                if ($num > $maxUpdate) {
                    $maxUpdate = $num;
                }
            }
        }

        $sequences = [
            [
                'year' => $year,
                'form_type' => 'VMS',
                'status' => 'NEW',
                'last_number' => $maxNew,
            ],
            [
                'year' => $year,
                'form_type' => 'VMS',
                'status' => 'UPDATE',
                'last_number' => $maxUpdate,
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
