<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            // A submission must always belong to exactly one conference and
            // one author — both FKs required, not nullable.
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            // Who made the final accept/reject call — distinct from the
            // author, set only once a decision is made.
            $table->foreignId('final_decision_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('track')->nullable();
            $table->text('abstract');
            $table->string('file_path')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            // pending | under_review | accepted | rejected | revision_requested
            $table->enum('status', ['pending', 'under_review', 'accepted', 'rejected', 'revision_requested'])->default('pending');
            $table->timestamp('final_decision_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
