import { Router } from 'express'

export const recipeSearchRouter = Router()

// Common ingredient suggestions by recipe type
const ingredientSuggestions: Record<string, string[]> = {
  'chicken': ['chicken breast', 'olive oil', 'garlic', 'salt', 'pepper', 'herbs'],
  'pasta': ['pasta', 'olive oil', 'garlic', 'parmesan cheese', 'salt', 'pepper'],
  'salad': ['mixed greens', 'tomatoes', 'cucumber', 'olive oil', 'lemon juice', 'salt'],
  'soup': ['broth', 'vegetables', 'onion', 'garlic', 'salt', 'pepper', 'herbs'],
  'curry': ['curry powder', 'onion', 'garlic', 'ginger', 'coconut milk', 'vegetables'],
  'stir fry': ['oil', 'garlic', 'ginger', 'soy sauce', 'vegetables', 'protein'],
  'tacos': ['tortillas', 'protein', 'cheese', 'lettuce', 'tomatoes', 'lime'],
  'pizza': ['pizza dough', 'tomato sauce', 'mozzarella cheese', 'toppings'],
  'sandwich': ['bread', 'protein', 'lettuce', 'tomato', 'condiments'],
  'smoothie': ['fruits', 'yogurt', 'milk', 'honey'],
  'omelette': ['eggs', 'butter', 'cheese', 'vegetables', 'salt', 'pepper'],
  'rice': ['rice', 'water', 'salt', 'butter'],
  'fish': ['fish fillet', 'lemon', 'olive oil', 'herbs', 'salt', 'pepper'],
  'beef': ['beef', 'oil', 'garlic', 'onion', 'salt', 'pepper'],
  'vegetables': ['mixed vegetables', 'olive oil', 'garlic', 'salt', 'herbs'],
}

function getIngredientSuggestions(recipeName: string): string[] {
  const lowerName = recipeName.toLowerCase()

  // Find matching category
  for (const [key, ingredients] of Object.entries(ingredientSuggestions)) {
    if (lowerName.includes(key)) {
      return ingredients
    }
  }

  // Default ingredients
  return ['main ingredient', 'olive oil', 'garlic', 'salt', 'pepper']
}

function generateInstructions(recipeName: string): string[] {
  const lowerName = recipeName.toLowerCase()

  // Type-specific instructions
  if (lowerName.includes('salad')) {
    return [
      'Wash and chop all vegetables.',
      'Combine ingredients in a large bowl.',
      'Prepare dressing by mixing oil, lemon juice, and seasonings.',
      'Toss salad with dressing just before serving.'
    ]
  }

  if (lowerName.includes('pasta')) {
    return [
      'Bring a large pot of salted water to boil.',
      'Cook pasta according to package directions.',
      'While pasta cooks, prepare the sauce.',
      'Drain pasta and toss with sauce.',
      'Serve hot with grated cheese.'
    ]
  }

  if (lowerName.includes('soup')) {
    return [
      'Heat oil in a large pot over medium heat.',
      'Sauté onions and garlic until fragrant.',
      'Add vegetables and cook for 5 minutes.',
      'Pour in broth and bring to a boil.',
      'Reduce heat and simmer for 20-25 minutes.',
      'Season to taste and serve hot.'
    ]
  }

  // Generic cooking instructions
  return [
    `Gather all ingredients for ${recipeName.toLowerCase()}.`,
    'Prepare ingredients by washing and chopping as needed.',
    'Heat oil in a pan over medium heat.',
    'Cook main ingredients according to desired doneness.',
    'Add seasonings and adjust to taste.',
    'Serve hot and enjoy!'
  ]
}

// GET /api/recipe/search?q=<query>
// Returns an intelligent scaffolded recipe JSON for the given query.
recipeSearchRouter.get('/search', async (req: any, res: any) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' })
    }

    // Derive a display name: strip trailing 'recipe' and title-case
    const raw = q.replace(/\brecipe\b/gi, '').trim() || q
    const name = raw
      .split(/\s+/)
      .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
      .join(' ')

    // Get intelligent ingredient suggestions
    const suggestedIngredients = getIngredientSuggestions(name)
    const ingredients = suggestedIngredients.map(ing => ({ name: ing }))

    // Get type-specific instructions
    const instructions = generateInstructions(name)

    // Provide an intelligent, editable scaffold
    const payload = {
      name,
      description: '',
      ingredients,
      instructions,
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      tags: ['auto-generated', 'editable'],
      image: null,
      sourceUrl: undefined,
      authorName: 'Auto-Generated',
    }

    return res.json(payload)
  } catch (e: any) {
    return res.status(500).json({ error: 'Recipe search failed', details: e?.message || String(e) })
  }
})
