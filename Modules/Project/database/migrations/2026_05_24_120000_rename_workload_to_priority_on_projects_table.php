<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Skip on fresh installs where the create_projects_table migration
        // already creates the `priority` column directly.
        if (! Schema::hasColumn('projects', 'workload')) {
            return;
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->string('priority')->default('medium')->after('status');
        });

        DB::table('projects')->update([
            'priority' => DB::raw("CASE workload "
                . "WHEN 'overloaded' THEN 'urgent' "
                . "ELSE workload END"),
        ]);

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('workload');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('projects', 'priority')) {
            return;
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->string('workload')->default('medium')->after('status');
        });

        DB::table('projects')->update([
            'workload' => DB::raw("CASE priority "
                . "WHEN 'urgent' THEN 'overloaded' "
                . "ELSE priority END"),
        ]);

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};
