<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\User\Http\Requests\StoreUserRequest;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function manage(): Response
    {
        return Inertia::render('User/Manage', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'created_at')
                ->orderBy('name')
                ->get(),
            'status' => session('status'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());

        return to_route('user.index')->with('status', 'Používateľ bol úspešne vytvorený.');
    }
}
