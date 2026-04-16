# Databázový diagram — Internal Information System

High-level prehľad dátového modelu systému, **rozdelený podľa modulov** pre čitateľnosť. Každý modul má samostatný DBML súbor určený na renderovanie v [dbdiagram.io](https://dbdiagram.io).

## Ako si diagram pozrieť

1. Otvor [dbdiagram.io](https://dbdiagram.io).
2. **Import** → **From DBML**.
3. Skopíruj obsah zvoleného `.dbml` súboru z [diagrams/](diagrams/) a vlož ho.

## Moduly

| # | Modul | Súbor | Obsah |
|---|---|---|---|
| 1 | **User** | [diagrams/user-module.dbml](diagrams/user-module.dbml) | `users`, `sessions`, `password_reset_tokens` |
| 2 | **Project** | [diagrams/project-module.dbml](diagrams/project-module.dbml) | `projects`, `tasks`, `subtasks`, `comments`, `project_team`, `project_allocations`, `assigned_users`, `activity_log`, `notifications` |
| 3 | **TimeTracking** | [diagrams/time-tracking-module.dbml](diagrams/time-tracking-module.dbml) | `time_entries` |
| 4 | **CapacityManagement** | [diagrams/capacity-module.dbml](diagrams/capacity-module.dbml) | `employee_capacities` |
| 5 | **Permissions** (Spatie) | [diagrams/permissions-module.dbml](diagrams/permissions-module.dbml) | `permissions`, `roles`, `model_has_*`, `role_has_permissions` |

## Konvencie

- **Stub tabuľky** — v každom modulovom diagrame je `users` (prípadne `projects`, `tasks`) zobrazený ako **stub** — iba `id` a `name`, označené `Note: 'STUB'`. Skutočná definícia je v [user-module.dbml](diagrams/user-module.dbml) resp. [project-module.dbml](diagrams/project-module.dbml). Vďaka tomu sa čiary nepretínajú naprieč stovkami vzťahov — každý diagram zobrazuje iba to, čo je relevantné pre daný modul.
- **Farby modulov:** User 🟦, Project 🟥, TimeTracking 🟩, Capacity 🟧, Permissions 🟪. Stub tabuľky sú sivé.
- **Polymorfické vzťahy** (`activity_log.subject_*`, `notifications.notifiable_*`, Spatie `model_has_*.model_*`) nemajú hard FK — sú označené `Note:` komentárom.

## Cross-module vzťahy

Keďže diagramy sú rozdelené, tu je súhrn vzťahov medzi modulmi:

```
User ──┬── Project           users.id ← projects.owner_id
       │                     users.id ← tasks.assigned_to
       │                     users.id ← project_team.user_id
       │                     users.id ← project_allocations.user_id
       │                     users.id ← assigned_users.user_id
       │                     users.id ← comments.user_id
       │                     users.id ← activity_log.user_id
       │
       ├── TimeTracking      users.id ← time_entries.user_id
       │
       ├── Capacity          users.id ← employee_capacities.user_id  (1:1)
       │
       └── Permissions       users → model_has_roles/permissions  (polymorphic)

Project ── TimeTracking      projects.id ← time_entries.project_id
                             tasks.id    ← time_entries.task_id
```

## Dôležité dizajnové poznámky

- **Dve rôzne role v projekte:** `projects.owner_id` = jediný vlastník; `project_team` = členovia tímu (N:M s alokáciou a permissions). Vlastník **nemusí** byť v `project_team`.
- **Soft deletes** na `projects` a `tasks` (`deleted_at`).
- **Denormalizácia:** `projects.tasks_total` a `projects.tasks_completed` sa aktualizujú cez model eventy.
- **Project-scoped permissions** sú uložené ako JSON v `project_team.permissions` (oddelené od globálneho Spatie RBAC v module Permissions).
- **Kapacita a vyťaženie:** `employee_capacities.weekly_capacity_hours` (baseline) × `project_allocations.allocated_hours` (plán) × `time_entries.hours` (skutočnosť) → utilizácia = `used_hours / allocated_hours`.

## Plná verzia (všetko v jednom)

Ak potrebuješ plný diagram so všetkými tabuľkami naraz (vizuálne menej prehľadný, ale úplný), použi [database-diagram.dbml](database-diagram.dbml).
