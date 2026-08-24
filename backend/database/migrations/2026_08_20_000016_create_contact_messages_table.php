<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            // Nullable — a visitor can submit this form without logging in.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->text('message');
            // new | in_progress | resolved
            $table->string('status')->default('new');
            $table->timestamps();
        });

        DB::statement("ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_name_not_blank CHECK (btrim(name) <> '')");
        DB::statement("ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_message_not_blank CHECK (btrim(message) <> '')");
        DB::statement("ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check CHECK (status IN ('new','in_progress','resolved'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
