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
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Data Utama Vendor
            |--------------------------------------------------------------------------
            */
            $table->string('nama_perusahaan');
            $table->string('vendor_code')->nullable()->unique();
            $table->enum('source_type', ['EXISTING', 'NEW'])->default('NEW');
            $table->string('search_term')->nullable();
            $table->string('pic_vendor')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile_phone', 50)->nullable();
            $table->string('fax', 50)->nullable();

            /*
            |--------------------------------------------------------------------------
            | Kategori Vendor
            |--------------------------------------------------------------------------
            */
            $table->foreignId('kategori_id')
                ->nullable()
                ->constrained('vendor_categories')
                ->nullOnDelete();

            $table->string('kategori_other')->nullable();
            $table->string('business_type')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Data Alamat & Legalitas
            |--------------------------------------------------------------------------
            */
            $table->string('npwp', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable();

            /*
            |--------------------------------------------------------------------------
            | Accounting Data
            |--------------------------------------------------------------------------
            */
            $table->foreignId('account_group_id')
                ->nullable()
                ->constrained('account_groups')
                ->nullOnDelete();

            $table->string('account_group_other')->nullable();

            $table->foreignId('recon_account_id')
                ->nullable()
                ->constrained('recon_accounts')
                ->nullOnDelete();

            $table->string('recon_account_other')->nullable();

            $table->string('payment_method')->default('transfer');
            $table->string('company_code_purch_org')->default('1200 / 1300 (PROJECT BAKTI)');

            $table->foreignId('payment_term_id')
                ->nullable()
                ->constrained('payment_terms')
                ->nullOnDelete();

            $table->string('payment_term_other')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Purchasing Data
            |--------------------------------------------------------------------------
            */
            $table->string('order_currency', 20)->nullable();
            $table->string('order_currency_other')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Pembuat & Masa Berlaku
            |--------------------------------------------------------------------------
            */
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
