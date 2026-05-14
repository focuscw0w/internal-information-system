<?php

namespace Modules\Project\Services\Search;

class SearchActionBuilder
{
    /**
     * @return array{id: string, title: string, subtitle: string, url: string, icon: string, keywords: array<int, string>}
     */
    public static function make(string $id, string $title, string $subtitle, string $url, string $icon, array $keywords): array
    {
        return compact('id', 'title', 'subtitle', 'url', 'icon', 'keywords');
    }

    /**
     * Filter actions by term match, cap to limit, and strip keywords from output.
     *
     * @param  array<int, array<string, mixed>>  $actions
     * @return array<int, array<string, mixed>>
     */
    public static function filterAndShape(array $actions, string $term, int $perGroup): array
    {
        $limit = max($perGroup, 8);

        return collect($actions)
            ->filter(fn (array $action) => self::matchesTerm($action, $term))
            ->take($limit)
            ->map(fn (array $action) => [
                'type' => 'action',
                'id' => $action['id'],
                'title' => $action['title'],
                'subtitle' => $action['subtitle'],
                'url' => $action['url'],
                'icon' => $action['icon'],
            ])
            ->values()
            ->all();
    }

    private static function matchesTerm(array $action, string $term): bool
    {
        if ($term === '') {
            return true;
        }

        $haystack = mb_strtolower(implode(' ', [
            $action['title'],
            $action['subtitle'],
            ...$action['keywords'],
        ]));

        return str_contains($haystack, mb_strtolower($term));
    }
}
