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
        $table->string('final_pdf_path')->nullable();
    });
}

public function down(): void
{
    Schema::table('vendor_requests', function (Blueprint $table) {
        $table->dropColumn('final_pdf_path');
    });
}

};
