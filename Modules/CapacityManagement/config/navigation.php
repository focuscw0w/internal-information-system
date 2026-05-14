<?php

return [
    'group' => 'Kapacitný manažment',
    'items' => [
        [
            'title' => 'Kapacitný dashboard',
            'route' => 'capacity-management.index',
            'icon' => 'Gauge',
            'permission' => \Modules\CapacityManagement\Enums\CapacityPermission::CAPACITY_MANAGE->value,
            'order' => 40,
        ],
    ],
];
