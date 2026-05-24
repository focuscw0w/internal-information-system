<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Services\ProjectService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectServiceRepositoryMockTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_uses_the_project_repository_for_filtered_visible_project_listing(): void
    {
        $user = User::factory()->create();
        $filters = ['status' => 'active'];
        $projects = new Collection([new Project(['name' => 'Repository-backed project'])]);
        $repository = Mockery::mock(ProjectRepositoryInterface::class);

        $repository
            ->shouldReceive('visibleTo')
            ->once()
            ->with($user, $filters)
            ->andReturn($projects);

        $service = new ProjectService(
            Mockery::mock(TeamServiceInterface::class),
            Mockery::mock(NotificationServiceInterface::class),
            Mockery::mock(ProjectAllocationSyncInterface::class),
            $repository,
        );

        $this->actingAs($user);

        $this->assertSame($projects, $service->getAllProjects($filters));
    }
}
