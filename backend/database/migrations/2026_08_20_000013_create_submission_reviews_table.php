<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->nullable();
            $table->text('comments')->nullable();
            // accept | reject | revise
            $table->string('recommendation')->nullable();
            $table->boolean('locked')->default(false);
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            // A submission can have multiple reviews, but each reviewer can
            // only review a given submission once.
            $table->unique(['submission_id', 'reviewer_id']);
        });

        DB::statement('ALTER TABLE submission_reviews ADD CONSTRAINT submission_reviews_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 10)');

        // A locked review can't be edited — enforced at the DB level so a
        // direct API call can't bypass it. An organiser can still explicitly
        // set locked = false first to unlock/correct one.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION submission_reviews_prevent_edit_when_locked()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.locked = TRUE AND NEW.locked = TRUE THEN
                    RAISE EXCEPTION 'This review is locked and can no longer be edited.';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER submission_reviews_lock_guard
                BEFORE UPDATE ON submission_reviews
                FOR EACH ROW
                EXECUTE FUNCTION submission_reviews_prevent_edit_when_locked();
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS submission_reviews_lock_guard ON submission_reviews');
        DB::unprepared('DROP FUNCTION IF EXISTS submission_reviews_prevent_edit_when_locked');
        Schema::dropIfExists('submission_reviews');
    }
};
