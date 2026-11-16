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
        Schema::create('vendor_approval_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_request_id')
                ->constrained('vendor_requests')
                ->cascadeOnDelete();

            $table->string('approval_stage', 50)->index();

            // Identitas Approver yang Menindak
            $table->foreignId('acted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('acted_by_name', 255)->nullable();
            $table->string('acted_by_nik', 50)->nullable()->index();
            $table->string('acted_by_email', 255)->nullable();

            // Status Tindakan & Catatan / Alasan
            $table->string('status', 50);
            $table->text('notes')->nullable();

            // Waktu & Tanda Tangan Digital
            $table->timestamp('acted_at')->nullable();
            $table->string('signature_token', 64)->nullable()->unique();

            $table->timestamps();

            // Indeks pencarian kronologis riwayat
            $table->index(['vendor_request_id', 'acted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_approval_histories');
    }
};
