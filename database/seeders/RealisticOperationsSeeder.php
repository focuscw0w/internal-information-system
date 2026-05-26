<?php

namespace Database\Seeders;

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Enums\ProjectPriority;
use Modules\Project\Enums\ProjectStatus;
use Modules\Project\Enums\TaskPriority;
use Modules\Project\Enums\TaskStatus;
use Modules\Project\Models\ActivityLog;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Subtask;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Enums\TimeTrackingPermission;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class RealisticOperationsSeeder extends Seeder
{
    private CarbonImmutable $today;

    private CarbonImmutable $currentWeekStart;

    private CarbonImmutable $seedWindowStart;

    private CarbonImmutable $seedWindowEnd;

    private TimeEntryServiceInterface $timeEntryService;

    private NotificationServiceInterface $notificationService;

    /** @var array<string, User> */
    private array $users = [];

    /** @var array<string, Project> */
    private array $projects = [];

    /** @var array<string, Task> */
    private array $tasks = [];

    public function run(): void
    {
        $this->today = CarbonImmutable::today();
        $this->currentWeekStart = $this->today->startOfWeek();
        $this->seedWindowStart = $this->currentWeekStart->subWeeks(2);
        $this->seedWindowEnd = $this->today->addDays(90);
        $this->timeEntryService = app(TimeEntryServiceInterface::class);
        $this->notificationService = app(NotificationServiceInterface::class);

        $previousQueue = config('queue.default');
        config(['queue.default' => 'sync']);

        $this->createUsers();
        $this->createEmployeeCapacities();
        $this->createProjects();
        $this->createTaskDetails();
        $this->createTimeEntries();
        $this->applyPostTimeEntryAdjustments();
        $this->refreshProjectMetrics();
        $this->generateNotifications();
        $this->printSummary();

        config(['queue.default' => $previousQueue]);
    }

    private function createUsers(): void
    {
        $profiles = [
            'admin' => [
                'name' => 'Admin Systému',
                'email' => 'admin@test.com',
                'is_admin' => true,
                'permissions' => app(PermissionRegistryInterface::class)->all(),
            ],
            'martina' => [
                'name' => 'Martina Bieliková',
                'email' => 'martina.bielikova@test.com',
                'is_admin' => false,
                'permissions' => [
                    UserPermission::USERS_VIEW->value,
                    ProjectGlobalPermission::PROJECTS_CREATE->value,
                    ProjectGlobalPermission::PROJECTS_VIEW_ALL->value,
                ],
            ],
            'lukas' => [
                'name' => 'Lukáš Valo',
                'email' => 'lukas.valo@test.com',
                'is_admin' => false,
                'permissions' => [
                    UserPermission::USERS_VIEW->value,
                    ProjectGlobalPermission::PROJECTS_VIEW_ALL->value,
                    CapacityPermission::CAPACITY_MANAGE->value,
                ],
            ],
            'peter' => [
                'name' => 'Peter Sýkora',
                'email' => 'peter.sykora@test.com',
                'is_admin' => false,
                'permissions' => [UserPermission::USERS_VIEW->value],
            ],
            'eva' => [
                'name' => 'Eva Malíková',
                'email' => 'eva.malikova@test.com',
                'is_admin' => false,
                'permissions' => [UserPermission::USERS_VIEW->value],
            ],
            'simon' => [
                'name' => 'Simon Kubík',
                'email' => 'simon.kubik@test.com',
                'is_admin' => false,
                'permissions' => [UserPermission::USERS_VIEW->value],
            ],
            'nina' => [
                'name' => 'Nina Holubová',
                'email' => 'nina.holubova@test.com',
                'is_admin' => false,
                'permissions' => [UserPermission::USERS_VIEW->value],
            ],
        ];

        foreach ($profiles as $key => $profile) {
            $user = User::updateOrCreate(
                ['email' => $profile['email']],
                [
                    'name' => $profile['name'],
                    'password' => Hash::make('password'),
                    'is_admin' => $profile['is_admin'],
                ]
            );

            $user->syncPermissions($profile['permissions']);
            $this->users[$key] = $user;
        }
    }

    private function createEmployeeCapacities(): void
    {
        $capacities = [
            'admin' => 8,
            'martina' => 32,
            'lukas' => 24,
            'peter' => 36,
            'eva' => 28,
            'simon' => 16,
            'nina' => 12,
        ];

        foreach ($capacities as $userKey => $hours) {
            EmployeeCapacity::updateOrCreate(
                ['user_id' => $this->users[$userKey]->id],
                ['weekly_capacity_hours' => $hours]
            );
        }
    }

    private function createProjects(): void
    {
        $deliveryPermissions = $this->deliveryPermissions();
        $workPermissions = $this->workPermissions();
        $readOnlyPermissions = $this->readOnlyPermissions();

        $erp = Project::create([
            'name' => 'ERP migrácia 2026',
            'description' => 'Migrácia historických dát, skladových API a reportingových tokov do nového ERP.',
            'status' => ProjectStatus::ACTIVE->value,
            'priority' => ProjectPriority::HIGH->value,
            'start_date' => $this->seedWindowStart->subWeek(),
            'end_date' => $this->seedWindowEnd,
            'progress' => 0,
            'capacity_used' => 88,
            'capacity_available' => 12,
            'tasks_total' => 0,
            'tasks_completed' => 0,
            'owner_id' => $this->users['martina']->id,
        ]);
        $this->projects['erp'] = $erp;

        $this->attachTeam(
            $erp,
            [
                ['user' => 'lukas', 'permissions' => $deliveryPermissions, 'allocation' => 20, 'hourly_rate' => 48],
                ['user' => 'peter', 'permissions' => $workPermissions, 'allocation' => 50, 'hourly_rate' => 42],
                ['user' => 'eva', 'permissions' => $workPermissions, 'allocation' => 50, 'hourly_rate' => 40],
                ['user' => 'simon', 'permissions' => $readOnlyPermissions, 'allocation' => 50, 'hourly_rate' => 34],
            ],
            'martina',
            true
        );

        $this->createAllocations($erp, [
            ['user' => 'martina', 'allocated_hours' => 48, 'used_hours' => 26, 'percentage' => 38, 'notes' => 'Riadenie migrácie a grooming backlogu.'],
            ['user' => 'lukas', 'allocated_hours' => 20, 'used_hours' => 8, 'percentage' => 20, 'notes' => 'Koordinácia kapacít a eskalácie.'],
            ['user' => 'peter', 'allocated_hours' => 72, 'used_hours' => 52, 'percentage' => 50, 'notes' => 'API a integračné práce.'],
            ['user' => 'eva', 'allocated_hours' => 56, 'used_hours' => 34, 'percentage' => 50, 'notes' => 'Dashboard a reportingové UI.'],
            ['user' => 'simon', 'allocated_hours' => 32, 'used_hours' => 34, 'percentage' => 50, 'notes' => 'Integračné a regresné testy.'],
        ]);

        $mobile = Project::create([
            'name' => 'Mobilný sklad',
            'description' => 'Stabilizácia release candidate buildu, offline režimu a skenovania čiarových kódov.',
            'status' => ProjectStatus::ACTIVE->value,
            'priority' => ProjectPriority::URGENT->value,
            'start_date' => $this->seedWindowStart->subWeeks(3),
            'end_date' => $this->today->subDays(2),
            'progress' => 0,
            'capacity_used' => 104,
            'capacity_available' => 0,
            'tasks_total' => 0,
            'tasks_completed' => 0,
            'owner_id' => $this->users['lukas']->id,
        ]);
        $this->projects['mobile'] = $mobile;

        $this->attachTeam(
            $mobile,
            [
                ['user' => 'peter', 'permissions' => $workPermissions, 'allocation' => 20, 'hourly_rate' => 42],
                ['user' => 'simon', 'permissions' => $readOnlyPermissions, 'allocation' => 25, 'hourly_rate' => 34],
                ['user' => 'nina', 'permissions' => $deliveryPermissions, 'allocation' => 40, 'hourly_rate' => 28],
            ],
            'lukas',
            true
        );

        $this->createAllocations($mobile, [
            ['user' => 'lukas', 'allocated_hours' => 40, 'used_hours' => 28, 'percentage' => 42, 'notes' => 'Koordinácia release a incidentov.'],
            ['user' => 'peter', 'allocated_hours' => 24, 'used_hours' => 13, 'percentage' => 18, 'notes' => 'Offline synchronizácia.'],
            ['user' => 'simon', 'allocated_hours' => 16, 'used_hours' => 10, 'percentage' => 25, 'notes' => 'Android build a smoke testy.'],
            ['user' => 'nina', 'allocated_hours' => 20, 'used_hours' => 10, 'percentage' => 42, 'notes' => 'Release podpora a podnety z prevádzky.'],
        ]);

        $reporting = Project::create([
            'name' => 'Interný reporting',
            'description' => 'Menší interný stream pre manažérske KPI exporty a prístupové filtre.',
            'status' => ProjectStatus::PLANNING->value,
            'priority' => ProjectPriority::MEDIUM->value,
            'start_date' => $this->seedWindowStart,
            'end_date' => $this->seedWindowEnd,
            'progress' => 0,
            'capacity_used' => 46,
            'capacity_available' => 54,
            'tasks_total' => 0,
            'tasks_completed' => 0,
            'owner_id' => $this->users['admin']->id,
        ]);
        $this->projects['reporting'] = $reporting;

        $this->attachTeam(
            $reporting,
            [
                ['user' => 'martina', 'permissions' => $deliveryPermissions, 'allocation' => 10, 'hourly_rate' => 48],
                ['user' => 'eva', 'permissions' => $workPermissions, 'allocation' => 15, 'hourly_rate' => 40],
                ['user' => 'nina', 'permissions' => $workPermissions, 'allocation' => 35, 'hourly_rate' => 28],
            ],
            'admin',
            false
        );

        $this->createAllocations($reporting, [
            ['user' => 'admin', 'allocated_hours' => 8, 'used_hours' => 6, 'percentage' => 25, 'notes' => 'Schválenie prístupov a KPI.'],
            ['user' => 'martina', 'allocated_hours' => 12, 'used_hours' => 10, 'percentage' => 10, 'notes' => 'Validácia biznis logiky.'],
            ['user' => 'eva', 'allocated_hours' => 16, 'used_hours' => 34, 'percentage' => 14, 'notes' => 'Exporty a UI ladenie.'],
            ['user' => 'nina', 'allocated_hours' => 16, 'used_hours' => 12, 'percentage' => 33, 'notes' => 'Podpora používateľov a spätná väzba.'],
        ]);

        $this->createTasks();
    }

    private function createTasks(): void
    {
        $erp = $this->projects['erp'];
        $mobile = $this->projects['mobile'];
        $reporting = $this->projects['reporting'];

        $this->createTask('erp-discovery', $erp, [
            'title' => 'Uzavrieť integračný discovery workshop',
            'description' => 'Zosúladiť mapovanie objektov a potvrdiť integračné body medzi ERP a skladom.',
            'status' => TaskStatus::DONE->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 8,
            'start_date' => $this->seedWindowStart,
            'due_date' => $this->seedWindowStart->addDays(4),
            'completed_at' => $this->seedWindowStart->addDays(4)->setTime(15, 30),
            'assigned_users' => ['martina', 'peter'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-data-model', $erp, [
            'title' => 'Navrhnúť dátový model objednávok',
            'description' => 'Pripraviť entitné mapovanie objednávok, zákazníkov a stavových prechodov.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 120,
            'start_date' => $this->seedWindowStart->addDays(1),
            'due_date' => $this->today->addDays(45),
            'assigned_users' => ['martina', 'peter'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-etl', $erp, [
            'title' => 'ETL migrácia historických faktúr',
            'description' => 'Pripraviť transformácie a validačné pravidlá pre import faktúr.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::URGENT->value,
            'estimated_hours' => 190,
            'start_date' => $this->seedWindowStart->addDays(2),
            'due_date' => $this->today->addDays(30),
            'assigned_users' => ['martina'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-api', $erp, [
            'title' => 'Implementovať API synchronizáciu skladu',
            'description' => 'Doplniť retry logiku, audit a serializáciu skladových pohybov.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::URGENT->value,
            'estimated_hours' => 180,
            'start_date' => $this->seedWindowStart,
            'due_date' => $this->today->addDays(24),
            'assigned_users' => ['peter'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-dashboard', $erp, [
            'title' => 'Dorobiť dashboard backlogu objednávok',
            'description' => 'Spraviť prehľad oneskorených objednávok a filtrov pre logistiku.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 110,
            'start_date' => $this->seedWindowStart,
            'due_date' => $this->today->addDays(35),
            'assigned_users' => ['eva'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-tests', $erp, [
            'title' => 'Integračné testy migrácie',
            'description' => 'Pripraviť regresné scenáre pre importy a párovanie stavov.',
            'status' => TaskStatus::TESTING->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 96,
            'start_date' => $this->seedWindowStart->addWeek(),
            'due_date' => $this->today->addDays(28),
            'assigned_users' => ['simon'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-audit', $erp, [
            'title' => 'Bezpečnostný audit importných pipeline',
            'description' => 'Skontrolovať audit trail a prístupové obmedzenia importných jobov.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::MEDIUM->value,
            'estimated_hours' => 72,
            'start_date' => $this->today->addDays(35),
            'due_date' => $this->today->addDays(65),
            'assigned_users' => ['lukas'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-cutover', $erp, [
            'title' => 'Pripraviť cutover checklist pre ostrý prechod',
            'description' => 'Zosúladiť rollback kroky, kontaktný strom a release okno.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::URGENT->value,
            'estimated_hours' => 84,
            'start_date' => $this->today,
            'due_date' => $this->today->addDays(14),
            'assigned_users' => ['martina', 'lukas'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('erp-cleanup', $erp, [
            'title' => 'Vyčistiť legacy mapovania partnerov',
            'description' => 'Doplniť chýbajúce mapovania partnerov a ručné korekcie.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 68,
            'start_date' => $this->today,
            'due_date' => $this->today->addDays(21),
            'assigned_users' => ['martina'],
            'assigned_by' => 'martina',
        ]);

        $this->createTask('mobile-offline', $mobile, [
            'title' => 'Stabilizovať offline synchronizáciu',
            'description' => 'Opraviť konflikty pri opakovanom odosielaní zásob po reconnecte.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::URGENT->value,
            'estimated_hours' => 36,
            'start_date' => $this->seedWindowStart->subWeek(),
            'due_date' => $this->today->subDays(2),
            'assigned_users' => ['lukas', 'peter'],
            'assigned_by' => 'lukas',
        ]);

        $this->createTask('mobile-scanner', $mobile, [
            'title' => 'Opraviť skenovanie čiarových kódov',
            'description' => 'Zvýšiť toleranciu na slabé osvetlenie a doplniť fallback pre manuálny vstup.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 32,
            'start_date' => $this->seedWindowStart->addWeek(),
            'due_date' => $this->today->subDays(5),
            'assigned_users' => ['peter'],
            'assigned_by' => 'lukas',
        ]);

        $this->createTask('mobile-android', $mobile, [
            'title' => 'Dokončiť Android smoke build',
            'description' => 'Prejsť kritické scenáre pred release kandidátom a logovať crash reporting.',
            'status' => TaskStatus::TESTING->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 12,
            'start_date' => $this->seedWindowStart,
            'due_date' => $this->today->subDay(),
            'assigned_users' => ['simon'],
            'assigned_by' => 'lukas',
        ]);

        $this->createTask('mobile-release', $mobile, [
            'title' => 'Stabilizovať release candidate',
            'description' => 'Skonsolidovať feedback z pilotnej prevádzky a pripraviť release poznámky.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::URGENT->value,
            'estimated_hours' => 24,
            'start_date' => $this->seedWindowStart->addWeek(),
            'due_date' => $this->today->addDays(2),
            'assigned_users' => ['lukas', 'nina'],
            'assigned_by' => 'lukas',
        ]);

        $this->createTask('mobile-push', $mobile, [
            'title' => 'Pripraviť push notifikácie pre inventúru',
            'description' => 'Doplniť odosielanie kritických udalostí pre skladníkov počas inventúry.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::MEDIUM->value,
            'estimated_hours' => 20,
            'start_date' => $this->today->addDays(30),
            'due_date' => $this->today->addDays(60),
            'assigned_users' => ['nina'],
            'assigned_by' => 'lukas',
        ]);

        $this->createTask('report-etl', $reporting, [
            'title' => 'Dodať ETL pre weekly KPI',
            'description' => 'Pripraviť denné agregácie a validáciu zdrojových dát pre dashboard vedenia.',
            'status' => TaskStatus::DONE->value,
            'priority' => TaskPriority::MEDIUM->value,
            'estimated_hours' => 12,
            'start_date' => $this->seedWindowStart,
            'due_date' => $this->seedWindowStart->addDays(9),
            'completed_at' => $this->seedWindowStart->addDays(11)->setTime(14, 0),
            'assigned_users' => ['admin', 'martina'],
            'assigned_by' => 'admin',
        ]);

        $this->createTask('report-export', $reporting, [
            'title' => 'Doladiť export do Excelu',
            'description' => 'Zjednotiť exportné hlavičky, formát dátumov a finančných polí.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::HIGH->value,
            'estimated_hours' => 28,
            'start_date' => $this->seedWindowStart->addWeek(),
            'due_date' => $this->today->addDays(40),
            'assigned_users' => ['eva', 'nina'],
            'assigned_by' => 'admin',
        ]);

        $this->createTask('report-access', $reporting, [
            'title' => 'Nastaviť prístupové filtre pre manažérov',
            'description' => 'Rozdeliť filtre podľa oddelení a zaviesť audit prístupov.',
            'status' => TaskStatus::IN_PROGRESS->value,
            'priority' => TaskPriority::MEDIUM->value,
            'estimated_hours' => 20,
            'start_date' => $this->seedWindowStart->addWeek(),
            'due_date' => $this->today->addDays(50),
            'assigned_users' => ['admin'],
            'assigned_by' => 'admin',
        ]);

        $this->createTask('report-qa', $reporting, [
            'title' => 'Pripraviť QA smoke scenáre',
            'description' => 'Zachytiť základné validačné scenáre pre KPI a exporty.',
            'status' => TaskStatus::TODO->value,
            'priority' => TaskPriority::LOW->value,
            'estimated_hours' => 12,
            'start_date' => $this->today->addDays(55),
            'due_date' => $this->today->addDays(75),
            'assigned_users' => ['simon'],
            'assigned_by' => 'admin',
        ]);
    }

    private function createTask(string $taskKey, Project $project, array $data): void
    {
        $task = Task::create([
            'project_id' => $project->id,
            'title' => $data['title'],
            'description' => $data['description'],
            'status' => $data['status'],
            'priority' => $data['priority'],
            'estimated_hours' => $data['estimated_hours'],
            'actual_hours' => 0,
            'start_date' => $data['start_date'],
            'due_date' => $data['due_date'],
            'completed_at' => $data['completed_at'] ?? null,
        ]);

        $assignedUserIds = collect($data['assigned_users'] ?? [])
            ->map(fn (string $userKey) => $this->users[$userKey]->id)
            ->all();

        $task->assignedUsers()->sync($assignedUserIds);

        if ($assignedUserIds !== []) {
            $this->notificationService->notifyTaskAssigned(
                $task,
                $assignedUserIds,
                $this->users[$data['assigned_by']]
            );
        }

        $this->tasks[$taskKey] = $task;
    }

    private function createTaskDetails(): void
    {
        $this->createSubtasks('erp-api', [
            ['title' => 'Doplniť retry stratégiu pre 429 odpovede', 'done' => true],
            ['title' => 'Pripraviť audit log pre synchronizačné chyby', 'done' => false],
            ['title' => 'Otestovať serializáciu skladových pohybov', 'done' => false],
        ]);

        $this->createSubtasks('mobile-offline', [
            ['title' => 'Reprodukovať konflikt pri reconnecte', 'done' => true],
            ['title' => 'Doplniť merge pravidlá pre inventúrne záznamy', 'done' => false],
        ]);

        $this->createSubtasks('report-access', [
            ['title' => 'Pripraviť zoznam oddelení a manažérskych rolí', 'done' => true],
            ['title' => 'Doplniť audit zobrazenia citlivých KPI', 'done' => false],
        ]);

        $commentDate = $this->seedWindowStart->addDays(7)->setTime(10, 15);

        $comments = [
            ['task' => 'erp-etl', 'user' => 'martina', 'body' => 'ETL transformácie už sedia na testovacích dátach, chýbajú nám ešte validačné pravidlá pre dobropisy.'],
            ['task' => 'erp-api', 'user' => 'peter', 'body' => 'Retry logiku som rozdelil na idempotentné a ne-idempotentné requesty, potrebujem ešte potvrdiť timeouty od infra tímu.'],
            ['task' => 'mobile-offline', 'user' => 'lukas', 'body' => 'Pilotný sklad hlási konflikty po reconnecte, preto držíme release až po ďalšom smoke teste.'],
            ['task' => 'report-export', 'user' => 'eva', 'body' => 'Export do Excelu je použiteľný, no ešte dolaďujem formátovanie stĺpcov pre finančné polia.'],
        ];

        foreach ($comments as $index => $comment) {
            Comment::create([
                'task_id' => $this->tasks[$comment['task']]->id,
                'user_id' => $this->users[$comment['user']]->id,
                'body' => $comment['body'],
                'created_at' => $commentDate->addDays($index),
                'updated_at' => $commentDate->addDays($index),
            ]);
        }

        $activityDate = $this->seedWindowStart->addDay()->setTime(9, 0);

        $activities = [
            [
                'project' => 'erp',
                'user' => 'martina',
                'type' => 'task_created',
                'description' => 'Vytvoril úlohu: Navrhnúť dátový model objednávok',
                'task' => 'erp-data-model',
                'created_at' => $activityDate,
            ],
            [
                'project' => 'erp',
                'user' => 'martina',
                'type' => 'task_created',
                'description' => 'Vytvoril úlohu: ETL migrácia historických faktúr',
                'task' => 'erp-etl',
                'created_at' => $activityDate->addHours(2),
            ],
            [
                'project' => 'erp',
                'user' => 'martina',
                'type' => 'task_assigned',
                'description' => 'Zmenil priradenie úlohy: Navrhnúť dátový model objednávok',
                'task' => 'erp-data-model',
                'metadata' => [
                    'old_users' => [$this->users['martina']->id],
                    'new_users' => [$this->users['martina']->id, $this->users['peter']->id],
                ],
                'created_at' => $activityDate->addDay(),
            ],
            [
                'project' => 'erp',
                'user' => 'martina',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Uzavrieť integračný discovery workshop',
                'task' => 'erp-discovery',
                'metadata' => ['old_status' => TaskStatus::IN_PROGRESS->value, 'new_status' => TaskStatus::DONE->value],
                'created_at' => $activityDate->addDays(3)->setTime(15, 30),
            ],
            [
                'project' => 'erp',
                'user' => 'peter',
                'type' => 'task_updated',
                'description' => 'Aktualizoval úlohu: Implementovať API synchronizáciu skladu',
                'task' => 'erp-api',
                'metadata' => [
                    'changes' => [
                        'priority' => ['old' => TaskPriority::HIGH->value, 'new' => TaskPriority::URGENT->value],
                        'estimated_hours' => ['old' => 160, 'new' => 180],
                    ],
                ],
                'created_at' => $activityDate->addDays(4)->setTime(11, 20),
            ],
            [
                'project' => 'erp',
                'user' => 'eva',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Dorobiť dashboard backlogu objednávok',
                'task' => 'erp-dashboard',
                'metadata' => ['old_status' => TaskStatus::TODO->value, 'new_status' => TaskStatus::IN_PROGRESS->value],
                'created_at' => $activityDate->addDays(5)->setTime(10, 10),
            ],
            [
                'project' => 'erp',
                'user' => 'simon',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Integračné testy migrácie',
                'task' => 'erp-tests',
                'metadata' => ['old_status' => TaskStatus::TODO->value, 'new_status' => TaskStatus::TESTING->value],
                'created_at' => $activityDate->addDays(7)->setTime(13, 45),
            ],
            [
                'project' => 'erp',
                'user' => 'martina',
                'type' => 'task_deleted',
                'description' => 'Odstránil úlohu: Duplikované mapovanie dodávateľov',
                'metadata' => ['task_title' => 'Duplikované mapovanie dodávateľov'],
                'created_at' => $activityDate->addDays(8)->setTime(16, 5),
            ],
            [
                'project' => 'mobile',
                'user' => 'lukas',
                'type' => 'task_created',
                'description' => 'Vytvoril úlohu: Stabilizovať offline synchronizáciu',
                'task' => 'mobile-offline',
                'created_at' => $activityDate->addHours(1),
            ],
            [
                'project' => 'mobile',
                'user' => 'lukas',
                'type' => 'task_assigned',
                'description' => 'Zmenil priradenie úlohy: Stabilizovať offline synchronizáciu',
                'task' => 'mobile-offline',
                'metadata' => [
                    'old_users' => [$this->users['lukas']->id],
                    'new_users' => [$this->users['lukas']->id, $this->users['peter']->id],
                ],
                'created_at' => $activityDate->addDays(2)->setTime(9, 25),
            ],
            [
                'project' => 'mobile',
                'user' => 'simon',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Dokončiť Android smoke build',
                'task' => 'mobile-android',
                'metadata' => ['old_status' => TaskStatus::IN_PROGRESS->value, 'new_status' => TaskStatus::TESTING->value],
                'created_at' => $activityDate->addDays(3)->setTime(14, 10),
            ],
            [
                'project' => 'mobile',
                'user' => 'peter',
                'type' => 'task_updated',
                'description' => 'Aktualizoval úlohu: Stabilizovať offline synchronizáciu',
                'task' => 'mobile-offline',
                'metadata' => [
                    'changes' => [
                        'description' => [
                            'old' => 'Opraviť konflikty pri opakovanom odosielaní zásob po reconnecte.',
                            'new' => 'Opraviť konflikty pri opakovanom odosielaní zásob po reconnecte a doplniť merge pravidlá.',
                        ],
                    ],
                ],
                'created_at' => $activityDate->addDays(5)->setTime(15, 40),
            ],
            [
                'project' => 'mobile',
                'user' => 'lukas',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Stabilizovať release candidate',
                'task' => 'mobile-release',
                'metadata' => ['old_status' => TaskStatus::IN_PROGRESS->value, 'new_status' => TaskStatus::TESTING->value],
                'created_at' => $this->today->subDay()->setTime(17, 10),
            ],
            [
                'project' => 'mobile',
                'user' => 'lukas',
                'type' => 'task_deleted',
                'description' => 'Odstránil úlohu: Manuálny export crash logov',
                'metadata' => ['task_title' => 'Manuálny export crash logov'],
                'created_at' => $activityDate->addDays(9)->setTime(12, 30),
            ],
            [
                'project' => 'reporting',
                'user' => 'admin',
                'type' => 'task_created',
                'description' => 'Vytvoril úlohu: Nastaviť prístupové filtre pre manažérov',
                'task' => 'report-access',
                'created_at' => $activityDate->addHours(3),
            ],
            [
                'project' => 'reporting',
                'user' => 'admin',
                'type' => 'task_assigned',
                'description' => 'Zmenil priradenie úlohy: Nastaviť prístupové filtre pre manažérov',
                'task' => 'report-access',
                'metadata' => [
                    'old_users' => [$this->users['admin']->id],
                    'new_users' => [$this->users['admin']->id, $this->users['nina']->id],
                ],
                'created_at' => $activityDate->addDays(2)->setTime(13, 15),
            ],
            [
                'project' => 'reporting',
                'user' => 'eva',
                'type' => 'task_updated',
                'description' => 'Aktualizoval úlohu: Export manažérskych KPI do Excelu',
                'task' => 'report-export',
                'metadata' => [
                    'changes' => [
                        'priority' => ['old' => TaskPriority::MEDIUM->value, 'new' => TaskPriority::HIGH->value],
                    ],
                ],
                'created_at' => $activityDate->addDays(4)->setTime(10, 45),
            ],
            [
                'project' => 'reporting',
                'user' => 'martina',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Dátový základ reportingových KPI',
                'task' => 'report-etl',
                'metadata' => ['old_status' => TaskStatus::TESTING->value, 'new_status' => TaskStatus::DONE->value],
                'created_at' => $this->seedWindowStart->addDays(11)->setTime(14, 0),
            ],
            [
                'project' => 'reporting',
                'user' => 'eva',
                'type' => 'task_status_changed',
                'description' => 'Zmenil stav úlohy: Export manažérskych KPI do Excelu',
                'task' => 'report-export',
                'metadata' => ['old_status' => TaskStatus::IN_PROGRESS->value, 'new_status' => TaskStatus::TESTING->value],
                'created_at' => $this->today->subDays(2)->setTime(11, 35),
            ],
            [
                'project' => 'reporting',
                'user' => 'admin',
                'type' => 'task_deleted',
                'description' => 'Odstránil úlohu: Samostatný CSV export KPI',
                'metadata' => ['task_title' => 'Samostatný CSV export KPI'],
                'created_at' => $activityDate->addDays(8)->setTime(9, 50),
            ],
        ];

        foreach ($activities as $activity) {
            $this->createActivity(
                $activity['project'],
                $activity['user'],
                $activity['type'],
                $activity['description'],
                $activity['created_at'],
                $activity['task'] ?? null,
                $activity['metadata'] ?? null,
            );
        }
    }

    private function createActivity(
        string $projectKey,
        string $userKey,
        string $type,
        string $description,
        CarbonImmutable $createdAt,
        ?string $taskKey = null,
        ?array $metadata = null,
    ): void {
        $task = $taskKey !== null ? $this->tasks[$taskKey] : null;

        ActivityLog::create([
            'project_id' => $this->projects[$projectKey]->id,
            'user_id' => $this->users[$userKey]->id,
            'type' => $type,
            'description' => $description,
            'subject_type' => $task ? Task::class : null,
            'subject_id' => $task?->id,
            'metadata' => $metadata,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function createTimeEntries(): void
    {
        $entries = [
            ['date' => '2026-03-30', 'user' => 'martina', 'task' => 'erp-discovery', 'hours' => 4.0, 'description' => 'Discovery workshop s financiami a skladom.'],
            ['date' => '2026-03-30', 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 5.0, 'description' => 'Prvý draft mapovania objednávok a zákazníkov.'],
            ['date' => '2026-03-30', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Návrh widgetov pre backlog objednávok.'],
            ['date' => '2026-03-30', 'user' => 'simon', 'task' => 'mobile-android', 'hours' => 3.0, 'description' => 'Smoke build a základná validácia crash reportingu.'],
            ['date' => '2026-03-30', 'user' => 'nina', 'task' => 'report-export', 'hours' => 2.0, 'description' => 'Zber spätnej väzby k exportu od manažérov.'],
            ['date' => '2026-03-30', 'user' => 'lukas', 'task' => 'mobile-offline', 'hours' => 4.0, 'description' => 'Analýza produkčného incidentu v offline režime.'],
            ['date' => '2026-03-31', 'user' => 'martina', 'task' => 'erp-discovery', 'hours' => 2.0, 'description' => 'Zapracovanie výstupov z workshopu do backlogu.'],
            ['date' => '2026-03-31', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 6.0, 'description' => 'Príprava API kontraktu pre synchronizáciu skladu.'],
            ['date' => '2026-03-31', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Implementácia filtrov backlogu na UI.'],
            ['date' => '2026-03-31', 'user' => 'simon', 'task' => 'mobile-android', 'hours' => 2.0, 'description' => 'Validácia Android build pipeline.'],
            ['date' => '2026-03-31', 'user' => 'admin', 'task' => 'report-etl', 'hours' => 2.0, 'description' => 'Schválenie KPI metrík a dátových zdrojov.'],
            ['date' => '2026-04-01', 'user' => 'martina', 'task' => 'erp-data-model', 'hours' => 4.0, 'description' => 'Doplnenie väzieb na faktúry a storno dokumenty.'],
            ['date' => '2026-04-01', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 5.0, 'description' => 'Serializácia skladových pohybov a retry handler.'],
            ['date' => '2026-04-01', 'user' => 'eva', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Exportné hlavičky a typografia pre Excel.'],
            ['date' => '2026-04-01', 'user' => 'lukas', 'task' => 'mobile-offline', 'hours' => 4.0, 'description' => 'Koordinácia reprodukcie chyby s pilotným skladom.'],
            ['date' => '2026-04-01', 'user' => 'nina', 'task' => 'report-export', 'hours' => 2.0, 'description' => 'Zber požiadaviek od controllingu na exporty.'],
            ['date' => '2026-04-02', 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 4.0, 'description' => 'Mapovanie validačných pravidiel pre faktúry.'],
            ['date' => '2026-04-02', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 4.0, 'description' => 'Doplnenie audit logu a idempotentných requestov.'],
            ['date' => '2026-04-02', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Stavové badge a filtračné prehľady.'],
            ['date' => '2026-04-02', 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 4.0, 'description' => 'Návrh regresných scenárov pre migráciu.'],
            ['date' => '2026-04-03', 'user' => 'martina', 'task' => 'erp-data-model', 'hours' => 4.0, 'description' => 'Validácia mapovania partnerov a zákazníkov.'],
            ['date' => '2026-04-03', 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 4.0, 'description' => 'Technický návrh väzieb pre skladové rezervácie.'],
            ['date' => '2026-04-03', 'user' => 'lukas', 'task' => 'mobile-release', 'hours' => 4.0, 'description' => 'Release planning a spätná väzba z pilotnej prevádzky.'],
            ['date' => '2026-04-03', 'user' => 'eva', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Excel formátovanie a fix dlhých názvov stĺpcov.'],
            ['date' => '2026-04-06', 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 4.0, 'description' => 'Doplnenie validačných scenárov pre import dobropisov.'],
            ['date' => '2026-04-06', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 4.0, 'description' => 'Retry logika pre batch requesty.'],
            ['date' => '2026-04-06', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Tabuľka oneskorených objednávok a filtrov.'],
            ['date' => '2026-04-06', 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 4.0, 'description' => 'Regresné scenáre pre testovacie dataset-y.'],
            ['date' => '2026-04-06', 'user' => 'nina', 'task' => 'mobile-release', 'hours' => 2.0, 'description' => 'Príprava release notes pre skladníkov.'],
            ['date' => '2026-04-07', 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 4.0, 'description' => 'Kontrola transformačných pravidiel s účtovníctvom.'],
            ['date' => '2026-04-07', 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 5.0, 'description' => 'Doplnenie väzieb na rezervácie a výdajky.'],
            ['date' => '2026-04-07', 'user' => 'lukas', 'task' => 'mobile-offline', 'hours' => 4.0, 'description' => 'Koordinácia opravného plánu pre offline synchronizáciu.'],
            ['date' => '2026-04-07', 'user' => 'eva', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Export súhrnov a finančných prehľadov.'],
            ['date' => '2026-04-07', 'user' => 'simon', 'task' => 'mobile-android', 'hours' => 3.0, 'description' => 'Android smoke test pred release kandidátom.'],
            ['date' => '2026-04-08', 'user' => 'martina', 'task' => 'report-etl', 'hours' => 4.0, 'description' => 'Validácia KPI metrík s controlllingom.'],
            ['date' => '2026-04-08', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 4.0, 'description' => 'Auditné eventy a logovanie chýb synchronizácie.'],
            ['date' => '2026-04-08', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Napojenie backlog chartov na API.'],
            ['date' => '2026-04-08', 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 4.0, 'description' => 'Doplnenie integračných testov pre storno scenáre.'],
            ['date' => '2026-04-09', 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 2.0, 'description' => 'Refinovanie validačných error hlášok.'],
            ['date' => '2026-04-09', 'user' => 'peter', 'task' => 'mobile-offline', 'hours' => 2.0, 'description' => 'Technická analýza konfliktu po reconnecte.'],
            ['date' => '2026-04-09', 'user' => 'eva', 'task' => 'report-export', 'hours' => 2.0, 'description' => 'Fix formátovania sumárnych stĺpcov.'],
            ['date' => '2026-04-09', 'user' => 'lukas', 'task' => 'mobile-release', 'hours' => 4.0, 'description' => 'Koordinácia release a pilotných pripomienok.'],
            ['date' => '2026-04-09', 'user' => 'admin', 'task' => 'report-access', 'hours' => 2.0, 'description' => 'Kontrola prístupových pravidiel pre manažérov.'],
            ['date' => '2026-04-10', 'user' => 'martina', 'task' => 'report-etl', 'hours' => 2.0, 'description' => 'Final review KPI logiky pred pilotom.'],
            ['date' => '2026-04-10', 'user' => 'peter', 'task' => 'erp-api', 'hours' => 4.0, 'description' => 'Finalizácia logovania pre retry branch.'],
            ['date' => '2026-04-10', 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Vizualizácia backlog kritických objednávok.'],
            ['date' => '2026-04-10', 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 4.0, 'description' => 'Doplnenie regresných krokov pre pilotné dáta.'],
            ['date' => '2026-04-10', 'user' => 'admin', 'task' => 'report-access', 'hours' => 2.0, 'description' => 'Rozdelenie filtrov podľa oddelení.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 6.0, 'description' => 'Prechod validačných pravidiel s účtovníctvom po víkende.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'martina', 'task' => 'report-etl', 'hours' => 2.0, 'description' => 'Kontrola KPI rozpadov na pilotných dátach.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'lukas', 'task' => 'mobile-release', 'hours' => 8.0, 'description' => 'Koordinácia release kandidáta a eskalácií z pilotu.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'lukas', 'task' => 'mobile-offline', 'hours' => 2.0, 'description' => 'Review incident timeline a ďalších krokov.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 6.0, 'description' => 'Implementácia retry branch pre skladové requesty.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'peter', 'task' => 'mobile-offline', 'hours' => 3.0, 'description' => 'Debug konfliktov synchronizácie na pilotnom sklade.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 8.0, 'description' => 'Optimalizácia backlog karty a detailu objednávok.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'eva', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Finálne úpravy exportných stĺpcov do Excelu.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 10.0, 'description' => 'Celodenný integračný test migrácie na pilotných dátach.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'simon', 'task' => 'mobile-android', 'hours' => 2.0, 'description' => 'Smoke test Android build-u po opravách.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'nina', 'task' => 'mobile-release', 'hours' => 4.0, 'description' => 'Príprava release komunikácie pre pilotný sklad.'],
            ['date' => $this->currentWeekStart->toDateString(), 'user' => 'admin', 'task' => 'report-access', 'hours' => 2.0, 'description' => 'Final review prístupových filtrov.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 6.0, 'description' => 'Doplnenie chýbajúcich validačných vetiev pre dobropisy.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'martina', 'task' => 'erp-cleanup', 'hours' => 3.5, 'description' => 'Doplnenie legacy mapovaní partnerov a ručných korekcií pred cutoverom.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'martina', 'task' => 'erp-cutover', 'hours' => 2.0, 'description' => 'Kontrola release okna a závislostí pre ostrý prechod ERP.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'lukas', 'task' => 'erp-cutover', 'hours' => 2.5, 'description' => 'Zosúladenie rollback krokov a kontaktného stromu pre cutover checklist.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'lukas', 'task' => 'erp-audit', 'hours' => 2.0, 'description' => 'Príprava kontrolných bodov pre audit importných pipeline.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 3.0, 'description' => 'Finálna kontrola väzieb rezervácií a výdajok pred integračným testom.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 4.5, 'description' => 'Dohľadanie výnimiek v importoch faktúr a príprava rozhodnutí pre účtovníctvo.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'martina', 'task' => 'erp-cutover', 'hours' => 3.0, 'description' => 'Spresnenie cutover checklistu po kontrole závislostí so skladom.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 4.0, 'description' => 'Doplnenie logovania retry pokusov a spracovania duplicitných skladových pohybov.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 3.5, 'description' => 'Úprava mapovania objednávkových stavov podľa posledného integračného review.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 5.0, 'description' => 'Doplnenie drilldown detailu oneskorených objednávok pre logistiku.'],
            ['date' => $this->currentWeekStart->addDays(2)->toDateString(), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 6.0, 'description' => 'Regresné testy importu faktúr po doplnení validačných pravidiel.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'martina', 'task' => 'erp-cleanup', 'hours' => 4.0, 'description' => 'Ručné zosúladenie partnerov bez jednoznačného legacy identifikátora.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'lukas', 'task' => 'erp-cutover', 'hours' => 3.5, 'description' => 'Koordinácia release okna a zodpovedností počas ostrého prechodu.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'lukas', 'task' => 'erp-audit', 'hours' => 3.0, 'description' => 'Kontrola prístupových obmedzení pre importné joby a audit trail.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 5.0, 'description' => 'Testovanie idempotentných requestov pri opakovanom odoslaní skladových pohybov.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 4.0, 'description' => 'Optimalizácia filtrov backlogu objednávok pre väčší dataset.'],
            ['date' => $this->currentWeekStart->addDays(3)->toDateString(), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 5.0, 'description' => 'Overenie storno scenárov a párovania stavov na pilotných dátach.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'lukas', 'task' => 'mobile-release', 'hours' => 8.0, 'description' => 'Spracovanie spätnej väzby z release review.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'lukas', 'task' => 'mobile-offline', 'hours' => 2.0, 'description' => 'Koordinácia ďalšieho fix window s pilotom.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 5.0, 'description' => 'Refaktor retry workeru a auditných eventov.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'peter', 'task' => 'mobile-offline', 'hours' => 4.0, 'description' => 'Oprava merge pravidiel pri reconnecte.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 6.0, 'description' => 'Ladenie backlog filtrov a detailu objednávok.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'eva', 'task' => 'report-export', 'hours' => 6.0, 'description' => 'Final polishing exportov po spätnej väzbe z controllingu.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 8.0, 'description' => 'Regresné testy migrácie na opravených datasetoch.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'nina', 'task' => 'mobile-release', 'hours' => 2.0, 'description' => 'Aktualizácia release poznámok a FAQ pre sklad.'],
            ['date' => $this->currentWeekStart->addDay()->toDateString(), 'user' => 'nina', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Potvrdenie exportných stĺpcov s používateľmi.'],
            ...$this->currentMonthTimeEntries(),
        ];

        foreach ($entries as $entry) {
            $entryDate = CarbonImmutable::parse($entry['date']);

            if ($entryDate->isAfter($this->today)) {
                continue;
            }

            $task = $this->tasks[$entry['task']];
            $status = $entry['status'] ?? $this->defaultTimeEntryStatus($entryDate);
            $approvalData = $this->approvalDataForEntry($entry, $task, $entryDate, $status);

            $this->timeEntryService->create([
                'project_id' => $task->project_id,
                'task_id' => $task->id,
                'user_id' => $this->users[$entry['user']]->id,
                'entry_date' => $entry['date'],
                'hours' => $entry['hours'],
                'description' => $entry['description'],
                'status' => $status,
                ...$approvalData,
            ]);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function currentMonthTimeEntries(): array
    {
        return [
            ['date' => $this->businessDayOfCurrentMonth(0), 'user' => 'admin', 'task' => 'report-access', 'hours' => 1.5, 'description' => 'Mesačné otvorenie reportingových prístupov a kontrola čakajúcich žiadostí.'],
            ['date' => $this->businessDayOfCurrentMonth(1), 'user' => 'martina', 'task' => 'erp-etl', 'hours' => 5.0, 'description' => 'Májová kontrola validačných pravidiel po importe pilotných faktúr.'],
            ['date' => $this->businessDayOfCurrentMonth(1), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 5.5, 'description' => 'Doplnenie retry logiky pre skladové pohyby po víkendovom importe.'],
            ['date' => $this->businessDayOfCurrentMonth(1), 'user' => 'eva', 'task' => 'report-export', 'hours' => 4.0, 'description' => 'Úprava Excel exportu pre májový controllingový balík.'],
            ['date' => $this->businessDayOfCurrentMonth(2), 'user' => 'lukas', 'task' => 'mobile-release', 'hours' => 6.0, 'description' => 'Release review po pilotnej zmene skladových procesov.'],
            ['date' => $this->businessDayOfCurrentMonth(2), 'user' => 'nina', 'task' => 'report-export', 'hours' => 3.0, 'description' => 'Overenie názvov KPI stĺpcov s vedúcimi tímov.'],
            ['date' => $this->businessDayOfCurrentMonth(2), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 5.0, 'description' => 'Regresné scenáre pre májové objednávky a dobropisy.'],
            ['date' => $this->businessDayOfCurrentMonth(3), 'user' => 'admin', 'task' => 'report-access', 'hours' => 2.0, 'description' => 'Oprava prístupového filtra pre oddelenie logistiky.', 'status' => TimeEntryStatusEnum::Rejected->value, 'rejection_reason' => 'Chýba presný dopad na používateľské role logistiky.'],
            ['date' => $this->businessDayOfCurrentMonth(3), 'user' => 'martina', 'task' => 'erp-cutover', 'hours' => 3.0, 'description' => 'Doplnenie zodpovedností do cutover checklistu pre ostrý prechod.'],
            ['date' => $this->businessDayOfCurrentMonth(3), 'user' => 'peter', 'task' => 'erp-data-model', 'hours' => 4.0, 'description' => 'Kontrola väzieb objednávok na skladové rezervácie pred sign-offom.'],
            ['date' => $this->businessDayOfCurrentMonth(4), 'user' => 'eva', 'task' => 'erp-dashboard', 'hours' => 5.0, 'description' => 'Doplnenie drilldownu oneskorených objednávok pre májový dashboard.'],
            ['date' => $this->businessDayOfCurrentMonth(4), 'user' => 'simon', 'task' => 'erp-tests', 'hours' => 4.5, 'description' => 'Smoke test importov po úpravách auditného logu.'],
            ['date' => $this->businessDayOfCurrentMonth(5), 'user' => 'nina', 'task' => 'mobile-release', 'hours' => 3.5, 'description' => 'Zber spätnej väzby z pilotného skladu po release kandidátovi.'],
            ['date' => $this->businessDayOfCurrentMonth(5), 'user' => 'admin', 'task' => 'report-access', 'hours' => 1.5, 'description' => 'Kontrola práv pre manažérsky detail reportov.'],
            ['date' => $this->businessDayOfCurrentMonth(6), 'user' => 'eva', 'task' => 'report-export', 'hours' => 3.0, 'description' => 'Zapracovanie pripomienok k exportným súčtom pred odoslaním reportu.', 'status' => TimeEntryStatusEnum::Pending->value],
            ['date' => $this->businessDayOfCurrentMonth(6), 'user' => 'martina', 'task' => 'erp-cleanup', 'hours' => 4.0, 'description' => 'Doriešenie legacy partnerov bez jednoznačného identifikátora.', 'status' => TimeEntryStatusEnum::Pending->value],
            ['date' => $this->businessDayOfCurrentMonth(7), 'user' => 'lukas', 'task' => 'erp-audit', 'hours' => 2.5, 'description' => 'Audit importných pipeline pred finálnym cutover rozhodnutím.', 'status' => TimeEntryStatusEnum::Pending->value],
            ['date' => $this->businessDayOfCurrentMonth(7), 'user' => 'peter', 'task' => 'erp-api', 'hours' => 3.5, 'description' => 'Doriešenie duplicitných skladových pohybov po opakovanom odoslaní.', 'status' => TimeEntryStatusEnum::Pending->value],
        ];
    }

    private function businessDayOfCurrentMonth(int $offset): string
    {
        $date = $this->today->startOfMonth();

        while ($date->isWeekend()) {
            $date = $date->addDay();
        }

        for ($days = 0; $days < $offset; $days++) {
            $date = $date->addDay();

            while ($date->isWeekend()) {
                $date = $date->addDay();
            }
        }

        return $date->toDateString();
    }

    private function defaultTimeEntryStatus(CarbonImmutable $entryDate): string
    {
        return $entryDate->isBefore($this->today)
            ? TimeEntryStatusEnum::Approved->value
            : TimeEntryStatusEnum::Pending->value;
    }

    /**
     * @return array<string, mixed>
     */
    private function approvalDataForEntry(array $entry, Task $task, CarbonImmutable $entryDate, string $status): array
    {
        if ($status === TimeEntryStatusEnum::Approved->value) {
            $approvedAt = $entryDate->addDay()->setTime(10, 30);
            $latestApprovedAt = CarbonImmutable::now()->subMinutes(30);

            if ($approvedAt->isAfter($latestApprovedAt)) {
                $approvedAt = $latestApprovedAt;
            }

            return [
                'approved_by' => $this->approverForEntry($entry['user'], $task)->id,
                'approved_at' => $approvedAt,
                'rejection_reason' => null,
            ];
        }

        if ($status === TimeEntryStatusEnum::Rejected->value) {
            return [
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => $entry['rejection_reason'] ?? 'Potrebné doplniť presnejší popis práce pred schválením.',
            ];
        }

        return [
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => null,
        ];
    }

    private function approverForEntry(string $userKey, Task $task): User
    {
        $projectName = collect($this->projects)
            ->first(fn (Project $project) => $project->id === $task->project_id)
            ?->name;

        $preferredApprover = match ($projectName) {
            'ERP migrácia 2026' => $userKey === 'martina' ? 'lukas' : 'martina',
            'Mobilný sklad' => $userKey === 'lukas' ? 'nina' : 'lukas',
            'Interný reporting' => $userKey === 'admin' ? 'martina' : 'admin',
            default => 'admin',
        };

        return $this->users[$preferredApprover];
    }

    private function applyPostTimeEntryAdjustments(): void
    {
        $this->tasks['erp-discovery']->update([
            'completed_at' => $this->seedWindowStart->addDays(4)->setTime(15, 30),
            'updated_at' => $this->seedWindowStart->addDays(4)->setTime(15, 30),
        ]);

        $this->tasks['report-etl']->update([
            'completed_at' => $this->seedWindowStart->addDays(11)->setTime(14, 0),
            'updated_at' => $this->seedWindowStart->addDays(11)->setTime(14, 0),
        ]);

        $staleMoment = $this->today->subDays(9)->setTime(16, 30);
        $this->tasks['mobile-offline']->update(['updated_at' => $staleMoment]);
        $this->tasks['mobile-android']->update(['updated_at' => $staleMoment->subDay()]);

        auth()->setUser($this->users['eva']);
        $this->notificationService->notifyTaskStatusChanged(
            $this->tasks['report-export']->fresh(),
            TaskStatus::IN_PROGRESS->value,
            TaskStatus::TESTING->value,
        );

        $this->tasks['report-export']->update(['status' => TaskStatus::TESTING->value]);
        $this->tasks['mobile-release']->update([
            'status' => TaskStatus::TESTING->value,
            'updated_at' => $this->today->subDay()->setTime(17, 10),
        ]);
    }

    private function refreshProjectMetrics(): void
    {
        foreach ($this->projects as $key => $project) {
            $project = $project->fresh('tasks');
            $tasksTotal = $project->tasks->count();
            $tasksCompleted = $project->tasks->where('status', TaskStatus::DONE->value)->count();
            $progress = $tasksTotal > 0 ? (int) round(($tasksCompleted / $tasksTotal) * 100) : 0;

            $capacityUsed = match ($key) {
                'erp' => 88,
                'mobile' => 104,
                default => 46,
            };

            $project->update([
                'tasks_total' => $tasksTotal,
                'tasks_completed' => $tasksCompleted,
                'progress' => $progress,
                'capacity_used' => $capacityUsed,
                'capacity_available' => max(0, 100 - $capacityUsed),
            ]);
        }
    }

    private function generateNotifications(): void
    {
        $reporting = $this->projects['reporting'];
        $reporting->update(['status' => ProjectStatus::ACTIVE->value]);

        $this->notificationService->notifyProjectStatusChanged(
            $reporting,
            ProjectStatus::PLANNING->value,
            ProjectStatus::ACTIVE->value,
            $this->users['admin']
        );

        Artisan::call('project:check-deadlines');
        Artisan::call('project:check-at-risk');
        Artisan::call('capacity:check-notifications');
    }

    private function printSummary(): void
    {
        if ($this->command === null) {
            return;
        }

        $notificationCount = DB::table('notifications')->count();

        $this->command->info('');
        $this->command->info('✅ RealisticOperationsSeeder completed');
        $this->command->table(
            ['Oblasť', 'Hodnota'],
            [
                ['Používatelia', (string) User::count()],
                ['Projekty', (string) Project::count()],
                ['Úlohy', (string) Task::count()],
                ['Časové záznamy', (string) TimeEntry::count()],
                ['Kapacity', (string) EmployeeCapacity::count()],
                ['Notifikácie', (string) $notificationCount],
                ['Obdobie', $this->seedWindowStart->toDateString().' - '.$this->seedWindowEnd->toDateString()],
            ]
        );
        $this->command->info('');
    }

    private function attachTeam(Project $project, array $members, string $assignedBy, bool $notifyHighPriority): void
    {
        foreach ($members as $member) {
            $project->team()->attach($this->users[$member['user']]->id, [
                'permissions' => json_encode($member['permissions'], JSON_THROW_ON_ERROR),
                'allocation' => $member['allocation'],
                'hourly_rate' => $member['hourly_rate'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $memberIds = collect($members)
            ->map(fn (array $member) => $this->users[$member['user']]->id)
            ->all();

        $this->notificationService->notifyProjectAssigned(
            $project,
            $memberIds,
            $this->users[$assignedBy]
        );

        if ($notifyHighPriority) {
            $this->notificationService->notifyProjectHighPriority(
                $project,
                $memberIds,
                $this->users[$assignedBy]
            );
        }
    }

    private function createAllocations(Project $project, array $allocations): void
    {
        foreach ($allocations as $allocation) {
            ProjectAllocation::create([
                'project_id' => $project->id,
                'user_id' => $this->users[$allocation['user']]->id,
                'allocated_hours' => $allocation['allocated_hours'],
                'used_hours' => $allocation['used_hours'],
                'percentage' => $allocation['percentage'],
                'start_date' => $this->currentWeekStart,
                'end_date' => $this->seedWindowEnd,
                'notes' => $allocation['notes'],
            ]);
        }
    }

    private function createSubtasks(string $taskKey, array $subtasks): void
    {
        foreach ($subtasks as $index => $subtask) {
            Subtask::create([
                'task_id' => $this->tasks[$taskKey]->id,
                'title' => $subtask['title'],
                'is_completed' => $subtask['done'],
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function deliveryPermissions(): array
    {
        return [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::EDIT_PROJECT->value,
            ProjectPermission::VIEW_TASKS->value,
            ProjectPermission::CREATE_TASKS->value,
            ProjectPermission::EDIT_TASKS->value,
            ProjectPermission::ASSIGN_TASKS->value,
            ProjectPermission::VIEW_TEAM->value,
            ProjectPermission::MANAGE_TEAM->value,
            TimeTrackingPermission::VIEW_ALL_TIME_ENTRIES->value,
            TimeTrackingPermission::MANAGE_TIME_ENTRIES->value,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function workPermissions(): array
    {
        return [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::VIEW_TASKS->value,
            ProjectPermission::EDIT_TASKS->value,
            ProjectPermission::VIEW_TEAM->value,
            TimeTrackingPermission::VIEW_ALL_TIME_ENTRIES->value,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function readOnlyPermissions(): array
    {
        return [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::VIEW_TASKS->value,
            ProjectPermission::VIEW_TEAM->value,
            TimeTrackingPermission::VIEW_ALL_TIME_ENTRIES->value,
        ];
    }
}
