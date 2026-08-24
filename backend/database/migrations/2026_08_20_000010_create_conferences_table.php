<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conferences', function (Blueprint $table) {
            $table->id();
            // RESTRICT, not cascade — an organiser's account can't be
            // deleted out from under their conferences.
            $table->foreignId('organiser_id')->constrained('users')->restrictOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            // JSON array of topic strings — simpler to work with via
            // Eloquent's array cast than a native Postgres text[] column.
            $table->json('topics')->nullable();
            // in_person | virtual | hybrid
            $table->string('format')->default('in_person');
            // open | closed — whether the conference is accepting submissions
            $table->string('submission_status')->default('open');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('submission_deadline')->nullable();
            // Nullable as a set — a virtual conference has none of these.
            $table->string('venue_name')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('website_link')->nullable();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE conferences ADD CONSTRAINT conferences_format_check CHECK (format IN ('in_person','virtual','hybrid'))");
        DB::statement("ALTER TABLE conferences ADD CONSTRAINT conferences_submission_status_check CHECK (submission_status IN ('open','closed'))");
        DB::statement('ALTER TABLE conferences ADD CONSTRAINT conferences_end_date_check CHECK (end_date >= start_date)');
        DB::statement('ALTER TABLE conferences ADD CONSTRAINT conferences_deadline_check CHECK (submission_deadline IS NULL OR submission_deadline <= start_date)');
        // A virtual conference has no physical venue; an in-person/hybrid
        // one must have a city and country.
        DB::statement(<<<'SQL'
            ALTER TABLE conferences ADD CONSTRAINT conferences_venue_by_format_check CHECK (
                (format = 'virtual' AND venue_name IS NULL AND city IS NULL AND country IS NULL)
                OR (format IN ('in_person','hybrid') AND city IS NOT NULL AND country IS NOT NULL)
            )
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('conferences');
    }
};
