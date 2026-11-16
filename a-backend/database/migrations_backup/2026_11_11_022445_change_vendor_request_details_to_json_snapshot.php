<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->dropColumn([
                'field_name',
                'old_value',
                'new_value',
            ]);
        });

        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->json('old_data')->nullable();
            $table->json('new_data');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->dropColumn([
                'old_data',
                'new_data',
            ]);
        });

        Schema::table('vendor_request_details', function (Blueprint $table) {
            $table->string('field_name');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
        });
    }
};