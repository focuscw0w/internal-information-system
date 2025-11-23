<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Project\Database\Factories\ProjectFactory;

class Project extends Model
{
    use HasFactory;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }

    /**
     * Mass-assignable attributes
     */
    protected $fillable = [
        'name',
        'client',
        'description',
        'status',
        'priority',
        'start_date',
        'due_date',
        'tags',
    ];

    /**
     * Hidden attributes (optional)
     */
    protected $hidden = [];

    /**
     * Casts (optional, but recommended for dates)
     */
    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
    ];
}
