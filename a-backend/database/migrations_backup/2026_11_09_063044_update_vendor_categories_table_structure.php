
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_categories', function (Blueprint $table) {
            $table->string('cat_code', 50)->nullable()->unique()->after('id');
            $table->string('category_type', 100)->nullable()->after('cat_code');
            $table->renameColumn('name', 'category_desc');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_categories', function (Blueprint $table) {
            $table->renameColumn('category_desc', 'name');
            $table->dropUnique(['cat_code']);
            $table->dropColumn([
                'cat_code',
                'category_type',
            ]);
        });
    }
};
