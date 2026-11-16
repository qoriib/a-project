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
    Schema::table('vendor_requests', function (Blueprint $table) {
        $table->string('form_number', 100)
            ->nullable()
            ->unique();
    });
}

public function down(): void
{
    Schema::table('vendor_requests', function (Blueprint $table) {
        $table->dropUnique(['form_number']);
        $table->dropColumn('form_number');
    });
}
};
