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

- Aktivny timer na indexe evidencie casu je lokalny UI preview a nespusta ani neuklada backendovy timer.
- Rychle pridanie zaznamu v pravom paneli je vizualny formular; existujuce realne time-entry akcie zostavaju na projektovych time-entry obrazovkach.
- Export CSV a odoslanie na schvalenie su zatial vizualne akcie.
- Uctovatelnost a schvalenie v zozname pouzivaju diskrétne staticke hodnoty, lebo aktualny time-entry model tieto polia neposkytuje.
- Tyzdnove KPI, mesacny odhad a datumovy rozsah v hlavicke su docasne vypocitane alebo staticke UI hodnoty podla Claude screenshotu.

## Buduce backend ulohy

- Navrhnut profilove polia alebo samostatny profilovy model.
- Dodat realny 2FA stav do Inertia props.
- Dodat aktivitu pouzivatela alebo audit feed pre profil.
- Implementovat exporty, role/groups management a bulk actions po dokonceni UI redizajnu.
