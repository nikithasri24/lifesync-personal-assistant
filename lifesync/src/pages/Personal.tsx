import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { 
  ShoppingCart, 
  ChefHat, 
  DollarSign,
  Plus,
  Check,
  X,
  Edit3,
  Trash2,
  Star,
  Clock,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';

type PersonalTab = 'shopping' | 'recipes' | 'finances';

const SHOPPING_CATEGORIES = ['groceries', 'household', 'personal', 'electronics', 'other'] as const;
const FINANCIAL_CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'];

export default function Personal() {
  const {
    shoppingItems,
    recipes,
    financialRecords,
    budgets,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleShoppingItem,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addFinancialRecord,
    deleteFinancialRecord,
    addBudget
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<PersonalTab>('shopping');
  const [showShoppingForm, setShowShoppingForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showFinanceForm, setShowFinanceForm] = useState(false);

  // Shopping form state
  const [shoppingForm, setShoppingForm] = useState({
    name: '',
    quantity: 1,
    category: 'groceries' as const,
    priority: 'medium' as const,
    price: '',
    store: '',
    notes: ''
  });

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'medium' as const,
    ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [''],
    tags: [] as string[],
    rating: 0
  });

  // Finance form state
  const [financeForm, setFinanceForm] = useState({
    type: 'expense' as const,
    amount: '',
    category: 'Food',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    account: ''
  });

  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    addShoppingItem({
      ...shoppingForm,
      price: shoppingForm.price ? parseFloat(shoppingForm.price) : undefined,
      purchased: false
    });
    setShoppingForm({
      name: '',
      quantity: 1,
      category: 'groceries',
      priority: 'medium',
      price: '',
      store: '',
      notes: ''
    });
    setShowShoppingForm(false);
  };

  const handleAddRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    addRecipe({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter(i => i.name.trim()),
      instructions: recipeForm.instructions.filter(i => i.trim())
    });
    setRecipeForm({
      name: '',
      description: '',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'medium',
      ingredients: [{ name: '', amount: '', unit: '' }],
      instructions: [''],
      tags: [],
      rating: 0
    });
    setShowRecipeForm(false);
  };

  const handleAddFinancialRecord = (e: React.FormEvent) => {
    e.preventDefault();
    addFinancialRecord({
      ...financeForm,
      amount: parseFloat(financeForm.amount),
      date: new Date(financeForm.date),
      tags: []
    });
    setFinanceForm({
      type: 'expense',
      amount: '',
      category: 'Food',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      account: ''
    });
    setShowFinanceForm(false);
  };

  const addIngredient = () => {
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, { name: '', amount: '', unit: '' }]
    });
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipeForm({ ...recipeForm, ingredients: newIngredients });
  };

  const addInstruction = () => {
    setRecipeForm({
      ...recipeForm,
      instructions: [...recipeForm.instructions, '']
    });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...recipeForm.instructions];
    newInstructions[index] = value;
    setRecipeForm({ ...recipeForm, instructions: newInstructions });
  };

  const thisMonthExpenses = financialRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return record.type === 'expense' &&
             recordDate.getMonth() === now.getMonth() &&
             recordDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, record) => sum + record.amount, 0);

  const thisMonthIncome = financialRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return record.type === 'income' &&
             recordDate.getMonth() === now.getMonth() &&
             recordDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, record) => sum + record.amount, 0);

  const tabs = [
    { id: 'shopping' as const, name: 'Shopping List', icon: ShoppingCart },
    { id: 'recipes' as const, name: 'Recipes', icon: ChefHat },
    { id: 'finances' as const, name: 'Finances', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personal Life</h1>
        <p className="text-gray-600">Organize your shopping, recipes, and finances</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Shopping List</h2>
            <button
              onClick={() => setShowShoppingForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>

          {/* Shopping Form Modal */}
          {showShoppingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Add Shopping Item</h3>
                <form onSubmit={handleAddShoppingItem} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={shoppingForm.name}
                    onChange={(e) => setShoppingForm({ ...shoppingForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={shoppingForm.quantity}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, quantity: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      min="1"
                    />
                    <select
                      value={shoppingForm.category}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, category: e.target.value as any })}
                      className="input-field"
                    >
                      {SHOPPING_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowShoppingForm(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">Add Item</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Shopping Items */}
          <div className="space-y-3">
            {shoppingItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Your shopping list is empty</p>
              </div>
            ) : (
              shoppingItems.map((item) => (
                <div
                  key={item.id}
                  className={`card flex items-center justify-between ${
                    item.purchased ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleShoppingItem(item.id)}
                      className="text-gray-400 hover:text-green-600"
                    >
                      {item.purchased ? <Check size={20} className="text-green-600" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded" />}
                    </button>
                    <div>
                      <h3 className={`font-medium ${item.purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.name} ({item.quantity})
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteShoppingItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recipes</h2>
            <button
              onClick={() => setShowRecipeForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Recipe</span>
            </button>
          </div>

          {/* Recipe Form Modal */}
          {showRecipeForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 my-8">
                <h3 className="text-lg font-semibold mb-4">Add New Recipe</h3>
                <form onSubmit={handleAddRecipe} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Recipe name"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={recipeForm.description}
                    onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                      <input
                        type="number"
                        value={recipeForm.prepTime}
                        onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (min)</label>
                      <input
                        type="number"
                        value={recipeForm.cookTime}
                        onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                      <input
                        type="number"
                        value={recipeForm.servings}
                        onChange={(e) => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 1 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={recipeForm.difficulty}
                        onChange={(e) => setRecipeForm({ ...recipeForm, difficulty: e.target.value as any })}
                        className="input-field"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                    {recipeForm.ingredients.map((ingredient, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Ingredient"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="input-field"
                        />
                        <input
                          type="text"
                          placeholder="Amount"
                          value={ingredient.amount}
                          onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                          className="input-field"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="input-field"
                        />
                      </div>
                    ))}
                    <button type="button" onClick={addIngredient} className="btn-secondary text-sm">
                      Add Ingredient
                    </button>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowRecipeForm(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">Add Recipe</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No recipes yet. Add your first recipe!</p>
              </div>
            ) : (
              recipes.map((recipe) => (
                <div key={recipe.id} className="card hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {recipe.prepTime + recipe.cookTime}min
                      </span>
                      <span className="flex items-center">
                        <Users size={12} className="mr-1" />
                        {recipe.servings}
                      </span>
                    </div>
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                  {recipe.rating && recipe.rating > 0 && (
                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < recipe.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => deleteRecipe(recipe.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Finances Tab */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Finances</h2>
            <button
              onClick={() => setShowFinanceForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Transaction</span>
            </button>
          </div>

          {/* Finance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month Income</p>
                  <p className="text-2xl font-semibold text-green-600">${thisMonthIncome.toFixed(2)}</p>
                </div>
                <TrendingUp className="text-green-500" size={24} />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month Expenses</p>
                  <p className="text-2xl font-semibold text-red-600">${thisMonthExpenses.toFixed(2)}</p>
                </div>
                <TrendingDown className="text-red-500" size={24} />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Income</p>
                  <p className={`text-2xl font-semibold ${
                    thisMonthIncome - thisMonthExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${(thisMonthIncome - thisMonthExpenses).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-gray-500" size={24} />
              </div>
            </div>
          </div>

          {/* Finance Form Modal */}
          {showFinanceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Add Transaction</h3>
                <form onSubmit={handleAddFinancialRecord} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={financeForm.type}
                      onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={financeForm.amount}
                      onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <select
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    className="input-field"
                  >
                    {FINANCIAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Description"
                    value={financeForm.description}
                    onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="date"
                    value={financeForm.date}
                    onChange={(e) => setFinanceForm({ ...financeForm, date: e.target.value })}
                    className="input-field"
                  />
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowFinanceForm(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">Add Transaction</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {financialRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                financialRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{record.description}</h4>
                        <p className="text-sm text-gray-500">
                          {record.category} • {format(new Date(record.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          record.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => deleteFinancialRecord(record.id)}
                          className="text-xs text-gray-400 hover:text-red-600 mt-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}