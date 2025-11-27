import React from 'react';
import { Stop, Route } from '../types';

interface OfflineMapProps {
  stops: Stop[];
  routes: Route[];
}

const OfflineMap: React.FC<OfflineMapProps> = ({ stops, routes }) => {
  // Helper to get stops for a route to draw lines
  const getRoutePath = (routeId: string) => {
    // Filter stops for this route and sort by distance (Manaus is 0)
    const routeStops = stops
      .filter(s => s.routeIds.includes(routeId))
      .sort((a, b) => a.distanceFromManausKm - b.distanceFromManausKm);
    
    if (routeStops.length === 0) return '';

    // Generate SVG path string
    // Manaus (Right) -> Interior (Left)
    return routeStops.map((stop, index) => 
      `${index === 0 ? 'M' : 'L'} ${stop.mapX} ${stop.mapY}`
    ).join(' ');
  };

  return (
    <div className="w-full bg-blue-50 rounded-xl overflow-hidden border border-blue-100 relative shadow-inner">
      <div className="absolute top-2 left-2 bg-white/80 p-2 rounded text-xs text-slate-500 z-10">
        <span className="font-bold">Mapa Offline</span> (Esquemático)
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded shadow text-xs space-y-1 z-10">
        {routes.map(r => (
          <div key={r.id} className="flex items-center">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: r.color }}></span>
            {r.name}
          </div>
        ))}
      </div>

      <svg viewBox="0 0 100 60" className="w-full h-full min-h-[300px] touch-pan-x touch-pan-y">
        {/* Background - Amazon Forest representation */}
        <rect width="100" height="60" fill="#f0f9ff" />
        
        {/* River Paths */}
        {routes.map(route => (
          <path
            key={route.id}
            d={getRoutePath(route.id)}
            fill="none"
            stroke={route.color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
        ))}

        {/* Stops */}
        {stops.map(stop => (
          <g key={stop.id} className="cursor-pointer group">
            <circle
              cx={stop.mapX}
              cy={stop.mapY}
              r="1.2"
              fill="white"
              stroke="#0f766e"
              strokeWidth="0.5"
              className="group-hover:r-2 transition-all duration-300"
            />
            <text
              x={stop.mapX}
              y={stop.mapY - 2.5}
              textAnchor="middle"
              fontSize="2"
              fill="#334155"
              className="opacity-70 group-hover:opacity-100 font-medium select-none"
            >
              {stop.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default OfflineMap;