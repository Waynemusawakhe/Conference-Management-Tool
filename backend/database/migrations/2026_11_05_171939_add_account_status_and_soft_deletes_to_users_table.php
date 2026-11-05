<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status', 20)
                ->default('active')
                ->after('role');

            $table->text('account_status_reason')
                ->nullable()
                ->after('account_status');

            $table->timestamp('account_status_changed_at')
                ->nullable()
                ->after('account_status_reason');

            $table->foreignId('account_status_changed_by')
                ->nullable()
                ->after('account_status_changed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->softDeletes();
            $table->index('account_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign([
                'account_status_changed_by',
            ]);

            $table->dropIndex([
                'account_status',
            ]);

            $table->dropSoftDeletes();

            $table->dropColumn([
                'account_status',
                'account_status_reason',
                'account_status_changed_at',
                'account_status_changed_by',
            ]);
        });
    }
};
