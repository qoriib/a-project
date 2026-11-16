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
        Schema::create('vendor_categories', function (Blueprint $table) {
            $table->id();
            $table->string('cat_code', 50)->nullable()->unique();
            $table->string('category_type', 50)->nullable();
            $table->string('category_desc', 255);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();

            // Indeks untuk filter kategori SCM / BR
            $table->index('category_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_categories');
    }
};
