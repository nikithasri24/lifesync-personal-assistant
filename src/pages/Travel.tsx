import React from 'react'
import WorldVisitedSVG from '../components/WorldVisitedSVG'
import USVisitedSVG from '../components/USVisitedSVG'
import CanadaVisitedSVG from '../components/CanadaVisitedSVG'
import IndiaVisitedSVG from '../components/IndiaVisitedSVG'
import { useState } from 'react'

const Travel: React.FC = () => {
  const [mapType, setMapType] = useState<'world' | 'us' | 'canada' | 'india'>('world')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Travel Map</h2>
          <p className="text-gray-600">Click countries to mark them as visited. Saved locally on this device.</p>
        </div>
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMapType('world')}
            className={`px-3 py-1.5 text-sm rounded-md ${mapType === 'world' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >World</button>
          <button
            onClick={() => setMapType('us')}
            className={`ml-1 px-3 py-1.5 text-sm rounded-md ${mapType === 'us' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >US States</button>
          <button
            onClick={() => setMapType('canada')}
            className={`ml-1 px-3 py-1.5 text-sm rounded-md ${mapType === 'canada' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >Canada</button>
          <button
            onClick={() => setMapType('india')}
            className={`ml-1 px-3 py-1.5 text-sm rounded-md ${mapType === 'india' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >India</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive {mapType === 'world' ? 'World' : mapType === 'us' ? 'US States' : mapType === 'canada' ? 'Canada Provinces' : 'India States'} Map</h3>
        {mapType === 'world' && <WorldVisitedSVG />}
        {mapType === 'us' && <USVisitedSVG />}
        {mapType === 'canada' && <CanadaVisitedSVG />}
        {mapType === 'india' && <IndiaVisitedSVG />}
      </div>
    </div>
  )
}

export default Travel
