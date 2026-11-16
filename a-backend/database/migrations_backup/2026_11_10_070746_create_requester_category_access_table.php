
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requester_category_access', function (Blueprint $table) {
            $table->id();

            // NIK milik Requester
            $table->string('nik', 255);

            // Kategori yang boleh diakses: SCM atau BRD
            $table->string('category_type', 20);

            // Masa berlaku akses
            $table->date('start_date');
            $table->date('end_date')->nullable();

            $table->timestamps();

            $table->index(
                ['nik', 'category_type'],
                'requester_category_access_nik_category_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requester_category_access');
    }
};
