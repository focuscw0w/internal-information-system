<?php

return [
    'items' => [
        [
            'title' => 'Dashboard',
            'route' => 'dashboard',
            'icon' => 'LayoutDashboard',
            'group' => 'Prehľad',
            'order' => 10,
        ],
        [
            'title' => 'Kapacitný dashboard',
            'route' => 'capacity-management.index',
            'icon' => 'Gauge',
            'group' => 'Manažment',
            'permission' => \Modules\CapacityManagement\Enums\CapacityPermission::CAPACITY_MANAGE->value,
            'order' => 30,
        ],
    ],
];
