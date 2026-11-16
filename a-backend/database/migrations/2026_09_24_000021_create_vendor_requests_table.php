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

            $table->string('form_number', 100)->nullable()->unique();

            $table->enum('request_type', [
                'CREATE',
                'IMPORT_EXISTING',
                'UPDATE',
            ]);

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->string('internal_vendor_code', 100)->nullable();
            $table->string('sap_vendor_code', 100)->nullable();
            $table->string('cat_code', 50)->nullable();

            $table->string('requested_by_nik', 255)->nullable();
            $table->string('requested_by_email', 255)->nullable();

            $table->enum('status', [
                'DRAFT',
                'PENDING',
                'CANCEL_APPROVE',
                'APPROVED',
                'REJECTED',
            ])->default('DRAFT');

            $table->string('current_stage', 255)->default('REQUESTER');

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->string('final_pdf_path', 255)->nullable();

            $table->timestamps();
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
