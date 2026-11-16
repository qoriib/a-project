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

            // 1. Data Utama Perusahaan
            $table->string('nama_perusahaan', 255);
            $table->string('vendor_code', 100)->nullable()->unique();
            $table->enum('source_type', ['EXISTING', 'NEW'])->default('NEW');
            $table->string('search_term', 255)->nullable();
            $table->string('business_type', 255)->nullable();

            // 2. Data Kontak Perusahaan
            $table->string('pic_vendor', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile_phone', 50)->nullable();
            $table->string('fax', 50)->nullable();

            // 3. Kategori Vendor
            $table->foreignId('kategori_id')
                ->nullable()
                ->constrained('vendor_categories')
                ->nullOnDelete();
            $table->string('kategori_other', 255)->nullable();

            // 4. Data Alamat & Legalitas
            $table->string('npwp', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable()->default('Indonesia');

            // 5. Data Accounting & SAP
            $table->foreignId('account_group_id')
                ->nullable()
                ->constrained('account_groups')
                ->nullOnDelete();
            $table->string('account_group_other', 255)->nullable();

            $table->foreignId('recon_account_id')
                ->nullable()
                ->constrained('recon_accounts')
                ->nullOnDelete();
            $table->string('recon_account_other', 255)->nullable();

            $table->string('payment_method', 100)->default('Transfer');
            $table->string('company_code_purch_org', 255)->default('1200 / 1300 (PROJECT BAKTI)');

            $table->foreignId('payment_term_id')
                ->nullable()
                ->constrained('payment_terms')
                ->nullOnDelete();
            $table->string('payment_term_other', 255)->nullable();

            // 6. Data Purchasing
            $table->string('order_currency', 20)->nullable()->default('IDR');
            $table->string('order_currency_other', 255)->nullable();

            // 7. Pembuat & Masa Berlaku
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();

            // Indeks pencarian
            $table->index('source_type');
            $table->index('nama_perusahaan');
            $table->index('npwp');
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
