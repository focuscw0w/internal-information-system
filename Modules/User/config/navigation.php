<?php

return [
    'group' => 'Správa systému',
    'items' => [
        [
            'title' => 'Používatelia',
            'route' => 'user.index',
            'permission' => 'users.manage',
            'order' => 50,
        ],
    ],
];
