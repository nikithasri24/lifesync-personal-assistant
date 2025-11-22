import React from 'react';

interface AddDestinationFormProps {
  selectedCountry: string;
  availableCountries: string[];
  onCountryChange: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

const AddDestinationForm: React.FC<AddDestinationFormProps> = ({
  selectedCountry,
  availableCountries,
  onCountryChange,
  onAdd,
  onCancel,
}) => {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
      >
        <option value="">-- Select country --</option>
        {availableCountries.map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={onAdd}
          disabled={!selectedCountry}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300"
        >
          Add Destination
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddDestinationForm;
