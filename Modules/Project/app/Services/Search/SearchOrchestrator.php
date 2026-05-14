<?php

namespace Modules\Project\Services\Search;

use Modules\Project\Contracts\SearchProviderInterface;
use Modules\User\Models\User;

class SearchOrchestrator
{
    /**
     * @param  iterable<SearchProviderInterface>  $providers
     */
    public function __construct(private readonly iterable $providers) {}

    public function search(string $query, User $user, int $perGroup = 5): array
    {
        $merged = [
            'actions' => [],
            'projects' => [],
            'tasks' => [],
            'comments' => [],
            'users' => [],
        ];

        foreach ($this->providers as $provider) {
            $contributions = $provider->search($query, $user, $perGroup);

            foreach ($contributions as $group => $items) {
                $merged[$group] = array_merge($merged[$group] ?? [], $items);
            }
        }

        return $merged;
    }
}
