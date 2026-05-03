# Redesign Static Data Notes

Tieto prvky su v redizajne docasne staticke alebo neaktivne, pretoze aktualna databaza alebo aplikacna logika pre ne este neposkytuje pravdivy zdroj dat.

## Pouzivatelia

- Export pouzivatelov je zatial iba vizualna akcia.
- Skupiny a role su zatial iba vizualna akcia.
- Pozvanie pouzivatela v headeri je zatial iba vizualna akcia; funkcne vytvaranie zostava cez existujuci formular.
- Bulk akcie z Claude navrhu, napriklad zmena roly alebo pozastavenie, este nie su napojene.
- Oddelenie pouzivatela nie je v tabulke `users`, preto sa zobrazuje placeholder.
- 2FA stav nie je v aktualnych user props, preto sa zobrazuje `N/A`.
- Posledna aktivita pouzivatela nie je v aktualnych user props.

## Profil

- Rola mimo systemovych opravneni nie je samostatne DB pole; profil pouziva prve dostupne opravnenie ako docasny badge.
- Oddelenie, telefon, lokalita, casove pasmo, manazer, bio, skills a odznaky z Claude mocku nie su v aktualnej databaze.
- Mesiacny ciel hodin je docasne 168h.
- Vcas dokoncene ulohy a on-time rate este nie su vypocitane v aplikacnej logike.

## Navigacia a Shell

- Spodny popis pouzivatela v sidebare zobrazuje docasne `Project Lead`, kym nebude doplnena realna rola/profilova pozicia.

## Projekty

- Klient alebo organizacia projektu z Claude karticiek nie je samostatne pole v aktualnom projektovom modeli; UI docasne pouziva vlastnika projektu alebo `Internal`.
- Rola clena timu v pravom paneli detailu projektu je docasne `Clen timu`, kym nebude doplnena projektova rola alebo pozicia.
- KPI texty ako medzimesacna zmena aktivnych projektov a pocet timov su docasne vizualne doplnky, kym nebude doplneny realny analyticky zdroj.
- Akcia `Spravovat tim` v hlavicke detailu projektu je zatial vizualna, realna sprava clenov zostava v existujucich projektovych dialogoch.

## Kapacitne planovanie

- Aktualny tyzden v hlavicke je docasne staticky text podla Claude screenshotu.
- Akcie `Sync s projektmi`, `Export`, `Pozriet odporucania`, `Aplikovat` a rychle filtre odporucani su zatial vizualne alebo lokalne UI akcie.
- Simulator v pravom paneli pouziva prvy dostupny projekt z predikcie a ovladace su preview; detailna simulacia zostava cez existujucu simulation route.
- Role/osobne pozicie v tabulke kapacit nie su v aktualnom modeli, preto sa v tabulke pouziva email ako druhy riadok.

## Evidencia casu

- Aktivny timer pouziva zdielany TimerProvider (`Modules/TimeTracking/resources/js/context/timer-context.tsx`) s persistenciou v localStorage. Stop tlacidlo otvori StopTimerDialog ktory zaokruhli cas na 0.25h a POSTuje na `/projects/{projectId}/time-entries`. Play tlacidlo v karte "Naposledy pouzite" automaticky spusti timer pre dany projekt a ulohu.
- Manualny zaznam, rychly formular v pravom paneli aj edit/delete v zozname zaznamov volaju existujuce projektove endpointy (`POST/PUT/DELETE /projects/{id}/time-entries`).
- Export CSV a odoslanie na schvalenie su zatial vizualne akcie.
- Uctovatelnost a schvalenie v zozname pouzivaju diskrétne staticke hodnoty, lebo aktualny time-entry model tieto polia neposkytuje.
- KPI Uctovatelne bolo nahradene KPI Minuly tyzden, lebo aktualny time-entry model neposkytuje pole pre uctovatelnost.
- Admin (is_admin) vidi vsetky zaznamy vsetkych pouzivatelov a KPI/graf agreguju za cely tim; tyzdny ciel sa pocita zo suctu weekly_capacity_hours v tabulke employee_capacities. Beznym pouzivatelom zostava osobny pohlad s cielom 40h/tyzden.
- Toggle Tyzden/Mesiac v karte "Prehlad tyzdna" zatial neprepina vizualizaciu - chyba mesacny agregat v summary.

## Buduce backend ulohy

- Navrhnut profilove polia alebo samostatny profilovy model.
- Dodat realny 2FA stav do Inertia props.
- Dodat aktivitu pouzivatela alebo audit feed pre profil.
- Implementovat exporty, role/groups management a bulk actions po dokonceni UI redizajnu.
