
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ubah status sementara menjadi VARCHAR
        // agar nilai status lama bisa dipetakan dengan aman.
        DB::statement("
            ALTER TABLE vendor_requests
            MODIFY status VARCHAR(50) NOT NULL DEFAULT 'Pending'
        ");

        // 2. Sesuaikan status lama ke status baru.
        DB::table('vendor_requests')
            ->where('status', 'Pending')
            ->update(['status' => 'PENDING']);

        DB::table('vendor_requests')
            ->where('status', 'Under Review')
            ->update(['status' => 'PENDING']);

        DB::table('vendor_requests')
            ->where('status', 'Approved')
            ->update(['status' => 'APPROVED']);

        DB::table('vendor_requests')
            ->where('status', 'Rejected')
            ->update(['status' => 'REJECTED']);

        DB::table('vendor_requests')
            ->where('status', 'Revision Required')
            ->update(['status' => 'PENDING']);

        // 3. Tambahkan kolom kode vendor baru
        // dan hapus kolom lama yang sudah digantikan.
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->string('internal_vendor_code', 100)
                ->nullable()
                ->after('vendor_id');

            $table->string('sap_vendor_code', 100)
                ->nullable()
                ->after('internal_vendor_code');

            $table->dropColumn([
                'vendor_code',
                'rejection_reason',
                'notes',
            ]);
        });

        // 4. Rapikan urutan kolom sekaligus
        // tetapkan ENUM status dan default current_stage.
        DB::statement("
            ALTER TABLE vendor_requests
            MODIFY COLUMN form_number VARCHAR(100) NULL DEFAULT NULL AFTER id,

            MODIFY COLUMN request_type
                ENUM('CREATE', 'IMPORT_EXISTING', 'UPDATE')
                NOT NULL AFTER form_number,

            MODIFY COLUMN vendor_id
                BIGINT UNSIGNED NULL DEFAULT NULL AFTER request_type,

            MODIFY COLUMN internal_vendor_code
                VARCHAR(100) NULL DEFAULT NULL AFTER vendor_id,

            MODIFY COLUMN sap_vendor_code
                VARCHAR(100) NULL DEFAULT NULL AFTER internal_vendor_code,

            MODIFY COLUMN cat_code
                VARCHAR(50) NULL DEFAULT NULL AFTER sap_vendor_code,

            MODIFY COLUMN requested_by_nik
                VARCHAR(255) NULL DEFAULT NULL AFTER cat_code,

            MODIFY COLUMN requested_by_email
                VARCHAR(255) NULL DEFAULT NULL AFTER requested_by_nik,

            MODIFY COLUMN status
                ENUM(
                    'DRAFT',
                    'PENDING',
                    'CANCEL_APPROVE',
                    'APPROVED',
                    'REJECTED'
                )
                NOT NULL DEFAULT 'DRAFT' AFTER requested_by_email,

            MODIFY COLUMN current_stage
                VARCHAR(255) NOT NULL DEFAULT 'REQUESTER' AFTER status,

            MODIFY COLUMN submitted_at
                TIMESTAMP NULL DEFAULT NULL AFTER current_stage,

            MODIFY COLUMN completed_at
                TIMESTAMP NULL DEFAULT NULL AFTER submitted_at,

            MODIFY COLUMN final_pdf_path
                VARCHAR(255) NULL DEFAULT NULL AFTER completed_at,

            MODIFY COLUMN created_at
                TIMESTAMP NULL DEFAULT NULL AFTER final_pdf_path,

            MODIFY COLUMN updated_at
                TIMESTAMP NULL DEFAULT NULL AFTER created_at
        ");
    }

    public function down(): void
    {
        // 1. Ubah status sementara menjadi VARCHAR.
        DB::statement("
            ALTER TABLE vendor_requests
            MODIFY status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
        ");

        // 2. Kembalikan status ke format sebelumnya.
        DB::table('vendor_requests')
            ->where('status', 'DRAFT')
            ->update(['status' => 'Pending']);

        DB::table('vendor_requests')
            ->where('status', 'PENDING')
            ->update(['status' => 'Under Review']);

        DB::table('vendor_requests')
            ->where('status', 'CANCEL_APPROVE')
            ->update(['status' => 'Under Review']);

        DB::table('vendor_requests')
            ->where('status', 'APPROVED')
            ->update(['status' => 'Approved']);

        DB::table('vendor_requests')
            ->where('status', 'REJECTED')
            ->update(['status' => 'Rejected']);

        // 3. Kembalikan kolom lama.
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->string('vendor_code', 100)
                ->nullable()
                ->after('vendor_id');

            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
        });

        // 4. Salin internal code ke kolom lama jika tersedia.
        DB::statement("
            UPDATE vendor_requests
            SET vendor_code = internal_vendor_code
        ");

        // 5. Kembalikan ENUM dan default lama.
        DB::statement("
            ALTER TABLE vendor_requests
            MODIFY COLUMN status
                ENUM(
                    'Pending',
                    'Under Review',
                    'Approved',
                    'Rejected',
                    'Revision Required'
                )
                NOT NULL DEFAULT 'Pending',

            MODIFY COLUMN current_stage
                VARCHAR(255) NOT NULL DEFAULT 'PROCUREMENT'
        ");

        // 6. Hapus kolom kode vendor baru.
        Schema::table('vendor_requests', function (Blueprint $table) {
            $table->dropColumn([
                'internal_vendor_code',
                'sap_vendor_code',
            ]);
        });
    }
};
