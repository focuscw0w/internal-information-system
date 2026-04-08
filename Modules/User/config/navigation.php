<?php

return [
    'group' => 'Správa systému',
    'items' => [
        [
            'title' => 'Používatelia',
            'route' => 'user.index',
            'icon' => 'Users',
            'permission' => 'users.manage',
            'order' => 50,
        ],
    ],
];
 