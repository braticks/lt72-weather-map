# LT72 Weather Map – Oro pavojus ir orų radaras

<img src="icon.svg" alt="Vėjas, lietus ir oro pavojus" width="64" height="64">

Neoficiali Home Assistant integracija su **vienu Lietuvos žemėlapiu**: LT72 perspėjimai pagal apskritis, tikras RainViewer kritulių radaras, Open-Meteo vėjo ir sniego prognozės.

## Galimybės

- Tikros visų 10 Lietuvos apskričių ribos, spustelėjama apskritis.
- Oro pavojus: raudona / geltona / geltona po raudonos / balta; be įrašo kortoje balta su punktyrine riba (ne oficialus atšaukimas).
- **Radaras** – RainViewer stebėti krituliai (iki 2 val. istorija, ne prognozė).
- **Vėjas** – Open-Meteo prognozuojamas greitis, kryptis ir gūsiai.
- **Sniegas** – Open-Meteo prognozuojamas snygis.
- Vaizdo sluoksniai ir informacijos blokai perjungiami kortos viduje ir per UI redaktorių.

**Versija:** [v0.1.1](https://github.com/braticks/lt72-weather-map/releases/tag/v0.1.1) · [Visi leidimai](https://github.com/braticks/lt72-weather-map/releases)

**Ikona:** `custom_components/lt72_weather_map/brand/icon.png` (HA integracijai) ir `icon.svg` (GitHub README). HACS katalogo peržiūroje ikonos atvaizdavimas gali vėluoti.

## Įdiegimas

1. HACS → Custom repositories → `https://github.com/braticks/lt72-weather-map` → **Integration**.
2. Download → perkraukite Home Assistant.
3. Settings → Devices & services → Add integration → **LT72 Weather Map** → pasirinkite apskritį.
4. Dashboard → Edit → Add card → **LT72 Weather Map** arba įklijuokite:

```yaml
type: custom:lt72-weather-map
title: Oro pavojus ir orų radaras
region: kauno
layer: radar
```

Kortos resursas registruojamas automatiškai saugojimo (storage) režimu; YAML režimu pridėkite JavaScript module `/lt72_weather_map/lt72-weather-map.js?v=0.1.1`.

## Saugumas ir informacija

**Tai nėra oficiali pavojaus signalizavimo sistema.** Pasitikėkite LT-Alert, sirenomis ir institucijų pranešimais. **Balta be įrašo nereiškia oficialaus atšaukimo**. Radarą gali riboti paslaugos pasiekiamumas ir aprėptis. Vėjas / sniegas yra **prognozės**, ne tiesioginiai matavimai. Jei kurios nors paslaugos negalima pasiekti, atitinkamas sluoksnis rodomas kaip neprieinamas (ne kaip saugus / be kritulių).

Duomenys: [LT72](https://lt72.lt/), [RainViewer](https://www.rainviewer.com/) ir [Open-Meteo](https://open-meteo.com/); geografinės ribos: [govlt/powerbi-map-lt](https://github.com/govlt/powerbi-map-lt).

RainViewer vieša nemokama API skirta asmeniniam / mokomajam naudojimui ir turi greičio apribojimus. Komerciniam naudojimui tikrinkite tiekėjo sąlygas. Žemėlapis **neįterpia Windy iframe**; visi sluoksniai sudedami ant to paties žemėlapio.

*Pastaba: naujos RainViewer versijos radaro kadrų keliai turi 12 simbolių identifikatorius, todėl integracija priima ir naują, ir seną URL formatą.*
