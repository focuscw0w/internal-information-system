<?php

return [
    'items' => [
        [
            'title' => 'Sledovanie času',
            'route' => 'time-tracking.index',
            'icon' => 'Clock',
            'group' => 'Prehľad',
            'order' => 20,
        ],
        [
            'title' => 'Tímové riadenie',
            'route' => 'manager.dashboard',
            'icon' => 'Layers',
            'group' => 'Manažment',
            'manager_area' => true,
            'order' => 10,
        ],
        [
            'title' => 'Výkazy času',
            'route' => 'manager.time.reports.index',
            'icon' => 'BarChart3',
            'group' => 'Manažment',
            'manager_area' => true,
            'order' => 20,
        ],
    ],
];
