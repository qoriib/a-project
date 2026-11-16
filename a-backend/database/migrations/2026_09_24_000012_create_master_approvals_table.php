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
        Schema::create('master_approvals', function (Blueprint $table) {
            $table->id();
            $table->string('nik');
            $table->string('email');
            $table->string('approval_stage');
            $table->boolean('can_view')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->index('nik');
            $table->index('email');
            $table->index('approval_stage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_approvals');
    }
};
