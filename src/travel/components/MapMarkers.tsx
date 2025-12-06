import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import type { VisitStatus } from '../types';
import { nationalParks } from '../data/nationalParks';
import { islands } from '../data/islands';
import { createParkIcon, createIslandIcon } from './mapIcons';

interface MapMarkersProps {
  showNationalParks: boolean;
  showIslands: boolean;
  visitedParks: Record<string, VisitStatus>;
  visitedIslands: Record<string, VisitStatus>;
  onParkClick?: (parkId: string) => void;
  onIslandClick?: (islandId: string) => void;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  showNationalParks,
  showIslands,
  visitedParks,
  visitedIslands,
  onParkClick,
  onIslandClick,
}) => {
  return (
    <>
      {/* National Parks markers */}
      {showNationalParks && nationalParks.map(park => {
        const isVisited = !!visitedParks[park.id];
        return (
          <Marker
            key={park.id}
            position={[park.lat, park.lon]}
            icon={createParkIcon(isVisited)}
            eventHandlers={{
              click: () => onParkClick?.(park.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div style={{ padding: '8px', minWidth: '250px', maxWidth: '300px' }}>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#111827',
                  fontSize: '15px',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {park.name}
                </h3>
                {park.established && (
                  <p style={{
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500',
                    margin: '3px 0'
                  }}>
                    Est. {park.established}
                  </p>
                )}
                {park.unesco && (
                  <p style={{
                    fontSize: '12px',
                    color: '#1d4ed8',
                    fontWeight: 'bold',
                    margin: '4px 0'
                  }}>
                    UNESCO World Heritage Site
                  </p>
                )}
                {park.description && (
                  <p style={{
                    fontSize: '13px',
                    color: '#1f2937',
                    marginTop: '6px',
                    lineHeight: '1.4'
                  }}>
                    {park.description}
                  </p>
                )}
                <p style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  fontWeight: '600'
                }}>
                  {isVisited ? (
                    <span style={{ color: '#15803d' }}>✓ Visited</span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>Click to mark as visited</span>
                  )}
                </p>
              </div>
            </Tooltip>
          </Marker>
        );
      })}

      {/* Islands markers */}
      {showIslands && islands.map(island => {
        const isVisited = !!visitedIslands[island.id];
        return (
          <Marker
            key={island.id}
            position={[island.lat, island.lon]}
            icon={createIslandIcon(isVisited)}
            eventHandlers={{
              click: () => onIslandClick?.(island.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div style={{ padding: '8px', minWidth: '250px', maxWidth: '300px' }}>
                <h3 style={{
                  fontWeight: 'bold',
                  color: '#111827',
                  fontSize: '15px',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {island.name}
                </h3>
                {island.islandGroup && (
                  <p style={{
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500',
                    margin: '3px 0'
                  }}>
                    {island.islandGroup}
                  </p>
                )}
                {island.description && (
                  <p style={{
                    fontSize: '13px',
                    color: '#1f2937',
                    marginTop: '6px',
                    lineHeight: '1.4'
                  }}>
                    {island.description}
                  </p>
                )}
                <p style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  fontWeight: '600'
                }}>
                  {isVisited ? (
                    <span style={{ color: '#1d4ed8' }}>✓ Visited</span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>Click to mark as visited</span>
                  )}
                </p>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};
