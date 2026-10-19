/* LT72 Weather Map for Home Assistant - one SVG coordinate system.
 * Map geometry: govlt/powerbi-map-lt.
 * Weather: RainViewer radar observations, Open-Meteo model predictions.
 */
const WMAP_REGIONS = [
  ["alytaus","Alytaus","Alytus",24.0410,54.3960],
  ["kauno","Kauno","Kaunas",23.9036,54.8985],
  ["klaipedos","Klaipėdos","Klaipėda",21.1443,55.7033],
  ["marijampoles","Marijampolės","Marijampolė",23.3541,54.5590],
  ["panevezio","Panevėžio","Panevėžys",24.3575,55.7348],
  ["siauliu","Šiaulių","Šiauliai",23.3137,55.9349],
  ["taurages","Tauragės","Tauragė",22.2897,55.2522],
  ["telsiu","Telšių","Telšiai",22.2492,55.9861],
  ["utenos","Utenos","Utena",25.5992,55.4976],
  ["vilniaus","Vilniaus","Vilnius",25.2797,54.6872]
];
const WMAP_BY_KEY=Object.fromEntries(WMAP_REGIONS.map(r=>[r[0],r]));
const WMAP_EXTRA_CITY_POINTS=[
 ["birzai","Biržai",24.7567,56.2045]
];
// Five largest cities, plus Biržai; the alert county set stays unchanged.
const WMAP_MAIN_CITIES=["vilniaus","kauno","klaipedos","siauliu","panevezio","birzai"];
const WMAP_LOCATION_CITIES=[
 ...WMAP_REGIONS.map(r=>[r[0],r[2],r[3],r[4]]),...WMAP_EXTRA_CITY_POINTS
].sort((a,b)=>a[1].localeCompare(b[1],"lt"));
const WMAP_LOCATION_MODES=[
 ["auto","Automatiškai (GPS / HA namai)"],
 ["browser","Tik naršyklės GPS (HTTPS)"],
 ["home","Home Assistant namų vieta"],
 ["city","Pasirinktas miestas"]
];
const WMAP_CITY_SETS=[
 ["main","5 pagrindiniai miestai + Biržai"],
 ["all","Visi 10 apskričių centrų + Biržai"]
];
function wmapTemperatureLabel(value) {
 if(typeof value!=="number"||!Number.isFinite(value))return null;
 const rounded=Math.round(value);
 return (rounded>0?"+":"")+rounded+"°";
}
const WMAP_LEVELS={
 red:["Raudona","#e53935"],
 yellow:["Geltona","#f9c74f"],
 yellow_after_red:["Geltona po raudonos","#ef9234"],
 white:["Balta","#f6f8fc"],
 not_reported:["Nėra įrašo","#f6f8fc"],
 unavailable:["Neprieinama","#8190a3"]
};
const WMAP_MODES=[
 ["radar","🌧️ Radaras"],["wind","💨 Vėjas"],
 ["snow","❄️ Sniegas"],["satellite","☁️ Palydovas"],["all","🌦️ Visi"],["none","🗺️ Tik pavojus"]
];
// Local, lightweight basemaps; no third-party tile account or API key needed.
const WMAP_PERFORMANCE_MODES=[["auto","Automatinis (15–30 FPS)"],["eco","Taupus (15 FPS)"],["smooth","Sklandus (30 FPS)"]];
const WMAP_WIND_VISIBILITY=[
 ["normal","Normalus"],
 ["strong","Ryškus (rekomenduojama)"],
 ["vivid","Labai ryškus"]
];
const WMAP_MAP_THEMES=[
 ["gray","Pilkas (Windy stilius)"],
 ["light","Šviesus"],
 ["dark","Tamsus"],
 ["blue","Melsvas"]
];
const WMAP_THEME_COLORS={
 gray:{sea:"#7b858c",land:"#a7acb1",outline:"#69757f",names:"#384b5a",county:"#4c6476",label:"#263f55"},
 light:{sea:"#dbeaf0",land:"#f2f2ec",outline:"#a9b6b6",names:"#697b86",county:"#94a7aa",label:"#284559"},
 dark:{sea:"#1d2a35",land:"#354451",outline:"#697984",names:"#acbdc9",county:"#8ca2b0",label:"#edf6fc"},
 blue:{sea:"#a9d0e4",land:"#dbe9e6",outline:"#83a3b4",names:"#527c8d",county:"#7f9ca7",label:"#274c64"}
};
// GeoColour switches between daylight and night images; for a consistent
// readable cloud overlay use the 10.5 um infrared channel by default.
const WMAP_SATELLITE_STYLES=[
 ["ir","☁️ Infraraudonieji debesys (rekomenduojama)"],
 ["geocolour","🛰️ GeoColour – diena / naktis"]
];
const WMAP_SATELLITE_OPACITIES=[
 ["subtle","Švelnus (25 %)"],
 ["normal","Vidutinis (38 %)"],
 ["strong","Ryškus (55 %)"]
];
const WMAP_COUNTRY_LABELS=[
 ["Latvija",24.6,56.26],["Baltarusija",27.4,54.35],
 ["Lenkija",22.0,54.07],["Kaliningrado sritis",21.64,54.34]
];
const WMAP_FLAGS=[
 ["show_header","Rodyti antraštę"],
 ["show_icon","Rodyti ikoną"],
 ["show_subtitle","Rodyti šaltinių būseną"],
 ["show_region_labels","Rodyti apskričių pavadinimus"],
 ["show_city_temperatures","Rodyti miestų temperatūras"],
 ["show_neighbor_borders","Rodyti kaimyninių šalių kontūrus"],
 ["show_neighbor_labels","Rodyti kaimyninių šalių pavadinimus"],
 ["show_alerts","Rodyti oro pavojaus spalvas"],
 ["show_weather_labels","Rodyti vėjo / sniego reikšmes"],
 ["show_details","Rodyti pasirinktos apskrities duomenis"],
 ["show_legend","Rodyti spalvų legendą"],
 ["show_timeline","Rodyti radaro laiko valdymą"],
 ["show_disclaimer","Rodyti perspėjimo paaiškinimą"],
 ["show_satellite_info","Rodyti apatinį palydovo paaiškinimą"],
 ["show_sources","Rodyti apatinę šaltinių eilutę"],
 ["show_precip_legend","Rodyti radaro kritulių spalvų paaiškinimą"],
 ["show_snowflakes","Rodyti snaiges prognozuojant snygį"],
 ["show_thunderstorms","Rodyti prognozuojamą perkūniją ⚡"],
 ["show_toolbar","Rodyti sluoksnių perjungimą"],
 ["show_location","Rodyti „Mano vieta“ žymeklį"],
 ["animated_wind","Animuoti vėjo judėjimą"]
];
const WMAP_URL="/lt72_weather_map/";
const WMAP_ESC=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);
const WMAP_NORMAL=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const WMAP_KEY=s=>WMAP_REGIONS.find(r=>WMAP_NORMAL(s).startsWith(WMAP_NORMAL(r[1])))?.[0];

