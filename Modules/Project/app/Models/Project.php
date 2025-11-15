<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

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
