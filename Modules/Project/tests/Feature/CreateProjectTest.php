<?php

use App\Models\User;
use Modules\Project\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Vytváranie projektu', function () {
    it('úspešne sa vytvorí projekt', function () {
        $user = User::factory()->create();

        $payload = [
            'name' => 'Projekt',
            'client' => 'Firma s.r.o.',
            'description' => 'Interný systém pre firmu',
            'status' => 'planned',
            'priority' => 'medium',
            'start_date' => '2025-01-10',
            'due_date' => '2025-03-10',
            'tags' => 'system'
        ];

        $response = $this->actingAs($user)
            ->post(route('project.store'), $payload)
            ->assertStatus(302);

        $projects = Project::where('name', 'Projekt')->get();
        expect($projects)->toHaveCount(1);

        $project = $projects->first();
        $response->assertRedirect(route('project.show', $project));
    });

    it('zlyhá pri chýbajúcom poli name', function () {
        $user = User::factory()->create();

        $payload = [
            'description' => 'Niečo',
            'start_date' => '2025-01-10',
        ];

        $this->actingAs($user)
            ->postJson(route('project.store'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('zlyhá pri neplatnom dátume', function () {
        $user = User::factory()->create();

        $payload = [
            'name' => 'Projekt',
            'start_date' => 'neplatny_datum',
            'due_date' => 'text',
        ];

        $this->actingAs($user)
            ->postJson(route('project.store'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'due_date']);
    });

    it('zlyhá ak je due_date pred start_date', function () {
        $user = User::factory()->create();

        $payload = [
            'name' => 'Projekt',
            'start_date' => '2025-03-10',
            'due_date' => '2025-03-01',
        ];

        $this->actingAs($user)
            ->postJson(route('project.store'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['due_date']);
    });

    it('zlyhá pri nepovolenom statuse', function () {
        $user = User::factory()->create();

        $payload = [
            'name' => 'Projekt',
            'status' => 'random',
        ];

        $this->actingAs($user)
            ->postJson(route('project.store'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('neprihlásený používateľ dostane 401', function () {
        $payload = [
            'name' => 'Projekt',
            'start_date' => '2025-01-10',
        ];

        $this->postJson(route('project.store'), $payload)
            ->assertStatus(401);
    });

    it('neprihlásený používateľ je presmerovaný na login', function () {
        $payload = [
            'name' => 'Nový informačný systém',
            'client' => 'Firma s.r.o.',
            'description' => 'Interný systém pre firmu',
            'status' => 'planned',
            'priority' => 'medium',
            'start_date' => '2025-01-10',
            'due_date' => '2025-03-10',
            'tags' => 'system',
        ];

        $this->post(route('project.store'), $payload)
            ->assertRedirect(route('login'));
    });
});
