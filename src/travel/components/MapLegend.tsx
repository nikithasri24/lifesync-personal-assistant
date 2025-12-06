import React from 'react';

interface MapLegendProps {
  currentZoom: number;
  showNationalParks: boolean;
  showIslands: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  currentZoom,
  showNationalParks,
  showIslands,
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
      <div className="space-y-2">
        {currentZoom < 5 ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300 bg-green-300"></div>
              <span className="text-xs text-gray-700 font-medium">Visited Country</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
              <span className="text-xs text-gray-700 font-medium">Not Visited</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300 bg-emerald-400"></div>
              <span className="text-xs text-gray-700 font-medium">Visited State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
              <span className="text-xs text-gray-700 font-medium">Not Visited</span>
            </div>
          </>
        )}

        {/* Park and Island markers */}
        {(showNationalParks || showIslands) && (
          <div className="border-t border-gray-200 mt-2 pt-2">
            {showNationalParks && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-xs shadow">
                    🌲
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Visited Park</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs shadow">
                    🌲
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Not Visited Park</span>
                </div>
              </>
            )}
            {showIslands && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs shadow">
                    🏝️
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Visited Island</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs shadow">
                    🏝️
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Not Visited Island</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {currentZoom < 5 ? 'Zoom in (5+) to see & click states' : 'Click states to mark as visited'}
      </p>
    </div>
  );
};
