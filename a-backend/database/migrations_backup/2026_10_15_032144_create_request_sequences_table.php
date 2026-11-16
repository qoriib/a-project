<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_sequences', function (Blueprint $table) {
            $table->id();

            $table->unsignedSmallInteger('year');
            $table->string('form_type', 1); // N atau U

            $table->string('status')->default('ACTIVE');
            $table->unsignedBigInteger('last_number')->default(0);

            $table->timestamps();

            // Urutan terpisah untuk setiap jenis form dan tahun
            $table->unique(
                ['year', 'form_type'],
                'request_sequences_year_type_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_sequences');
    }
};
