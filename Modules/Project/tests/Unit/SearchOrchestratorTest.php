<?php

namespace Modules\Project\Tests\Unit;

use Modules\Project\Contracts\SearchProviderInterface;
use Modules\Project\Services\Search\SearchOrchestrator;
use Modules\User\Models\User;
use PHPUnit\Framework\TestCase;

class SearchOrchestratorTest extends TestCase
{
    public function test_it_merges_results_from_all_registered_providers(): void
    {
        $orchestrator = new SearchOrchestrator([
            new class implements SearchProviderInterface {
                public function search(string $query, User $user, int $perGroup): array
                {
                    return [
                        'actions' => [['id' => 'create-project']],
                        'projects' => [['title' => $query.' Project']],
                    ];
                }
            },
            new class implements SearchProviderInterface {
                public function search(string $query, User $user, int $perGroup): array
                {
                    return [
                        'actions' => [['id' => 'time-reports']],
                        'users' => [['title' => 'Matched User']],
                    ];
                }
            },
        ]);

        $results = $orchestrator->search('CRM', new User(), 5);

        $this->assertSame([
            ['id' => 'create-project'],
            ['id' => 'time-reports'],
        ], $results['actions']);
        $this->assertSame([['title' => 'CRM Project']], $results['projects']);
        $this->assertSame([['title' => 'Matched User']], $results['users']);
        $this->assertSame([], $results['tasks']);
        $this->assertSame([], $results['comments']);
    }

    public function test_it_passes_the_per_group_limit_to_each_provider(): void
    {
        $provider = new class implements SearchProviderInterface {
            public int $receivedLimit = 0;

            public function search(string $query, User $user, int $perGroup): array
            {
                $this->receivedLimit = $perGroup;

                return [];
            }
        };

        (new SearchOrchestrator([$provider]))->search('CRM', new User(), 3);

        $this->assertSame(3, $provider->receivedLimit);
    }
}
