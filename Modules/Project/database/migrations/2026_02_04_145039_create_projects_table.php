<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])->default('planning');
            $table->enum('workload', ['low', 'medium', 'high'])->default('medium');

            // Dates
            $table->date('start_date');
            $table->date('end_date');
            $table->date('actual_start_date')->nullable();
            $table->date('actual_end_date')->nullable();

            // Progress & Capacity
            $table->integer('progress')->default(0); // 0-100
            $table->integer('capacity_used')->default(0); // percentage
            $table->integer('capacity_available')->default(100); // percentage

            // Tasks
            $table->integer('tasks_total')->default(0);
            $table->integer('tasks_completed')->default(0);

            // Budget (optional)
            $table->decimal('budget', 12, 2)->nullable();
            $table->decimal('budget_spent', 12, 2)->default(0);

            // Relations
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
