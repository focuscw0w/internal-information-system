<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Project\Enums\TaskStatus;
use Modules\Project\Enums\TaskPriority;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('status', TaskStatus::values())->default(TaskStatus::TODO->value);
            $table->enum('priority', TaskPriority::values())->default(TaskPriority::MEDIUM->value);

            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('estimated_hours')->nullable();
            $table->integer('actual_hours')->nullable();

            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};