<?php

namespace Modules\User\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;
use Modules\User\Models\User;

class UserController extends Controller
{
    public function __construct(private readonly UserServiceInterface $userService) {}

    /**
     * Return a list of users in JSON format.
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    /**
     *  Show the user management page.
     */
    public function manage(): Response
    {
        return Inertia::render('User/Manage', [
            'users' => User::query()
                ->with('permissions')
                ->select('id', 'name', 'email', 'is_admin', 'created_at')
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'permissions' => $user->getPermissionNames()->toArray(),
                    'created_at' => $user->created_at,
                ]),
            'availablePermissions' => PermissionEnum::groupedForFrontend(),
            'status' => session('status'),
        ]);
    }

    /**
     * Create a new user with the provided details and permissions.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return to_route('user.index')->with('status', 'Používateľ bol úspešne vytvorený.');
    }

    /**
     *  Update user permissions and other details.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return to_route('user.index')->with('status', 'Používateľ bol úspešne aktualizovaný.');
    }

    /**
     *  Delete a user.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->userService->deleteUser($user);

        return to_route('user.index')->with('status', 'Používateľ bol odstránený.');
    }

    /**
     * Return a list of users for options (e.g., in a dropdown).
     */
    public function options()
    {
        return User::select('id', 'name', 'email')->get();
    }
}
