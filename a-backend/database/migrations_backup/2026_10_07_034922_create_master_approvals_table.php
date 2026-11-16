<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_approvals', function (Blueprint $table) {
            $table->id();

            // Identitas pengguna
            $table->string('nik');
            $table->string('email');

            // Tahapan workflow
            $table->string('approval_stage');

            // Hak akses pada tahap tersebut
            $table->boolean('can_view')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_approve')->default(false);

            // Masa berlaku konfigurasi
            $table->date('start_date');
            $table->date('end_date')->nullable();

            $table->timestamps();

            $table->index('nik');
            $table->index('email');
            $table->index('approval_stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_approvals');
    }
};