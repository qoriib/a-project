<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('request_sequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->string('form_type', 50)->default('VMS');
            $table->string('status', 50)->default('NEW');
            $table->unsignedBigInteger('last_number')->default(0);
            $table->timestamps();

            // Kunci unik urutan penomoran per tahun, form_type, dan tipe request
            $table->unique(
                ['year', 'form_type', 'status'],
                'request_sequences_year_type_status_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_sequences');
    }
};
