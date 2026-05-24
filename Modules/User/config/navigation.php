<?php

return [
    'group' => 'Administrácia',
    'items' => [
        [
            'title' => 'Používatelia',
            'route' => 'user.index',
            'icon' => 'Users',
            'admin_only' => true,
            'order' => 10,
        ],
    ],
];
