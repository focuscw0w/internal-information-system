<?php

return [
    'group' => 'Kapacitný manažment',
    'items' => [
        [
            'title' => 'Tímové riadenie',
            'route' => 'manager.dashboard',
            'icon' => 'Layers',
            'order' => 30,
            'manager_area' => true,
        ],
        [
            'title' => 'Sledovanie času',
            'route' => 'time-tracking.index',
            'icon' => 'Clock',
            'order' => 50,
        ],
    ],
];
