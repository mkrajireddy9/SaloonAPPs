import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export type FreeMapPoint = {
  id: string;
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
  draggable?: boolean;
};

type Props = {
  points: FreeMapPoint[];
  center?: { latitude: number; longitude: number } | null;
  height?: number;
  selectedId?: string | null;
  onMarkerPress?: (id: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
};

const escapeHtml = (value: string) => value.replace(/</g, "\\u003c");

export function FreeMap({ points, center, height = 320, selectedId, onMarkerPress, onMapPress, onMarkerDragEnd }: Props) {
  const html = useMemo(() => {
    const fallback = points[0] || center || { latitude: 17.4485, longitude: 78.3908 };
    const data = JSON.stringify({ points, center: center || fallback, selectedId }).replace(/</g, "\\u003c");
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0;background:#e7f1ed} .leaflet-control-attribution{font-size:9px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const data=${escapeHtml(data)};const fallback=data.center||{latitude:17.4485,longitude:78.3908};const map=L.map('map',{zoomControl:false}).setView([fallback.latitude,fallback.longitude],13);L.control.zoom({position:'bottomright'}).addTo(map);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const markers={};const selectedIcon=L.divIcon({className:'halo-marker',html:'<div style="width:22px;height:22px;border-radius:50%;background:#c55239;border:3px solid white;box-shadow:0 2px 7px #555"></div>',iconSize:[22,22],iconAnchor:[11,11]});const normalIcon=L.divIcon({className:'halo-marker',html:'<div style="width:20px;height:20px;border-radius:50%;background:#4c947d;border:3px solid white;box-shadow:0 2px 7px #555"></div>',iconSize:[20,20],iconAnchor:[10,10]});data.points.forEach(p=>{const marker=L.marker([p.latitude,p.longitude],{icon:p.id===data.selectedId?selectedIcon:normalIcon,draggable:!!p.draggable}).addTo(map);if(p.title)marker.bindPopup('<b>'+String(p.title).replace(/[<>]/g,'')+'</b>'+ (p.description?'<br>'+String(p.description).replace(/[<>]/g,''):'')).openPopup();marker.on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:p.id})));marker.on('dragend',e=>{const c=e.target.getLatLng();window.ReactNativeWebView.postMessage(JSON.stringify({type:'drag',latitude:c.lat,longitude:c.lng,id:p.id}))});markers[p.id]=marker});map.on('click',e=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map',latitude:e.latlng.lat,longitude:e.latlng.lng})));if(data.points.length>1)map.fitBounds(data.points.map(p=>[p.latitude,p.longitude]),{padding:[30,30]});</script></body></html>`;
  }, [points, center, selectedId]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "marker") onMarkerPress?.(message.id);
      if ((message.type === "map" || message.type === "drag") && Number.isFinite(message.latitude) && Number.isFinite(message.longitude)) {
        const coordinate = { latitude: Number(message.latitude), longitude: Number(message.longitude) };
        if (message.type === "map") onMapPress?.(coordinate);
        else onMarkerDragEnd?.(coordinate);
      }
    } catch {
      // Ignore malformed messages from the map document.
    }
  };

  return <View style={[styles.container, { height }]}><WebView originWhitelist={["*"]} source={{ html }} onMessage={onMessage} javaScriptEnabled domStorageEnabled scrollEnabled={false} /></View>;
}

const styles = StyleSheet.create({ container: { overflow: "hidden", borderRadius: 16, backgroundColor: "#e7f1ed" } });
