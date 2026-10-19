# LT72 Weather Map – Oro pavojus ir orų radaras

<img src="icon.svg" alt="Vėjas, lietus ir oro pavojus" width="64" height="64">

Neoficiali Home Assistant integracija su **vienu Lietuvos žemėlapiu**: LT72 perspėjimai pagal apskritis, tikras RainViewer kritulių radaras, Open-Meteo vėjo ir sniego prognozės.

## Galimybės

- Tikros visų 10 Lietuvos apskričių ribos, spustelėjama apskritis.
- Oro pavojus: raudona / geltona / geltona po raudonos / balta; be įrašo kortoje balta su punktyrine riba (ne oficialus atšaukimas).
- **Radaras** – RainViewer stebėti krituliai (iki 2 val. istorija, ne prognozė). Radaro vaizdas naudoja **Universal Blue (2)** spalvų paletę ir parametrą `1_1`, leidžiantį atskirai spalvinti tikėtiną sniegą. Kortelėje yra atskiras spalvų paaiškinimas, kurį galima išjungti.
- **Vėjas** – animuotos vėjo dalelės ir Open-Meteo prognozuojamas greitis, kryptis bei gūsiai. Dalelės juda pagal apytikslę 10 apskričių vėjo duomenų interpoliaciją (ne „Windy“ detalumo modelis).
- **Sniegas** – Open-Meteo prognozuojamas snygis. Sniego prognozė pagal apskritis nėra tas pats, kas radaro sniego spalvinimas.
- **Palydovas** – [EUMETSAT EUMETView](https://view.eumetsat.int/) WMS vaizdas tame pačiame geografiniame žemėlapyje. Nuo v0.5.1 numatytasis variantas – **IR 10,5 µm**, vienodai naudojamas dieną ir naktį; neprivalomas GeoColour dienos ir nakties kompozitas prieinamas per UI. Debesų vaizdo ryškumas keičiamas UI. **Palydovo vaizdo realų atvaizdavimą reikia patikrinti naudojamoje HA naršyklėje:** viešasis WMS gali vėluoti ar riboti užklausas; nutrūkus ryšiui korta parodo įspėjimą.
- Vaizdo sluoksniai ir informacijos blokai perjungiami kortos viduje ir per UI redaktorių.
- **📍 Mano vieta** – rodo būtent dashboardą atidariusio telefono / planšetės / kompiuterio vietą. Atidarius kortą, naršyklė automatiškai paprašo leidimo nustatyti vietą (jeigu jis dar nesuteiktas); leidus Lietuvos žemėlapyje atsiranda mėlynas pulsuojantis taškas. Mygtukas „Mano vieta“ leidžia bandyti dar kartą. Vietos koordinatės naudojamos tik naršyklėje, nesiunčiamos į Home Assistant serverį. **Reikalinga HTTPS prieiga** arba kita naršyklės laikoma saugia aplinka; vietinis HTTP IP adresas paprastai neveiks.

**Versija:** [v0.5.7](https://github.com/braticks/lt72-weather-map/releases/tag/v0.5.7) · [Visi leidimai](https://github.com/braticks/lt72-weather-map/releases)

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

Kortos resursas registruojamas automatiškai saugojimo (storage) režimu; YAML režimu pridėkite JavaScript module `/lt72_weather_map/lt72-weather-map.js?v=0.5.7`.

## Saugumas ir informacija

**Tai nėra oficiali pavojaus signalizavimo sistema.** Pasitikėkite LT-Alert, sirenomis ir institucijų pranešimais. **Balta be įrašo nereiškia oficialaus atšaukimo**. Radarą gali riboti paslaugos pasiekiamumas ir aprėptis. Vėjas / sniegas yra **prognozės**, ne tiesioginiai matavimai. Jei kurios nors paslaugos negalima pasiekti, atitinkamas sluoksnis rodomas kaip neprieinamas (ne kaip saugus / be kritulių).

Duomenys: [LT72](https://lt72.lt/), [RainViewer](https://www.rainviewer.com/) ir [Open-Meteo](https://open-meteo.com/); geografinės ribos: [govlt/powerbi-map-lt](https://github.com/govlt/powerbi-map-lt).

RainViewer vieša nemokama API skirta asmeniniam / mokomajam naudojimui ir turi greičio apribojimus. Komerciniam naudojimui tikrinkite tiekėjo sąlygas. Žemėlapis **neįterpia Windy iframe**; visi sluoksniai sudedami ant to paties žemėlapio.

*Pastaba: naujos RainViewer versijos radaro kadrų keliai turi 12 simbolių identifikatorius, todėl integracija priima ir naują, ir seną URL formatą.*

### Papildomi YAML nustatymai

```yaml
type: custom:lt72-weather-map
layer: wind
animated_wind: true
wind_particles: medium # low | medium | high
show_location: true
show_weather_labels: true
```

Jei įrenginio vietos nustatymas nepavyksta, korta **nenaudoja serverio adreso** kaip pakaitalo. Vietos rodymą galima išjungti per kortos vizualinį redaktorių. Vietos aptikimui kompiuteryje reikia įjungtų sistemos vietos nustatymo paslaugų; telefonu dažniausiai tiksliau nustato GPS. Vietos žymeklis rodomas tik Lietuvos žemėlapio ribose.

### Debesų sluoksnio pavyzdys

```yaml
type: custom:lt72-weather-map
layer: satellite
show_precip_legend: true
show_alerts: true
```

„Palydovas“ rodo **debesų struktūrą**, o ne tai, ar lyja/sninga. „Visi“ sluoksniuoja palydovo vaizdą po kritulių radaru ir LT72 apskritimis. Debesys pateikiami naudojant EUMETSAT `mtg_fd:rgb_geocolour` WMS sluoksnį (© EUMETSAT / NASA), o ne RainViewer IR produktą, kuris nutrauktas 2026 m. Palydovo vaizdai gaunami iš trečiosios šalies tiesiai per naršyklę, o ne per Home Assistant serverį.

### ❄ Snaigės ir ⚡ perkūnijos žymekliai (v0.4.0)

- **RainViewer (Universal Blue / paletė 2, smoothed/snow 1_1)** rodo radaru užfiksuotus kritulius. Lietus paprastai mėlynų atspalvių; stiprūs krituliai kartais ir kitų spalvų.
- **❄ Snaigės** virš apskrities centre esančio prognozės taško atsiranda tik tada, kai Open-Meteo modelis pateikia teigiamą `snowfall` arba sniego `weather_code`. Tai **nesudaro tikro radarinio snaigių lauko** ir neleidžia nustatyti konkrečios sniego ribos.
- **⚡ Žymeklis** įjungiamas, kai modelis praneša `weather_code: 95, 96, 97, 99` (perkūnija). **Tai nėra tikri užfiksuoti žaibo smūgiai ir neseka jų koordinačių.**
- Per kortos **vizualinį redaktorių** galima atskirai slėpti / rodyti snaiges ir perkūnijos žymeklius. Abu rodomi **Radaras**, **Sniegas** ir **Visi** režimuose, jei yra orų prognozės duomenys.

```yaml
type: custom:lt72-weather-map
layer: radar
show_snowflakes: true
show_thunderstorms: true
show_precip_legend: true
```

### Kaimyninės šalys ir žemėlapio temos (v0.5.0)

Žemėlapio foną ir kaimyninių valstybių kontūrus galima keisti **viename kortos UI redaktoriuje**:

- **Pilkas** – „Windy“ įkvėptas pilkų atspalvių fonas;
- **Šviesus** – neutralus, šviesus jūros ir žemės fonas;
- **Tamsus** – tamsi tema;
- **Melsvas** – melsvi jūros ir žemės atspalviai.

Fone yra **Lenkijos, Latvijos, Baltarusijos, Kaliningrado srities** ir kitų pakraštyje pasitaikančių valstybių administracinės sienos. Ribų šaltinis: [Natural Earth 1:110m Countries](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/) (public domain), supaprastintas ir nukirptas iki Lietuvos apylinkių. Kaimyninių šalių sienos specialiai blankesnės už Lietuvos apskritis. **Tai ne gatvių žemėlapis ar tikslus sienų matavimo šaltinis.** Internete jokių fono žemėlapių plytelių ir API raktų nereikia.

Vėjo animacijos dalelės dabar juda proporcingai interpoliuotam Open-Meteo **km/h** greičiui: esant labai silpnam vėjui animacija praktiškai sustoja, o stipresnis vėjas juda sparčiau, su ilgesniu ir ryškesniu pėdsaku. Tai vizualus modelis (ne Windy vėjo lauko rezoliucija).

```yaml
type: custom:lt72-weather-map
layer: wind
map_theme: gray  # gray | light | dark | blue
show_neighbor_borders: true
show_neighbor_labels: true
animated_wind: true
```

### Palydovo vaizdo sutvarkymas (v0.5.1)

Anksčiau numatytasis **GeoColour** sluoksnis jungė saulės apšviestas natūralias spalvas ir tamsų NASA nakties foną. Esant sutemoms žemėlapyje matėsi staigūs šviesaus ir tamsaus fono plotai, todėl ribos bei radaras buvo sunkiai įskaitomi. Dabar numatytasis **EUMETSAT Meteosat MTG IR10.5** (`mtg_fd:ir105_hrfi`) yra tas pats infraraudonųjų spindulių produktas ir dieną, ir naktį; jis rodomas su 38% permatomumu bei `screen` maišymo režimu virš žemėlapio fono. GeoColour liko **pasirinktinis**, jo dienos/nakties riba gali būti ryški.

Kortos vizualiniame redaktoriuje rinkitės **Palydoviniai debesys → Palydovo vaizdo tipas**, taip pat galite mažinti sluoksnio ryškumą iki 25%. **Pasirinktos apskrities mėlynas kontūras sušvelnintas**, kad neužgožtų kitų sienų.

```yaml
type: custom:lt72-weather-map
layer: satellite
satellite_style: ir          # ir | geocolour
satellite_opacity: subtle   # subtle | normal | strong
map_theme: gray
```

### v0.5.2 – tikslesnės sienos, išjungiamas tekstas ir matomas vėjas

- Kaimyninių šalių kontūrų geometrija pakeista iš **Natural Earth 1:110m** į **1:50m** (world-atlas@2 duomenys, public domain). `neighbors.json` dabar apima žymiai daugiau Latvijos, Lenkijos, Baltarusijos, Lietuvos, Rusijos Kaliningrado srities ir Estijos ribų taškų; failas lokaliai saugomas kartu su korta. Lietuviškų apskričių ribos nekeičiamos.
- Kortos UI turi atskirus jungiklius `show_satellite_info` – palydovo apatinė aiškinamoji eilutė, ir `show_sources` – apatinių šaltinių eilutė. Išjungus šaltinių eilutę lieka tik **ⓘ Šaltiniai** suskleidžiama prieiga prie privalomo šaltinių priskyrimo.
- Vėjo animacijos skaitomumas pagerintas: storesnės, didesnio kontrasto, švelniai švytinčios dalelės (numatyta `wind_visibility: strong`), daugiau dalelių ir pasirinkimas `normal` / `strong` / `vivid`. Dalelių greitis ir toliau keičiasi pagal modelio vėjo stiprumą.

```yaml
type: custom:lt72-weather-map
layer: wind
map_theme: gray
wind_particles: high
wind_visibility: vivid  # normal | strong | vivid
show_satellite_info: false
show_sources: false
```

### v0.5.3 – pagrindinių miestų temperatūros

- Žemėlapyje rodomi **Vilnius, Kaunas, Klaipėda, Šiauliai ir Panevėžys** su temperatūra `°C` (numatytasis režimas).
- Kortos UI galima pasirinkti **visus 10 apskričių centrų** arba išjungti temperatūras. Kartojami miesto ir apskrities pavadinimai automatiškai pašalinami, jei rodoma to paties miesto temperatūra.
- Šaltinis: **Open-Meteo current.temperature_2m** (modelio dabartinė reikšmė, ne oficialus meteorologinės stoties matavimas). Duomenys atnaujinami kartu su prognoze kas ~10 minučių. Tikslesniems miestų duomenims integracija naudoja miestų centrų koordinates, o ne ankstesnius apskrities apytikslius taškus.
- Jei temperatūra nepasiekiama, miestas neturi klaidinančio `0°` užrašo.
- **Miestų temperatūros rodomos visuose sluoksniuose**, įskaitant radarą, vėją ir palydovą.

```yaml
type: custom:lt72-weather-map
layer: radar
show_city_temperatures: true
city_temperature_set: main   # main | all
```

### v0.5.4 – Biržų temperatūra

**Biržai** pridėti kaip papildomas 11-as temperatūros taškas. Net esant režimui `city_temperature_set: main` rodomos šešių vietovių temperatūros: Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys **ir Biržai**. Režimas `all` rodo 10 apskričių centrų ir Biržus (11 vietovių). Biržų duomenys užsakomi atskirai pagal miesto koordinates (56.2045, 24.7567), nenaudojant Panevėžio temperatūros kaip pakaitalo. Tai Open-Meteo modelio temperatūra maždaug kas 10 minučių.

### v0.5.5 – našumo optimizavimas

- **Open-Meteo vėjas, sniegas ir miestų temperatūros** atnaujinamos kas 15 min. (anksčiau – 10).
- **RainViewer radaro kadrai** atnaujinami kas 5 min.; **EUMETSAT palydovo vaizdas** – kas 15 min.; **LT72 perspėjimai** – kas minutę.
- Vėjo laukas iš anksto apskaičiuojamas į mažą **vektorių tinklelį**; dalelių animacija nebekartoja apskričių projekcijų ir trigonometrijos kiekvienam kadrui.
- Ignoruojami nesusijusių Home Assistant sensorių pokyčiai ir nepasikeitę žemėlapio duomenys – visas SVG nebėra be reikalo atkuriamas.
- **IntersectionObserver** sustabdo animaciją, kai korta už ekrano ribų, o **visibilitychange** – kai naršyklės skirtukas paslėptas. Grįžus animacija tęsiama.
- UI pasirinkimai: **Automatinis** (pagal įrenginio resursus, 15–24 FPS), **Taupus** (15 FPS), **Sklandus** (30 FPS). Esant OS sumažinto judesio nustatymui animacija išjungta.
- Silpnesnei planšetei ar Android TV rekomenduojamas `performance_mode: eco`; tai nemažina radarų ar temperatūrų duomenų tikslumo.

```yaml
type: custom:lt72-weather-map
layer: wind
performance_mode: auto    # auto | eco | smooth
wind_particles: medium  # low | medium | high
animated_wind: true
```

Po atnaujinimo verta patikrinti našumą tikrame kompiuteryje, telefone ir senesnėje planšetėje. Automatiniai testai patikrina logiką, ne realius FPS.

### v0.5.7 – modelio paskutinio 15 min intervalo vėjo vidurkis

- Vėjo greitis ir kryptis apskaičiuojami iš dviejų paskutinio prieinamo 15 minučių intervalo **Open-Meteo minutely_15 modelio momentinių** taškų. Greitis yra dviejų reikšmių aritmetinis vidurkis, o kryptis – pagal greitį svertinis kampų vidurkis; ignoruojami būsimi, seni ar trūkstami taškai.
- Tai **apytikslis modelinis**, ne stoties išmatuotas ar realių pastarųjų 15 min stebėtas, vėjo vidurkis. Modelio laikas gali kiek atsilikti.
- Žemėlapyje prie greičio rodomas užrašas `(15 min)`, o pasirinktos apskrities detalėse – `15 min. modelio vid.`.
- Jei patikimų 15 min duomenų nėra, naudojama ankstesnė `current` modelio vėjo reikšmė. Tokiu atveju detalių eilutėje rodoma `modelis dabar`; 15 min žyma neteikiama.
- Suvidurkintas vėjo greitis ir kryptis naudojami ir dalelių animacijai. Visos **v0.5.5** našumo optimizacijos, įskaitant adaptyvų FPS ir išankstinį vėjo tinklelį, išsaugotos.

Atnaujinti į `v0.5.7`: HACS → LT72 Weather Map → Update, perkrauti Home Assistant ir perkrauti naršyklės kortą (`Ctrl+F5`).
