<?php

namespace App\Support\Inertia;

use Illuminate\Filesystem\Filesystem;
use Illuminate\View\FileViewFinder;
use InvalidArgumentException;

/**
 * Inertia testing view finder that also resolves "Module/component" names
 * to pages inside Modules/{Module}/resources/js/pages/{component}.{ext}.
 */
class ModuleAwareViewFinder extends FileViewFinder
{
    public function __construct(Filesystem $files, array $paths, array $extensions, private readonly string $modulesPath)
    {
        parent::__construct($files, $paths, $extensions);
    }

    public function find($name)
    {
        if (isset($this->views[$name])) {
            return $this->views[$name];
        }

        $name = trim($name);

        if (str_contains($name, '/')) {
            [$module, $page] = explode('/', $name, 2);
            $modulePath = $this->modulesPath.DIRECTORY_SEPARATOR.$module.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages';

            if (is_dir($modulePath)) {
                try {
                    return $this->views[$name] = $this->findInPaths($page, [$modulePath]);
                } catch (InvalidArgumentException) {
                    // fall through to default lookup
                }
            }
        }

        return parent::find($name);
    }
}
