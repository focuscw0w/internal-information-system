<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('project_team')
            ->whereJsonContains('permissions', 'manage_team')
            ->orderBy('id')
            ->each(function ($row) {
                $perms = json_decode($row->permissions, true) ?? [];
                $perms[] = 'view_all_time_entries';
                $perms[] = 'manage_time_entries';
                DB::table('project_team')
                    ->where('id', $row->id)
                    ->update(['permissions' => json_encode(array_unique($perms))]);
            });
    }

    public function down(): void
    {
        DB::table('project_team')->orderBy('id')->each(function ($row) {
            $perms = json_decode($row->permissions, true) ?? [];
            $perms = array_values(array_diff($perms, ['view_all_time_entries', 'manage_time_entries']));
            DB::table('project_team')
                ->where('id', $row->id)
                ->update(['permissions' => json_encode($perms)]);
        });
    }
};
