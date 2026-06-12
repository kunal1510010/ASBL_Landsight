import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Rectangle, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Parcel } from "@/lib/types";
import { centroid, estimateAcres } from "@/lib/geo";
import { Button, cn } from "./ui";
import { ScanSearch, Satellite, Map as MapIcon, X, Pencil } from "lucide-react";

/** Lake FTL buffers - construction prohibited. Kept client-side (pure geometry). */
export const FTL_ZONES: { id: string; name: string; note: string; polygon: [number, number][] }[] = [
  {
    id: "osman-sagar-ftl",
    name: "Osman Sagar FTL + buffer",
    note: "GO 111 / FTL buffer - construction prohibited",
    polygon: [
      [17.395, 78.284], [17.394, 78.301], [17.387, 78.306], [17.378, 78.303],
      [17.372, 78.293], [17.374, 78.282], [17.383, 78.278],
    ],
  },
];

export interface ScanResult { ids: string[]; bounds: L.LatLngBounds }

interface Props {
  parcels: Parcel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scannedIds?: string[] | null;
  onScanStart?: () => void;
  onScanComplete?: (r: ScanResult) => void;
  onParcelDrawn?: (polygon: [number, number][]) => void;
  center?: [number, number];
  zoom?: number;
}

const STATUS_COLOR: Record<Parcel["status"], string> = {
  undeveloped: "#16a34a",
  partial: "#d97706",
  developed: "#64748b",
};

