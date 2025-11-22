import React from 'react';

interface NewTripFormProps {
  tripName: string;
  description: string;
  startDate: string;
  endDate: string;
  onTripNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

const NewTripForm: React.FC<NewTripFormProps> = ({
  tripName,
  description,
  startDate,
  endDate,
  onTripNameChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onCreate,
  onCancel,
}) => {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <input
        type="text"
        placeholder="Trip name"
        value={tripName}
        onChange={(e) => onTripNameChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          type="date"
          placeholder="Start date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="date"
          placeholder="End date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCreate}
          disabled={!tripName.trim()}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300"
        >
          Create
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

export default NewTripForm;
