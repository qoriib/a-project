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
        Schema::create('master_approval_layer', function (Blueprint $table) {
            $table->id();
            $table->string('cat_code', 255);
            $table->string('type', 50)->default('Approval');
            $table->unsignedInteger('priority');
            $table->string('stage', 100);
            $table->string('email', 255);
            $table->string('nik', 255);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->index(
                ['cat_code', 'type', 'priority'],
                'master_approval_layer_flow_idx'
            );

            $table->index(
                ['nik', 'email'],
                'master_approval_layer_approver_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_approval_layer');
    }
};
