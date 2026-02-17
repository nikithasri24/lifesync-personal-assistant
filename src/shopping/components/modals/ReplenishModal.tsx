import React, { useState } from 'react';

interface ReplenishModalProps {
  itemName: string;
  currentQuantity: number;
  suggestedTarget: number;
  onReplenish: (targetQuantity: number) => Promise<void>;
  onCancel: () => void;
}

export function ReplenishModal({
  itemName,
  currentQuantity: _currentQuantity,
  suggestedTarget,
  onReplenish,
  onCancel
}: ReplenishModalProps): React.JSX.Element {
  const [targetQuantity, setTargetQuantity] = useState(String(suggestedTarget));

  const handleReplenish = async (): Promise<void> => {
    await onReplenish(Number(targetQuantity) || 0);
  };

  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span className="text-gray-700">Replenish {itemName} to target quantity:</span>
      <input
        type="number"
        min={0}
        value={targetQuantity}
        onChange={(e) => setTargetQuantity(e.target.value)}
        className="w-28 rounded border border-gray-300 px-2 py-1"
      />
      <button
        className="px-3 py-1 rounded bg-[#C18B5E] text-white hover:bg-[#B5795A]"
        onClick={() => void handleReplenish()}
      >
        Go
      </button>
      <button
        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
