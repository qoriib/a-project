
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tambahkan kolom email pelaku approval
        Schema::table('vendor_approval_histories', function (Blueprint $table) {
            $table->string('acted_by_email')->nullable()->after('acted_by_nik');
        });

        // Ubah sementara status menjadi VARCHAR
        DB::statement("
            ALTER TABLE vendor_approval_histories
            MODIFY status VARCHAR(50) NOT NULL
        ");

        // Sesuaikan status lama ke status baru
        DB::table('vendor_approval_histories')
            ->whereIn('status', ['Pending', 'Under Review'])
            ->update(['status' => 'SUBMITTED']);

        DB::table('vendor_approval_histories')
            ->where('status', 'Approved')
            ->update(['status' => 'APPROVED']);

        DB::table('vendor_approval_histories')
            ->where('status', 'Rejected')
            ->update(['status' => 'REJECTED']);

        DB::table('vendor_approval_histories')
            ->where('status', 'Revision Required')
            ->update(['status' => 'CANCEL_APPROVE']);

        // Tetapkan enum baru
        DB::statement("
            ALTER TABLE vendor_approval_histories
            MODIFY status ENUM(
                'SUBMITTED',
                'APPROVED',
                'REJECTED',
                'CANCEL_APPROVE'
            ) NOT NULL
        ");
    }

    public function down(): void
    {
        // Kembalikan status ke VARCHAR sementara
        DB::statement("
            ALTER TABLE vendor_approval_histories
            MODIFY status VARCHAR(50) NOT NULL
        ");

        // Kembalikan nilai status lama
        DB::table('vendor_approval_histories')
            ->where('status', 'SUBMITTED')
            ->update(['status' => 'Under Review']);

        DB::table('vendor_approval_histories')
            ->where('status', 'APPROVED')
            ->update(['status' => 'Approved']);

        DB::table('vendor_approval_histories')
            ->where('status', 'REJECTED')
            ->update(['status' => 'Rejected']);

        DB::table('vendor_approval_histories')
            ->where('status', 'CANCEL_APPROVE')
            ->update(['status' => 'Revision Required']);

        // Kembalikan enum lama
        DB::statement("
            ALTER TABLE vendor_approval_histories
            MODIFY status ENUM(
                'Pending',
                'Under Review',
                'Approved',
                'Rejected',
                'Revision Required'
            ) NOT NULL
        ");

        // Hapus kolom email
        Schema::table('vendor_approval_histories', function (Blueprint $table) {
            $table->dropColumn('acted_by_email');
        });
    }
};