const WMAP_ZOOM=6, WMAP_TILE=256;
function wmapWorld(lon,lat,z=WMAP_ZOOM){
 const sin=Math.sin(lat*Math.PI/180);
 return [(lon+180)/360*Math.pow(2,z)*WMAP_TILE,
   (1-Math.log((1+sin)/(1-sin))/(2*Math.PI))/2*Math.pow(2,z)*WMAP_TILE];
}
function wmapProjection(){
 const left=wmapWorld(20.85,54.00);
 const right=wmapWorld(26.92,56.48);
 const x0=left[0], x1=right[0], y0=right[1], y1=left[1];
 const scale=Math.min(716/(x1-x0),390/(y1-y0));
 const dx=(760-(x1-x0)*scale)/2,dy=(444-(y1-y0)*scale)/2;
 const pixelsPerWorld=Math.pow(2,WMAP_ZOOM)*WMAP_TILE;
 // WMS EPSG:3857 shares this exact Mercator geometry with the radar tiles.
 const worldX=v=>(v/pixelsPerWorld-0.5)*40075016.68557849;
 const worldY=v=>(0.5-v/pixelsPerWorld)*40075016.68557849;
 const west=worldX(x0-dx/scale),east=worldX(x0+(760-dx)/scale);
 const north=worldY(y0-dy/scale),south=worldY(y0+(444-dy)/scale);
 return {
   bbox3857:[west,south,east,north],
   xy(lon,lat){
     const p=wmapWorld(lon,lat);
     return [dx+(p[0]-x0)*scale,dy+(p[1]-y0)*scale];
   },
   tileBounds:{
     xmin:Math.floor(x0/WMAP_TILE)-1,xmax:Math.floor(x1/WMAP_TILE)+1,
     ymin:Math.floor(y0/WMAP_TILE)-1,ymax:Math.floor(y1/WMAP_TILE)+1
   },
   tileRect(x,y){
     return [dx+(x*WMAP_TILE-x0)*scale,dy+(y*WMAP_TILE-y0)*scale,
             WMAP_TILE*scale,WMAP_TILE*scale];
   }
 };
}
function wmapDecode(topo){
 const {arcs,transform,objects}=topo;
 if(!Array.isArray(arcs)||!transform||!objects?.LT_apskritys){
   throw Error("Netinkami apskričių ribų duomenys");
 }
 const proj=wmapProjection();
 const decoded=arcs.map(arc=>{
   let x=0,y=0;
   return arc.map(([dx,dy])=>{
     x+=dx;y+=dy;
     return [x*transform.scale[0]+transform.translate[0],
       y*transform.scale[1]+transform.translate[1]];
   });
 });
 function ring(ids){
   const output=[];
   ids.forEach(id=>{
     const part=id<0 ? decoded[~id]?.slice().reverse():decoded[id];
     if(!part)throw Error("Neteisinga apskrities ribos atkarpa");
     output.push(...(output.length?part.slice(1):part));
   });
   return output;
 }
 function draw(poly){
   return poly.map(ids=>ring(ids).map((point,i)=>{
     const p=proj.xy(...point);
     return (i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1);
   }).join(" ")+"Z").join(" ");
 }
 return objects.LT_apskritys.geometries.map(g=>{
   const key=WMAP_KEY(g.properties?.APS_PAV);
   if(!WMAP_BY_KEY[key])throw Error("Nepažįstama apskritis");
   const polygons=g.type==="MultiPolygon"?g.arcs:[g.arcs];
   const [x,y]=proj.xy(WMAP_BY_KEY[key][3],WMAP_BY_KEY[key][4]);
   return {key,name:WMAP_BY_KEY[key][1],short:WMAP_BY_KEY[key][2],
     d:polygons.map(draw).join(" "),x,y};
 });
}
// Natural Earth country boundaries bundled as local, key-free polygons.
function wmapNeighborPaths(geometry, proj=wmapProjection()){
 if(!geometry||!Array.isArray(geometry.features))return [];
 return geometry.features.map(country=>{
   const polygons=country.polygons||[];
   const path=polygons.map(rings=>rings.map(ring=>
     ring.map((coord,i)=>{
       const [x,y]=proj.xy(coord[0],coord[1]);
       return (i?"L":"M")+x.toFixed(1)+","+y.toFixed(1);
     }).join(" ")+"Z"
   ).join(" ")).join(" ");
   return {name:country.name,d:path};
 }).filter(f=>f.d.startsWith("M"));
}
function wmapWindStyle(theme,visibility){
 const bright=theme==="dark"||theme==="gray";
 const palette=bright?"231,249,255":"22,75,128";
 const mode=["normal","strong","vivid"].includes(visibility)?visibility:"strong";
 return {
   ink:palette,
   width:mode==="vivid"?2.45:mode==="strong"?1.90:1.25,
   intensity:mode==="vivid"?1.60:mode==="strong"?1.32:1.0,
   shadow:bright?"12,35,55":"255,255,255",
   blur:mode==="normal"?0:mode==="strong"?2.5:4.0,
   density:mode==="vivid"?1.30:1.0
 };
}
function wmapPerformancePreset(mode,cores=8,memory=8) {
 const c=Number.isFinite(cores)?cores:8;
 const m=Number.isFinite(memory)?memory:8;
 if(mode==="eco"||(mode!=="smooth"&&(c<=4||m<=3)))return {fps:15,density:.52,blur:false};
 if(mode==="smooth")return {fps:30,density:1,blur:true};
 return {fps:24,density:.72,blur:false};
}
// Build wind vector samples and precompute a small grid once per sensor update.
// Each particle then reads only 4 cached grid cells per frame.
function wmapBuildWindGrid(samples,step=28){
 const projection=wmapProjection();
 const stations=WMAP_REGIONS.map(r=>{
   const sample=samples?.[r[0]];
   const speed=Number(sample?.wind_kmh),direction=Number(sample?.wind_from_deg);
   if(!sample||!Number.isFinite(speed)||speed<0||!Number.isFinite(direction))return null;
   const [x,y]=projection.xy(r[3],r[4]);
   const angle=(direction+180)*Math.PI/180;
   return {x,y,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed};
 }).filter(Boolean);
 const cols=Math.ceil(760/step)+1,rows=Math.ceil(444/step)+1,values=[];
 for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
   const x=gx*step,y=gy*step;
   let vx=0,vy=0,total=0;
   for(const p of stations){
     const dist2=(p.x-x)**2+(p.y-y)**2;
     const weight=1/Math.max(600,dist2);
     vx+=p.vx*weight;vy+=p.vy*weight;total+=weight;
   }
   values.push(total?[vx/total,vy/total]:[0,0]);
 }
 return {cols,rows,step,values};
}
function wmapSampleWindGrid(grid,x,y){
 if(!grid?.values?.length)return null;
 const gx=Math.min(grid.cols-1.000001,Math.max(0,x/grid.step));
 const gy=Math.min(grid.rows-1.000001,Math.max(0,y/grid.step));
 const ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,n=iy*grid.cols+ix;
 const a=grid.values[n],b=grid.values[n+1],c=grid.values[n+grid.cols],d=grid.values[n+grid.cols+1];
 if(!a||!b||!c||!d)return null;
 const vx=a[0]*(1-fx)*(1-fy)+b[0]*fx*(1-fy)+c[0]*(1-fx)*fy+d[0]*fx*fy;
 const vy=a[1]*(1-fx)*(1-fy)+b[1]*fx*(1-fy)+c[1]*(1-fx)*fy+d[1]*fx*fy;
 return {vx,vy,speed:Math.hypot(vx,vy)};
}
function wmapWindMotion(speed){
 const value=Number(speed);
 if(!Number.isFinite(value)||value<0.6) return {pixelsPerSecond:0,trailLength:0,alpha:0,lineWidth:0};
 return {
   pixelsPerSecond:Math.min(142,value*2.05),
   trailLength:Math.min(15,Math.max(3,Math.round(3+value/6))),
   alpha:Math.min(0.93,0.20+value/70),
   lineWidth:Math.min(2.8,1.1+value/55)
 };
}
function wmapState(alertsAvailable,alertRecord){
 if(!alertsAvailable)return "unavailable";
 if(!alertRecord)return "not_reported";
 return ["red","yellow","yellow_after_red","white"].includes(alertRecord.kodas)
   ?alertRecord.kodas:"unavailable";
}
// Inverse-distance interpolation of ten Open-Meteo county forecast vectors.
// This is an approximate *visual* flow field, not a Windy high-resolution model.
function wmapWindField(samples, x, y) {
 let sx=0,sy=0,total=0;
 const projection=wmapProjection();
 for(const r of WMAP_REGIONS) {
   const sample=samples[r[0]];
   const speed=Number(sample?.wind_kmh);
   const heading=Number(sample?.wind_from_deg);
   if(!Number.isFinite(speed)||speed<0||!Number.isFinite(heading))continue;
   const [cx,cy]=projection.xy(r[3],r[4]);
   const dist2=Math.pow(x-cx,2)+Math.pow(y-cy,2);
   const weight=1/Math.max(600,dist2);
   const theta=(heading+180)*Math.PI/180;
   sx+=Math.sin(theta)*speed*weight;
   sy+=-Math.cos(theta)*speed*weight;
   total+=weight;
 }
 if(!total)return null;
 return {vx:sx/total,vy:sy/total,speed:Math.hypot(sx/total,sy/total)};
}
function wmapLocationMarker(coords, projection=wmapProjection()) {
 if(!coords || !Number.isFinite(coords.latitude)||!Number.isFinite(coords.longitude))return null;
 const [x,y]=projection.xy(coords.longitude,coords.latitude);
 if(x<0||y<0||x>760||y>444)return null;
 return {x,y};
}
// EUMETView infrared band is day/night consistent. GeoColour alternates
// daytime true-colour and a nighttime IR + NASA basemap; keep it optional.
function wmapSatelliteUrl(proj=wmapProjection(),now=Date.now(),style="ir") {
 const layer=style==="geocolour"?"mtg_fd:rgb_geocolour":"mtg_fd:ir105_hrfi";
 const params=new URLSearchParams({
   SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetMap",
   LAYERS:layer,STYLES:"",
   CRS:"EPSG:3857",BBOX:proj.bbox3857.map(v=>v.toFixed(1)).join(","),
   WIDTH:"760",HEIGHT:"444",FORMAT:"image/png",TRANSPARENT:"true",
   _t:String(Math.floor(now/900000)) // Refresh the WMS image roughly every 15 min.
 });
 return "https://view.eumetsat.int/geoserver/wms?"+params.toString();
}
function wmapSatelliteOpacity(level) {
 return ({subtle:0.25,normal:0.38,strong:0.55})[level]??0.38;
}
// Forecast markers: based on Open-Meteo county sample points, not observed
// lightning strike positions and not radar-pixel precipitation types.
function wmapIsSnowForecast(forecast) {
 if(!forecast)return false;
 const cm=Number(forecast.snow_cm);
 const code=Number(forecast.weather_code);
 return (Number.isFinite(cm)&&cm>0) ||
   [71,73,75,77,85,86].includes(code);
}
function wmapIsThunderForecast(forecast) {
 if(!forecast || forecast.weather_code==null)return false;
 return [95,96,97,99].includes(Number(forecast.weather_code));
}
function wmapSnowCluster(shape) {
 const offsets=[
   [-34,-28],[-15,-34],[8,-30],[30,-24],
   [-40,-6],[-21,-6],[0,-9],[22,-3],[41,0],
   [-35,19],[-13,16],[10,21],[31,23]
 ];
 return '<g class="snow-cluster" aria-label="Prognozuojamas sniegas: '+WMAP_ESC(shape.name)+' apskritis">'+
   offsets.map(([dx,dy],i)=>
     '<text class="forecast-snowflake" x="'+(shape.x+dx).toFixed(1)+
     '" y="'+(shape.y+dy).toFixed(1)+'" font-size="'+(i%3===0?17:13)+
     '" text-anchor="middle">❄</text>'
   ).join("")+'</g>';
}
function wmapRadarTiles(meta,frame,proj=wmapProjection()){
 const host=String(meta?.host||"");
 const path=String(frame?.path||"");
 if(host!=="https://tilecache.rainviewer.com"||!/^\/v2\/radar\/(?:[0-9]{9,12}|[0-9a-f]{12})$/.test(path))return [];
 const {xmin,xmax,ymin,ymax}=proj.tileBounds;
 const results=[];
 for(let x=xmin;x<=xmax;x++)for(let y=ymin;y<=ymax;y++){
   if(x<0||y<0||x>=64||y>=64)continue;
   const [px,py,w,h]=proj.tileRect(x,y);
   results.push({url:host+path+"/256/6/"+x+"/"+y+"/2/1_1.png",x:px,y:py,w,h});
 }
 return results;
}

