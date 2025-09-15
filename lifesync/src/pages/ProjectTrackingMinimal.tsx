import React, { useState } from 'react';

export default function ProjectTrackingMinimal() {
  const [test, setTest] = useState('Hello');
  
  try {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Tracking - Minimal</h1>
        <p>Test state: {test}</p>
        <button 
          onClick={() => setTest('Clicked!')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Button
        </button>
      </div>
    );
  } catch (error) {
    console.error('Error in ProjectTrackingMinimal:', error);
    return <div>Error: {String(error)}</div>;
  }
}