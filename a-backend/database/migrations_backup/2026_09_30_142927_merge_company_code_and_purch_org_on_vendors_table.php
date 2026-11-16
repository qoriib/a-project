<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * 1. Tambahkan kolom gabungan
         */
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('company_code_purch_org')
                ->default('1200 / 1300 (PROJECT BAKTI)')
                ->after('company_code_id');
        });

        /*
         * 2. Isi vendor lama dengan nilai default
         */
        DB::table('vendors')->update([
            'company_code_purch_org' => '1200 / 1300 (PROJECT BAKTI)',
        ]);

        /*
         * 3. Hapus foreign key company_code_id
         */
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropForeign(['company_code_id']);
        });

        /*
         * 4. Hapus kolom yang sebelumnya dipisah
         */
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'company_code_id',
                'purch_org',
            ]);
        });
    }

    public function down(): void
    {
        /*
         * Kembalikan kolom lama
         */
        Schema::table('vendors', function (Blueprint $table) {
            $table->foreignId('company_code_id')
                ->nullable()
                ->constrained('company_codes')
                ->nullOnDelete();

            $table->string('purch_org', 50)
                ->nullable();
        });

        /*
         * Hapus kolom gabungan
         */
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn('company_code_purch_org');
        });
    }
};