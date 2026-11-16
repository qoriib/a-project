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
        Schema::create('requester_category_access', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 50);
            $table->string('category_type', 50);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();

            // Indeks unik akses kategori per NIK
            $table->unique(
                ['nik', 'category_type'],
                'requester_category_access_nik_type_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requester_category_access');
    }
};
