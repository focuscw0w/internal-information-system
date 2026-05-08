<?php

return [
    'group' => 'Kapacitný manažment',
    'items' => [
        [
            'title' => 'Kapacitný dashboard',
            'route' => 'capacity-management.index',
            'icon' => 'Gauge',
            'permission' => \App\Enums\PermissionEnum::CAPACITY_MANAGE->value,
            'order' => 40,
        ],
    ],
];
