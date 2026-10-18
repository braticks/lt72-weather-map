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
  window:{}
};
vm.createContext(ctx);vm.runInContext(source,ctx);
ctx.topo=topo;
const paths=vm.runInContext("wmapDecode(topo)",ctx);
assert.equal(paths.length,10);
assert.equal(new Set(paths.map(x=>x.key)).size,10);
assert(paths.every(x=>x.d.startsWith("M")&&!x.d.includes("NaN")));
assert(paths.every(x=>Number.isFinite(x.x)&&x.x>=0&&x.x<=760));
assert(paths.every(x=>Number.isFinite(x.y)&&x.y>=0&&x.y<=444));
assert.equal(vm.runInContext("wmapState(true,null)",ctx),"not_reported");
assert.equal(vm.runInContext("wmapState(false,null)",ctx),"unavailable");
assert.equal(vm.runInContext('wmapState(true,{kodas:"red"})',ctx),"red");
assert.equal(vm.runInContext('wmapState(true,{kodas:"white"})',ctx),"white");
const satelliteUrl=vm.runInContext("wmapSatelliteUrl(wmapProjection(),1792000000000)",ctx);
const sat=new URL(satelliteUrl);
assert.equal(sat.hostname,"view.eumetsat.int");
assert.equal(sat.searchParams.get("LAYERS"),"mtg_fd:rgb_geocolour");
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
const attributes={
  saltinis:"LT72 Weather Map",apskritis:"Kauno apskritis",
  alerts_available:true, weather_available:true,radar_available:true,
  apskritys:{kauno:{kodas:"red",paskelbta:"2026-10-18 08:00"}},
  weather_samples:{kauno:{wind_kmh:20,wind_from_deg:90,gust_kmh:35,snow_cm:0.3,precip_mm:1}},
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

// Device geolocation always belongs to the browser, with an explicit user click.
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
