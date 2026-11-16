
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            // Hapus foreign key pada kolom lama terlebih dahulu.
            $table->dropForeign('vendors_withholding_tax_foreign');

            // Setelah foreign key dihapus, drop kolom lama.
            $table->dropColumn('withholding_tax');
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->unsignedBigInteger('withholding_tax')->nullable();
        });
    }
};
