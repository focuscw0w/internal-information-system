<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Project\Services\Search\SearchOrchestrator;

class GlobalSearchController extends Controller
{
    public function __construct(private readonly SearchOrchestrator $orchestrator) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $results = $this->orchestrator->search($validated['q'] ?? '', $request->user());

        return response()->json([
            'query' => $validated['q'] ?? '',
            'results' => $results,
        ]);
    }
}
