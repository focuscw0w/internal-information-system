<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

class MakeModule extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'make:module
        {module : Názov modulu (napr. TimeTracking)}
        {title : Názov v sidebare (napr. "Sledovanie času")}
        {group : Skupina v sidebare (napr. "Kapacitný manažment")}
        {--force : Prepísať existujúce súbory}';

    /**
     * The console command description.
     */
    protected $description = 'Create a nwidart module + navigation config + React page';

    /**
     * Execute the console command.
     */
    public function handle(Filesystem $fs): int
    {
        $module = Str::studly($this->argument('module'));
        $title  = $this->argument('title');
        $group  = $this->argument('group');
        $force  = $this->option('force');

        $slug       = Str::kebab($module);
        $routeName  = $slug . '.index';
        $modulePath = base_path("Modules/{$module}");

        // 1) Let nwidart generate the module (controller, routes, providers, etc.)
        if ($fs->isDirectory($modulePath)) {
            $this->warn("Modul {$module} už existuje, preskakujem module:make.");
        } else {
            $this->info("Vytváram modul: {$module}");
            $this->call('module:make', ['name' => [$module]]);

            if (! $fs->isDirectory($modulePath)) {
                $this->error("Modul sa nevytvoril: {$modulePath}");
                return self::FAILURE;
            }
        }

        // 2) Create navigation.php
        $navPath = "{$modulePath}/config/navigation.php";
        $navContent = <<<PHP
<?php

return [
    'group' => '{$this->escape($group)}',
    'items' => [
        [
            'title' => '{$this->escape($title)}',
            'route' => '{$routeName}',
            'order' => 50,
        ],
    ],
];
PHP;

        if ($force || ! $fs->exists($navPath)) {
            $fs->put($navPath, $navContent);
            $this->info("Vytvorený: config/navigation.php");
        } else {
            $this->warn("navigation.php už existuje, preskakujem.");
        }

        // 3) Create React page
        $pageDir  = "{$modulePath}/resources/js/pages";
        $pagePath = "{$pageDir}/Index.tsx";
        $fs->ensureDirectoryExists($pageDir);

        $pageContent = <<<TSX
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Index({ title }: { title: string }) {
  return (
    <AppLayout>
      <Head title={title} />
      <div className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toto je automaticky vytvorená stránka modulu.
        </p>
      </div>
    </AppLayout>
  );
}
TSX;

        if ($force || ! $fs->exists($pagePath)) {
            $fs->put($pagePath, $pageContent);
            $this->info("Vytvorený: resources/js/pages/Index.tsx");
        } else {
            $this->warn("Index.tsx už existuje, preskakujem.");
        }

        // Summary
        $this->newLine();
        $this->info("✅ Modul {$module} je pripravený.");
        $this->line("   URL:        /{$slug}");
        $this->line("   Route:      {$routeName}");
        $this->line("   Page:       Modules/{$module}/resources/js/pages/Index.tsx");
        $this->line("   Controller: Modules/{$module}/app/Http/Controllers/{$module}Controller.php");
        $this->newLine();
        $this->line("   Ďalšie kroky:");
        $this->line("   1) Uprav controller – pridaj Inertia::render()");
        $this->line("   2) Uprav routes/web.php – nastav routy podľa potreby");

        return self::SUCCESS;
    }

    /**
     * Escape single quotes and backslashes for PHP string literals.
     */
    private function escape(string $value): string
    {
        return str_replace(['\\', "'"], ['\\\\', "\\'"], $value);
    }
}
