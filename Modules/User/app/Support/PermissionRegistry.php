<?php

namespace Modules\User\Support;

use BackedEnum;
use InvalidArgumentException;
use Modules\User\Contracts\PermissionEnumInterface;
use Modules\User\Contracts\PermissionRegistryInterface;

class PermissionRegistry implements PermissionRegistryInterface
{
    /** @var array<int, class-string> */
    private array $enums = [];

    public function register(string $enumClass): void
    {
        if (! enum_exists($enumClass)) {
            throw new InvalidArgumentException("[$enumClass] is not an enum.");
        }

        if (! is_subclass_of($enumClass, PermissionEnumInterface::class)) {
            throw new InvalidArgumentException("[$enumClass] must implement ".PermissionEnumInterface::class);
        }

        if (! is_subclass_of($enumClass, BackedEnum::class)) {
            throw new InvalidArgumentException("[$enumClass] must be a backed enum.");
        }

        if (! in_array($enumClass, $this->enums, true)) {
            $this->enums[] = $enumClass;
        }
    }

    public function all(): array
    {
        $values = [];

        foreach ($this->enums as $enumClass) {
            foreach ($enumClass::cases() as $case) {
                $values[] = $case->value;
            }
        }

        return $values;
    }

    public function groupedForFrontend(): array
    {
        $grouped = [];

        foreach ($this->enums as $enumClass) {
            foreach ($enumClass::cases() as $case) {
                /** @var PermissionEnumInterface $case */
                $grouped[$case->group()][] = [
                    'value' => $case->value,
                    'label' => $case->label(),
                    'description' => $case->description(),
                ];
            }
        }

        return $grouped;
    }

    public function find(string $value): ?PermissionEnumInterface
    {
        foreach ($this->enums as $enumClass) {
            $case = $enumClass::tryFrom($value);
            if ($case instanceof PermissionEnumInterface) {
                return $case;
            }
        }

        return null;
    }
}
