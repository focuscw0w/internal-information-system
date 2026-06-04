# Cogitator

**Cogitator** je interný informačný systém určený na podporu riadenia projektov,
práce tímov, evidencie času a kapacitného plánovania. Projekt vznikol ako
praktická implementácia k bakalárskej práci zameranej na návrh modulárneho
interného systému pre malé a stredné podniky.

Systém spája projektový manažment, sledovanie práce, používateľské oprávnenia a
kapacitné prehľady do jednej webovej aplikácie postavenej na Laravel, Inertia a
React.

## Hlavné moduly

| Modul | Popis |
| --- | --- |
| **User** | Správa používateľov, profilov, nastavení účtu, autentifikácie a oprávnení. |
| **Project** | Projekty, úlohy, subtasks, tím, projektové oprávnenia, komentáre, prílohy, notifikácie a závislosti úloh. |
| **TimeTracking** | Evidencia odpracovaného času, timer dáta, schvaľovanie záznamov, manažérske reporty a exporty. |
| **CapacityManagement** | Kapacity používateľov, vyťaženosť tímu, kapacitný dashboard a simulácia projektových scenárov. |

## Funkcionalita

- správa používateľov a administrátorský prístup,
- prihlasovanie, zabudnuté heslo, profil a osobné nastavenia,
- vytváranie a správa projektov,
- projektové tímy s projektovo viazanými oprávneniami,
- úlohy, podúlohy, komentáre, prílohy a zmienky,
- Kanban/Gantt orientované projektové pohľady v používateľskom rozhraní,
- globálne vyhľadávanie naprieč modulmi,
- notifikácie k projektom, termínom a rizikám,
- evidencia odpracovaných hodín na projektoch a úlohách,
- schvaľovanie a zamietanie časových záznamov manažérom,
- reporty a export evidencie času,
- nastavovanie týždennej kapacity zamestnancov,
- porovnanie dostupnej kapacity, plánovaných alokácií a skutočne odpracovaného času,
- simulácia kapacitných scenárov projektu.

## Technologický stack

| Vrstva | Technológie |
| --- | --- |
| Backend | PHP 8.2, Laravel 12, Laravel Fortify |
| Frontend | React 19, TypeScript, Inertia.js, Vite |
| UI | Tailwind CSS, Radix UI, Headless UI, lucide-react, Recharts |
| Databáza | PostgreSQL |
| Modularita | nwidart/laravel-modules |
| Oprávnenia | spatie/laravel-permission + projektové JSON oprávnenia |
| Testovanie | Pest, Laravel test runner |
| DevOps | Docker, Docker Compose, Nginx, queue worker, scheduler |

## Architektúra

Aplikácia používa modulárnu Laravel architektúru. Doménové časti systému sú
oddelené do adresára `Modules/`, pričom každý modul môže obsahovať vlastné
routy, controllery, requesty, modely, služby, migrácie, seedery, frontend stránky
a testy.

Prezentačná vrstva je postavená na Inertia.js, takže Laravel poskytuje backend a
server-side routovanie, zatiaľ čo používateľské rozhranie je implementované v
Reacte. Navigácia sa skladá dynamicky podľa aktívnych modulov a oprávnení
používateľa.

Databázový model je rozdelený podľa modulov. Dokumentácia diagramov je v
[docs/database-diagram.md](docs/database-diagram.md).

## Štruktúra projektu

```text
app/                       spoločná aplikačná logika
Modules/                   modulárne časti systému
  User/                    používatelia, autentifikácia, profil, oprávnenia
  Project/                 projekty, úlohy, tím, komentáre, notifikácie
  TimeTracking/            evidencia času, schvaľovanie, reporty
  CapacityManagement/      kapacity, dashboard, simulácie
database/                  spoločné migrácie a seedery
docs/                      databázové diagramy a doplnková dokumentácia
resources/                 spoločné frontend zdroje a Blade entrypoint
routes/                    koreňové routy aplikácie
docker/                    konfigurácia Nginx pre Docker prostredie
```

## Spustenie cez Docker Compose

Projekt obsahuje Docker prostredie s PHP aplikáciou, Nginx serverom,
PostgreSQL databázou, queue workerom, schedulerom a Node/Vite službou.

### Požiadavky

- Docker
- Docker Compose

### Kroky

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
```

Aplikácia bude dostupná na:

```text
http://localhost
```

Vite dev server beží v kontajneri `node` na porte `5173`.

## Lokálne spustenie bez Dockeru

Táto alternatíva predpokladá lokálne nainštalované PHP, Composer, Node.js,
npm a PostgreSQL. Databázové údaje nastav v `.env` podľa vlastného prostredia.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
composer run dev
```

Príkaz `composer run dev` spustí Laravel server, queue listener a Vite vývojový
server cez `concurrently`.

## Užitočné príkazy

```bash
# Spustenie testov cez Composer skript
composer test

# Spustenie Laravel testov
php artisan test

# TypeScript kontrola
npm run types

# Produkčný frontend build
npm run build

# Kontrola formátovania frontend zdrojov
npm run format:check
```

## Databáza a seed dáta

Predvolená konfigurácia v `.env.example` používa PostgreSQL:

```text
DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_PORT=5432
DB_DATABASE=app
DB_USERNAME=app
DB_PASSWORD=secret
```

Pri Docker spustení tieto hodnoty zodpovedajú službe `pgsql` z
`docker-compose.yml`. Pri lokálnom spustení bez Dockeru je potrebné upraviť
`DB_HOST`, používateľa, heslo a názov databázy podľa lokálneho PostgreSQL
prostredia.

Seedovanie aplikácie spúšťa základné oprávnenia, používateľské dáta a realistické
projektové dáta cez hlavný `DatabaseSeeder`.

## Moduly a oprávnenia

Systém kombinuje dva prístupy k oprávneniam:

- globálne oprávnenia cez `spatie/laravel-permission`,
- projektové oprávnenia uložené pri členstve používateľa v projektovom tíme.

Vďaka tomu môže mať používateľ všeobecnú rolu v systéme a zároveň rozdielne
práva v jednotlivých projektoch.

## Dokumentácia

- [Databázový diagram](docs/database-diagram.md)
- [DBML diagramy modulov](docs/diagrams/)
- [Odporúčané rozšírenia systému](docs/odporucane-rozsirenia-systemu.html)

## Akademický kontext

Projekt je implementačnou časťou bakalárskej práce zameranej na návrh a vývoj
interného informačného systému. Práca sa venuje analýze potrieb malých a
stredných podnikov, návrhu modulárnej architektúry, databázového modelu a
implementácii modulov pre správu používateľov, projektový manažment, evidenciu
času a kapacitné plánovanie.

## Licencia

Tento projekt je licencovaný pod licenciou MIT. Podrobnosti sú uvedené v súbore
[LICENSE](LICENSE).
