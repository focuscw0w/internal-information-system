<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class RegisteredUserController extends Controller
{
    public function create(): never
    {
        throw new NotFoundHttpException('Self registration is disabled.');
    }

    public function store(Request $request): RedirectResponse
    {
        throw new NotFoundHttpException('Self registration is disabled.');
    }
}
