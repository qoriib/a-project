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
        Schema::create('vendor_requests', function (Blueprint $table) {
            $table->id();

            // Identitas Pengajuan
            $table->string('form_number', 100)->nullable()->unique();
            $table->enum('request_type', ['CREATE', 'IMPORT_EXISTING', 'UPDATE'])->default('CREATE');

            // Relasi ke Master Vendor
            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->cascadeOnDelete();

            // Kode Referensi & Kategori
            $table->string('internal_vendor_code', 100)->nullable();
            $table->string('sap_vendor_code', 100)->nullable();
            $table->string('cat_code', 50)->nullable()->index();

            // Pemohon (Requester)
            $table->string('requested_by_nik', 50)->nullable()->index();
            $table->string('requested_by_email', 255)->nullable();

            // Status & Tahapan Workflow
            $table->string('status', 50)->default('DRAFT')->index();
            $table->string('current_stage', 50)->default('REQUESTER')->index();

            // Alasan Penolakan / Rollback
            $table->text('rejection_reason')->nullable();
            $table->text('cancellation_reason')->nullable();

            // Waktu & PDF Final
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('final_pdf_path', 255)->nullable();

            $table->timestamps();

            // Indeks komposit antrean approval
            $table->index(['current_stage', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_requests');
    }
};
