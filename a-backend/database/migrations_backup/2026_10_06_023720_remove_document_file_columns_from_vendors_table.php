<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'npwp_file',
                'rekening_file',
                'nib_file',
                'siup_file',
                'company_profile_file',
                'sertifikat_file',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('npwp_file')->nullable();
            $table->string('rekening_file')->nullable();
            $table->string('nib_file')->nullable();
            $table->string('siup_file')->nullable();
            $table->string('company_profile_file')->nullable();
            $table->string('sertifikat_file')->nullable();
        });
    }
};