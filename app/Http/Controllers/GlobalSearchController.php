<?php

namespace App\Http\Controllers;

use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __construct(private readonly GlobalSearchService $searchService) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $results = $this->searchService->search($validated['q'], $request->user());

        return response()->json([
            'query' => $validated['q'],
            'results' => $results,
        ]);
    }
}
