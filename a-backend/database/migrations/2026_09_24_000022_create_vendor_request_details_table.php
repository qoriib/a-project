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
        Schema::create('vendor_request_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_request_id')
                ->constrained('vendor_requests')
                ->cascadeOnDelete();

            // Snapshot Data Lama vs Baru dan Diff Field Perubahan
            $table->json('old_data')->nullable();
            $table->json('new_data');
            $table->json('diff_data')->nullable();

            // Informasi User Pemohon Perubahan
            $table->string('changed_by_nik', 50)->nullable();
            $table->string('changed_by_email', 255)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_request_details');
    }
};
