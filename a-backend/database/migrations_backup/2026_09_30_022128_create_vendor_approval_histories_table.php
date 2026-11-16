<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_approval_histories', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Request
            |--------------------------------------------------------------------------
            */

            $table->foreignId('vendor_request_id')
                ->constrained('vendor_requests')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Tahapan Approval
            |--------------------------------------------------------------------------
            */

            $table->string('approval_stage');

            /*
            |--------------------------------------------------------------------------
            | User yang melakukan aksi
            |--------------------------------------------------------------------------
            */

            $table->foreignId('acted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Status Approval
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'Pending',
                'Under Review',
                'Approved',
                'Rejected',
                'Revision Required',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Catatan Approval
            |--------------------------------------------------------------------------
            */

            $table->text('notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Waktu Aksi
            |--------------------------------------------------------------------------
            */

            $table->timestamp('acted_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_approval_histories');
    }
};