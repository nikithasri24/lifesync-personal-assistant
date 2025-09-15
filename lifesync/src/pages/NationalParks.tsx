import React from 'react';
import NationalParksMap from '../components/NationalParksMap';
import '../styles/leaflet-custom.css';

const NationalParks: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <NationalParksMap />
    </div>
  );
};

export default NationalParks;