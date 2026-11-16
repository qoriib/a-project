
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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

            $table->enum('subcategory', [
                'Material',
                'Jasa',
            ]);

            $table->timestamps();

            // Mencegah kombinasi kategori dan subkategori duplikat
            $table->unique(
                ['vendor_id', 'category_id', 'subcategory'],
                'vendor_subcategory_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_subcategory');
    }
};
