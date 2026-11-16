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
    Schema::table('vendors', function (Blueprint $table) {
        $table->string('withholding_tax')->nullable()->after('payment_method');

        $table->dropColumn([
            'withholding_tax_type',
            'withholding_tax_code',
        ]);
    });
}

public function down(): void
{
    Schema::table('vendors', function (Blueprint $table) {
        $table->string('withholding_tax_type')->nullable();
        $table->string('withholding_tax_code')->nullable();

        $table->dropColumn('withholding_tax');
    });
}
};