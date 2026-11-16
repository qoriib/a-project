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

            /*
            |--------------------------------------------------------------------------
            | Procurement Data
            |--------------------------------------------------------------------------
            */

            $table->string('search_term')->nullable()->after('nama_perusahaan');

            $table->string('city')->nullable()->after('address');

            $table->string('postal_code', 20)->nullable()->after('city');

            $table->string('country', 100)->nullable()->after('postal_code');

            $table->string('fax', 50)->nullable()->after('phone');

            $table->string('business_type')->nullable()->after('kategori_other');

            /*
            |--------------------------------------------------------------------------
            | Purchasing Organization
            |--------------------------------------------------------------------------
            */

            $table->string('purch_org', 50)->nullable()->after('company_code_id');

            /*
            |--------------------------------------------------------------------------
            | Tax Data
            |--------------------------------------------------------------------------
            */

            $table->string('withholding_tax_code')->nullable()->after('withholding_tax_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'search_term',
                'city',
                'postal_code',
                'country',
                'fax',
                'business_type',
                'purch_org',
                'withholding_tax_code',
            ]);
        });
    }
};