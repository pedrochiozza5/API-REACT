import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MateroLocation } from '@/lib/types';

type Props={
  locations:MateroLocation[];
  selectedId?:number|null;
  onSelect?:(location:MateroLocation)=>void;
  className?:string;
  editablePoint?:{lat:number;lng:number}|null;
  onPick?:(lat:number,lng:number)=>void;
};

function markerHtml(location:MateroLocation,selected:boolean){
  const yerbados=location.brandId==='enyerbados';
  return `<div class="ba-map-pin ${yerbados?'ba-map-pin--yerbados':''} ${selected?'is-selected':''}"><span>${location.featured?'★':'●'}</span></div>`;
}
function clusterHtml(count:number){return `<div class="ba-map-cluster"><strong>${count}</strong><span>rondas</span></div>`;}

export function WorldMapCanvas({locations,selectedId,onSelect,className='',editablePoint,onPick}:Props){
  const host=useRef<HTMLDivElement|null>(null); const mapRef=useRef<L.Map|null>(null); const layerRef=useRef<L.LayerGroup|null>(null); const editMarkerRef=useRef<L.Marker|null>(null);
  const locationsKey=useMemo(()=>locations.map(x=>`${x.id}:${x.latitude}:${x.longitude}:${x.brandId}:${x.featured}`).join('|'),[locations]);
  const stateRef=useRef({locations,selectedId,onSelect}); stateRef.current={locations,selectedId,onSelect}; const pickRef=useRef(onPick); pickRef.current=onPick;

  useEffect(()=>{
    if(!host.current||mapRef.current)return;
    const map=L.map(host.current,{zoomControl:false,attributionControl:false,worldCopyJump:true,minZoom:2,maxZoom:18,scrollWheelZoom:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    L.control.zoom({position:'bottomright'}).addTo(map);
    L.control.attribution({position:'bottomleft',prefix:false}).addAttribution('© OpenStreetMap').addTo(map);
    map.setView([-34.7,-58.5],5);
    mapRef.current=map; layerRef.current=L.layerGroup().addTo(map);
    const resize=()=>map.invalidateSize(); setTimeout(resize,80); window.addEventListener('resize',resize);
    map.on('click',(e)=>pickRef.current?.(e.latlng.lat,e.latlng.lng));
    return()=>{window.removeEventListener('resize',resize);map.remove();mapRef.current=null;layerRef.current=null;editMarkerRef.current=null;};
  },[]);

  useEffect(()=>{
    const map=mapRef.current,layer=layerRef.current;if(!map||!layer)return;
    const render=()=>{
      layer.clearLayers(); const {locations:selectedLocations,selectedId:activeId,onSelect:choose}=stateRef.current;
      const zoom=map.getZoom(); const shouldCluster=zoom<11 && selectedLocations.length>8;
      if(!shouldCluster){
        selectedLocations.forEach(loc=>{
          const icon=L.divIcon({className:'ba-map-divicon',html:markerHtml(loc,loc.id===activeId),iconSize:[34,42],iconAnchor:[17,36]});
          const marker=L.marker([loc.latitude,loc.longitude],{icon,keyboard:true,title:loc.name}); marker.on('click',()=>choose?.(loc)); marker.addTo(layer);
        }); return;
      }
      const cells=new Map<string,MateroLocation[]>();
      selectedLocations.forEach(loc=>{const p=map.project([loc.latitude,loc.longitude],zoom);const key=`${Math.floor(p.x/58)}:${Math.floor(p.y/58)}`;cells.set(key,[...(cells.get(key)||[]),loc]);});
      cells.forEach(group=>{
        if(group.length===1){const loc=group[0];const icon=L.divIcon({className:'ba-map-divicon',html:markerHtml(loc,loc.id===activeId),iconSize:[34,42],iconAnchor:[17,36]});const marker=L.marker([loc.latitude,loc.longitude],{icon,title:loc.name});marker.on('click',()=>choose?.(loc));marker.addTo(layer);return;}
        const lat=group.reduce((s,x)=>s+x.latitude,0)/group.length,lng=group.reduce((s,x)=>s+x.longitude,0)/group.length;
        const icon=L.divIcon({className:'ba-map-divicon',html:clusterHtml(group.length),iconSize:[58,58],iconAnchor:[29,29]});
        const marker=L.marker([lat,lng],{icon,keyboard:true,title:`${group.length} rondas`});
        marker.on('click',()=>map.fitBounds(group.map(x=>[x.latitude,x.longitude] as L.LatLngTuple),{padding:[70,70],maxZoom:Math.min(13,zoom+3)})); marker.addTo(layer);
      });
    };
    render(); map.on('zoomend moveend',render); return()=>{map.off('zoomend moveend',render);};
  },[locationsKey,selectedId]);

  useEffect(()=>{
    const map=mapRef.current;if(!map||!locations.length||selectedId)return;const bounds=locations.map(x=>[x.latitude,x.longitude] as L.LatLngTuple);if(bounds.length>1)map.fitBounds(bounds,{padding:[55,55],maxZoom:7});else map.setView(bounds[0],8);
  },[locationsKey,selectedId]);

  useEffect(()=>{
    const map=mapRef.current;if(!map)return;if(editMarkerRef.current){editMarkerRef.current.remove();editMarkerRef.current=null;}if(!editablePoint)return;
    const icon=L.divIcon({className:'ba-map-divicon',html:'<div class="ba-map-pin is-selected"><span>+</span></div>',iconSize:[34,42],iconAnchor:[17,36]});
    const m=L.marker([editablePoint.lat,editablePoint.lng],{icon,draggable:Boolean(pickRef.current)}).addTo(map);if(pickRef.current)m.on('dragend',()=>{const p=m.getLatLng();pickRef.current?.(p.lat,p.lng);});editMarkerRef.current=m;
  },[editablePoint?.lat,editablePoint?.lng]);

  useEffect(()=>{const map=mapRef.current;if(!map||!selectedId)return;const loc=locations.find(x=>x.id===selectedId);if(loc)map.flyTo([loc.latitude,loc.longitude],Math.max(map.getZoom(),7),{duration:.8});},[selectedId,locations]);

  return <div ref={host} data-lenis-prevent className={`ba-world-map ${className}`} aria-label="Mapa de Materos por el Mundo"/>;
}
