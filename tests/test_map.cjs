const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path");
const dir=path.join(__dirname,"..","custom_components","lt72_weather_map","www");
const source=fs.readFileSync(path.join(dir,"lt72-weather-map.js"),"utf8");
const topo=JSON.parse(fs.readFileSync(path.join(dir,"counties.json"),"utf8"));
const registered={};
class E {
  attachShadow(){
    this.shadowRoot={innerHTML:"",querySelectorAll:()=>[]};
    return this.shadowRoot;
  }
  dispatchEvent(e){this.event=e;return true;}
}
const ctx={
  HTMLElement:E,
  CustomEvent:class{constructor(type,init){this.type=type;Object.assign(this,init);}},
  customElements:{get:(key)=>registered[key],define:(key,val)=>registered[key]=val},
  document:{createElement:(key)=>({element:key})},
  window:{},
  URLSearchParams
};
vm.createContext(ctx);vm.runInContext(source,ctx);
ctx.topo=topo;
const paths=vm.runInContext("wmapDecode(topo)",ctx);
const neighborSource=JSON.parse(fs.readFileSync(path.join(dir,"neighbors.json"),"utf8"));
ctx.neighborSource=neighborSource;
const neighbors=vm.runInContext("wmapNeighborPaths(neighborSource)",ctx);
assert(neighbors.length>=4);
assert(neighbors.some(n=>n.name==="Poland"));
assert(neighbors.some(n=>n.name==="Latvia"));
assert(neighbors.every(n=>n.d.startsWith("M")&&!n.d.includes("NaN")));
assert(neighborSource.source.includes("1:50m"));
assert(neighbors.find(n=>n.name==="Latvia").d.split("L").length>80,
  "50m Latvia borders contain more detail than previous jagged 110m geometry");
