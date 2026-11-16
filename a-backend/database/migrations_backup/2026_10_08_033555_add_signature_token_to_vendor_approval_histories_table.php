<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_approval_histories', function (Blueprint $table) {
            $table->string('signature_token', 64)
                ->nullable()
                ->unique()
                ->after('acted_at');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_approval_histories', function (Blueprint $table) {
            $table->dropUnique([
                'signature_token',
            ]);

            $table->dropColumn('signature_token');
        });
    }
};