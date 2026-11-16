<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_requests', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Vendor
            |--------------------------------------------------------------------------
            |
            | Nullable karena pengajuan CREATE bisa dibuat
            | sebelum vendor memiliki record di tabel vendors.
            |
            */
            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Jenis Pengajuan
            |--------------------------------------------------------------------------
            */

            $table->enum('request_type', [
                'CREATE',
                'UPDATE',
            ]);

            /*
            |--------------------------------------------------------------------------
            | User yang Mengajukan
            |--------------------------------------------------------------------------
            */

            $table->foreignId('requested_by')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Status Pengajuan
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'Pending',
                'Under Review',
                'Approved',
                'Rejected',
                'Revision Required',
            ])->default('Pending');

            /*
            |--------------------------------------------------------------------------
            | Catatan
            |--------------------------------------------------------------------------
            */

            $table->text('notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Waktu Pengajuan
            |--------------------------------------------------------------------------
            */

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_requests');
    }
};