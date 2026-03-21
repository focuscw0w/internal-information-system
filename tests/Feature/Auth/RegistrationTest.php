<?php

test('registration screen is not available', function () {
    $response = $this->get(route('register'));

    $response->assertNotFound();
});

test('new users can not self register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertNotFound();
    $this->assertGuest();
});