const normalWind=vm.runInContext('wmapWindStyle("gray","normal")',ctx);
const vividWind=vm.runInContext('wmapWindStyle("gray","vivid")',ctx);
assert(vividWind.width>normalWind.width);
assert(vividWind.intensity>normalWind.intensity);
assert(vividWind.density>normalWind.density);
const slow=vm.runInContext("wmapWindMotion(3)",ctx);
const medium=vm.runInContext("wmapWindMotion(18)",ctx);
const strong=vm.runInContext("wmapWindMotion(70)",ctx);
assert.equal(vm.runInContext("wmapWindMotion(0).pixelsPerSecond",ctx),0);
assert(slow.pixelsPerSecond < medium.pixelsPerSecond && medium.pixelsPerSecond < strong.pixelsPerSecond);
assert(slow.alpha < medium.alpha && medium.alpha < strong.alpha);
assert(slow.trailLength < medium.trailLength && medium.trailLength < strong.trailLength);
assert.equal(paths.length,10);
assert.equal(vm.runInContext("wmapTemperatureLabel(8.6)",ctx),"+9°");
assert.equal(vm.runInContext("wmapTemperatureLabel(-2.6)",ctx),"-3°");
assert.equal(vm.runInContext("wmapTemperatureLabel(0)",ctx),"0°");
assert.equal(vm.runInContext("wmapTemperatureLabel(null)",ctx),null);
assert.equal(vm.runInContext("wmapTemperatureLabel(undefined)",ctx),null);
assert.equal(vm.runInContext("WMAP_MAIN_CITIES.length",ctx),6);
const ecoPreset=vm.runInContext("wmapPerformancePreset('eco',8,8)",ctx);
const smoothPreset=vm.runInContext("wmapPerformancePreset('smooth',8,8)",ctx);
const autoLow=vm.runInContext("wmapPerformancePreset('auto',4,2)",ctx);
const autoHigh=vm.runInContext("wmapPerformancePreset('auto',8,8)",ctx);
assert.equal(ecoPreset.fps,15);
assert.equal(smoothPreset.fps,30);
assert.equal(autoLow.fps,15);
assert(autoHigh.fps>15&&autoHigh.fps<=30);
assert(ecoPreset.density<autoHigh.density&&autoHigh.density<smoothPreset.density);
ctx.precomp={kauno:{wind_kmh:20,wind_from_deg:270}};
ctx.grid=vm.runInContext("wmapBuildWindGrid(precomp)",ctx);
ctx.gridPos=vm.runInContext("wmapProjection().xy(23.9036,54.8985)",ctx);
const gridSample=vm.runInContext("wmapSampleWindGrid(grid,gridPos[0],gridPos[1])",ctx);
assert(gridSample&&gridSample.vx>0&&gridSample.speed>10);
assert.equal(vm.runInContext("wmapSampleWindGrid(null,200,200)",ctx),null);
assert.equal(vm.runInContext("WMAP_EXTRA_CITY_POINTS.length",ctx),1);
assert.equal(vm.runInContext('WMAP_EXTRA_CITY_POINTS[0][1]',ctx),"Biržai");
assert.equal(new Set(paths.map(x=>x.key)).size,10);
assert(paths.every(x=>x.d.startsWith("M")&&!x.d.includes("NaN")));
assert(paths.every(x=>Number.isFinite(x.x)&&x.x>=0&&x.x<=760));
assert(paths.every(x=>Number.isFinite(x.y)&&x.y>=0&&x.y<=444));
assert.equal(vm.runInContext("wmapState(true,null)",ctx),"not_reported");
assert.equal(vm.runInContext("wmapState(false,null)",ctx),"unavailable");
assert.equal(vm.runInContext('wmapState(true,{kodas:"red"})',ctx),"red");
assert.equal(vm.runInContext('wmapState(true,{kodas:"white"})',ctx),"white");
assert.equal(vm.runInContext('wmapIsSnowForecast({snow_cm:0.4,weather_code:0})',ctx),true);
assert.equal(vm.runInContext('wmapIsSnowForecast({snow_cm:0,weather_code:85})',ctx),true);
assert.equal(vm.runInContext('wmapIsSnowForecast({snow_cm:0,weather_code:0})',ctx),false);
assert.equal(vm.runInContext('wmapIsThunderForecast({weather_code:95})',ctx),true);
assert.equal(vm.runInContext('wmapIsThunderForecast({weather_code:97})',ctx),true);
assert.equal(vm.runInContext('wmapIsThunderForecast({weather_code:99})',ctx),true);
assert.equal(vm.runInContext('wmapIsThunderForecast({weather_code:61})',ctx),false);
assert.equal(vm.runInContext('wmapIsThunderForecast({weather_code:null})',ctx),false);
const satelliteUrl=vm.runInContext("wmapSatelliteUrl(wmapProjection(),1792000000000)",ctx);
const sat=new URL(satelliteUrl);
assert.equal(sat.hostname,"view.eumetsat.int");
assert.equal(sat.searchParams.get("LAYERS"),"mtg_fd:ir105_hrfi");
const colorUrl=vm.runInContext("wmapSatelliteUrl(wmapProjection(),1792000000000,'geocolour')",ctx);
assert.equal(new URL(colorUrl).searchParams.get("LAYERS"),"mtg_fd:rgb_geocolour");
assert.equal(vm.runInContext("wmapSatelliteOpacity('subtle')",ctx),0.25);
assert.equal(vm.runInContext("wmapSatelliteOpacity('normal')",ctx),0.38);
assert.equal(vm.runInContext("wmapSatelliteOpacity('strong')",ctx),0.55);
assert.equal(sat.searchParams.get("CRS"),"EPSG:3857");
const bbox=sat.searchParams.get("BBOX").split(",").map(Number);
assert.equal(bbox.length,4);
assert(bbox[0]<bbox[2] && bbox[1]<bbox[3]);
assert.equal(sat.searchParams.get("WIDTH"),"760");
assert.equal(sat.searchParams.get("HEIGHT"),"444");
ctx.windSamples={kauno:{wind_kmh:20,wind_from_deg:270}};
const kpos=vm.runInContext("wmapProjection().xy(23.90,54.93)",ctx);
ctx.kpos=kpos;
const wfield=vm.runInContext("wmapWindField(windSamples,kpos[0],kpos[1])",ctx);
assert(wfield);
assert(wfield.vx>0 && Math.abs(wfield.vy)<0.001,"West wind should move east");
assert(Math.abs(wfield.speed-20)<0.001);
assert.equal(vm.runInContext("wmapWindField({},100,100)",ctx),null);
ctx.location={latitude:54.93,longitude:23.90};
const position=vm.runInContext("wmapLocationMarker(location)",ctx);
assert(position&&position.x>0&&position.y>0);
ctx.outside={latitude:50.0,longitude:30.0};
assert.equal(vm.runInContext("wmapLocationMarker(outside)",ctx),null);
const valid={host:"https://tilecache.rainviewer.com",frames:[{time:1720000000,path:"/v2/radar/1720000000"}]};
ctx.radar=valid;ctx.frame=valid.frames[0];
const tiles=vm.runInContext("wmapRadarTiles(radar,frame)",ctx);
assert(tiles.length>0&&tiles.length<=20);
assert(tiles.every(t=>t.url.startsWith("https://tilecache.rainviewer.com/v2/radar/1720000000/256/6/")));
assert(tiles.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)));
assert.equal(vm.runInContext('wmapRadarTiles({host:"https://evil.test"},frame).length',ctx),0);
assert.equal(vm.runInContext('wmapRadarTiles(radar,{path:"/evil"}).length',ctx),0);
ctx.frameHex={time:1792342800,path:"/v2/radar/15f54382b37b"};
assert(vm.runInContext("wmapRadarTiles(radar,frameHex).length",ctx)>0);
const editor=vm.runInContext("new LT72WeatherMapEditor()",ctx);
editor.setConfig({type:"custom:lt72-weather-map"});
assert(editor.shadowRoot.innerHTML.includes('data-setting="show_legend"'));
assert(editor.shadowRoot.innerHTML.includes('data-select="layer"'));
assert(editor.shadowRoot.innerHTML.includes('data-select="region"'));
editor._change("show_legend",false);
assert.equal(editor.event.type,"config-changed");
assert.equal(editor.event.detail.config.show_legend,false);
editor._change("layer","snow");
assert.equal(editor.event.detail.config.layer,"snow");
editor._change("show_legend",true);
assert.equal(Object.hasOwn(editor.event.detail.config,"show_legend"),false);
const card=vm.runInContext("new LT72WeatherMapCard()",ctx);
card._regions=paths;
card._neighbors=neighbors;
const attributes={
  saltinis:"LT72 Weather Map",apskritis:"Kauno apskritis",
  alerts_available:true, weather_available:true,radar_available:true,
  apskritys:{kauno:{kodas:"red",paskelbta:"2026-10-18 08:00"}},
  weather_samples:{kauno:{wind_kmh:20,wind_from_deg:90,gust_kmh:35,snow_cm:0.3,precip_mm:1,weather_code:95,temperature_c:8.6},
    vilniaus:{temperature_c:10},klaipedos:{temperature_c:6.2},
    siauliu:{temperature_c:7},panevezio:{temperature_c:8},
    alytaus:{temperature_c:8},marijampoles:{temperature_c:9},
    taurages:{temperature_c:7},telsiu:{temperature_c:5},utenos:{temperature_c:4},
    birzai:{temperature_c:3.6}},
  radar:valid
};
card.setConfig({type:"custom:lt72-weather-map",region:"kauno",layer:"radar"});
card.hass={states:{"sensor.lt72_weather":{entity_id:"sensor.lt72_weather",state:"Raudona",attributes}}};
const visible=card.shadowRoot.innerHTML;
assert(visible.includes("RainViewer"));
assert(visible.includes("20 km/h"));
assert(visible.includes("LT72"));
assert(visible.includes('<div class="legend">'));
assert(visible.includes('<div class="detail">'));
assert(visible.includes('href="https://tilecache.rainviewer.com'));
card.setConfig({type:"custom:lt72-weather-map",show_legend:false,show_details:false,show_header:false,show_toolbar:false});
const hidden=card.shadowRoot.innerHTML;
assert(!hidden.includes('<div class="legend">'));
assert(!hidden.includes('<div class="detail">'));
assert(!hidden.includes('<div class="header">'));
assert(!hidden.includes('<div class="toolbar">'));
assert(hidden.includes('<svg viewBox="0 0 760 444"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"wind"});
assert.equal(card._mode,"wind");
card.setConfig({type:"custom:lt72-weather-map",layer:"snow"});
assert.equal(card._mode,"snow");
console.log("All 10 counties, weather overlays, RainViewer tiles and UI editor passed.");

// The map displays the browsing device's GPS dot (and offers a retry button).
assert(visible.includes('data-locate="true"'));
assert(visible.includes("Mano vieta"));
card.setConfig({type:"custom:lt72-weather-map",layer:"wind"});
assert(card.shadowRoot.innerHTML.includes('class="wind-canvas"'));
card._devicePosition={latitude:54.93,longitude:23.90,accuracy:50};
card.setConfig({type:"custom:lt72-weather-map",layer:"wind"});
assert(card.shadowRoot.innerHTML.includes('class="device-location"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"wind",show_location:false,animated_wind:false});
assert(!card.shadowRoot.innerHTML.includes('data-locate="true"'));
assert(!card.shadowRoot.innerHTML.includes('class="wind-canvas"'));
assert(!card.shadowRoot.innerHTML.includes('class="device-location"'));
editor._change("animated_wind",false);
assert.equal(editor.event.detail.config.animated_wind,false);
editor._change("animated_wind",true);
assert.equal(Object.hasOwn(editor.event.detail.config,"animated_wind"),false);
editor._change("show_location",false);
assert.equal(editor.event.detail.config.show_location,false);
editor._change("wind_particles","high");
assert.equal(editor.event.detail.config.wind_particles,"high");
console.log("GPS permissions UI, position projection, wind field and animation switches passed.");

card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",show_location:false});
assert(card.shadowRoot.innerHTML.includes('class="satellite-layer"'));
assert(card.shadowRoot.innerHTML.includes("EUMETSAT"));
assert(!card.shadowRoot.innerHTML.includes('<div class="precip-guide">'));
card.setConfig({type:"custom:lt72-weather-map",layer:"all"});
assert(card.shadowRoot.innerHTML.includes('class="satellite-layer"'));
assert(card.shadowRoot.innerHTML.includes('class="precip-guide"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"radar",show_precip_legend:false});
assert(!card.shadowRoot.innerHTML.includes('class="precip-guide"'));
editor._change("layer","satellite");
assert.equal(editor.event.detail.config.layer,"satellite");
editor._change("show_precip_legend",false);
assert.equal(editor.event.detail.config.show_precip_legend,false);
console.log("EUMETSAT WMS bounds, overlay, and radar legend toggles verified.");

card.setConfig({type:"custom:lt72-weather-map",layer:"radar"});
assert(card.shadowRoot.innerHTML.includes('class="snow-cluster"'),"Snow cluster visible on radar");
assert(card.shadowRoot.innerHTML.includes('class="thunder-forecast"'),"Forecast thunder on radar");
assert(card.shadowRoot.innerHTML.includes("Prognozuojama perkūnija"));
assert(card.shadowRoot.innerHTML.includes("Ne tikri žaibo smūgiai") ||
       card.shadowRoot.innerHTML.includes("NE tikri žaibo smūgiai") ||
       card.shadowRoot.innerHTML.includes("ne užfiksuoti smūgiai"));
card.setConfig({type:"custom:lt72-weather-map",layer:"radar",show_snowflakes:false});
assert(!card.shadowRoot.innerHTML.includes('class="snow-cluster"'));
assert(card.shadowRoot.innerHTML.includes('class="thunder-forecast"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"radar",show_thunderstorms:false});
assert(!card.shadowRoot.innerHTML.includes('class="thunder-forecast"'));
assert(card.shadowRoot.innerHTML.includes('class="snow-cluster"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"wind"});
assert(!card.shadowRoot.innerHTML.includes('class="snow-cluster"'));
assert(!card.shadowRoot.innerHTML.includes('class="thunder-forecast"'));
editor._change("show_snowflakes",false);
assert.equal(editor.event.detail.config.show_snowflakes,false);
editor._change("show_thunderstorms",false);
assert.equal(editor.event.detail.config.show_thunderstorms,false);
console.log("Rain, forecast snowflakes, storm model and UI toggles passed.");

card.setConfig({type:"custom:lt72-weather-map",layer:"wind",map_theme:"dark"});
const darkMap=card.shadowRoot.innerHTML;
assert(darkMap.includes("--wmap-sea:#1d2a35"));
assert(darkMap.includes('class="neighbor-outlines"'));
assert(darkMap.includes("Kaliningrado sritis"));
assert(darkMap.includes('class="neighbor-land"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"radar",map_theme:"light",show_neighbor_labels:false,show_neighbor_borders:false});
const minimalMap=card.shadowRoot.innerHTML;
assert(minimalMap.includes("--wmap-sea:#dbeaf0"));
assert(!minimalMap.includes('class="neighbor-label"'));
assert(!minimalMap.includes('class="neighbor"'));
assert(minimalMap.includes('class="neighbor-land"'));
editor._change("map_theme","blue");
assert.equal(editor.event.detail.config.map_theme,"blue");
editor._change("show_neighbor_borders",false);
assert.equal(editor.event.detail.config.show_neighbor_borders,false);
console.log("Neighboring country polygons, map themes and strength-dependent wind animation passed.");

card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",satellite_style:"ir",satellite_opacity:"subtle"});
const niceSatellite=card.shadowRoot.innerHTML;
assert(niceSatellite.includes("mtg_fd%3Air105_hrfi"));
assert(niceSatellite.includes('opacity="0.25"'));
assert(niceSatellite.includes('mix-blend-mode:screen'));
assert(!niceSatellite.includes("mtg_fd%3Argb_geocolour"));
card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",satellite_style:"geocolour",satellite_opacity:"strong"});
const colorSatellite=card.shadowRoot.innerHTML;
assert(colorSatellite.includes("mtg_fd%3Argb_geocolour"));
assert(colorSatellite.includes('opacity="0.55"'));
assert(colorSatellite.includes('mix-blend-mode:normal'));
assert(colorSatellite.includes("Sutemų riba gali būti ryški"));
card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",satellite_style:"ir",satellite_opacity:"normal"});
assert(card.shadowRoot.innerHTML.includes('opacity="0.38"'));
assert(card.shadowRoot.innerHTML.includes('stroke-width="1.65"'));
editor._change("satellite_style","ir");
assert.equal(editor.event.detail.config.satellite_style,"ir");
editor._change("satellite_opacity","subtle");
assert.equal(editor.event.detail.config.satellite_opacity,"subtle");
console.log("Consistent IR satellite, daylight/night GeoColour option, opacity and subtle outline passed.");

card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",show_satellite_info:false,show_sources:false});
const cleanBottom=card.shadowRoot.innerHTML;
assert(!cleanBottom.includes('<div class="sat-guide">'),"Satellite info hidden");
assert(cleanBottom.includes('<details class="source-details">'),"Sources collapse into a disclosure");
assert(!cleanBottom.includes('<details class="source-details" open'),"Sources must default closed");
assert(cleanBottom.includes('<details class="source-details">'),"Sources remain accessible through disclosure");
assert(cleanBottom.includes("ⓘ Šaltiniai"));
card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",show_satellite_info:true,show_sources:true});
assert(card.shadowRoot.innerHTML.includes('<div class="sat-guide">'));
assert(card.shadowRoot.innerHTML.includes('<div class="credits">Made with'));
assert(!card.shadowRoot.innerHTML.includes('<details class="source-details">'));
assert(editor.shadowRoot.innerHTML.includes('data-setting="show_satellite_info"'));
assert(editor.shadowRoot.innerHTML.includes('data-setting="show_sources"'));
assert(editor.shadowRoot.innerHTML.includes('data-select="wind_visibility"'));
editor._change("show_satellite_info",false);
assert.equal(editor.event.detail.config.show_satellite_info,false);
editor._change("show_sources",false);
assert.equal(editor.event.detail.config.show_sources,false);
editor._change("wind_visibility","vivid");
assert.equal(editor.event.detail.config.wind_visibility,"vivid");
console.log("50m neighbor borders, optional footers, source disclosure, visible wind settings passed.");

card.setConfig({type:"custom:lt72-weather-map",layer:"radar"});
const fiveCityHtml=card.shadowRoot.innerHTML;
assert.equal((fiveCityHtml.match(/class="city-temperature /g)||[]).length,6);
assert(fiveCityHtml.includes('aria-label="Biržai +4°"'));
assert(fiveCityHtml.includes("Biržai"));
assert(fiveCityHtml.includes("Kaunas"));
assert(fiveCityHtml.includes("+9°"));
assert(fiveCityHtml.includes('class="city-value"'));
assert(!fiveCityHtml.includes('aria-label="Alytus +8°"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"satellite",city_temperature_set:"all"});
const tenCitiesHtml=card.shadowRoot.innerHTML;
assert.equal((tenCitiesHtml.match(/class="city-temperature /g)||[]).length,11);
assert(tenCitiesHtml.includes('aria-label="Alytus +8°"'));
card.setConfig({type:"custom:lt72-weather-map",layer:"radar",show_city_temperatures:false});
const noCitiesHtml=card.shadowRoot.innerHTML;
assert(!noCitiesHtml.includes('class="city-temperature '));
assert(noCitiesHtml.includes('class="county-label"'));
assert(editor.shadowRoot.innerHTML.includes('data-setting="show_city_temperatures"'));
assert(editor.shadowRoot.innerHTML.includes('data-select="city_temperature_set"'));
editor._change("show_city_temperatures",false);
assert.equal(editor.event.detail.config.show_city_temperatures,false);
editor._change("city_temperature_set","all");
assert.equal(editor.event.detail.config.city_temperature_set,"all");
console.log("Main city temperatures, all-county mode, hide toggle and no false zero verified.");

const birzaiPosition=vm.runInContext("wmapProjection().xy(24.7567,56.2045)",ctx);
assert(birzaiPosition[0]>0&&birzaiPosition[0]<760);
assert(birzaiPosition[1]>0&&birzaiPosition[1]<444);
console.log("Biržai independent weather sample and overlay position verified.");

let actualRenders=0;
const nativeRender=card._render.bind(card);
card._render=(...args)=>{actualRenders++;return nativeRender(...args);};
const lastHass=card._hass;
const hassWithOtherEntity={...lastHass,states:{...lastHass.states,
 "sensor.unrelated":{entity_id:"sensor.unrelated",state:"on",attributes:{}}}};
card.hass=hassWithOtherEntity;
const afterNewHass=actualRenders;
card.hass={...hassWithOtherEntity,states:{...hassWithOtherEntity.states,
 "sensor.unrelated":{entity_id:"sensor.unrelated",state:"off",attributes:{}}}};
assert.equal(actualRenders,afterNewHass,"Unrelated sensor changes should not rebuild the map");
assert(editor.shadowRoot.innerHTML.includes('data-select="performance_mode"'));
editor._change("performance_mode","eco");
assert.equal(editor.event.detail.config.performance_mode,"eco");
console.log("Adaptive FPS, cached grid and unrelated HA update guard tests passed.");

const avgWindowAttributes=JSON.parse(JSON.stringify(attributes));
avgWindowAttributes.weather_samples.kauno.wind_window="15m";
avgWindowAttributes.weather_samples.kauno.wind_kmh=14.5;
card.setConfig({type:"custom:lt72-weather-map",layer:"wind"});
card.hass={states:{"sensor.lt72_weather_map":{
 entity_id:"sensor.lt72_weather_map",state:"ok",
 last_updated:"2026-10-18T21:44:00+03:00",attributes:avgWindowAttributes
}},locale:{language:"lt-LT"}};
assert(card.shadowRoot.innerHTML.includes("14.5 km/h (15 min)"));
assert(card.shadowRoot.innerHTML.includes("15 min. modelio vid."));
avgWindowAttributes.weather_samples.kauno.wind_window="current";
card.hass={states:{"sensor.lt72_weather_map":{
 entity_id:"sensor.lt72_weather_map",state:"ok",
 last_updated:"2026-10-18T21:45:00+03:00",attributes:avgWindowAttributes
}},locale:{language:"lt-LT"}};
assert(!card.shadowRoot.innerHTML.includes("14.5 km/h (15 min)"));
assert(card.shadowRoot.innerHTML.includes("modelis dabar"));
console.log("Recent-model 15-minute wind averaging/fallback labels passed.");

 
// Browser geolocation is requested automatically on first display, but consent
// stays under the browser's control and denied permissions are never bypassed.
async function testAutomaticBrowserLocation(){
  let requests=0,stopped=0;
  ctx.window.isSecureContext=true;
  ctx.navigator={
    permissions:{query:async()=>({state:"prompt"})},
    geolocation:{
      watchPosition(success){
        requests++;
        success({coords:{latitude:54.93,longitude:23.90,accuracy:30}});
        return 42;
      },
      clearWatch(id){assert.equal(id,42);stopped++;}
    }
  };
  const gps=vm.runInContext("new LT72WeatherMapCard()",ctx);
  gps._regions=paths;
  gps.setConfig({type:"custom:lt72-weather-map"});
  gps.connectedCallback();
  await Promise.resolve();
  assert.equal(requests,1,"Prompt state should start browser geolocation");
  assert(gps.shadowRoot.innerHTML.includes('class="device-location"'),
    "GPS dot should be rendered on the map");
  gps.disconnectedCallback();
  assert.equal(stopped,1,"Geolocation tracking stops on disconnect");

  ctx.navigator.permissions.query=async()=>({state:"denied"});
  const denied=vm.runInContext("new LT72WeatherMapCard()",ctx);
  denied._regions=paths;
  denied.setConfig({type:"custom:lt72-weather-map"});
  denied.connectedCallback();
  await Promise.resolve();
  assert.equal(requests,1,"Denied permission must not start geolocation");
  denied.disconnectedCallback();

  ctx.window.isSecureContext=false;
  const insecure=vm.runInContext("new LT72WeatherMapCard()",ctx);
  insecure._regions=paths;
  insecure.setConfig({type:"custom:lt72-weather-map"});
  insecure.connectedCallback();
  assert(insecure.shadowRoot.innerHTML.includes("HTTPS adresas"));
  assert.equal(requests,1,"Insecure HTTP must not start geolocation");
  insecure.disconnectedCallback();
  console.log("Automatic browser geolocation, GPS map dot and HTTPS guard passed.");
}
testAutomaticBrowserLocation().catch(err=>{console.error(err);process.exitCode=1;});
