# LifeSync CLI

Command-line interface for the LifeSync personal productivity suite. Manage your shopping lists, meal planning, and recipes directly from your terminal.

## Installation

```bash
cd cli
npm install
npm run build

# Install globally (optional)
npm link
```

## Quick Start

1. **Initial Setup**
   ```bash
   lifesync config setup
   ```

2. **Add items to shopping list**
   ```bash
   lifesync add bananas
   lifesync add "organic milk" -q 2 -u cartons --organic
   ```

3. **Plan meals**
   ```bash
   lifesync meal add "pasta carbonara" -d monday -t dinner
   lifesync meal week
   ```

4. **Manage recipes**
   ```bash
   lifesync recipe add "Spaghetti Carbonara"
   lifesync recipe import "https://youtube.com/watch?v=recipe"
   ```

## Commands

### Quick Actions
- `lifesync quick` - Interactive quick actions menu
- `lifesync add [item]` - Add item to shopping list
- `lifesync add -m [meal]` - Add meal to plan
- `lifesync list` - Show shopping list
- `lifesync list -m` - Show meal plan
- `lifesync status` - Overview of all data

### Shopping List
- `lifesync shopping add [item]` - Add item to shopping list
- `lifesync shopping list` - Show shopping list
- `lifesync shopping buy <item>` - Mark item as purchased
- `lifesync shopping remove <item>` - Remove item
- `lifesync shopping clear` - Remove all purchased items

**Options for adding items:**
- `-q, --quantity <number>` - Quantity (default: 1)
- `-u, --unit <string>` - Unit (pcs, lbs, oz, etc.)
- `-c, --category <string>` - Category
- `-p, --priority <string>` - Priority (low, medium, high)
- `--price <number>` - Estimated price
- `--store <string>` - Preferred store
- `--brand <string>` - Brand
- `--organic` - Mark as organic
- `--notes <string>` - Notes

### Meal Planning
- `lifesync meals add [meal]` - Add meal to weekly plan
- `lifesync meals week` - Show weekly meal plan
- `lifesync meals status <meal> -s <status>` - Update meal status
- `lifesync meals remove <meal>` - Remove meal from plan

**Options for adding meals:**
- `-d, --date <date>` - Date (YYYY-MM-DD, day name, today, tomorrow)
- `-t, --type <string>` - Meal type (breakfast, lunch, dinner, snack)
- `-s, --servings <number>` - Number of servings
- `-p, --people <number>` - Number of people
- `-n, --notes <string>` - Notes

### Recipe Management
- `lifesync recipes add [name]` - Add new recipe
- `lifesync recipes list` - List all recipes
- `lifesync recipes show <recipe>` - Show recipe details
- `lifesync recipes import <url>` - Import recipe from URL
- `lifesync recipes remove <recipe>` - Remove recipe

**Filter options for listing:**
- `-c, --cuisine <string>` - Filter by cuisine
- `-d, --difficulty <string>` - Filter by difficulty
- `-t, --tag <string>` - Filter by tag
- `--quick` - Show only quick recipes (< 30 min)

### Data Synchronization
- `lifesync sync all` - Sync all data with web app
- `lifesync sync shopping` - Sync shopping items only
- `lifesync sync recipes` - Sync recipes only
- `lifesync sync meals` - Sync meal plans only
- `lifesync sync export` - Export data to JSON file
- `lifesync sync import <file>` - Import data from JSON file
- `lifesync sync status` - Check sync status

**Sync options:**
- `-p, --push` - Push local data to web app only
- `-l, --pull` - Pull web app data to local only

### Configuration
- `lifesync config setup` - Run initial setup wizard
- `lifesync config show` - Show current configuration
- `lifesync config set <key> <value>` - Set configuration value
- `lifesync config reset` - Reset to defaults

## Examples

### Shopping List Management
```bash
# Add items with various options
lifesync add "organic bananas" -q 6 -u pcs -c produce --organic
lifesync add "ground beef" -q 2 -u lbs -p high --store "whole foods"
lifesync add "milk" -q 1 -u gallon --price 4.99

# View and manage list
lifesync shopping list
lifesync shopping list -c produce
lifesync shopping buy bananas --price 5.99
lifesync shopping clear
```

### Meal Planning
```bash
# Add meals for the week
lifesync meal add "pasta carbonara" -d monday -t dinner -s 4 -p 2
lifesync meal add "oatmeal" -d tuesday -t breakfast
lifesync meal add "chicken salad" -d wednesday -t lunch

# View meal plan
lifesync meal week
lifesync meal week -d "2024-01-15"

# Update meal status
lifesync meal status "pasta carbonara" -s prepped
lifesync meal status "oatmeal" -s cooked
```

### Recipe Management
```bash
# Add recipe interactively
lifesync recipe add "Spaghetti Carbonara"

# Import from URL
lifesync recipe import "https://youtube.com/watch?v=recipe123"

# List and filter recipes
lifesync recipe list
lifesync recipe list -c italian
lifesync recipe list --quick
lifesync recipe list -d easy

# View recipe details
lifesync recipe show carbonara
```

### Data Sync
```bash
# Sync with web application
lifesync sync all
lifesync sync shopping --push
lifesync sync recipes --pull

# Export/import data
lifesync sync export
lifesync sync import ./backup.json

# Check sync status
lifesync sync status
```

## Configuration

The CLI stores data in `~/.lifesync/`:
- `config.json` - Configuration settings
- `data/` - Local data files (shopping.json, recipes.json, meals.json)

Default configuration:
```json
{
  "apiUrl": "http://localhost:3000",
  "dataPath": "~/.lifesync/data",
  "defaultStore": "",
  "defaultMealType": "dinner",
  "defaultCategory": "other",
  "username": "user"
}
```

## Integration with Web App

The CLI can sync data with the LifeSync web application:

1. Make sure the web app is running (usually on http://localhost:3000)
2. Configure the API URL: `lifesync config set apiUrl http://localhost:3000`
3. Sync data: `lifesync sync all`

The CLI maintains local data files, so you can use it offline and sync when connected.

## Advanced Usage

### Date Parsing
The CLI accepts flexible date formats:
- `2024-01-15` - Specific date
- `monday`, `tuesday`, etc. - Next occurrence of that day
- `today` - Today
- `tomorrow` - Tomorrow

### Search and Filtering
Most list commands support searching:
- By name: `lifesync shopping list` (searches in item names)
- By category: `lifesync shopping list -c produce`
- By store: `lifesync shopping list -s "whole foods"`
- By priority: `lifesync shopping list -p high`

### Batch Operations
```bash
# Add multiple items
lifesync add apples
lifesync add oranges
lifesync add bananas

# Clear all purchased items
lifesync shopping clear

# View overview
lifesync status
```

## Troubleshooting

### Common Issues

1. **Config not found**: Run `lifesync config setup`
2. **Sync failed**: Check web app is running with `lifesync sync status`
3. **Command not found**: Install globally with `npm link` or use `npm run dev`

### Getting Help
- `lifesync --help` - General help
- `lifesync <command> --help` - Command-specific help
- `lifesync quick` - Interactive mode for beginners