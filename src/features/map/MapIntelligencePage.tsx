import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPin, ShieldAlert, X } from 'lucide-react';
import { useMapLocations } from '../../hooks/useIntelligenceApi';
import { MapLocation } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export function MapIntelligencePage() {
  const { data: locations, isLoading } = useMapLocations('ALL');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !locations) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [77.5946, 12.9716],
      zoom: 5,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    locations.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'custom-map-marker flex items-center justify-center h-8 w-8 rounded-full border-2 border-white cursor-pointer shadow-lg transition-transform hover:scale-125';

      if (loc.locationType === 'CRIME_SCENE') el.style.backgroundColor = '#ef4444';
      else if (loc.locationType === 'VEHICLE_DETECTION') el.style.backgroundColor = '#a855f7';
      else if (loc.locationType === 'PHONE_CELL_TOWER') el.style.backgroundColor = '#f59e0b';
      else if (loc.locationType === 'CCTV_SIGHTING') el.style.backgroundColor = '#3b82f6';
      else el.style.backgroundColor = '#10b981';

      el.addEventListener('click', () => {
        setSelectedLocation(loc);
        map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 12, duration: 800 });
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [locations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Geospatial & Map Intelligence Workspace (MapLibre GL JS)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Spatial telemetry mapping cell tower pings, ANPR vehicle sightings, and crime scene locations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-bold">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
        <span>NOTICE: ALL GEOSPATIAL MAP COORDINATES ARE SYNTHETIC/DEMO DATA FOR INTELLIGENCE SYSTEM VALIDATION.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative h-[650px] overflow-hidden border-primary/30 bg-slate-950">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400">
                Initializing MapLibre GL JS spatial renderer...
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute bottom-4 left-4 p-3 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md text-[10px] space-y-1.5 select-none shadow-xl">
              <span className="font-bold text-slate-300 block mb-1">Spatial Layer Legend</span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-slate-400">CRIME SCENE / SAFEHOUSE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-slate-400">ANPR VEHICLE SIGHTING</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">CELL TOWER PING</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-slate-400">CCTV SURVEILLANCE</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedLocation ? (
            <Card className="border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Spatial Inspector</CardTitle>
                <button onClick={() => setSelectedLocation(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <Badge variant="outline">{selectedLocation.locationType}</Badge>
                  <h3 className="text-base font-extrabold text-foreground mt-1">{selectedLocation.title}</h3>
                  <p className="text-muted-foreground text-[11px] mt-1">{selectedLocation.address}</p>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-foreground">{selectedLocation.latitude}, {selectedLocation.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">{new Date(selectedLocation.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedLocation.entityName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Linked Entity:</span>
                      <span className="font-bold text-primary">{selectedLocation.entityName}</span>
                    </div>
                  )}
                </div>

                {selectedLocation.metadata && (
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Telemetry Metadata:</span>
                    <div className="p-2 rounded bg-muted/40 border border-border space-y-1 text-[11px]">
                      {Object.entries(selectedLocation.metadata).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{k}:</span>
                          <span className="font-semibold text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 text-center space-y-3 text-muted-foreground">
              <MapPin className="h-8 w-8 text-primary mx-auto opacity-50" />
              <p className="text-xs">
                Click any map marker to inspect spatial telemetry details, cell tower metadata, or vehicle sighting records.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