export default function ParcelMap({
  parcels, selectedId, onSelect, scannedIds = null,
  onScanStart, onScanComplete, onParcelDrawn,
  center, zoom,
}: Props) {
  const [satellite, setSatellite] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanRect, setScanRect] = useState<L.LatLngBounds | null>(null);

  // Draw parcel state
  const [drawActive, setDrawActive] = useState(false);
  const [drawVerts, setDrawVerts] = useState<[number, number][]>([]);
  const [drawnPoly, setDrawnPoly] = useState<[number, number][] | null>(null);

  function closeDrawPolygon(verts: [number, number][]) {
    if (verts.length < 3) return;
    setDrawnPoly(verts);
    setDrawVerts([]);
    setDrawActive(false);
    onParcelDrawn?.(verts);
  }

  function startDraw() {
    setScanMode(false);
    setDrawnPoly(null);
    setDrawVerts([]);
    setDrawActive(true);
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[17.425, 78.28]}
        zoom={12}
        className={cn("h-full w-full", (scanMode || drawActive) && "ls-crosshair")}
      >
        {satellite ? (
          <TileLayer
            attribution="Imagery (c) Esri - Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='(c) <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {center && zoom !== undefined && <MapFlyTo center={center} zoom={zoom} />}

        {FTL_ZONES.map((z) => (
          <Polygon
            key={z.id}
            positions={z.polygon}
            pathOptions={{ className: "ls-blocked", color: "#dc2626", weight: 2, dashArray: "6 4", fillColor: "#dc2626", fillOpacity: 0.15 }}
          >
            <Tooltip sticky>
              <span className="font-medium">{z.name}</span><br />{z.note}
            </Tooltip>
          </Polygon>
        ))}

        {parcels.map((p) => {
          const hidden = scannedIds !== null && !scannedIds.includes(p.id);
          const color = p.blocked ? "#dc2626" : STATUS_COLOR[p.status];
          const isSel = p.id === selectedId;
          return (
            <Polygon
              key={p.id}
              positions={p.polygon}
              pathOptions={{
                color: isSel ? "#065f46" : color,
                weight: isSel ? 3.5 : 2,
                fillColor: color,
                fillOpacity: hidden ? 0.05 : isSel ? 0.45 : 0.3,
                opacity: hidden ? 0.25 : 1,
              }}
              eventHandlers={{ click: () => !scanMode && !drawActive && onSelect(p.id) }}
            >
              <Tooltip sticky>
                <span className="font-medium">{p.name}</span><br />
                {p.acres} ac - {p.category} - Rs {p.pricePerSft.toLocaleString("en-IN")}/sft
                {p.blocked && <><br /><span className="text-red-600 font-medium">FTL buffer - blocked</span></>}
              </Tooltip>
            </Polygon>
          );
        })}

        {scanRect && (
          <Rectangle
            bounds={scanRect}
            pathOptions={{ className: "ls-scan-rect", color: "#16a34a", weight: 2, dashArray: "8 6", fillColor: "#16a34a", fillOpacity: 0.12 }}
          />
        )}

        {/* Completed drawn polygon */}
        {drawnPoly && !drawActive && (
          <Polygon
            positions={drawnPoly}
            pathOptions={{ color: "#2563eb", weight: 2.5, dashArray: "5 4", fillColor: "#3b82f6", fillOpacity: 0.22 }}
          >
            <Tooltip>
              <span className="font-medium">Custom parcel</span><br />
              ~{estimateAcres(drawnPoly).toFixed(2)} acres (estimated)
            </Tooltip>
          </Polygon>
        )}

        {/* In-progress polyline while drawing */}
        {drawActive && drawVerts.length >= 2 && (
          <Polyline
            positions={drawVerts}
            pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "6 4" }}
          />
        )}

        {/* Vertex markers while drawing */}
        {drawActive && drawVerts.map((v, i) => {
          const isFirst = i === 0;
          const canClose = isFirst && drawVerts.length >= 3;
          return (
            <CircleMarker
              key={i}
              center={v}
              radius={canClose ? 9 : 5}
              pathOptions={{
                color: canClose ? "#22d3ee" : "#3b82f6",
                fillColor: canClose ? "#22d3ee" : "#3b82f6",
                fillOpacity: 0.8,
                weight: 2,
              }}
              eventHandlers={canClose ? { click: () => closeDrawPolygon(drawVerts) } : {}}
            />
          );
        })}

        <ScanController
          active={scanMode}
          scanning={scanning}
          onRect={setScanRect}
          onDrawn={(bounds) => {
            setScanning(true);
            onScanStart?.();
            window.setTimeout(() => {
              const ids = parcels.filter((p) => bounds.contains(L.latLng(...centroid(p.polygon)))).map((p) => p.id);
              setScanning(false);
              setScanMode(false);
              setScanRect(bounds);
              onScanComplete?.({ ids, bounds });
            }, 1900);
          }}
        />

        <DrawController
          active={drawActive}
          vertices={drawVerts}
          onAddVertex={(v) => setDrawVerts((prev) => [...prev, v])}
          onClose={() => closeDrawPolygon(drawVerts)}
        />

        <ScanlineOverlay bounds={scanning ? scanRect : null} />
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
        <Button
          variant={scanMode ? "default" : "secondary"}
          className="shadow-md !px-3 !py-1.5 text-xs"
          disabled={scanning || drawActive}
          onClick={() => {
            setScanMode((m) => !m);
            setScanRect(null);
          }}
        >
          {scanMode ? <X className="h-4 w-4" /> : <ScanSearch className="h-4 w-4" />}
          {scanning ? "Scanning..." : scanMode ? "Cancel scan" : "Scan area"}
        </Button>
        <Button
          variant={drawActive ? "default" : "secondary"}
          className="shadow-md !px-3 !py-1.5 text-xs"
          disabled={scanning}
          onClick={() => {
            if (drawActive) {
              setDrawActive(false);
              setDrawVerts([]);
            } else {
              startDraw();
            }
          }}
        >
          {drawActive ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {drawActive ? "Cancel draw" : "Draw parcel"}
        </Button>
        <Button
          variant="secondary"
          className="shadow-md !px-3 !py-1.5 text-xs"
          onClick={() => setSatellite((s) => !s)}
        >
          {satellite ? <MapIcon className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
          {satellite ? "Streets" : "Satellite"}
        </Button>
      </div>

      {/* Scan hints */}
      {scanMode && !scanning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-foreground/85 text-background text-xs px-4 py-2 shadow-lg">
          Drag a rectangle over the area to scan for open land
        </div>
      )}
      {scanning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-primary text-primary-foreground text-xs px-4 py-2 shadow-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-foreground animate-ping" />
          Analyzing satellite imagery - detecting undeveloped land...
        </div>
      )}

      {/* Draw hints */}
      {drawActive && drawVerts.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-blue-700 text-white text-xs px-4 py-2 shadow-lg">
          Click on the map to trace your parcel boundary
        </div>
      )}
      {drawActive && drawVerts.length > 0 && drawVerts.length < 3 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-blue-700 text-white text-xs px-4 py-2 shadow-lg">
          Keep clicking to add vertices ({drawVerts.length}/3 minimum)
        </div>
      )}
      {drawActive && drawVerts.length >= 3 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-blue-600 text-white text-xs px-4 py-2 shadow-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping" />
          Double-click or click the cyan dot to close the polygon
        </div>
      )}
    </div>
  );
}

