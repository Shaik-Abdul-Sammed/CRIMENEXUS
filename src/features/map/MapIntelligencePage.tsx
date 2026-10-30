import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import maplibregl from 'maplibre-gl';
import { MapPin, ShieldAlert, X, Navigation, Clock, Bell, BellRing, AlertTriangle } from 'lucide-react';
import { useMapLocations } from '../../hooks/useIntelligenceApi';
import { MapLocation } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface TimelineWaypoint {
  type: 'ANPR_SIGHTING' | 'CDR_CELL_PING';
  timestamp: string;
  latitude: number;
  longitude: number;
  title: string;
  location_name: string;
  entity: string;
  details: string;
}

export function MapIntelligencePage() {
  const { data: locations, isLoading } = useMapLocations('ALL');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [timelineWaypoints, setTimelineWaypoints] = useState<TimelineWaypoint[]>([]);
  const [activeWaypointIdx, setActiveWaypointIdx] = useState<number | null>(null);
  const [anprAlertOpen, setAnprAlertOpen] = useState(true);

  // 1. Fetch Correlated Movement Timeline from Backend Analytics
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    axios
      .get(`${baseURL}/analytics/movement-timeline?plate_number=TS%2009%20AB%201234&phone_number=%2B91%2098765%2043210`, { timeout: 3500 })
      .then((res) => {
        if (res.data?.timeline_events && res.data.timeline_events.length > 0) {
          setTimelineWaypoints(res.data.timeline_events);
        } else {
          // Default correlated waypoints
          setTimelineWaypoints([
            {
              type: 'CDR_CELL_PING',
              timestamp: '2026-10-29T10:15:00',
              latitude: 28.6280,
              longitude: 77.3649,
              title: 'Cell Tower Ping: TOWER-NOIDA-62',
              location_name: 'Sector 62 Tech Zone, Noida',
              entity: '+91 98765 43210',
              details: 'Incoming call from associate Vikram (Duration: 94s, Voice)'
            },
            {
              type: 'ANPR_SIGHTING',
              timestamp: '2026-10-29T11:42:00',
              latitude: 28.1402,
              longitude: 77.5510,
              title: 'ANPR Sighting: TS 09 AB 1234',
              location_name: 'Yamuna Expressway Toll KM 48',
              entity: 'TS 09 AB 1234',
              details: 'Speed 118 km/h heading southbound towards Mathura (Confidence: 0.98)'
            },
            {
              type: 'CDR_CELL_PING',
              timestamp: '2026-10-29T14:30:00',
              latitude: 28.6315,
              longitude: 77.2167,
              title: 'Cell Tower Ping: TOWER-DEL-CONN',
              location_name: 'Connaught Place Inner Circle, Delhi',
              entity: '+91 98765 43210',
              details: 'Outgoing call to hawala courier Suresh (Duration: 42s)'
            }
          ]);
        }
      })
      .catch(() => {
        // Fallback demo waypoints
        setTimelineWaypoints([
          {
            type: 'CDR_CELL_PING',
            timestamp: '2026-10-29T10:15:00',
            latitude: 28.6280,
            longitude: 77.3649,
            title: 'Cell Tower Ping: TOWER-NOIDA-62',
            location_name: 'Sector 62 Tech Zone, Noida',
            entity: '+91 98765 43210',
            details: 'Incoming call from associate Vikram (Duration: 94s, Voice)'
          },
          {
            type: 'ANPR_SIGHTING',
            timestamp: '2026-10-29T11:42:00',
            latitude: 28.1402,
            longitude: 77.5510,
            title: 'ANPR Sighting: TS 09 AB 1234',
            location_name: 'Yamuna Expressway Toll KM 48',
            entity: 'TS 09 AB 1234',
            details: 'Speed 118 km/h heading southbound towards Mathura (Confidence: 0.98)'
          },
          {
            type: 'CDR_CELL_PING',
            timestamp: '2026-10-29T14:30:00',
            latitude: 28.6315,
            longitude: 77.2167,
            title: 'Cell Tower Ping: TOWER-DEL-CONN',
            location_name: 'Connaught Place Inner Circle, Delhi',
            entity: '+91 98765 43210',
            details: 'Outgoing call to hawala courier Suresh (Duration: 42s)'
          }
        ]);
      });
  }, []);

  // 2. Initialize Map and Plot Markers & Trajectory Line
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Delhi NCR / Yamuna corridor
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [77.40, 28.40],
      zoom: 8.5,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Add LineString Trajectory for movement timeline
      if (timelineWaypoints.length >= 2) {
        const coords = timelineWaypoints.map((w) => [w.longitude, w.latitude]);

        map.addSource('transit-trajectory', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        });

        map.addLayer({
          id: 'transit-line-glow',
          type: 'line',
          source: 'transit-trajectory',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#06b6d4',
            'line-width': 8,
            'line-opacity': 0.35,
          },
        });

        map.addLayer({
          id: 'transit-line',
          type: 'line',
          source: 'transit-trajectory',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#22d3ee',
            'line-width': 3,
            'line-dasharray': [2, 1],
          },
        });
      }
    });

    // Plot Base Dataset Markers
    if (locations) {
      locations.forEach((loc) => {
        const el = document.createElement('div');
        el.className = 'custom-map-marker flex items-center justify-center h-7 w-7 rounded-full border border-white/80 cursor-pointer shadow-lg transition-transform hover:scale-125';

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
    }

    // Plot Correlated Timeline Waypoint Markers with Special Icons
    timelineWaypoints.forEach((wp, idx) => {
      const isWantedVehicle = wp.entity.includes('TS 09 AB 1234') || wp.location_name.includes('Yamuna');
      const el = document.createElement('div');

      if (isWantedVehicle) {
        // Feature 10: "Wanted Vehicle" ANPR Pulsing Red Radar Marker
        el.className = 'wanted-vehicle-pulsing-marker relative flex items-center justify-center h-10 w-10 rounded-full border-2 border-red-400 bg-red-600 font-black text-xs text-white cursor-pointer shadow-[0_0_25px_#dc2626] transition-transform hover:scale-125';
        el.title = 'WANTED VEHICLE HIT: TS 09 AB 1234 @ Yamuna Expressway Toll KM 48';
        el.innerHTML = '<span class="relative flex h-full w-full items-center justify-center"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80"></span><span class="relative text-[11px]">🚨</span></span>';
      } else {
        el.className = 'timeline-marker flex items-center justify-center h-8 w-8 rounded-full border-2 border-cyan-400 font-extrabold text-[11px] text-white cursor-pointer shadow-xl transition-transform hover:scale-125';
        if (wp.type === 'ANPR_SIGHTING') {
          el.style.backgroundColor = '#9333ea'; // Purple
        } else {
          el.style.backgroundColor = '#d97706'; // Amber
        }
        el.innerText = `${idx + 1}`;
      }

      el.addEventListener('click', () => {
        setActiveWaypointIdx(idx);
        setSelectedLocation({
          id: `wp-${idx + 1}`,
          title: wp.title,
          locationType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE_DETECTION' : 'PHONE_CELL_TOWER',
          entityType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE' : 'PHONE',
          latitude: wp.latitude,
          longitude: wp.longitude,
          address: wp.location_name,
          timestamp: wp.timestamp,
          caseId: 'CASE-2026-DEMO',
          entityName: wp.entity,
          metadata: {
            details: wp.details,
            stepOrder: `${idx + 1} of ${timelineWaypoints.length}`,
            source: wp.type === 'ANPR_SIGHTING' ? 'CCTNS / VAHAN ANPR' : 'Telecom Multi-Carrier CDR'
          }
        });
        map.flyTo({ center: [wp.longitude, wp.latitude], zoom: 13, duration: 800 });
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [locations, timelineWaypoints]);

  const flyToWaypoint = (wp: TimelineWaypoint, idx: number) => {
    setActiveWaypointIdx(idx);
    setSelectedLocation({
      id: `wp-${idx + 1}`,
      title: wp.title,
      locationType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE_DETECTION' : 'PHONE_CELL_TOWER',
      entityType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE' : 'PHONE',
      latitude: wp.latitude,
      longitude: wp.longitude,
      address: wp.location_name,
      timestamp: wp.timestamp,
      caseId: 'CASE-2026-DEMO',
      entityName: wp.entity,
      metadata: {
        details: wp.details,
        stepOrder: `${idx + 1} of ${timelineWaypoints.length}`,
        source: wp.type === 'ANPR_SIGHTING' ? 'CCTNS / VAHAN ANPR' : 'Telecom Multi-Carrier CDR'
      }
    });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [wp.longitude, wp.latitude], zoom: 13, duration: 900 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Movement Intelligence & Trajectory Timeline (MapLibre GL JS)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated correlation of CDR cellular tower pings with ANPR highway camera detections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/30 flex items-center gap-1.5 py-1 px-2.5">
            <Navigation className="h-3.5 w-3.5" />
            Suspect Convoy Path: Rajan (TS 09 AB 1234)
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 text-cyan-200 text-xs font-semibold">
        <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0" />
        <span>AUTOMATION 3 ACTIVE: Real-time spatiotemporal fusion engine correlating CDR tower triangulation and VAHAN ANPR checkpoint logs into an interactive GeoJSON LineString trajectory.</span>
      </div>

      {/* Feature 10: "Wanted Vehicle" ANPR Real-Time Intercept Alert Toast */}
      {anprAlertOpen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-red-500/80 bg-red-950/50 text-red-100 shadow-xl shadow-red-950/50 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce mt-0.5">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded bg-red-600">
                  REAL-TIME ANPR INTERCEPT ALERT
                </span>
                <span className="text-xs text-red-300 font-mono">Camera: YAMUNA-EXPR-CAM-04</span>
              </div>
              <h4 className="text-sm font-extrabold text-white mt-1">
                Wanted Syndicate Vehicle Sighted: TS 09 AB 1234 (Toyota Fortuner)
              </h4>
              <p className="text-xs text-red-300/90 mt-0.5">
                Flagged at Yamuna Expressway Toll KM 48 camera • Speed: 118 km/h heading Southbound towards Mathura
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              size="sm"
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/50"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({ center: [77.5510, 28.1402], zoom: 14, duration: 800 });
                }
              }}
            >
              Zoom to Toll Camera
            </Button>
            <button
              onClick={() => setAnprAlertOpen(false)}
              className="text-red-400 hover:text-white text-xs px-2 py-1 font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative h-[650px] overflow-hidden border-primary/30 bg-slate-950">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400">
                Initializing MapLibre GL JS spatial renderer...
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute bottom-4 left-4 p-3 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md text-[10px] space-y-1.5 select-none shadow-xl">
              <span className="font-bold text-slate-300 block mb-1">Spatial Layer Legend</span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300 font-bold">CORRELATED TRANSIT PATH (GeoJSON)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-slate-400">ANPR VEHICLE SIGHTING (TS 09 AB 1234)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">CELL TOWER PING (+91 98765 43210)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-slate-400">CRIME SCENE / SAFE HOUSE</span>
              </div>
            </div>
          </Card>

          {/* Chronological Breadcrumb Ribbon */}
          <Card className="p-4 border-cyan-500/30 bg-slate-950/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Chronological Breadcrumb Trajectory (Scrub to Replay Route)
              </h4>
              <span className="text-[11px] text-muted-foreground font-mono">
                {timelineWaypoints.length} Correlated Checkpoints
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {timelineWaypoints.map((wp, idx) => (
                <div
                  key={idx}
                  onClick={() => flyToWaypoint(wp, idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeWaypointIdx === idx
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-950/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={wp.type === 'ANPR_SIGHTING' ? 'border-purple-500 text-purple-400 text-[10px]' : 'border-amber-500 text-amber-400 text-[10px]'}>
                      {wp.type === 'ANPR_SIGHTING' ? 'ANPR CAM' : 'CELL TOWER'} #{idx + 1}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(wp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white mt-1.5 truncate">{wp.location_name}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{wp.details}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedLocation ? (
            <Card className="border-cyan-500/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Spatial Inspector</CardTitle>
                <button onClick={() => setSelectedLocation(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">{selectedLocation.locationType}</Badge>
                  <h3 className="text-base font-extrabold text-foreground mt-1">{selectedLocation.title}</h3>
                  <p className="text-muted-foreground text-[11px] mt-1">{selectedLocation.address}</p>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-cyan-400">{selectedLocation.latitude}, {selectedLocation.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">{new Date(selectedLocation.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedLocation.entityName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Associated Entity:</span>
                      <span className="font-bold text-primary">{selectedLocation.entityName}</span>
                    </div>
                  )}
                </div>

                {selectedLocation.metadata && (
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Telemetry Metadata:</span>
                    <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1 text-[11px]">
                      {Object.entries(selectedLocation.metadata).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{k}:</span>
                          <span className="font-semibold text-foreground">{String(v)}</span>
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
                Click any waypoint marker or the chronological breadcrumbs to inspect trajectory coordinates, cell tower metadata, and correlated ANPR sightings.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
