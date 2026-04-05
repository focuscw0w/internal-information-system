<?php

namespace Modules\CapacityManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

class EmployeeCapacity extends Model
{
    protected $fillable = [
        'user_id',
        'weekly_capacity_hours',
    ];

    protected function casts(): array
    {
        return [
            'weekly_capacity_hours' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
