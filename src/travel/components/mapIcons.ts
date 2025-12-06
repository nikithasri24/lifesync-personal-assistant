import L from 'leaflet';

// Custom icons for national parks and islands
export const createParkIcon = (visited: boolean): L.DivIcon => {
  return L.divIcon({
    className: 'custom-park-icon',
    html: `<div style="
      background-color: ${visited ? '#10B981' : '#6B7280'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">🌲</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createIslandIcon = (visited: boolean): L.DivIcon => {
  return L.divIcon({
    className: 'custom-island-icon',
    html: `<div style="
      background-color: ${visited ? '#3B82F6' : '#9CA3AF'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">🏝️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};
