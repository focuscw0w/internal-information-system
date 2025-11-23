<?php

use App\Models\User;
use Modules\Project\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Editovanie projektu', function () {
    it('upraví meno projektu', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create([
                'name' => 'Pôvodný názov',
                'start_date' => '2025-01-10',
                'due_date' => '2025-01-10',
            ]
        );

        $payload = [
            'name' => 'Upravený názov',
            'description' => $project->description,
            'status' => $project->status,
            'priority' => $project->priority,
            'start_date' => $project->start_date,
            'due_date' => $project->due_date,
            'tags' => $project->tags,
        ];

        $this->actingAs($user)
            ->patch(route('project.update', $project->id), $payload)
            ->assertStatus(302);

        $project->refresh();

        expect($project->name)->toBe('Upravený názov');
    });

    it('zlyhá pri chýbajúcom poli name', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $payload = [
            'description' => $project->description,
            'status' => $project->status,
            'priority' => $project->priority,
            'start_date' => $project->start_date,
            'due_date' => $project->due_date,
        ];

        $this->actingAs($user)
            ->patchJson(route('project.update', $project->id), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('zlyhá pri neplatnom statuse', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $payload = [
            'name' => $project->name,
            'description' => $project->description,
            'status' => 'invalid_status',
            'priority' => $project->priority,
            'start_date' => $project->start_date,
            'due_date' => $project->due_date,
        ];

        $this->actingAs($user)
            ->patchJson(route('project.update', $project->id), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('zlyhá pri neplatnom dátume', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $payload = [
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'priority' => $project->priority,
            'start_date' => 'invalid',
            'due_date' => 'text',
        ];

        $this->actingAs($user)
            ->patchJson(route('project.update', $project->id), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'due_date']);
    });

    it('zlyhá ak je due_date pred start_date', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $payload = [
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'priority' => $project->priority,
            'start_date' => '2025-10-10',
            'due_date' => '2025-01-01',
        ];

        $this->actingAs($user)
            ->patchJson(route('project.update', $project->id), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['due_date']);
    });

    it('neprihlásený používateľ nemôže upraviť projekt', function () {
        $project = Project::factory()->create();

        $this->patch(route('project.update', $project->id), [])
            ->assertRedirect(route('login'));
    });

    it('neprihlásený používateľ dostane 401', function () {
        $project = Project::factory()->create();

        $this->patchJson(route('project.update', $project->id), [])
            ->assertStatus(401);
    });

    it('update neexistujúceho projektu vráti 404', function () {
        $user = User::factory()->create();

        $payload = [
            'name' => 'Projekt',
            'description' => 'Popis',
            'status' => 'planned',
            'priority' => 'medium',
            'start_date' => '2025-01-10',
            'due_date' => '2025-01-10',
            'tags' => 'tag1,tag2',
        ];

        $this->actingAs($user)
            ->patchJson(route('project.update', 999999), $payload)
            ->assertStatus(404);
    });

    it('update nezmení polia, ktoré neboli poslané', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'name' => 'Old Name',
            'description' => 'Old Desc',
            'start_date' => '2025-01-10',
            'due_date' => '2025-01-10',
        ]);

        $payload = [
            'name' => 'New Name',
            'description' => $project->description,
            'status' => $project->status,
            'priority' => $project->priority,
            'start_date' => $project->start_date,
            'due_date' => $project->due_date,
            'tags' => $project->tags,
        ];

        $this->actingAs($user)
            ->patch(route('project.update', $project->id), $payload)
            ->assertStatus(302);

        $project->refresh();

        expect($project->name)->toBe('New Name')
            ->and($project->description)->toBe('Old Desc');
    });
});
