<?php

namespace Modules\User\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Models\User;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    public function __construct(protected UserServiceInterface $userService) {}

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
            'availablePermissions' => PermissionEnum::groupedForFrontend(),
            'status' => session('status'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return to_route('user.index')->with('status', 'Používateľ bol úspešne vytvorený.');
    }

    public function show(User $user): Response
    {
        return Inertia::render('User/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'permissions' => $user->getPermissionNames()->toArray(),
                'created_at' => $user->created_at,
            ],
            'availablePermissions' => PermissionEnum::groupedForFrontend(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return to_route('user.index')->with('status', 'Používateľ bol úspešne aktualizovaný.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->userService->deleteUser($user);

        return to_route('user.index')->with('status', 'Používateľ bol odstránený.');
    }

    public function options()
    {
        return User::select('id', 'name', 'email')->get();
    }
}
