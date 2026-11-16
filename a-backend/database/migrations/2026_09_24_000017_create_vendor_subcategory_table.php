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
        Schema::create('vendor_subcategory', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->foreignId('category_id')
                ->constrained('vendor_categories')
                ->cascadeOnDelete();

            $table->string('category_other')->nullable();

            $table->enum('subcategory', [
                'Material',
                'Jasa',
            ]);

            $table->timestamps();

            $table->unique(
                ['vendor_id', 'category_id', 'subcategory'],
                'vendor_subcategory_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_subcategory');
    }
};
