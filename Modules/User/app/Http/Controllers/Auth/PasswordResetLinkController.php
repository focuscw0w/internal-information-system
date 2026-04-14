<?php

namespace Modules\User\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\User\Models\User;

class PasswordResetLinkController extends Controller
{
    public function __construct(private readonly NotificationServiceInterface $notificationService) {}

    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Notify admins that a user has requested a password reset.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $this->notificationService->notifyPasswordResetRequested($user);
        }

        return back()->with('status', 'Vaša žiadosť bola odoslaná správcovi systému.');
    }
}
