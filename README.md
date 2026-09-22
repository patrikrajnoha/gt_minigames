# Gold Trail Tycoon Wiki minihier

Statická dokumentačná wiki stránka pripravená pre GitHub Pages. Obsahuje minihry a gameplay systémy hry Gold Trail Tycoon.

## Lokálne spustenie

Nie je potrebný build krok ani inštalácia balíkov. Najjednoduchšie je otvoriť `index.html` v prehliadači. Pre spoľahlivejšie lokálne testovanie môžete priečinok spustiť cez ľubovoľný statický server, napríklad:

```text
python -m http.server 8000
```

Potom otvorte `http://localhost:8000/`.

## Publikovanie cez GitHub Pages

1. Nahrajte tento priečinok do GitHub repozitára.
2. Otvorte **Settings → Pages** v danom repozitári.
3. Vyberte **Deploy from a branch**, predvolenú vetvu a priečinok `/ (root)`.
4. Uložte nastavenie. GitHub Pages publikuje `index.html`; všetky odkazy a assets používajú relatívne cesty, takže fungujú aj v URL projektového repozitára.

## Úprava obsahu

- `assets/js/data.js` je jediný dátový zdroj pre katalóg aj detailné stránky.
- Každý objekt v `GAME_DATA` predstavuje jednu minihru alebo hlavný gameplay systém.
- `NAV_GROUPS` určuje skupiny a poradie v bočnej navigácii.

## Pridanie alebo výmena concept artu

Umiestnite obrázok do priečinka `img/` a jeho cestu nastavte v príslušnom poli `image` v `assets/js/data.js`. Alternatívne verzie môžu byť uvedené v poli `gallery`.

## Pridanie ďalšej minihry

Pridajte do `GAME_DATA` objekt s jedinečným `id`, názvom, lokáciou, typom, kategóriou, obrázkom a obsahom sekcií. Jeho `id` pridajte do príslušnej skupiny v `NAV_GROUPS`. Renderer automaticky vytvorí kartu, detailnú stránku, breadcrumbs a odkazy na predchádzajúci/ďalší systém.

## Stiahnutie aktuálneho obsahu

Odkazy na stránke vytvárajú Markdown export priamo z `GAME_DATA` v `assets/js/data.js`, ktorý používa aj renderer stránky. Po úprave obsahu preto nie je potrebné ručne aktualizovať samostatný dokument. Staršie súbory v `downloads/` nie sú používané odkazmi na stránke.

## Štruktúra projektu

```text
index.html                 katalógová stránka
game.html                  znovu použiteľná detailná stránka
assets/css/style.css       vizuálny systém western/parchment
assets/js/data.js          dáta minihier a navigačné skupiny
assets/js/app.js           renderer katalógu a článku
img/                       concept art obrázky
img/thumbs/                optimalizované náhľady pre katalóg
downloads/                 staršie exporty, stránka ich už nepoužíva
```
