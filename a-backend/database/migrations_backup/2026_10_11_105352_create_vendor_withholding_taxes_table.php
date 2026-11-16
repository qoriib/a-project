
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_withholding_taxes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->foreignId('withholding_tax_id')
                ->constrained('withholding_taxes')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(
                ['vendor_id', 'withholding_tax_id'],
                'vendor_withholding_tax_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_withholding_taxes');
    }
};