class LT72WeatherMapCard extends HTMLElement {
 constructor(){
   super();
   this.attachShadow({mode:"open"});
   this._config={type:"custom:lt72-weather-map"};
   this._hass=null;this._regions=null;this._neighbors=null;this._loading=false;this._error="";
   this._selected=null;this._mode=null;this._radarIndex=null;
   this._windRaf=null;this._windParticles=[];this._windLastTime=0;
   this._devicePosition=null;this._geolocationError="";
   this._locationOverride=null;
   this._geolocationWatchId=null;this._checkedGeoPermission=false;
   this._satelliteError=false;this._satelliteBucket=null;
   this._hassSignature=null;this._windInViewport=true;
   this._windObserver=null;this._windPageListener=null;
 }
 static getStubConfig(){return {type:"custom:lt72-weather-map"};}
 static getConfigElement(){return document.createElement("lt72-weather-map-editor");}
 setConfig(config){
   if(!config||config.type!=="custom:lt72-weather-map")throw Error("Netinkamas LT72 Weather Map kortos tipas");
   const before=this._config.region;
   const previousLayer=this._config.layer;
   const previousLocation=JSON.stringify([this._config.location_mode,this._config.location_city,this._config.show_location]);
   this._config={...config};
   const changedLocation=previousLocation!==JSON.stringify([config.location_mode,config.location_city,config.show_location]);
   if(changedLocation){
     this._locationOverride=null;
     this._stopLocationWatch();
     this._checkedGeoPermission=false;
     this._devicePosition=null;
     this._geolocationError="";
   }
   if(WMAP_BY_KEY[config.region])this._selected=config.region;
   else if(before!==config.region)this._selected=null;
   if(this._mode===null||previousLayer!==config.layer)this._mode=config.layer||"radar";
   if(!WMAP_MODES.some(m=>m[0]===this._mode))this._mode="radar";
   this._render();
   if(changedLocation&&this.isConnected===true)this._checkExistingLocationPermission();
 }
 set hass(value){
   this._hass=value;
   const entity=this._entity(),a=entity?.attributes||{};
   // Ignore unrelated HA entity updates and the refreshed_at timestamp.
   const signature=JSON.stringify([
     value?.config?.latitude,value?.config?.longitude,
     entity?.entity_id,entity?.state,a.apskritis,a.apskritys,
     a.alerts_available,a.weather_samples,a.weather_available,
     a.radar,a.radar_available,a.errors
   ]);
   if(signature===this._hassSignature)return;
   this._hassSignature=signature;
   this._render();
 }
 getCardSize(){return 7;}
 getGridOptions(){return {columns:12,min_rows:5,max_rows:12};}
 _show(option){return this._config[option]!==false;}
 connectedCallback(){
   if(typeof IntersectionObserver!=="undefined"&&!this._windObserver){
     this._windObserver=new IntersectionObserver(entries=>{
       const visible=!!entries[0]?.isIntersecting;
       if(this._windInViewport===visible)return;
       this._windInViewport=visible;
       if(visible)this._resumeWindAnimation();
       else this._stopWindAnimation();
     },{threshold:.01});
     this._windObserver.observe(this);
   }
   if(typeof document!=="undefined"&&document.addEventListener&&!this._windPageListener){
     this._windPageListener=()=>{
       if(document.hidden)this._stopWindAnimation();
       else this._resumeWindAnimation();
     };
     document.addEventListener("visibilitychange",this._windPageListener);
   }
   if(!this._regions&&!this._loading)this._loadGeometry();
   else this._render();
   this._checkExistingLocationPermission();
 }
 disconnectedCallback(){
   this._stopWindAnimation();
   this._windObserver?.disconnect();
   this._windObserver=null;
   if(this._windPageListener&&typeof document!=="undefined"&&document.removeEventListener){
     document.removeEventListener("visibilitychange",this._windPageListener);
     this._windPageListener=null;
   }
   this._stopLocationWatch();
   // Recheck after a card is detached and reattached to the dashboard.
   this._checkedGeoPermission=false;
 }
 _stopLocationWatch(){
   if(this._geolocationWatchId!==null&&typeof navigator!=="undefined"&&navigator.geolocation){
     navigator.geolocation.clearWatch(this._geolocationWatchId);
   }
   this._geolocationWatchId=null;
 }
 _locationChoice(){
   if(this._locationOverride)return this._locationOverride;
   const mode=this._config.location_mode;
   if(mode==="city")return "city:"+(this._config.location_city||"kauno");
   return mode==="browser"||mode==="home"?mode:"auto";
 }
 _homeCoordinates(){
   // HA-configured home coordinates, NOT the location inferred from a local IP.
   const conf=this._hass?.config;
   if(conf?.latitude==null||conf?.longitude==null)return null;
   const latitude=Number(conf.latitude),longitude=Number(conf.longitude);
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||
      latitude < -90||latitude > 90||longitude < -180||longitude > 180)return null;
   return {latitude,longitude};
 }
 _locationInfo(){
   const choice=this._locationChoice();
   if(choice.startsWith("city:")){
     const city=WMAP_LOCATION_CITIES.find(c=>c[0]===choice.slice(5));
     return city?{coords:{latitude:city[3],longitude:city[2]},label:city[1]+" (pasirinktas miestas)",source:"city"}:null;
   }
   if(choice==="browser"||(choice==="auto"&&
     (typeof window==="undefined"||window.isSecureContext!==false)&&this._devicePosition)){
     return this._devicePosition?
       {coords:this._devicePosition,label:"Šio įrenginio GPS vieta",source:"browser"}:null;
   }
   const home=choice==="home"||choice==="auto"?this._homeCoordinates():null;
   return home?{coords:home,label:"Home Assistant namų vieta (ne GPS)",source:"home"}:null;
 }
 _selectLocation(choice){
   this._stopLocationWatch();
   this._checkedGeoPermission=false;
   this._geolocationError="";
   this._locationOverride=choice;
   this._render();
   if(choice==="browser"||choice==="auto")this._checkExistingLocationPermission();
 }
 async _checkExistingLocationPermission(){
   if(this._checkedGeoPermission||this._config.show_location===false||
      !["auto","browser"].includes(this._locationChoice()))return;
   this._checkedGeoPermission=true;
   if(typeof navigator==="undefined"||!navigator.geolocation)return;
   if(typeof window!=="undefined"&&window.isSecureContext===false){
     if(this._locationChoice()==="browser"){
       this._geolocationError="Naršyklės GPS reikalingas HTTPS adresas.";
       this._render();
     }
     return;
   }
   // Automatically request the browser's location; browser consent is required.
   if(!navigator.permissions?.query){
     if(this.isConnected!==false)this._locate();
     return;
   }
   try{
     const permission=await navigator.permissions.query({name:"geolocation"});
     if(permission.state!=="denied"&&this.isConnected!==false)this._locate();
   }catch(_error){
     if(this.isConnected!==false)this._locate();
   }
 }
 _locate(){
   if(typeof navigator==="undefined"||!navigator.geolocation){
     this._geolocationError="Ši naršyklė nepalaiko vietos nustatymo.";
     this._render();return;
   }
   if(typeof window!=="undefined"&&window.isSecureContext===false){
     this._geolocationError="Vietai nustatyti būtinas HTTPS adresas.";
     this._render();return;
   }
   // Geolocation uses the browsing device, never Home Assistant/Proxmox IP.
   if(this._geolocationWatchId!==null)return;
   this._geolocationError="Nustatoma įrenginio vieta…";
   this._render();
   try{
     this._geolocationWatchId=navigator.geolocation.watchPosition(
       pos=>{
         const {latitude,longitude,accuracy}=pos.coords;
         if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return;
         if(this._config.show_location===false||
            !["auto","browser"].includes(this._locationChoice()))return;
         this._devicePosition={latitude,longitude,accuracy};
         this._geolocationError="";
         this._render();
       },
       err=>{
         this._geolocationError=err.code===1 ?
           "Vietos leidimas atmestas arba neprieinamas. Leiskite GPS naršyklėje." :
           (typeof window!=="undefined"&&window.isSecureContext===false ?
           "Vietai nustatyti būtinas HTTPS adresas." :
           "Nepavyko nustatyti įrenginio vietos. Patikrinkite GPS.");
         // Let the user retry once permissions or connectivity are fixed.
         if(this._geolocationWatchId!==null){
           navigator.geolocation.clearWatch(this._geolocationWatchId);
           this._geolocationWatchId=null;
         }
         this._render();
       },
       {enableHighAccuracy:true,maximumAge:30000,timeout:15000}
     );
   }catch(_err){
     this._geolocationWatchId=null;
     this._geolocationError="Nepavyko paleisti vietos nustatymo.";
     this._render();
   }
 }
 _stopWindAnimation(){
   if(this._windRaf!==null && typeof cancelAnimationFrame==="function"){
     cancelAnimationFrame(this._windRaf);
   }
   this._windRaf=null;
   this._windLastTime=0;
 }
 _resumeWindAnimation(){
   if(!this._windInViewport||this._windRaf!==null)return;
   if(typeof document!=="undefined"&&document.hidden)return;
   const mode=this._mode||"radar";
   if(!["wind","all"].includes(mode)||this._config.animated_wind===false)return;
   const attr=this._entity()?.attributes;
   if(attr?.weather_available)this._startWindAnimation(attr.weather_samples||{});
 }
 _startWindAnimation(samples){
   if(this._windRaf!==null||!this._windInViewport||
     (typeof document!=="undefined"&&document.hidden))return;
   const canvas=this.shadowRoot.querySelector?.(".wind-canvas");
   if(!canvas||typeof requestAnimationFrame!=="function")return;
   if(typeof matchMedia==="function" && matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   const context=canvas.getContext?.("2d");
   if(!context)return;
   const cores=typeof navigator!=="undefined"?navigator.hardwareConcurrency:8;
   const memory=typeof navigator!=="undefined"?navigator.deviceMemory:8;
   const preset=wmapPerformancePreset(this._config.performance_mode,cores,memory);
   const windGrid=wmapBuildWindGrid(samples);
   const appearance=wmapWindStyle(this._config.map_theme,this._config.wind_visibility);
   const counts={low:75,medium:140,high:220};
   const count=Math.max(24,Math.round((counts[this._config.wind_particles]||140)*appearance.density*preset.density));
   context.lineCap="round";
   context.shadowColor="rgba("+appearance.shadow+",0.52)";
   context.shadowBlur=preset.blur?appearance.blur:0;
   const seed=()=>({x:Math.random()*760,y:Math.random()*444,
     age:Math.random()*110,trail:[]});
   this._windParticles=Array.from({length:count},seed);
   const animate=(time)=>{
     // Keep a single animation loop per card; restart cleanly on HA updates.
     if(this.isConnected===false||!this._windInViewport||
       (typeof document!=="undefined"&&document.hidden)){this._windRaf=null;return;}
     if(this._windLastTime && time-this._windLastTime<1000/preset.fps){
       this._windRaf=requestAnimationFrame(animate);return;
     }
     const dt=this._windLastTime?Math.min(0.10,(time-this._windLastTime)/1000):1/preset.fps;
     this._windLastTime=time;
     context.clearRect(0,0,760,444);
     for(let i=0;i<this._windParticles.length;i++){
       let p=this._windParticles[i];
       const vector=wmapSampleWindGrid(windGrid,p.x,p.y);
       const motion=wmapWindMotion(vector?.speed);
       if(!vector||motion.pixelsPerSecond===0){p.age+=4;continue;}
       p.x+=vector.vx/vector.speed*motion.pixelsPerSecond*dt;
       p.y+=vector.vy/vector.speed*motion.pixelsPerSecond*dt;
       p.trail.push([p.x,p.y]);
       if(p.trail.length>motion.trailLength)p.trail.shift();
       p.age++;
       if(p.age>85||p.x<0||p.y<0||p.x>760||p.y>444){
         this._windParticles[i]=seed();
         continue;
       }
       for(let j=1;j<p.trail.length;j++){
         const alpha=Math.min(0.98,(0.28+j/p.trail.length*0.72)*motion.alpha*appearance.intensity);
         context.strokeStyle="rgba("+appearance.ink+","+alpha.toFixed(3)+")";
         context.lineWidth=Math.max(appearance.width,motion.lineWidth*appearance.width);
         context.beginPath();
         context.moveTo(p.trail[j-1][0],p.trail[j-1][1]);
         context.lineTo(p.trail[j][0],p.trail[j][1]);
         context.stroke();
       }
     }
     this._windRaf=requestAnimationFrame(animate);
   };
   this._windRaf=requestAnimationFrame(animate);
 }
 async _loadGeometry(){
   this._loading=true;this._render();
   try{
     const response=await fetch(WMAP_URL+"counties.json");
     if(!response.ok)throw Error("HTTP "+response.status);
     this._regions=wmapDecode(await response.json());
     this._error="";
     try{
       const neighborResponse=await fetch(WMAP_URL+"neighbors.json");
       if(!neighborResponse.ok)throw Error("HTTP "+neighborResponse.status);
       this._neighbors=wmapNeighborPaths(await neighborResponse.json());
     }catch(error){
       // Country basemap is optional; do not hide LT72 / weather on failure.
       this._neighbors=[];
       console.warn("LT72 Weather Map: neighboring country outlines unavailable",error);
     }
   }catch(exc){this._error="Nepavyko įkelti Lietuvos žemėlapio: "+exc.message;}
   finally{this._loading=false;this._render();}
 }
 _entity(){
   if(!this._hass)return null;
   if(this._config.entity)return this._hass.states[this._config.entity]||null;
   return Object.values(this._hass.states).find(s=>s.entity_id.startsWith("sensor.")
     && s.attributes?.saltinis==="LT72 Weather Map")||null;
 }
 _render(){
   const root=this.shadowRoot;
   if(!root)return;
   this._stopWindAnimation();
   const entity=this._entity(), data=entity?.attributes||{};
   const activeAlerts=!!data.alerts_available, weatherReady=!!data.weather_available;
   const radarReady=!!data.radar_available;
   const alerts=activeAlerts?data.apskritys||{}:{};
   const weather=weatherReady?data.weather_samples||{}:{};
   const radar=radarReady?data.radar||{}:{};
   const frames=Array.isArray(radar.frames)?radar.frames:[];
   if(this._radarIndex===null || this._radarIndex>=frames.length)this._radarIndex=Math.max(0,frames.length-1);
   if(!this._selected)this._selected=WMAP_KEY(data.apskritis)||this._config.region||"kauno";
   const region=WMAP_BY_KEY[this._selected]||WMAP_BY_KEY.kauno;
   const alert=alerts[region[0]], forecast=weather[region[0]];
   const alertCode=wmapState(activeAlerts,alert);
   const alertLevel=WMAP_LEVELS[alertCode];
   const mode=this._mode||"radar";
   const showSatellite=mode==="satellite"||mode==="all";
   const showRadar=(mode==="radar"||mode==="all")&&radarReady;
   const showWind=(mode==="wind"||mode==="all")&&weatherReady;
   const showSnow=(mode==="snow"||mode==="radar"||mode==="all")&&weatherReady;
   const showThunder=(mode==="snow"||mode==="radar"||mode==="all")&&weatherReady;
   const chosenFrame=frames[this._radarIndex]||null;
   const projection=wmapProjection();
   const theme=WMAP_THEME_COLORS[this._config.map_theme]||WMAP_THEME_COLORS.gray;
   const currentBucket=Math.floor(Date.now()/900000);
   if(this._satelliteBucket!==currentBucket){
     this._satelliteBucket=currentBucket;
     this._satelliteError=false;
   }
   const satelliteStyle=this._config.satellite_style==="geocolour"?"geocolour":"ir";
   const satelliteOpacity=wmapSatelliteOpacity(this._config.satellite_opacity);
   const satelliteImage=showSatellite&&!this._satelliteError?
     '<image class="satellite-layer" href="'+WMAP_ESC(wmapSatelliteUrl(projection,Date.now(),satelliteStyle))+
     '" x="0" y="0" width="760" height="444" preserveAspectRatio="none" opacity="'+satelliteOpacity+
     '" style="mix-blend-mode:'+(satelliteStyle==="ir"?"screen":"normal")+'"></image>' : "";
   let images="";
   if(showRadar&&chosenFrame){
     images=wmapRadarTiles(radar,chosenFrame,projection).map(t=>
       '<image href="'+WMAP_ESC(t.url)+'" x="'+t.x.toFixed(1)+'" y="'+t.y.toFixed(1)+
       '" width="'+t.w.toFixed(1)+'" height="'+t.h.toFixed(1)+
       '" preserveAspectRatio="none"></image>').join("");
   }
   const neighbors=this._config.show_neighbor_borders!==false&&this._neighbors?
     this._neighbors.map(c=>'<path class="neighbor" d="'+c.d+'"></path>').join("") : "";
   const neighborBase=this._neighbors?
     '<g class="neighbor-land">'+this._neighbors.map(c=>
       '<path d="'+c.d+'" fill="var(--wmap-land)" stroke="none"></path>').join("")+'</g>' : "";
   const cityMode=this._config.city_temperature_set==="all"?"all":"main";
   const visibleCityKeys=new Set(cityMode==="all"?
     [...WMAP_REGIONS.map(r=>r[0]),...WMAP_EXTRA_CITY_POINTS.map(r=>r[0])]
     :WMAP_MAIN_CITIES);
   const cityTempKeys=weatherReady&&this._show("show_city_temperatures")
     ?new Set([...visibleCityKeys].filter(key=>
       wmapTemperatureLabel(weather[key]?.temperature_c)!==null))
     :new Set();
   const countryLabels=this._config.show_neighbor_labels!==false&&this._neighbors?
     WMAP_COUNTRY_LABELS.map(([name,lon,lat])=>{
       const [x,y]=projection.xy(lon,lat);
       return '<text class="neighbor-label" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+
         '" text-anchor="middle">'+WMAP_ESC(name)+'</text>';
     }).join("") : "";
   const regionsHtml=this._regions?this._regions.map(s=>{
     const value=alerts[s.key], code=wmapState(activeAlerts,value);
     const color=WMAP_LEVELS[code]?.[1]||WMAP_LEVELS.unavailable[1];
     // Keep subdued country geography visible under the LT72 alert overlay.
     const isActive=["red","yellow","yellow_after_red"].includes(code);
     const alertShown=this._show("show_alerts");
     const opacity=alertShown?(isActive?0.68:code==="unavailable"?0.16:0.05):0;
     const select=s.key===region[0];
     const outline="var(--wmap-county)";
     const bgFill=alertShown?color:"#f4f6fa";
     const text=this._show("show_region_labels")&&!cityTempKeys.has(s.key)?
       '<text x="'+s.x.toFixed(1)+'" y="'+(s.y-13).toFixed(1)+
       '" text-anchor="middle" class="county-label">'+WMAP_ESC(s.short)+'</text>':"";
     return '<g role="button" tabindex="0" data-region="'+s.key+
       '" aria-label="'+WMAP_ESC(s.name+" apskritis: "+WMAP_LEVELS[code][0])+'">'+
       '<path d="'+s.d+'" fill="'+bgFill+'" fill-opacity="'+opacity+
       '" stroke="'+outline+'" stroke-opacity="'+(select?0.85:0.53)+
       '" stroke-width="'+(select?1.65:0.85)+
       '" stroke-dasharray="'+(code==="not_reported"&&!select?"4 3":"none")+
       '" stroke-linejoin="round"></path>'+text+'</g>';
   }).join(""):"";
   const weatherHtml=this._regions?this._regions.map(s=>{
     const w=weather[s.key];
     if(!w)return "";
     let shapes="";
     if(showWind){
       if(this._config.animated_wind===false){
         const angle=(Number(w.wind_from_deg)+180)%360;
         shapes='<g transform="translate('+s.x.toFixed(1)+' '+s.y.toFixed(1)+')">'+
           '<g transform="rotate('+angle+')">'+
           '<path d="M0 13V-14 M-6 -5L0 -14L6 -5" fill="none" stroke="#1d4ed8" stroke-width="3.5" stroke-linecap="round"></path>'+
           '</g></g>';
       }
       if(this._show("show_weather_labels")){
         const windText=w.wind_kmh+" km/h"+(w.wind_window==="15m"?" (15 min)":"");
         shapes+='<text class="weather-label" x="'+s.x.toFixed(1)+
           '" y="'+(s.y+26).toFixed(1)+'" text-anchor="middle">'+
           WMAP_ESC(windText)+'</text>';
       }
     }
     if(mode==="snow" && this._show("show_weather_labels") && wmapIsSnowForecast(w)){
       shapes+='<text x="'+s.x.toFixed(1)+'" y="'+(s.y+45).toFixed(1)+
         '" class="weather-label" text-anchor="middle">'+
         WMAP_ESC(w.snow_cm+" cm prognozė")+'</text>';
     }
     return shapes;
   }).join(""):"";
   const forecastSymbols=this._regions&&weatherReady ? this._regions.map(s=>{
     const w=weather[s.key];
     if(!w)return "";
     const snow=showSnow&&this._show("show_snowflakes")&&wmapIsSnowForecast(w);
     const thunder=showThunder&&this._show("show_thunderstorms")&&wmapIsThunderForecast(w);
     if(!snow&&!thunder)return "";
     const clipId="wmap-clip-"+s.key;
     const defs='<defs><clipPath id="'+clipId+'"><path d="'+s.d+'"></path></clipPath></defs>';
     const flakes=snow?'<g clip-path="url(#'+clipId+')">'+wmapSnowCluster(s)+'</g>':"";
     const bolt=thunder?'<g class="thunder-forecast" transform="translate('+
       s.x.toFixed(1)+','+(s.y-8).toFixed(1)+')">'+
       '<circle r="15" fill="rgba(26,32,44,.68)" stroke="#facc15" stroke-width="1.5"></circle>'+
       '<path d="M2-11 -7 2 H-1 L-5 12 9-3 H3 L7-11 Z" fill="#facc15" stroke="#fff1a8" stroke-width=".7"></path>'+
       '<title>⚡ Prognozuojama perkūnija – ne užfiksuotas žaibo smūgis</title></g>':"";
     return defs+flakes+bolt;
   }).join("") : "";
   const allCityPositions=[
     ...(this._regions||[]),
     ...WMAP_EXTRA_CITY_POINTS.map(([key,short,lon,lat])=>{
       const [x,y]=projection.xy(lon,lat);
       return {key,short,x,y};
     })
   ];
   const cityTemperatures=this._regions&&cityTempKeys.size?
     allCityPositions.filter(r=>cityTempKeys.has(r.key)).map(r=>{
       const c=wmapTemperatureLabel(weather[r.key]?.temperature_c);
       const tempValue=weather[r.key]?.temperature_c;
       const tempColor=tempValue<=0?"cold":tempValue>=25?"hot":"neutral";
       return '<g class="city-temperature '+tempColor+'" aria-label="'+
         WMAP_ESC(r.short+' '+c)+'">'+
         '<text class="city-label" x="'+r.x.toFixed(1)+'" y="'+(r.y-9).toFixed(1)+
         '" text-anchor="middle">'+WMAP_ESC(r.short)+'</text>'+
         '<text class="city-value" x="'+r.x.toFixed(1)+'" y="'+(r.y+7).toFixed(1)+
         '" text-anchor="middle">'+WMAP_ESC(c)+'</text></g>';
     }).join("") : "";
   const locationChoice=this._locationChoice();
   const locationInfo=this._config.show_location===false?null:this._locationInfo();
   const locationPoint=locationInfo?wmapLocationMarker(locationInfo.coords,projection):null;
   const locationOutside=!!locationInfo&&!locationPoint;
   const locationColor=locationInfo?.source==="home"?"#059669":
     locationInfo?.source==="city"?"#ea580c":"#2563eb";
   const deviceMarker=locationPoint?
     '<g class="device-location" role="img" aria-label="'+WMAP_ESC(locationInfo.label)+'">'+
       '<circle cx="'+locationPoint.x.toFixed(1)+'" cy="'+locationPoint.y.toFixed(1)+
       '" r="15" fill="'+locationColor+'" fill-opacity=".15" stroke="'+locationColor+
       '" stroke-width="1.5"'+(locationInfo.source==="browser"?' class="gps-pulse"':"")+'></circle>'+
       '<circle cx="'+locationPoint.x.toFixed(1)+'" cy="'+locationPoint.y.toFixed(1)+
       '" r="6" fill="'+locationColor+'" stroke="#fff" stroke-width="2.5"></circle>'+
       '<title>'+WMAP_ESC(locationInfo.label)+'</title></g>':"";
   const locationPicker=this._config.show_location===false?"":'<label class="location-picker" title="Vietos pasirinkimas">'+
     '📍 <select data-location-choice aria-label="Vieta žemėlapyje">'+
     WMAP_LOCATION_MODES.filter(m=>m[0]!=="city").map(m=>
       '<option value="'+m[0]+'"'+(locationChoice===m[0]?' selected':'')+'>'+WMAP_ESC(m[1])+'</option>').join("")+
     WMAP_LOCATION_CITIES.map(c=>
       '<option value="city:'+c[0]+'"'+(locationChoice==="city:"+c[0]?' selected':'')+'>'+WMAP_ESC(c[1])+'</option>').join("")+
     '</select></label>';
   const locationButton=this._config.show_location===false||
     !["auto","browser"].includes(locationChoice)||
     (typeof window!=="undefined"&&window.isSecureContext===false)?"":'<button type="button" class="locate-button" data-locate="true"'+
     ' title="Pakartoti naršyklės GPS nustatymą">⌖ GPS</button>';
   const locationNote=this._config.show_location===false?"":(
     locationChoice==="auto"&&locationInfo?.source==="home"?
       "Rodoma HA namų vieta (ne įrenginio GPS)."+(
         typeof window!=="undefined"&&window.isSecureContext===false?" GPS reikalingas HTTPS.":""):
     locationOutside?"Pasirinkta vieta už rodomo žemėlapio ribų.":
     this._geolocationError||
     (!locationInfo&&["auto","home"].includes(locationChoice)?
       "HA namų koordinatės nenustatytos – pasirinkite miestą.":"")
   );
   const animateWind=showWind&&this._config.animated_wind!==false;
   const buttons=WMAP_MODES.map(m=>
     '<button class="mode '+(mode===m[0]?'active':'')+'" data-mode="'+m[0]+
     '" type="button">'+WMAP_ESC(m[1])+'</button>').join("");
   const weatherInfo=weatherReady&&forecast?
     '<div class="weather-details">'+
       '<span>💨 '+WMAP_ESC(forecast.wind_kmh)+' km/h'+
         (forecast.wind_window==="15m"?' (15 min. modelio vid.)':' (modelis dabar)')+'</span>'+
       '<span>Gūsiai '+WMAP_ESC(forecast.gust_kmh)+' km/h</span>'+
       '<span>❄ '+WMAP_ESC(forecast.snow_cm)+' cm</span>'+
       '<span>🌧 '+WMAP_ESC(forecast.precip_mm)+' mm</span>'+
       (wmapIsSnowForecast(forecast)?'<span>❄ Prognozuojamas snygis</span>':"")+
       (wmapIsThunderForecast(forecast)?'<span>⚡ Prognozuojama perkūnija (ne žaibo smūgiai)</span>':"")+
     '</div>':"<div class=\"note\">Orų prognozės neprieinamos.</div>";
   const msg=!activeAlerts?"LT72 duomenys neprieinami":
     !alert?"LT72 įrašo nėra – tai ne oficialus atšaukimas":
     (alert.paskelbta?"Pranešta: "+alert.paskelbta:"Paskelbimo laikas nenurodytas");
   const details=this._show("show_details")?
     '<div class="detail"><div class="county-head">'+
       '<span class="dot" style="background:'+alertLevel[1]+'"></span>'+
       '<strong>'+WMAP_ESC(region[1])+' apskritis</strong>'+
       '<span class="status">'+WMAP_ESC(alertLevel[0])+'</span></div>'+
       '<div class="note">'+WMAP_ESC(msg)+'</div>'+weatherInfo+'</div>':"";
   const precipitationGuide=this._show("show_precip_legend")&&(mode==="radar"||mode==="all")?
     '<div class="precip-guide"><strong>🌧️ Radaro krituliai:</strong>'+
       '<span class="rain-gradient"></span><span>Silpnesni → stipresni</span>'+
       '<span class="snow-chip">❄️</span><span>Žydra / balzgana – galimas sniegas</span>'+
       '<small>RainViewer paletė „Universal Blue“ (2). Lietus daugiausia mėlynas, stiprūs krituliai gali būti kitų atspalvių. ❄ žymekliai – Open-Meteo sniego prognozė pagal apskritis; ne radaro snaigių koordinatės. ⚡ – prognozuojama perkūnija, ne užfiksuoti smūgiai.</small>'+
     '</div>' : "";
   const satelliteGuide=showSatellite&&this._show("show_satellite_info")?
     '<div class="sat-guide">☁️ '+(satelliteStyle==="ir"?
       'Palydoviniai debesys – IR 10,5 µm, vienodas sluoksnis dieną ir naktį.':
       'GeoColour: dienos natūralios spalvos / nakties IR kompozitas. Sutemų riba gali būti ryški.')+
       ' Tai nėra lietaus ar sniego radaras.'+
       (this._satelliteError?' ⚠ EUMETSAT vaizdas nepasiekiamas.':'')+'</div>' : "";
   const legend=this._show("show_legend")?
     '<div class="legend">'+Object.entries(WMAP_LEVELS).filter(e=>e[0]!=="not_reported")
       .map(([,level])=>'<span><i style="background:'+level[1]+'"></i>'+
           WMAP_ESC(level[0])+'</span>').join("")+'</div>':"";
   const frameTime=chosenFrame?new Date(chosenFrame.time*1000).toLocaleString(
     this._hass?.locale?.language||"lt-LT",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"}
   ):"Nėra duomenų";
   const timeline=this._show("show_timeline")&&(mode==="radar"||mode==="all")?
     '<div class="timeline"><button type="button" data-frame="-1" '+(!radarReady||this._radarIndex===0?'disabled':'')+
     '>‹</button><span>Radaras: '+WMAP_ESC(frameTime)+' • praeities stebėjimas</span>'+
     '<button type="button" data-frame="1" '+(!radarReady||this._radarIndex>=frames.length-1?'disabled':'')+
     '>›</button></div>':"";
   const statusText=!entity?"Pridėkite LT72 Weather Map integraciją":
     (!activeAlerts?"⚠ LT72 nepasiekiamas":"LT72")+
     " · "+(weatherReady?"Orų prognozė":"⚠ prognozė neprieinama")+
     " · "+(radarReady?"Radaras":"⚠ radaras neprieinamas");
   const header=this._show("show_header")?
     '<div class="header">'+(this._show("show_icon")?
     '<img src="'+WMAP_URL+'icon.svg" alt="" width="38" height="38">':"")+
     '<div class="heads"><b>'+WMAP_ESC(this._config.title||"Oro pavojus ir orų radaras")+
     '</b>'+(this._show("show_subtitle")?'<small>'+WMAP_ESC(statusText)+'</small>':"")+
     '</div></div>':"";
   const toolbar=this._show("show_toolbar")?'<div class="toolbar">'+buttons+'</div>':"";
   const attribution='<div class="credits">Made with <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>'+
     ' · <a href="https://lt72.lt/" target="_blank" rel="noopener noreferrer">LT72</a>'+
     ' · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>'+
     ((mode==="radar"||mode==="all")?
       ' · Weather data by <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>':'')+
     (showSatellite?' · Palydovas © <a href="https://www.eumetsat.int/" target="_blank" rel="noopener noreferrer">EUMETSAT</a>'+
       (satelliteStyle==="geocolour"?'/NASA':""):'')+
     '</div>';
   const sourcesMarkup=this._show("show_sources")?attribution:
     '<details class="source-details"><summary title="Duomenų šaltiniai">ⓘ Šaltiniai</summary>'+
       attribution+'</details>';
   const explanatory=this._show("show_disclaimer")?
     '<div class="fineprint">Balta be pranešimo ≠ oficialus atšaukimas. '+
     'Pilka = nepasiekiama. Radaras rodo stebėtus kritulius, o palydovas – debesų dangą; vėjas, snaigės ir ⚡ perkūnijos žymekliai – modelio prognozė, NE tikri žaibo smūgiai. '+
     'Pavojaus metu vadovaukitės oficialiais LT-Alert pranešimais.</div>':"";
   const mapMissing=(mode==="radar"&&!radarReady)||
     ((mode==="wind"||mode==="snow")&&!weatherReady);
   root.innerHTML=[
     '<style>',
     ':host{display:block;color:var(--primary-text-color);font-family:var(--primary-font-family,Roboto,Arial,sans-serif)}',
     'ha-card{display:block;overflow:hidden;padding:14px}',
     '.header{display:flex;align-items:center;gap:10px;margin-bottom:10px}',
     '.heads{display:grid;gap:2px;min-width:0}.heads b{font-size:16px}.heads small{font-size:11px;color:var(--secondary-text-color)}',
     '.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}',
     '.mode{border:1px solid var(--divider-color,#9ca3af);color:var(--primary-text-color);background:var(--secondary-background-color,#f3f4f6);font:inherit;font-size:12px;padding:7px 9px;border-radius:8px;cursor:pointer}',
     '.mode.active{border-color:var(--primary-color,#2196f3);box-shadow:inset 0 0 0 1px var(--primary-color,#2196f3);font-weight:700}',
     '.map{position:relative;background:var(--wmap-sea,#7b858c);border-radius:10px;overflow:hidden;isolation:isolate}',
     '.satellite-layer{pointer-events:none}',
     '.neighbor{fill:none;stroke:var(--wmap-border);stroke-width:1.35;stroke-opacity:.48;pointer-events:none}',
     '.neighbor-label{font:500 13px Roboto,Arial,sans-serif;fill:var(--wmap-names);stroke:var(--wmap-land);stroke-width:2px;paint-order:stroke;pointer-events:none}',
     '.neighbor-land{pointer-events:none}', 
     '.wind-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}',
     '.locate-button{position:absolute;z-index:4;bottom:9px;right:9px;font:inherit;font-size:11px;padding:7px 9px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color,#fff);color:var(--primary-text-color);cursor:pointer;box-shadow:0 1px 4px #0003}',
     '.gps-pulse{transform-box:fill-box;transform-origin:center;animation:gpsPulse 2s ease-in-out infinite}',
     '@keyframes gpsPulse{0%,100%{opacity:.45;transform:scale(.85)}50%{opacity:.85;transform:scale(1.25)}}',
     '.map svg{width:100%;height:auto;display:block;max-height:470px}',
     '.county-label{font:600 13px Roboto,Arial,sans-serif;fill:var(--wmap-label);paint-order:stroke;stroke:var(--wmap-land);stroke-width:3px;stroke-linejoin:round;pointer-events:none}',
     '.city-temperature{pointer-events:none;filter:drop-shadow(0 1px 1px #0005)}',
     '.city-label{font:600 13px Roboto,Arial,sans-serif;fill:#fff;stroke:#1b2939;stroke-width:2.5px;paint-order:stroke;stroke-linejoin:round}',
     '.city-value{font:700 17px Roboto,Arial,sans-serif;fill:#f7fafc;stroke:#172536;stroke-width:2.6px;paint-order:stroke;stroke-linejoin:round}',
     '.city-temperature.cold .city-value{fill:#ccecff}.city-temperature.hot .city-value{fill:#ffddae}',
     '.weather-label{font:bold 12px Roboto,Arial,sans-serif;fill:#134e86;paint-order:stroke;stroke:#fff;stroke-width:3.5px;pointer-events:none}',
     '.snow-label{font:29px Arial,sans-serif;fill:#0ea5e9;paint-order:stroke;stroke:#fff;stroke-width:3px;pointer-events:none}',
     '.forecast-snowflake{font-family:Arial,sans-serif;fill:#e2f7ff;stroke:#2b86b8;stroke-width:.6px;paint-order:stroke;pointer-events:none;filter:drop-shadow(0 1px 1px #0f416688)}',
     '.snow-cluster,.thunder-forecast{pointer-events:none}',
     '[data-region]{cursor:pointer;outline:none}[data-region]:focus-visible path,[data-region]:hover path{stroke:#2563eb;stroke-width:3}',
     '.missing{padding:30px 10px;color:var(--secondary-text-color);text-align:center}',
     '.geo-note{font-size:11px;color:var(--secondary-text-color);margin-top:5px;line-height:1.4}',
     '.overlay-alert{position:absolute;left:8px;top:8px;padding:5px 7px;border-radius:7px;background:var(--card-background-color,#fff);font-size:11px;box-shadow:0 1px 3px #0002}',
     '.timeline{display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;margin-top:8px;color:var(--secondary-text-color)}',
     '.timeline button{border:1px solid var(--divider-color);color:var(--primary-text-color);border-radius:7px;background:transparent;font-size:19px;cursor:pointer;padding:0 10px}.timeline button:disabled{opacity:.3;cursor:default}',
     '.detail{margin-top:10px;padding:10px 12px;border:1px solid var(--divider-color);border-radius:10px}',
     '.county-head{display:flex;align-items:center;gap:8px;font-size:13px;flex-wrap:wrap}.status{margin-left:auto}',
     '.dot{height:11px;width:11px;border-radius:50%;border:1px solid #64748b}.note{font-size:11px;color:var(--secondary-text-color);margin-top:5px}',
     '.weather-details{display:flex;gap:7px 14px;flex-wrap:wrap;font-size:12px;margin-top:8px}',
     '.legend{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;margin-top:10px}',
     '.legend span{font-size:10px;color:var(--secondary-text-color);display:flex;align-items:center;gap:4px}',
     '.legend i{display:inline-block;width:9px;height:9px;border:1px solid #94a3b8;border-radius:3px}',
     '.fineprint{font-size:10px;color:var(--secondary-text-color);line-height:1.4;margin-top:10px}',
     '.precip-guide{display:flex;gap:6px 9px;flex-wrap:wrap;align-items:center;margin-top:9px;font-size:11px;color:var(--secondary-text-color)}',
     '.precip-guide strong{color:var(--primary-text-color)}',
     '.precip-guide small{flex-basis:100%;line-height:1.35;font-size:10px}',
     '.rain-gradient{display:inline-block;width:78px;height:9px;border-radius:4px;border:1px solid #94a3b8;background:linear-gradient(90deg,#9fdfee,#00a3e0,#005588,#ffee00,#ff4400)}',
     '.snow-chip{color:#0aa4cc;font-size:16px}',
     '.sat-guide{margin-top:8px;font-size:11px;color:var(--secondary-text-color);line-height:1.35}',
     '.credits{display:flex;justify-content:flex-end;font-size:10px;gap:4px;color:var(--secondary-text-color);margin-top:8px;flex-wrap:wrap}.credits a{color:var(--secondary-text-color);text-decoration:underline}',
     '.source-details{font-size:10px;text-align:right;color:var(--secondary-text-color);margin-top:4px}.source-details summary{cursor:pointer;display:inline-block;padding:2px 4px}.source-details .credits{margin-top:1px}',
     '.compact{padding:8px}.compact .header{margin-bottom:5px}.compact .mode{font-size:11px;padding:5px}.compact .toolbar{margin-bottom:6px}',
     '@media(max-width:480px){.county-label{font-size:16px}.weather-label{font-size:16px}ha-card{padding:10px}.toolbar{gap:4px}.mode{padding:6px;font-size:11px}}',
     '</style>',
     '<ha-card'+(this._config.compact?' class="compact"':'')+
       ' style="--wmap-sea:'+theme.sea+';--wmap-land:'+theme.land+
       ';--wmap-border:'+theme.outline+';--wmap-names:'+theme.names+
       ';--wmap-county:'+theme.county+';--wmap-label:'+theme.label+'">',header,toolbar,
     '<div class="map">',
     this._error?'<div class="missing">'+WMAP_ESC(this._error)+'</div>':
     !this._regions?'<div class="missing">Įkeliamas Lietuvos žemėlapis...</div>':
       '<svg viewBox="0 0 760 444" aria-label="LT72 pavojaus ir orų žemėlapis" role="img">'+
         '<rect x="0" y="0" width="760" height="444" fill="var(--wmap-sea)"></rect>'+
         neighborBase+satelliteImage+images+
         '<g class="neighbor-outlines">'+neighbors+'</g>'+
         countryLabels+regionsHtml+weatherHtml+forecastSymbols+cityTemperatures+deviceMarker+'</svg>'+
         (animateWind?'<canvas class="wind-canvas" width="760" height="444" aria-hidden="true"></canvas>':""),
     locationButton,
     (mapMissing?'<div class="overlay-alert">⚠ '+WMAP_ESC(mode==="radar"?
       "Radaro duomenys nepasiekiami":"Orų prognozės nepasiekiamos")+'</div>':""),
     '</div>',
     (locationNote?'<div class="geo-note">'+WMAP_ESC(locationNote)+'</div>':""),
     timeline,precipitationGuide,satelliteGuide,details,legend,explanatory,sourcesMarkup,
     '</ha-card>'
   ].join("");
   root.querySelectorAll(".satellite-layer").forEach(node=>{
     node.addEventListener("error",()=>{
       if(!this._satelliteError){
         this._satelliteError=true;
         this._render();
       }
     });
   });
   root.querySelectorAll("[data-locate]").forEach(node=>{
     node.addEventListener("click",()=>this._locate());
   });
   if(animateWind&&this._regions)this._startWindAnimation(weather);
   root.querySelectorAll("[data-mode]").forEach(node=>{
     node.addEventListener("click",()=>{
       this._mode=node.getAttribute("data-mode");
       this._radarIndex=null;this._render();
     });
   });
   root.querySelectorAll("[data-region]").forEach(node=>{
     const select=()=>{this._selected=node.getAttribute("data-region");this._render();};
     node.addEventListener("click",select);
     node.addEventListener("keydown",e=>{
       if(e.key==="Enter"||e.key===" "){e.preventDefault();select();}
     });
   });
   root.querySelectorAll("[data-frame]").forEach(node=>{
     node.addEventListener("click",()=>{
       this._radarIndex=Math.max(0,Math.min(frames.length-1,this._radarIndex+Number(node.getAttribute("data-frame"))));
       this._render();
     });
   });
 }
}

