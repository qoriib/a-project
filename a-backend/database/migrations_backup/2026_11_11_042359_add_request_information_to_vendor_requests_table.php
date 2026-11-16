
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->string('cat_code', 50)->nullable();
            $table->string('requested_by_email', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->dropColumn([
                'cat_code',
                'requested_by_email',
            ]);
        });
    }
};
