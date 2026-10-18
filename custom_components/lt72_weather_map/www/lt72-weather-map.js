/* LT72 Weather Map for Home Assistant - one SVG coordinate system.
 * Map geometry: govlt/powerbi-map-lt.
 * Weather: RainViewer radar observations, Open-Meteo model predictions.
 */
const WMAP_REGIONS = [
  ["alytaus","Alytaus","Alytus",24.05,54.42],
  ["kauno","Kauno","Kaunas",23.90,54.93],
  ["klaipedos","Klaipėdos","Klaipėda",21.60,55.74],
  ["marijampoles","Marijampolės","Marijampolė",23.50,54.55],
  ["panevezio","Panevėžio","Panevėžys",24.36,55.75],
  ["siauliu","Šiaulių","Šiauliai",23.31,55.97],
  ["taurages","Tauragės","Tauragė",22.28,55.30],
  ["telsiu","Telšių","Telšiai",22.25,56.02],
  ["utenos","Utenos","Utena",25.60,55.49],
  ["vilniaus","Vilniaus","Vilnius",25.30,54.80]
];
const WMAP_BY_KEY=Object.fromEntries(WMAP_REGIONS.map(r=>[r[0],r]));
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
 ["snow","❄️ Sniegas"],["all","🌦️ Visi"],["none","🗺️ Tik pavojus"]
];
const WMAP_FLAGS=[
 ["show_header","Rodyti antraštę"],
 ["show_icon","Rodyti ikoną"],
 ["show_subtitle","Rodyti šaltinių būseną"],
 ["show_region_labels","Rodyti apskričių pavadinimus"],
 ["show_alerts","Rodyti oro pavojaus spalvas"],
 ["show_weather_labels","Rodyti vėjo / sniego reikšmes"],
 ["show_details","Rodyti pasirinktos apskrities duomenis"],
 ["show_legend","Rodyti spalvų legendą"],
 ["show_timeline","Rodyti radaro laiko valdymą"],
 ["show_disclaimer","Rodyti perspėjimo paaiškinimą"],
 ["show_toolbar","Rodyti sluoksnių perjungimą"]
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
 return {
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
function wmapState(alertsAvailable,alertRecord){
 if(!alertsAvailable)return "unavailable";
 if(!alertRecord)return "not_reported";
 return ["red","yellow","yellow_after_red","white"].includes(alertRecord.kodas)
   ?alertRecord.kodas:"unavailable";
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
   this._hass=null;this._regions=null;this._loading=false;this._error="";
   this._selected=null;this._mode=null;this._radarIndex=null;
 }
 static getStubConfig(){return {type:"custom:lt72-weather-map"};}
 static getConfigElement(){return document.createElement("lt72-weather-map-editor");}
 setConfig(config){
   if(!config||config.type!=="custom:lt72-weather-map")throw Error("Netinkamas LT72 Weather Map kortos tipas");
   const before=this._config.region;
   this._config={...config};
   if(WMAP_BY_KEY[config.region])this._selected=config.region;
   else if(before!==config.region)this._selected=null;
   this._mode=this._mode||config.layer||"radar";
   if(!WMAP_MODES.some(m=>m[0]===this._mode))this._mode="radar";
   this._render();
 }
 set hass(value){this._hass=value;this._render();}
 getCardSize(){return 7;}
 getGridOptions(){return {columns:12,min_rows:5,max_rows:12};}
 _show(option){return this._config[option]!==false;}
 connectedCallback(){if(!this._regions&&!this._loading)this._loadGeometry();else this._render();}
 async _loadGeometry(){
   this._loading=true;this._render();
   try{
     const response=await fetch(WMAP_URL+"counties.json");
     if(!response.ok)throw Error("HTTP "+response.status);
     this._regions=wmapDecode(await response.json());
     this._error="";
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
   const showRadar=(mode==="radar"||mode==="all")&&radarReady;
   const showWind=(mode==="wind"||mode==="all")&&weatherReady;
   const showSnow=(mode==="snow"||mode==="all")&&weatherReady;
   const chosenFrame=frames[this._radarIndex]||null;
   const projection=wmapProjection();
   let images="";
   if(showRadar&&chosenFrame){
     images=wmapRadarTiles(radar,chosenFrame,projection).map(t=>
       '<image href="'+WMAP_ESC(t.url)+'" x="'+t.x.toFixed(1)+'" y="'+t.y.toFixed(1)+
       '" width="'+t.w.toFixed(1)+'" height="'+t.h.toFixed(1)+
       '" preserveAspectRatio="none"></image>').join("");
   }
   const regionsHtml=this._regions?this._regions.map(s=>{
     const value=alerts[s.key], code=wmapState(activeAlerts,value);
     const color=WMAP_LEVELS[code]?.[1]||WMAP_LEVELS.unavailable[1];
     // Colour active alert districts; other polygons are lightly filled above radar.
     const isActive=["red","yellow","yellow_after_red"].includes(code);
     const opacity=showRadar?(isActive?0.63:0.08):1;
     const select=s.key===region[0];
     const outline=select?"#2677d6":"var(--secondary-text-color,#64748b)";
     const bgFill=this._show("show_alerts")?color:"#f4f6fa";
     const text=this._show("show_region_labels")?
       '<text x="'+s.x.toFixed(1)+'" y="'+(s.y-13).toFixed(1)+
       '" text-anchor="middle" class="county-label">'+WMAP_ESC(s.short)+'</text>':"";
     return '<g role="button" tabindex="0" data-region="'+s.key+
       '" aria-label="'+WMAP_ESC(s.name+" apskritis: "+WMAP_LEVELS[code][0])+'">'+
       '<path d="'+s.d+'" fill="'+bgFill+'" fill-opacity="'+opacity+
       '" stroke="'+outline+'" stroke-width="'+(select?3:1.45)+
       '" stroke-dasharray="'+(code==="not_reported"&&!select?"4 3":"none")+
       '" stroke-linejoin="round"></path>'+text+'</g>';
   }).join(""):"";
   const weatherHtml=this._regions?this._regions.map(s=>{
     const w=weather[s.key];
     if(!w)return "";
     let shapes="";
     if(showWind){
       const angle=(Number(w.wind_from_deg)+180)%360;
       shapes='<g transform="translate('+s.x.toFixed(1)+' '+s.y.toFixed(1)+')">'+
         '<g transform="rotate('+angle+')">'+
         '<path d="M0 13V-14 M-6 -5L0 -14L6 -5" fill="none" stroke="#1d4ed8" stroke-width="3.5" stroke-linecap="round"></path>'+
         '</g></g>';
       if(this._show("show_weather_labels")){
         shapes+='<text class="weather-label" x="'+s.x.toFixed(1)+
           '" y="'+(s.y+26).toFixed(1)+'" text-anchor="middle">'+
           WMAP_ESC(w.wind_kmh+" km/h")+'</text>';
       }
     }
     if(showSnow&&Number(w.snow_cm)>0){
       const yy=showWind?s.y-26:s.y;
       shapes+='<text x="'+(s.x+23).toFixed(1)+'" y="'+yy.toFixed(1)+
         '" class="snow-label" text-anchor="middle">❄</text>';
       if(this._show("show_weather_labels")){
         shapes+='<text x="'+(s.x+23).toFixed(1)+'" y="'+(yy+14).toFixed(1)+
           '" class="weather-label" text-anchor="middle">'+
           WMAP_ESC(w.snow_cm+" cm")+'</text>';
       }
     }
     return shapes;
   }).join(""):"";
   const buttons=WMAP_MODES.map(m=>
     '<button class="mode '+(mode===m[0]?'active':'')+'" data-mode="'+m[0]+
     '" type="button">'+WMAP_ESC(m[1])+'</button>').join("");
   const weatherInfo=weatherReady&&forecast?
     '<div class="weather-details">'+
       '<span>💨 '+WMAP_ESC(forecast.wind_kmh)+' km/h</span>'+
       '<span>Gūsiai '+WMAP_ESC(forecast.gust_kmh)+' km/h</span>'+
       '<span>❄ '+WMAP_ESC(forecast.snow_cm)+' cm</span>'+
       '<span>🌧 '+WMAP_ESC(forecast.precip_mm)+' mm</span>'+
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
   const attribution='<div class="credits"><a href="https://lt72.lt/" target="_blank" rel="noopener noreferrer">LT72</a>'+
     ' · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>'+
     ((mode==="radar"||mode==="all")?
       ' · Weather data by <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>':'')+
     '</div>';
   const explanatory=this._show("show_disclaimer")?
     '<div class="fineprint">Balta be pranešimo ≠ oficialus atšaukimas. '+
     'Pilka = nepasiekiama. Radaras rodo stebėtus kritulius; vėjas ir sniegas – modelio prognozė. '+
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
     '.map{position:relative;background:var(--secondary-background-color,#edf0f4);border-radius:10px;overflow:hidden}',
     '.map svg{width:100%;height:auto;display:block;max-height:470px}',
     '.county-label{font:bold 13px Roboto,Arial,sans-serif;fill:#18253b;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}',
     '.weather-label{font:bold 12px Roboto,Arial,sans-serif;fill:#134e86;paint-order:stroke;stroke:#fff;stroke-width:3.5px;pointer-events:none}',
     '.snow-label{font:29px Arial,sans-serif;fill:#0ea5e9;paint-order:stroke;stroke:#fff;stroke-width:3px;pointer-events:none}',
     '[data-region]{cursor:pointer;outline:none}[data-region]:focus-visible path,[data-region]:hover path{stroke:#2563eb;stroke-width:3}',
     '.missing{padding:30px 10px;color:var(--secondary-text-color);text-align:center}',
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
     '.credits{display:flex;justify-content:flex-end;font-size:10px;gap:4px;color:var(--secondary-text-color);margin-top:8px;flex-wrap:wrap}.credits a{color:var(--secondary-text-color);text-decoration:underline}',
     '.compact{padding:8px}.compact .header{margin-bottom:5px}.compact .mode{font-size:11px;padding:5px}.compact .toolbar{margin-bottom:6px}',
     '@media(max-width:480px){.county-label{font-size:16px}.weather-label{font-size:16px}ha-card{padding:10px}.toolbar{gap:4px}.mode{padding:6px;font-size:11px}}',
     '</style>',
     '<ha-card'+(this._config.compact?' class="compact"':'')+'>',header,toolbar,
     '<div class="map">',
     this._error?'<div class="missing">'+WMAP_ESC(this._error)+'</div>':
     !this._regions?'<div class="missing">Įkeliamas Lietuvos žemėlapis...</div>':
       '<svg viewBox="0 0 760 444" aria-label="LT72 pavojaus ir orų žemėlapis" role="img">'+
         '<rect x="0" y="0" width="760" height="444" fill="var(--secondary-background-color,#e7eff4)"></rect>'+
         images+regionsHtml+weatherHtml+'</svg>',
     (mapMissing?'<div class="overlay-alert">⚠ '+WMAP_ESC(mode==="radar"?
       "Radaro duomenys nepasiekiami":"Orų prognozės nepasiekiamos")+'</div>':""),
     '</div>',timeline,details,legend,explanatory,attribution,
     '</ha-card>'
   ].join("");
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
   else if(key.startsWith("show_")){if(value)delete next[key];else next[key]=false;}
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
     '<label class="field"><span>Pradinis sluoksnis</span><select data-select="layer">',
     ...WMAP_MODES.map(m=>'<option value="'+m[0]+'"'+((current.layer||"radar")===m[0]?' selected':'')+'>'+WMAP_ESC(m[1])+'</option>'),
     '</select></label>',
     '<h4>Rodyti / slėpti</h4><div class="flags">'+flags+'</div>',
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
