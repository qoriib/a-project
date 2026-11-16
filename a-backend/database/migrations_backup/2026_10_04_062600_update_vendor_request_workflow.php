<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Vendor Request - Current Stage
        |--------------------------------------------------------------------------
        */

        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->string('current_stage')
                ->default('PROCUREMENT')
                ->after('status');
        });

        /*
        |--------------------------------------------------------------------------
        | Hapus Salesperson
        |--------------------------------------------------------------------------
        */

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn('salesperson');
        });
    }

    public function down(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Kembalikan Salesperson
        |--------------------------------------------------------------------------
        */

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('salesperson')
                ->nullable()
                ->after('order_currency_other');
        });

        /*
        |--------------------------------------------------------------------------
        | Hapus Current Stage
        |--------------------------------------------------------------------------
        */

        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->dropColumn('current_stage');
        });
    }
};