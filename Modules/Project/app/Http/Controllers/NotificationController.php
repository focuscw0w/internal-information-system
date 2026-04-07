<?php

namespace Modules\Project\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Project\Contracts\NotificationServiceInterface;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationServiceInterface $notificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getUserNotifications(
            $request->user(),
            20
        );

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'per_page'     => $notifications->perPage(),
                'total'        => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $success = $this->notificationService->markAsRead($id, $request->user());

        return response()->json(['success' => $success], $success ? 200 : 404);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return response()->json(['marked' => $count]);
    }
}
