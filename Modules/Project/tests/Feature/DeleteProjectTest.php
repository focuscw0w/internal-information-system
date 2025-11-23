<?php

use App\Models\User;
use Modules\Project\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Mazanie projektu', function () {
    it('úspešne odstráni projekt', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)
            ->delete(route('project.destroy', $project->id))
            ->assertStatus(302)
            ->assertRedirect(route('project.index'));

        expect(Project::find($project->id))->toBeNull();
    });

    it('zmazanie neexistujúceho projektu vráti 404', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->deleteJson(route('project.destroy', 999999))
            ->assertStatus(404);
    });

    it('neprihlásený používateľ dostane 401', function () {
        $project = Project::factory()->create();

        $this->deleteJson(route('project.destroy', $project->id))
            ->assertStatus(401);
    });

    it('neprihlásený používateľ je presmerovaný na login', function () {
        $project = Project::factory()->create();

        $this->delete(route('project.destroy', $project->id))
            ->assertRedirect(route('login'));
    });

    it('odstráni projekt z databázy', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)
            ->delete(route('project.destroy', $project->id));

        $this->assertDatabaseMissing('projects', [
            'id' => $project->id,
        ]);
    });

    it('redirectuje na index po zmazaní', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)
            ->delete(route('project.destroy', $project->id))
            ->assertRedirect(route('project.index'));
    });
});
