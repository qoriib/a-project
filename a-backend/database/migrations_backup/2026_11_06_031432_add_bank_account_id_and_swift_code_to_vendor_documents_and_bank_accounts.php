<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambahkan relasi dokumen ke rekening bank
        Schema::table('vendor_documents', function (Blueprint $table) {
            $table->foreignId('bank_account_id')
                ->nullable()
                ->after('vendor_id')
                ->constrained('vendor_bank_accounts')
                ->restrictOnDelete();
        });

        // Tambahkan Swift Code rekening bank
        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->string('swift_code')
                ->nullable()
                ->after('account_name');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_documents', function (Blueprint $table) {
            $table->dropForeign(['bank_account_id']);
            $table->dropColumn('bank_account_id');
        });

        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->dropColumn('swift_code');
        });
    }
};
