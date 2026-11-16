<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->unsignedBigInteger('withholding_tax')
                ->nullable()
                ->change();
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->foreign('withholding_tax')
                ->references('id')
                ->on('withholding_taxes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropForeign(['withholding_tax']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('withholding_tax')
                ->nullable()
                ->change();
        });
    }
};