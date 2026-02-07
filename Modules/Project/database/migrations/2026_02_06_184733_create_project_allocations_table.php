<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            
            // Allocation details
            $table->integer('allocated_hours')->default(0); // Celkovo alokovaných hodín
            $table->integer('used_hours')->default(0); // Použitých hodín
            $table->integer('percentage')->default(0); // % alokácie (0-100)
            
            // Date range
            $table->date('start_date');
            $table->date('end_date');
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Unique constraint - jeden user nemôže mať viac alokácií na ten istý projekt v rovnakom období
            $table->unique(['project_id', 'user_id', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_allocations');
    }
};