function ScanController({
  active, scanning, onRect, onDrawn,
}: {
  active: boolean;
  scanning: boolean;
  onRect: (b: L.LatLngBounds | null) => void;
  onDrawn: (b: L.LatLngBounds) => void;
}) {
  const map = useMap();
  const start = useRef<L.LatLng | null>(null);
  const last = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (active) map.dragging.disable();
    else { map.dragging.enable(); start.current = null; }
  }, [active, map]);

  useMapEvents({
    mousedown(e) { if (!active || scanning) return; start.current = e.latlng; last.current = null; onRect(null); },
    mousemove(e) {
      if (!active || scanning || !start.current) return;
      const b = L.latLngBounds(start.current, e.latlng);
      last.current = b; onRect(b);
    },
    mouseup() {
      if (!active || scanning || !start.current) return;
      const b = last.current; start.current = null;
      if (b && Math.abs(b.getNorth() - b.getSouth()) > 0.002) onDrawn(b);
      else onRect(null);
    },
  });
  return null;
}

function DrawController({
  active, vertices, onAddVertex, onClose,
}: {
  active: boolean;
  vertices: [number, number][];
  onAddVertex: (v: [number, number]) => void;
  onClose: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (active) {
      map.dragging.disable();
      map.doubleClickZoom.disable();
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
    }
  }, [active, map]);

  useMapEvents({
    click(e) {
      if (!active) return;
      if (vertices.length >= 3) {
        const fp = map.latLngToContainerPoint(L.latLng(...vertices[0]));
        const cp = map.latLngToContainerPoint(e.latlng);
        if (Math.hypot(fp.x - cp.x, fp.y - cp.y) < 18) {
          onClose();
          return;
        }
      }
      onAddVertex([e.latlng.lat, e.latlng.lng]);
    },
    dblclick(e) {
      if (!active || vertices.length < 3) return;
      L.DomEvent.stopPropagation(e.originalEvent);
      onClose();
    },
  });
  return null;
}

function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

function ScanlineOverlay({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!bounds) { setBox(null); return; }
    const update = () => {
      const nw = map.latLngToContainerPoint(bounds.getNorthWest());
      const se = map.latLngToContainerPoint(bounds.getSouthEast());
      setBox({ left: nw.x, top: nw.y, width: se.x - nw.x, height: se.y - nw.y });
    };
    update();
    map.on("move zoom", update);
    return () => { map.off("move zoom", update); };
  }, [bounds, map]);

  if (!box) return null;
  return (
    <div className="pointer-events-none absolute z-[450] overflow-hidden" style={box}>
      <div
        className="absolute left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
          boxShadow: "0 0 14px 3px rgba(74,222,128,.7)",
          animation: "ls-scanline 1.1s linear infinite",
        }}
      />
    </div>
  );
}
