<?php

namespace App\Providers;

use App\Support\Inertia\ModuleAwareViewFinder;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind('inertia.testing.view-finder', function ($app) {
            return new ModuleAwareViewFinder(
                $app['files'],
                $app['config']->get('inertia.testing.page_paths'),
                $app['config']->get('inertia.testing.page_extensions'),
                base_path('Modules'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
      Inertia::share('moduleNavigation', fn () => \App\Support\Navigation\ModuleNavigation::build());
    }
}
