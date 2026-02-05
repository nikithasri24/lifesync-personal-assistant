import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChefHat, ShoppingCart, Loader2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import type { GroceryItem, GroceryItemStatus } from '../../hooks/useGroceryList';

interface GroceryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryList: GroceryItem[];
  neededItems: GroceryItem[];
  atHomeItems: GroceryItem[];
  inCartItems: GroceryItem[];
  purchasedItems: GroceryItem[];
  weekStartDate: Date;
  updateItemStatus: (itemId: string, status: GroceryItemStatus) => void;
  getStatusColor: (status: GroceryItemStatus) => string;
  onCopyCart: () => void;
  onSendToShoppingList?: (items: GroceryItem[]) => Promise<{ success: boolean; count: number }>;
}

export function GroceryListModal({
  isOpen,
  onClose,
  groceryList,
  neededItems,
  atHomeItems,
  inCartItems,
  purchasedItems,
  weekStartDate,
  updateItemStatus,
  getStatusColor,
  onCopyCart,
  onSendToShoppingList,
}: GroceryListModalProps): React.ReactElement | null {
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; count: number } | null>(null);

  if (!isOpen) return null;

  const handleSendToShoppingList = async (): Promise<void> => {
    if (!onSendToShoppingList || inCartItems.length === 0) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await onSendToShoppingList(inCartItems);
      setSendResult(result);

      // Clear the result message after 3 seconds
      setTimeout(() => setSendResult(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ModalShell
      title="Smart Grocery List"
      subtitle={`Week of ${format(weekStartDate, 'MMM d, yyyy')}`}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{neededItems.length}</div>
            <div className="text-xs text-slate-600">Needed</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{atHomeItems.length}</div>
            <div className="text-xs text-green-600">At Home</div>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{inCartItems.length}</div>
            <div className="text-xs text-indigo-600">In Cart</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{purchasedItems.length}</div>
            <div className="text-xs text-gray-500">Purchased</div>
          </div>
        </div>

        {groceryList.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <ChefHat className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium">No recipes with ingredients in this week's plan.</p>
            <p className="mt-1 text-sm">Add some recipes to your meal plan to generate a grocery list.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            {/* Needed Items */}
            {neededItems.length > 0 && (
              <ItemSection
                title={`Items to Buy (${neededItems.length})`}
                items={neededItems}
                getStatusColor={getStatusColor}
                updateItemStatus={updateItemStatus}
                actions={(item) => (
                  <>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.id, 'at_home')}
                      className="rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                      aria-label={`Mark ${item.name} as at home`}
                      title="Mark as at home"
                    >
                      At Home
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.id, 'in_cart')}
                      className="rounded px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      aria-label={`Add ${item.name} to cart`}
                      title="Add to cart"
                    >
                      Add to Cart
                    </button>
                  </>
                )}
              />
            )}

            {/* In Cart Items */}
            {inCartItems.length > 0 && (
              <ItemSection
                title={`In Your Cart (${inCartItems.length})`}
                items={inCartItems}
                getStatusColor={getStatusColor}
                updateItemStatus={updateItemStatus}
                titleColor="text-indigo-700"
                actions={(item) => (
                  <>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.id, 'needed')}
                      className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                      aria-label={`Remove ${item.name} from cart`}
                      title="Move back to needed"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemStatus(item.id, 'purchased')}
                      className="rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      aria-label={`Mark ${item.name} as purchased`}
                      title="Mark as purchased"
                    >
                      Purchased
                    </button>
                  </>
                )}
              />
            )}

            {/* At Home Items */}
            {atHomeItems.length > 0 && (
              <ItemSection
                title={`Already at Home (${atHomeItems.length})`}
                items={atHomeItems}
                getStatusColor={getStatusColor}
                updateItemStatus={updateItemStatus}
                titleColor="text-green-700"
                actions={(item) => (
                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'needed')}
                    className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    aria-label={`Mark ${item.name} as needed to buy`}
                    title="Move back to needed"
                  >
                    Need to Buy
                  </button>
                )}
              />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        {/* Result message */}
        {sendResult && (
          <div className={`text-sm text-center py-2 px-4 rounded-md ${
            sendResult.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {sendResult.success
              ? `✓ Added ${sendResult.count} item${sendResult.count !== 1 ? 's' : ''} to Shopping List`
              : 'Failed to add items to Shopping List'}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{groceryList.length}</span> total items •
            <span className="font-medium text-indigo-600"> {inCartItems.length}</span> in cart
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopyCart}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Copy cart list to clipboard"
            >
              Copy Cart List
            </button>
            {onSendToShoppingList && (
              <button
                type="button"
                onClick={handleSendToShoppingList}
                disabled={isSending || inCartItems.length === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                aria-label="Send cart items to shopping list"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Send to Shopping List
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              aria-label="Close grocery list modal"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

interface ItemSectionProps {
  title: string;
  items: GroceryItem[];
  getStatusColor: (status: GroceryItemStatus) => string;
  updateItemStatus: (itemId: string, status: GroceryItemStatus) => void;
  titleColor?: string;
  actions: (item: GroceryItem) => React.ReactNode;
}

function ItemSection({ title, items, getStatusColor, titleColor = 'text-slate-700', actions }: ItemSectionProps): React.ReactElement {
  return (
    <div className="mb-4">
      <h3 className={`text-sm font-semibold ${titleColor} mb-2 sticky top-0 bg-white py-2`}>{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 transition ${getStatusColor(item.status)}`}>
            <div className="flex-1">
              <div className="font-medium">
                {item.amount && item.unit ? `${item.amount} ${item.unit} ` : item.amount ? `${item.amount} ` : ''}
                {item.name}
              </div>
              <div className="mt-0.5 text-xs opacity-70">For: {item.recipes.join(', ')}</div>
            </div>
            <div className="flex gap-1">{actions(item)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
