<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
            ALTER TABLE submissions
            DROP CONSTRAINT IF EXISTS submissions_status_check
        ");

        DB::statement("
            ALTER TABLE submissions
            ADD CONSTRAINT submissions_status_check
            CHECK (
                status IN (
                    'pending',
                    'under_review',
                    'accepted',
                    'rejected',
                    'revision_requested',
                    'withdrawn'
                )
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            UPDATE submissions
            SET status = 'pending'
            WHERE status = 'withdrawn'
        ");

        DB::statement("
            ALTER TABLE submissions
            DROP CONSTRAINT IF EXISTS submissions_status_check
        ");

        DB::statement("
            ALTER TABLE submissions
            ADD CONSTRAINT submissions_status_check
            CHECK (
                status IN (
                    'pending',
                    'under_review',
                    'accepted',
                    'rejected',
                    'revision_requested'
                )
            )
        ");
    }
};