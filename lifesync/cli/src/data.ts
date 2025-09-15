import fs from 'fs-extra';
import path from 'path';
import { ShoppingItem, Recipe, MealPlan, Store, TodoItem, TodoCategory } from './types.js';
import { loadConfig } from './config.js';

export class DataManager {
  private config: any;
  private dataPath: string;

  constructor() {
    this.config = null;
    this.dataPath = '';
  }

  async init() {
    this.config = await loadConfig();
    this.dataPath = this.config.dataPath;
    await fs.ensureDir(this.dataPath);
  }

  private getFilePath(type: string): string {
    return path.join(this.dataPath, `${type}.json`);
  }

  private async readData<T>(type: string): Promise<T[]> {
    try {
      const filePath = this.getFilePath(type);
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error(`Error reading ${type} data:`, error);
      return [];
    }
  }

  private async writeData<T>(type: string, data: T[]): Promise<void> {
    try {
      const filePath = this.getFilePath(type);
      await fs.writeJson(filePath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Error writing ${type} data:`, error);
    }
  }

  // Shopping Items
  async getShoppingItems(): Promise<ShoppingItem[]> {
    return this.readData<ShoppingItem>('shopping');
  }

  async addShoppingItem(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShoppingItem> {
    const items = await this.getShoppingItems();
    const newItem: ShoppingItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    items.push(newItem);
    await this.writeData('shopping', items);
    return newItem;
  }

  async updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null> {
    const items = await this.getShoppingItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates, updatedAt: new Date() };
    await this.writeData('shopping', items);
    return items[index];
  }

  async deleteShoppingItem(id: string): Promise<boolean> {
    const items = await this.getShoppingItems();
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    await this.writeData('shopping', filteredItems);
    return true;
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return this.readData<Recipe>('recipes');
  }

  async addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const recipes = await this.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    recipes.push(newRecipe);
    await this.writeData('recipes', recipes);
    return newRecipe;
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) return null;
    
    recipes[index] = { ...recipes[index], ...updates };
    await this.writeData('recipes', recipes);
    return recipes[index];
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const recipes = await this.getRecipes();
    const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
    if (filteredRecipes.length === recipes.length) return false;
    
    await this.writeData('recipes', filteredRecipes);
    return true;
  }

  // Meal Plans
  async getMealPlans(): Promise<MealPlan[]> {
    return this.readData<MealPlan>('meals');
  }

  async addMealPlan(meal: Omit<MealPlan, 'id'>): Promise<MealPlan> {
    const meals = await this.getMealPlans();
    const newMeal: MealPlan = {
      ...meal,
      id: Date.now().toString()
    };
    meals.push(newMeal);
    await this.writeData('meals', meals);
    return newMeal;
  }

  async updateMealPlan(id: string, updates: Partial<MealPlan>): Promise<MealPlan | null> {
    const meals = await this.getMealPlans();
    const index = meals.findIndex(meal => meal.id === id);
    if (index === -1) return null;
    
    meals[index] = { ...meals[index], ...updates };
    await this.writeData('meals', meals);
    return meals[index];
  }

  async deleteMealPlan(id: string): Promise<boolean> {
    const meals = await this.getMealPlans();
    const filteredMeals = meals.filter(meal => meal.id !== id);
    if (filteredMeals.length === meals.length) return false;
    
    await this.writeData('meals', filteredMeals);
    return true;
  }

  // Stores
  async getStores(): Promise<Store[]> {
    return this.readData<Store>('stores');
  }

  async addStore(store: Omit<Store, 'id'>): Promise<Store> {
    const stores = await this.getStores();
    const newStore: Store = {
      ...store,
      id: Date.now().toString()
    };
    stores.push(newStore);
    await this.writeData('stores', stores);
    return newStore;
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
    const stores = await this.getStores();
    const index = stores.findIndex(store => store.id === id);
    if (index === -1) return null;
    
    stores[index] = { ...stores[index], ...updates };
    await this.writeData('stores', stores);
    return stores[index];
  }

  async deleteStore(id: string): Promise<boolean> {
    const stores = await this.getStores();
    const filteredStores = stores.filter(store => store.id !== id);
    if (filteredStores.length === stores.length) return false;
    
    await this.writeData('stores', filteredStores);
    return true;
  }

  // Todo Items
  async getTodoItems(): Promise<TodoItem[]> {
    return this.readData<TodoItem>('todos');
  }

  async addTodoItem(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    const items = await this.getTodoItems();
    const newItem: TodoItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    items.push(newItem);
    await this.writeData('todos', items);
    return newItem;
  }

  async updateTodoItem(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    const items = await this.getTodoItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates, updatedAt: new Date() };
    await this.writeData('todos', items);
    return items[index];
  }

  async deleteTodoItem(id: string): Promise<boolean> {
    const items = await this.getTodoItems();
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    await this.writeData('todos', filteredItems);
    return true;
  }

  // Todo Categories
  async getTodoCategories(): Promise<TodoCategory[]> {
    return this.readData<TodoCategory>('todoCategories');
  }

  async addTodoCategory(category: Omit<TodoCategory, 'id' | 'createdAt'>): Promise<TodoCategory> {
    const categories = await this.getTodoCategories();
    const newCategory: TodoCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    categories.push(newCategory);
    await this.writeData('todoCategories', categories);
    return newCategory;
  }

  async updateTodoCategory(id: string, updates: Partial<TodoCategory>): Promise<TodoCategory | null> {
    const categories = await this.getTodoCategories();
    const index = categories.findIndex(category => category.id === id);
    if (index === -1) return null;
    
    categories[index] = { ...categories[index], ...updates };
    await this.writeData('todoCategories', categories);
    return categories[index];
  }

  async deleteTodoCategory(id: string): Promise<boolean> {
    const categories = await this.getTodoCategories();
    const filteredCategories = categories.filter(category => category.id !== id);
    if (filteredCategories.length === categories.length) return false;
    
    await this.writeData('todoCategories', filteredCategories);
    return true;
  }
}

export const dataManager = new DataManager();