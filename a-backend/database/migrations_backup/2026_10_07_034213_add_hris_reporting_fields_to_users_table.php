<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('depthead')->nullable()->after('position');
            $table->string('divhead')->nullable()->after('depthead');
            $table->string('director')->nullable()->after('divhead');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'depthead',
                'divhead',
                'director',
            ]);
        });
    }
};