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

## Buduce backend ulohy

- Navrhnut profilove polia alebo samostatny profilovy model.
- Dodat realny 2FA stav do Inertia props.
- Dodat aktivitu pouzivatela alebo audit feed pre profil.
- Implementovat exporty, role/groups management a bulk actions po dokonceni UI redizajnu.
