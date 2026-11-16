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
            $table->string('vendor_code')->unique();
            $table->string('pic_vendor')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();

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

            /*
            |--------------------------------------------------------------------------
            | Data Administrasi
            |--------------------------------------------------------------------------
            */

            $table->string('npwp', 100)->nullable();
            $table->string('rekening', 100)->nullable();
            $table->text('address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dokumen Vendor
            |--------------------------------------------------------------------------
            */

            $table->string('npwp_file')->nullable();
            $table->string('rekening_file')->nullable();
            $table->string('nib_file')->nullable();
            $table->string('siup_file')->nullable();
            $table->string('company_profile_file')->nullable();
            $table->string('sertifikat_file')->nullable();

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

            /*
            | Withholding Tax
            |
            | L1 = PPH4(2) – Inv.Deduction
            | L2 = PPH21 – Inv.Deduction
            | L3 = PPH23 – Inv.Deduction
            | L4 = PPH26 – Invoice Deduction
            */

            $table->enum('withholding_tax_type', [
                'L1',
                'L2',
                'L3',
                'L4',
            ])->nullable();

            /*
            |--------------------------------------------------------------------------
            | Company Code & Purchasing Data
            |--------------------------------------------------------------------------
            */

            $table->foreignId('company_code_id')
                ->nullable()
                ->constrained('company_codes')
                ->nullOnDelete();

            $table->foreignId('payment_term_id')
                ->nullable()
                ->constrained('payment_terms')
                ->nullOnDelete();
            
            $table->string('payment_term_other')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Purchasing Organization Data
            |--------------------------------------------------------------------------
            */

            $table->string('order_currency', 20)->nullable();
            $table->string('order_currency_other')->nullable();

            $table->string('salesperson')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Status Vendor
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'Pending',
                'Under Review',
                'Approved',
                'Rejected',
                'Revision Required', 
            ])->default('Pending');

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