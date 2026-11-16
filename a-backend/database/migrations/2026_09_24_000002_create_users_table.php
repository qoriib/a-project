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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Identitas Karyawan
            $table->string('name', 255);
            $table->string('nik', 50)->unique();
            $table->string('email', 255)->unique();
            $table->string('password', 255);

            // Peran & Hak Akses
            $table->foreignId('role_id')
                ->nullable()
                ->constrained('roles')
                ->nullOnDelete();

            // Struktur Organisasi (HRIS)
            $table->string('division', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('position', 100)->nullable();
            $table->string('depthead', 100)->nullable();
            $table->string('divhead', 100)->nullable();
            $table->string('director', 100)->nullable();

            // Status Akun & Delegasi Cuti
            $table->boolean('is_active')->default(true);
            $table->string('substitute_nik', 50)->nullable();

            $table->rememberToken();
            $table->timestamps();

            // Indeks untuk pencarian cepat
            $table->index(['is_active', 'role_id']);
            $table->index('substitute_nik');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
