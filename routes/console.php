<?php

use App\Console\Commands\MakeModule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'make:module {module} {title} {group}',
    fn () => $this->call(MakeModule::class, [
        'module' => $this->argument('module'),
        'title' => $this->argument('title'),
        'group' => $this->argument('group'),
    ])
);
