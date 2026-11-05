<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('title', 180);
            $table->text('message');
            $table->string('action_url', 2048)->nullable();
            $table->json('default_channels')->nullable();
            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('notification_campaigns', function (Blueprint $table) {
            $table->id();

            $table->foreignId('template_id')
                ->nullable()
                ->constrained('notification_templates')
                ->nullOnDelete();

            $table->string('title', 180);
            $table->text('message');
            $table->string('action_url', 2048)->nullable();

            $table->string('target_type', 20);
            $table->string('target_value', 100)->nullable();

            $table->json('channels');
            $table->unsignedInteger('recipient_count')->default(0);

            $table->foreignId('sent_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['target_type', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_campaigns');
        Schema::dropIfExists('notification_templates');
    }
};
