
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->dropForeign('vendor_requests_vendor_id_foreign');

            $table->foreign('vendor_id', 'vendor_requests_vendor_id_foreign')
                ->references('id')
                ->on('vendors')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->dropForeign('vendor_requests_vendor_id_foreign');

            $table->foreign('vendor_id', 'vendor_requests_vendor_id_foreign')
                ->references('id')
                ->on('vendors')
                ->nullOnDelete();
        });
    }
};
