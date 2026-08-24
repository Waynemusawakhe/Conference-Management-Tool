<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Matches the enum already committed to in
     * App\Modules\Account\Controllers\AuthController: author, reviewer,
     * organiser, attendee, admin. Default 'author' matches
     * RegisterUserAction's existing fallback.
     *
     * The CHECK constraint is PostgreSQL-only syntax (SQLite doesn't
     * support adding named CHECK constraints via ALTER TABLE), so it's
     * skipped on other drivers — e.g. the SQLite in-memory DB used by
     * the test suite. Role validity is still enforced at the application
     * layer via Rule::in(UserRole::values()) in the Form Requests.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('author')->after('password');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('author','reviewer','organiser','attendee','admin'))");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};