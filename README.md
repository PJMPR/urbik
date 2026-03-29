# Urbik static business site

Statyczna, wielojęzyczna strona firmowa dla firmy remontowo-budowlanej z naciskiem na podłogi i prace wykończeniowe.

## Stack

- HTML5
- Tailwind CSS przez CDN
- Vanilla JavaScript
- JSON-based i18n w katalogu `i18n/`

## Struktura projektu

- `index.html`
- `about.html`
- `services.html`
- `gallery.html`
- `contact.html`
- `assets/css/styles.css`
- `assets/js/i18n-loader.js`
- `assets/js/i18n-data.js`
- `i18n/de.json`
- `photos/`
- `sitemap.xml`
- `robots.txt`

## Uruchomienie lokalne

### Szybki podgląd

1. Otwórz `index.html` bezpośrednio w przeglądarce.
2. Strona użyje `assets/js/i18n-data.js` jako fallback dla trybu `file://`.

### Zalecany tryb developerski

Uruchom dowolny prosty serwer statyczny, aby przeglądarka ładowała JSON bez ograniczeń lokalnego systemu plików.

Przykłady:

- VS Code Live Server
- `npx serve .`
- `python -m http.server`

## Tailwind

Projekt korzysta z CDN, więc build step nie jest wymagany. Jeśli chcesz przejść na build Tailwinda, zachowaj klasę HTML i przenieś style utility do własnej konfiguracji.

## Wdrożenie

### GitHub Pages

1. Wypchnij repozytorium na GitHub.
2. Wejdź w `Settings -> Pages`.
3. Ustaw publikację z gałęzi `main` i katalogu root.
4. Po wdrożeniu zaktualizuj `site.baseUrl` we wszystkich plikach `i18n/*.json`.

### Netlify

1. Dodaj projekt jako nową stronę.
2. Build command zostaw puste.
3. Publish directory ustaw na root projektu.
4. Po publikacji zaktualizuj `site.baseUrl` w tłumaczeniach.

### Vercel

1. Importuj projekt jako statyczną stronę.
2. Framework preset ustaw na `Other`.
3. Build command nie jest wymagany.
4. Output directory pozostaw domyślny.
5. Po wdrożeniu ustaw właściwy `site.baseUrl`.

## Google Analytics 4

W każdym pliku HTML znajduje się zakomentowany placeholder skryptu GA4 w sekcji `<head>`.

Aby włączyć analitykę:

1. Odszukaj komentarz `GA4 placeholder` w:
   - `index.html`
   - `about.html`
   - `services.html`
   - `gallery.html`
   - `contact.html`
2. Usuń komentarz otaczający snippet.
3. Zamień `G-XXXXXXXXXX` na swój Measurement ID.
4. Wdróż stronę ponownie.

## Jak dodać nowy język

1. Skopiuj jeden z plików w `i18n/`, na przykład `pl.json`.
2. Nazwij plik według kodu języka, np. `cs.json`.
3. Dodaj nowy kod do tablicy `SUPPORTED_LANGUAGES` w `assets/js/i18n-loader.js`.
4. Dodaj przycisk przełącznika języka we wszystkich plikach HTML.
5. Wygeneruj ponownie `assets/js/i18n-data.js`, aby fallback lokalny zawierał nowy język.

Przykładowa komenda PowerShell do odświeżenia fallbacku:

```powershell
$root = 'c:\moje\urbik'
$languages = 'de'
$data = [ordered]@{}
foreach ($lang in $languages) {
  $json = Get-Content -Raw -Path (Join-Path $root "i18n\$lang.json") | ConvertFrom-Json
  $data[$lang] = $json
}
$output = "window.__I18N_INLINE__ = " + ($data | ConvertTo-Json -Depth 100 -Compress) + ";`n"
Set-Content -Path (Join-Path $root 'assets\js\i18n-data.js') -Value $output -Encoding UTF8
```

## Jak dodać nowe zdjęcia do galerii

1. Skopiuj nowy plik do katalogu `photos/`.
2. Dodaj wpis z dokładną nazwą pliku do obiektu `gallery` we wszystkich plikach `i18n/*.json`.
3. Uzupełnij `title` i `description` dla każdego języka.
4. Jeśli korzystasz z podglądu `file://`, odśwież `assets/js/i18n-data.js` powyższą komendą.

## SEO checklist po wdrożeniu

- Ustaw prawdziwy adres domeny w `site.baseUrl` w każdym pliku `i18n/*.json`.
- Zaktualizuj `sitemap.xml` i `robots.txt` do docelowej domeny.
- Opcjonalnie podmień `og:image` w plikach HTML na wybrany obraz reprezentacyjny.
- Dodaj właściwy Measurement ID GA4.

## Uwagi

- Wszystkie widoczne treści są sterowane z plików `i18n/*.json`.
- Galeria buduje podpisy na podstawie nazw plików zdjęć.
- Formularz kontaktowy jest celowo bez backendu i nie wysyła danych.