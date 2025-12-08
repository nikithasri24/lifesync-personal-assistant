import type { StateCreator } from 'zustand';
import type { ShoppingItemData, ShoppingListData } from '@/services/types';
import {
  createShoppingItem,
  createShoppingList,
  deleteShoppingItem,
  getShoppingListItems,
  getShoppingLists,
  updateShoppingItem,
} from '@/api/shoppingAPI';

type ShoppingListInput = Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>;
type ShoppingItemInput = Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>;

export interface ShoppingSlice {
  shoppingLists: ShoppingListData[];
  shoppingListsLoaded: boolean;
  shoppingListsLoading: boolean;
  shoppingError: string | null;

  itemsByList: Record<string, ShoppingItemData[]>;
  itemsLoading: boolean;

  loadShoppingLists: () => Promise<void>;
  addShoppingList: (list: ShoppingListInput) => Promise<ShoppingListData>;
  loadShoppingItems: (listId: string) => Promise<void>;
  addShoppingItem: (listId: string, item: ShoppingItemInput) => Promise<ShoppingItemData>;
  updateShoppingItem: (itemId: string, updates: Partial<ShoppingItemData>) => Promise<ShoppingItemData>;
  deleteShoppingItem: (itemId: string, listId: string) => Promise<void>;
  getShoppingListById: (id: string) => ShoppingListData | undefined;
}

export const createShoppingSlice: StateCreator<ShoppingSlice, [], [], ShoppingSlice> = (set, get) => ({
  shoppingLists: [],
  shoppingListsLoaded: false,
  shoppingListsLoading: false,
  shoppingError: null,
  itemsByList: {},
  itemsLoading: false,

  loadShoppingLists: async () => {
    if (get().shoppingListsLoading) return;
    set({ shoppingListsLoading: true, shoppingError: null });
    try {
      const shoppingLists = await getShoppingLists();
      set({ shoppingLists, shoppingListsLoaded: true, shoppingListsLoading: false });
    } catch (error) {
      set({
        shoppingError: error instanceof Error ? error.message : 'Failed to load shopping lists',
        shoppingListsLoading: false,
      });
      throw error;
    }
  },

  addShoppingList: async (list) => {
    const created = await createShoppingList(list);
    set((state) => ({ shoppingLists: [created, ...state.shoppingLists] }));
    return created;
  },

  loadShoppingItems: async (listId) => {
    set({ itemsLoading: true });
    try {
      const items = await getShoppingListItems(listId);
      set((state) => ({
        itemsByList: { ...state.itemsByList, [listId]: items },
        itemsLoading: false,
      }));
    } catch (error) {
      set({ itemsLoading: false });
      throw error;
    }
  },

  addShoppingItem: async (listId, item) => {
    const created = await createShoppingItem(listId, item);
    set((state) => {
      const listItems = state.itemsByList[listId] ?? [];
      return { itemsByList: { ...state.itemsByList, [listId]: [created, ...listItems] } };
    });
    return created;
  },

  updateShoppingItem: async (itemId, updates) => {
    const updated = await updateShoppingItem(itemId, updates);
    set((state) => {
      const listId = updated.shopping_list_id;
      const listItems = state.itemsByList[listId] ?? [];
      return {
        itemsByList: {
          ...state.itemsByList,
          [listId]: listItems.map((item) => (item.id === itemId ? { ...item, ...updated } : item)),
        },
      };
    });
    return updated;
  },

  deleteShoppingItem: async (itemId, listId) => {
    await deleteShoppingItem(itemId);
    set((state) => {
      const listItems = state.itemsByList[listId] ?? [];
      return {
        itemsByList: {
          ...state.itemsByList,
          [listId]: listItems.filter((item) => item.id !== itemId),
        },
      };
    });
  },

  getShoppingListById: (id) => get().shoppingLists.find((list) => list.id === id),
});
