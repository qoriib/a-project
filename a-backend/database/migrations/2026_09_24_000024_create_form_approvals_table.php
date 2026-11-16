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
        Schema::create('form_approvals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_request_id')
                ->constrained('vendor_requests')
                ->cascadeOnDelete();

            $table->unsignedInteger('priority');
            $table->string('status', 50)->default('WAITING');
            $table->string('stage', 50);

            $table->string('nik', 50);
            $table->string('email', 255);

            $table->timestamps();

            // Satu urutan prioritas hanya boleh muncul sekali per permohonan
            $table->unique(
                ['vendor_request_id', 'priority'],
                'form_approvals_request_priority_unique'
            );

            // Indeks pencarian antrean approver
            $table->index(['nik', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_approvals');
    }
};
