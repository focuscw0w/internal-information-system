<?php

namespace Modules\Project\Console\Commands;

use Illuminate\Console\Command;
use Modules\Project\Services\ProjectAllocationSyncService;

class SyncProjectAllocationsCommand extends Command
{
    protected $signature = 'project:sync-allocations';

    protected $description = 'Prepočíta project allocations podľa aktuálneho tímu, dátumov projektu a kapacít.';

    public function __construct(private readonly ProjectAllocationSyncService $allocationSyncService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $projectsSynced = $this->allocationSyncService->syncAllProjectAllocations();

        $this->info("Project allocations boli zosynchronizované pre {$projectsSynced} projektov.");

        return self::SUCCESS;
    }
}
