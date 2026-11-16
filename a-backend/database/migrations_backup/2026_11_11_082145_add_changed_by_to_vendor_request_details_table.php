<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->string('changed_by_nik', 50)->nullable();
            $table->string('changed_by_email', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->dropColumn([
                'changed_by_nik',
                'changed_by_email',
            ]);
        });
    }
};