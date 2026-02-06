<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

class MakeModule extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:module
        {module : Názov modulu / namespace (napr. Projects)}
        {title : Názov v sidebare (napr. "Projekty")}
        {group : Skupina v sidebare (napr. "Práca & Čas")}';

    // php artisan  make:module Project "Projekty" "Kapacitný manažment"
    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a nwidart module + navigation item + basic React page';

    /**
     * Execute the console command.
     */
    public function handle(Filesystem $fs): int
    {
         $fs = new \Illuminate\Filesystem\Filesystem();

        $module = Str::studly($this->argument('module')); // Blog
        $title  = $this->argument('title');               // Projekty
        $group  = $this->argument('group');               // Práca & Čas

        $slug      = Str::kebab($module);                 // blog
        $routeName = Str::snake($slug) . '.index';        // blog.index

        $this->info("Vytváram modul: {$module}");

        // 1) nwidart module:make
        $this->call('module:make', ['name' => [$module]]);

        $modulePath = base_path("Modules/{$module}");
        if (!$fs->isDirectory($modulePath)) {
            $this->error("Modul sa nevytvoril: {$modulePath}");
            return self::FAILURE;
        }

        // 2) navigation.php
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
        $fs->put($navPath, $navContent);

        // 3) React page
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
        if (!$fs->exists($pagePath)) {
            $fs->put($pagePath, $pageContent);
        }

        // 4) Patch controller index() -> Inertia::render
        $controllerPath = "{$modulePath}/app/Http/Controllers/{$module}Controller.php";
        if (!$fs->exists($controllerPath)) {
            $this->error("Nenašiel som controller: {$controllerPath}");
            $this->warn("Tip: skontroluj, či nwidart stubs generujú {$module}Controller.php.");
            return self::FAILURE;
        }

        $controller = $fs->get($controllerPath);

        // 4a) ensure imports
        $controller = $this->ensureUse($controller, "use Inertia\\Inertia;");
        $controller = $this->ensureUse($controller, "use Illuminate\\Http\\Request;");

        // 4b) replace index() method body
        $newIndex = <<<PHP
    public function index(Request \$request)
    {
        return Inertia::render('{$module}/Index', [
            'title' => '{$this->escape($title)}',
        ]);
    }
PHP;

        $controller2 = $this->replaceMethod($controller, 'index', $newIndex);

        if ($controller2 === null) {
            $this->error("Nepodarilo sa nájsť/replace-núť metódu index() v controlleri.");
            $this->warn("Otvor súbor a uisti sa, že obsahuje 'public function index()' alebo 'public function index(Request \$request)'.");
            return self::FAILURE;
        }

        $fs->put($controllerPath, $controller2);

        // 5) Patch routes/web.php 
        $routesPath = "{$modulePath}/routes/web.php";
        if ($fs->exists($routesPath)) {
            $routes = $fs->get($routesPath);

       
            if (!str_contains($routes, "->prefix('{$slug}')")) {
                $routes = <<<PHP
<?php

use Illuminate\\Support\\Facades\\Route;
use Modules\\{$module}\\Http\\Controllers\\{$module}Controller;

Route::middleware(['web', 'auth'])
    ->prefix('{$slug}')
    ->name('{$slug}.')
    ->group(function () {
        Route::get('/', [{$module}Controller::class, 'index'])->name('index');
    });

PHP;
                $fs->put($routesPath, $routes);
            }
        } else {
            $routes = <<<PHP
<?php

use Illuminate\\Support\\Facades\\Route;
use Modules\\{$module}\\Http\\Controllers\\{$module}Controller;

Route::middleware(['web', 'auth'])
    ->prefix('{$slug}')
    ->name('{$slug}.')
    ->group(function () {
        Route::get('/', [{$module}Controller::class, 'index'])->name('index');
    });

PHP;
            $fs->ensureDirectoryExists(dirname($routesPath));
            $fs->put($routesPath, $routes);
        }

        $this->info("Hotovo.");
        $this->line("URL: /{$slug}");
        $this->line("Route: {$routeName}");
        $this->line("Page: Modules/{$module}/resources/js/pages/Index.tsx");
        $this->line("Controller patched: Modules/{$module}/app/Http/Controllers/{$module}Controller.php");

        return self::SUCCESS;
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', "'"], ['\\\\', "\\'"], $value);
    }

       private function ensureUse(string $content, string $useLine): string
    {
        if (str_contains($content, $useLine)) {
            return $content;
        }

        $pattern = '/^namespace\s+[^\n;]+;\s*\R/m';
        if (preg_match($pattern, $content, $m, PREG_OFFSET_CAPTURE)) {
            $pos = $m[0][1] + strlen($m[0][0]);
            return substr($content, 0, $pos) . $useLine . "\n" . substr($content, $pos);
        }

        return preg_replace('/^<\?php\s*/', "<?php\n\n{$useLine}\n", $content) ?? $content;
    }

      /**
     * Nahradí existujúcu metódu (podľa názvu) novým obsahom.
     * Vráti null, ak metódu nenájde.
     */
    private function replaceMethod(string $content, string $methodName, string $replacement): ?string
    {
        $pattern = '/\R\s*public\s+function\s+' . preg_quote($methodName, '/') . '\s*\([^)]*\)\s*\{.*?\R\s*\}\s*/s';

        if (!preg_match($pattern, $content)) {
            $pattern2 = '/\R\s*\/\*\*.*?\*\/\s*\R\s*public\s+function\s+' . preg_quote($methodName, '/') . '\s*\([^)]*\)\s*\{.*?\R\s*\}\s*/s';
            if (!preg_match($pattern2, $content)) {
                return null;
            }
            return preg_replace($pattern2, "\n\n{$replacement}\n", $content, 1);
        }

        return preg_replace($pattern, "\n\n{$replacement}\n", $content, 1);
    }
}
