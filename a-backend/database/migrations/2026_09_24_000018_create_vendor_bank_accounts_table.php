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
        Schema::create('vendor_bank_accounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->string('bank_name', 255);
            $table->string('account_number', 100);
            $table->string('account_name', 255)->nullable();
            $table->string('swift_code', 50)->nullable();
            $table->boolean('is_primary')->default(false);

            $table->timestamps();

            // Indeks pencarian rekening
            $table->index(['vendor_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_bank_accounts');
    }
};