class LT72WeatherMapEditor extends HTMLElement {
 constructor(){
   super();this.attachShadow({mode:"open"});
   this._config={type:"custom:lt72-weather-map"};this._hass=null;
 }
 setConfig(config){this._config={...config};this._render();}
 set hass(value){this._hass=value;this._render();}
 _change(key,value){
   const next={...this._config};
   if(key==="compact"){if(value)next.compact=true;else delete next.compact;}
   else if(key.startsWith("show_")||key==="animated_wind"){if(value)delete next[key];else next[key]=false;}
   else{if(value)next[key]=value;else delete next[key];}
   this._config=next;
   this.dispatchEvent(new CustomEvent("config-changed",{bubbles:true,composed:true,detail:{config:next}}));
 }
 _render(){
   const root=this.shadowRoot;if(!root)return;
   const current=this._config;
   const entities=this._hass?Object.values(this._hass.states).filter(s=>
     s.entity_id.startsWith("sensor.")&&s.attributes?.saltinis==="LT72 Weather Map"):[];
   const flags=WMAP_FLAGS.map(([id,label])=>
     '<label><input type="checkbox" data-setting="'+id+'"'+
     (current[id]!==false?' checked':'')+'>'+WMAP_ESC(label)+'</label>').join("");
   root.innerHTML=[
     '<style>',
     ':host{font-family:var(--primary-font-family);color:var(--primary-text-color);display:block;font-size:13px}',
     '.field{display:grid;gap:5px;margin:11px 0}.field span{color:var(--secondary-text-color);font-size:12px}',
     'select,input[type=text]{width:100%;box-sizing:border-box;padding:9px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}',
     '.flags{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:7px}',
     '.flags label,.compact{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--divider-color);border-radius:7px;cursor:pointer}',
     'input[type=checkbox]{width:17px;height:17px;margin:0;accent-color:var(--primary-color)}',
     'h4{font-size:13px;margin:18px 0 9px}p{color:var(--secondary-text-color);font-size:11px;line-height:1.4}',
     '</style>',
     '<h4>Žemėlapis</h4>',
     '<label class="field"><span>Kortos pavadinimas</span><input type="text" data-setting-text="title" value="'+WMAP_ESC(current.title||"")+'" placeholder="Oro pavojus ir orų radaras"></label>',
     '<label class="field"><span>LT72 Weather Map jutiklis</span><select data-select="entity">',
     '<option value="">Automatiškai</option>',
     ...entities.map(s=>'<option value="'+WMAP_ESC(s.entity_id)+'"'+(current.entity===s.entity_id?' selected':'')+'>'+WMAP_ESC(s.attributes.friendly_name||s.entity_id)+'</option>'),
     '</select></label>',
     '<label class="field"><span>Pradinė apskritis</span><select data-select="region">',
     '<option value="">Pagal integracijos nustatymus</option>',
     ...WMAP_REGIONS.map(r=>'<option value="'+r[0]+'"'+(current.region===r[0]?' selected':'')+'>'+WMAP_ESC(r[1])+' apskritis</option>'),
     '</select></label>',
     '<label class="field"><span>Miestai su temperatūromis</span><select data-select="city_temperature_set">',
     ...WMAP_CITY_SETS.map(([id,name])=>
       '<option value="'+id+'"'+((current.city_temperature_set||"main")===id?' selected':'')+'>'+
       WMAP_ESC(name)+'</option>'),
     '</select></label>',
     '<label class="field"><span>Pradinis sluoksnis</span><select data-select="layer">',
     ...WMAP_MODES.map(m=>'<option value="'+m[0]+'"'+((current.layer||"radar")===m[0]?' selected':'')+'>'+WMAP_ESC(m[1])+'</option>'),
     '</select></label>',
     '<label class="field"><span>Žemėlapio tema</span><select data-select="map_theme">',
     ...WMAP_MAP_THEMES.map(([id,name])=>
       '<option value="'+id+'"'+((current.map_theme||"gray")===id?' selected':'')+'>'+
       WMAP_ESC(name)+'</option>'),
     '</select></label>',
     '<h4>Palydoviniai debesys</h4>',
     '<label class="field"><span>Palydovo vaizdo tipas</span><select data-select="satellite_style">',
     ...WMAP_SATELLITE_STYLES.map(([id,name])=>
       '<option value="'+id+'"'+((current.satellite_style||"ir")===id?' selected':'')+'>'+
       WMAP_ESC(name)+'</option>'),
     '</select></label>',
     '<label class="field"><span>Debesų sluoksnio ryškumas</span><select data-select="satellite_opacity">',
     ...WMAP_SATELLITE_OPACITIES.map(([id,name])=>
       '<option value="'+id+'"'+((current.satellite_opacity||"normal")===id?' selected':'')+'>'+
       WMAP_ESC(name)+'</option>'),
     '</select></label>',
     '<p>IR sluoksnis neperjungia šviesaus ir tamsaus fono sutemus. „GeoColour“ gali turėti ryškią dienos / nakties ribą.</p>',
     '<h4>Rodyti / slėpti</h4><div class="flags">'+flags+'</div>',
     '<h4>Vėjo animacija</h4>',
     '<label class="field"><span>Našumo režimas</span><select data-select="performance_mode">',
     ...WMAP_PERFORMANCE_MODES.map(([id,label])=>
       '<option value="'+id+'"'+((current.performance_mode||"auto")===id?' selected':'')+'>'+
       WMAP_ESC(label)+'</option>'),
     '</select></label>',
     '<label class="field"><span>Judančių vėjo dalelių kiekis</span><select data-select="wind_particles">',
     ...[["low","Mažai"],["medium","Vidutiniškai"],["high","Daug"]].map(([v,label])=>
       '<option value="'+v+'"'+((current.wind_particles||"medium")===v?' selected':'')+'>'+label+'</option>'),
     '</select></label>',
     '<label class="field"><span>Vėjo matomumas</span><select data-select="wind_visibility">',
     ...WMAP_WIND_VISIBILITY.map(([v,label])=>
       '<option value="'+v+'"'+((current.wind_visibility||"strong")===v?' selected':'')+'>'+label+'</option>'),
     '</select></label>',
     '<h4>Išdėstymas</h4><label class="compact"><input type="checkbox" data-setting="compact"'+
       (current.compact?' checked':'')+'>Kompaktiška korta</label>',
     '<p>LT72 pavojaus perspėjimų neatstoja. Radarą teikia RainViewer, prognozes – Open-Meteo. Šaltinių priskyrimas rodomas visada.</p>'
   ].join("");
   root.querySelectorAll("[data-setting-text]").forEach(el=>
     el.addEventListener("change",()=>this._change(el.getAttribute("data-setting-text"),el.value)));
   root.querySelectorAll("[data-select]").forEach(el=>
     el.addEventListener("change",()=>this._change(el.getAttribute("data-select"),el.value)));
   root.querySelectorAll("[data-setting]").forEach(el=>
     el.addEventListener("change",()=>this._change(el.getAttribute("data-setting"),el.checked)));
 }
}

if(!customElements.get("lt72-weather-map")){
 customElements.define("lt72-weather-map",LT72WeatherMapCard);
}
if(!customElements.get("lt72-weather-map-editor")){
 customElements.define("lt72-weather-map-editor",LT72WeatherMapEditor);
}
window.customCards=window.customCards||[];
if(!window.customCards.some(x=>x.type==="lt72-weather-map")){
 window.customCards.push({
   type:"lt72-weather-map",name:"LT72 Weather Map",
   description:"Lietuvos oro pavojus, lietaus radaras, vėjas ir sniegas viename žemėlapyje",
   preview:true
 });
}
