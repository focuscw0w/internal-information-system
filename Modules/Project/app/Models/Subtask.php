<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subtask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'title',
        'is_completed',
        'sort_order',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Relations
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // Methods
    public function toggleComplete(): void
    {
        $this->update(['is_completed' => !$this->is_completed]);
    }
}
