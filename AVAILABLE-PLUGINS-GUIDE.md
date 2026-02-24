# Available Plugins Guide for LifeSync

This document catalogs all available plugins (Capacitor mobile plugins and Claude MCP servers) that could enhance the LifeSync Personal Assistant app.

**Last Updated:** February 24, 2026

---

## Table of Contents

- [Capacitor Plugins (Mobile Features)](#capacitor-plugins-mobile-features)
  - [Security & Authentication](#security--authentication)
  - [Camera & Media](#camera--media)
  - [Notifications](#notifications)
  - [Storage & Data](#storage--data)
  - [Health & Fitness](#health--fitness)
  - [Calendar & Events](#calendar--events)
  - [Payments & Subscriptions](#payments--subscriptions)
  - [Location & Maps](#location--maps)
  - [Device Features](#device-features)
  - [Audio & Voice](#audio--voice)
  - [Social & Sharing](#social--sharing)
  - [Barcode Scanning](#barcode-scanning)
- [MCP Servers (Claude Integrations)](#mcp-servers-claude-integrations)
  - [Finance & Budgeting](#finance--budgeting)
  - [Shopping & Groceries](#shopping--groceries)
  - [Meal Planning & Recipes](#meal-planning--recipes)
  - [Calendar & Scheduling](#calendar--scheduling)
  - [Task Management](#task-management)
  - [Notes & Documentation](#notes--documentation)
  - [Communication](#communication)
  - [Productivity & Automation](#productivity--automation)
  - [Database & Storage](#database--storage)
  - [Business Tools](#business-tools)
  - [AI & Memory](#ai--memory)
  - [Barcode & QR Code](#barcode--qr-code)
- [Recommended Plugins by Module](#recommended-plugins-by-module)
- [Top 10 Must-Have Plugins](#top-10-must-have-plugins)
- [Quick Installation Commands](#quick-installation-commands)
- [Resources](#resources)

---

## CAPACITOR PLUGINS (Mobile Features)

### Security & Authentication

#### Biometric Authentication

**@capawesome/capacitor-biometrics**
- **Features:** Face ID, Touch ID, fingerprint recognition
- **Platforms:** iOS, Android
- **Use Cases:** Secure app login, sensitive data access
- **Installation:** `npm install @capawesome/capacitor-biometrics`
- **Link:** https://github.com/capawesome-team/capacitor-plugins

**@aparajita/capacitor-biometric-auth**
- **Features:** Easy biometric API access
- **Platforms:** iOS, Android
- **Use Cases:** Authentication flows
- **Installation:** `npm install @aparajita/capacitor-biometric-auth`

#### Secure Storage

**@aparajita/capacitor-secure-storage**
- **Features:** iOS Keychain + Android Keystore
- **Platforms:** iOS, Android, Web
- **Use Cases:** Store tokens, passwords, sensitive user data
- **Installation:** `npm install @aparajita/capacitor-secure-storage`

**@capawesome/capacitor-secure-preferences**
- **Features:** Secure key/value storage
- **Platforms:** iOS, Android
- **Use Cases:** App settings, user preferences
- **Installation:** `npm install @capawesome/capacitor-secure-preferences`

**Module Applications:**
- Finance: Secure account credentials
- Together: Partner sensitive information
- Self-care: Health data privacy

---

### Camera & Media

#### Official Plugins

**@capacitor/camera**
- **Features:** Take photos, choose from gallery
- **Platforms:** iOS, Android, Web
- **Use Cases:** General photo capture
- **Installation:** `npm install @capacitor/camera`
- **Link:** https://capacitorjs.com/docs/apis/camera

#### Community Plugins

**@capacitor-community/camera-preview**
- **Features:** Live camera preview in HTML
- **Platforms:** iOS, Android
- **Use Cases:** Custom camera UI, real-time filters
- **Installation:** `npm install @capacitor-community/camera-preview`

**capacitor-plugin-camera**
- **Features:** Image processing (OCR, barcode reading)
- **Platforms:** iOS, Android
- **Use Cases:** Receipt OCR, document scanning
- **Installation:** Available on npm

**Module Applications:**
- Finance: Receipt scanning, document capture
- Meals: Food photo logging
- Shopping: Product photography
- Self-care: Skincare progress photos
- Together: Photo sharing

---

### Notifications

#### Official Plugins

**@capacitor/push-notifications**
- **Features:** Native push notifications, FCM/APNs
- **Platforms:** iOS, Android
- **Use Cases:** Real-time alerts, user engagement
- **Installation:** `npm install @capacitor/push-notifications`

**@capacitor/local-notifications**
- **Features:** Schedule local notifications, recurring alerts
- **Platforms:** iOS, Android, Web
- **Use Cases:** Reminders, scheduled tasks
- **Installation:** `npm install @capacitor/local-notifications`

#### Community Plugins

**@capawesome/capacitor-badge**
- **Features:** App icon badge count
- **Platforms:** iOS, Android
- **Use Cases:** Unread count indicators
- **Installation:** `npm install @capawesome/capacitor-badge`

**Module Applications:**
- Tasks: Deadline reminders
- Habits: Daily habit notifications
- Meals: Meal prep alerts
- Finance: Bill payment reminders
- Together: Partner message notifications

---

### Storage & Data

#### Official Plugins

**@capacitor/preferences**
- **Features:** Key/value persistent storage
- **Platforms:** iOS, Android, Web
- **Use Cases:** User settings, simple data storage
- **Installation:** `npm install @capacitor/preferences`

**@capacitor/filesystem**
- **Features:** File system read/write access
- **Platforms:** iOS, Android, Web
- **Use Cases:** Document storage, file management
- **Installation:** `npm install @capacitor/filesystem`

#### Community Plugins

**@capacitor-community/sqlite**
- **Features:** Full SQLite database support
- **Platforms:** iOS, Android, Web
- **Use Cases:** Offline-first apps, complex data
- **Installation:** `npm install @capacitor-community/sqlite`

**Module Applications:**
- Offline data caching for all modules
- Finance: Receipt document storage
- Meals: Recipe files and images
- Notes: Journal entry storage

---

### Health & Fitness

**@capgo/capacitor-health** ⭐
- **Features:**
  - Apple HealthKit (iOS)
  - Google Health Connect (Android)
  - Metrics: steps, heart rate, weight, calories, sleep, workouts
  - TypeScript API with unified data types
- **Platforms:** iOS, Android
- **Use Cases:** Fitness tracking, wellness monitoring
- **Installation:** `npm install @capgo/capacitor-health`
- **Link:** https://github.com/Cap-go/capacitor-health

**Pedometer Plugins**
- **Features:** Steps, distance, pace, cadence, floors
- **Platforms:** iOS, Android
- **Use Cases:** Activity tracking

**Module Applications:**
- Nutrition: Sync calories burned with food intake
- Goals: Fitness goal progress tracking
- Habits: Exercise habit monitoring
- Self-care: Sleep quality tracking

---

### Calendar & Events

**@ebarooni/capacitor-calendar**
- **Features:**
  - Read/write calendar events
  - Access reminders
  - Event management (create, update, delete)
- **Platforms:** iOS, Android
- **Use Cases:** Calendar sync, event creation
- **Installation:** `npm install @ebarooni/capacitor-calendar`
- **Link:** https://github.com/ebarooni/capacitor-calendar

**Module Applications:**
- Calendar: Native calendar integration
- Tasks: Sync deadlines to device calendar
- Meals: Meal planning schedule
- Together: Shared event calendar

---

### Payments & Subscriptions

**RevenueCat Purchases** ⭐ (Recommended)
- **Features:**
  - In-app purchases
  - Subscription management
  - Automatic receipt validation
  - Cross-platform consistent API
  - Analytics and insights
- **Platforms:** iOS, Android
- **Pros:** Well-documented, handles complexity automatically
- **Cons:** Requires RevenueCat account, shares App Store credentials
- **Installation:** `npm install @revenuecat/purchases-capacitor`
- **Link:** https://www.revenuecat.com/docs/getting-started/installation/capacitor

**@capgo/capacitor-native-purchases** (Free & Open Source)
- **Features:**
  - StoreKit 2 (iOS)
  - Google Play Billing 7 (Android)
  - No third-party dependencies
- **Platforms:** iOS, Android
- **Pros:** Free, latest native APIs, full control
- **Cons:** Manual receipt validation required
- **Installation:** `npm install @capgo/capacitor-native-purchases`
- **Link:** https://github.com/Cap-go/capacitor-native-purchases

**Capawesome Purchases Plugin** (Premium)
- **Features:**
  - StoreKit 2, Google Play Billing 8
  - Comprehensive features
  - Well-maintained
- **Platforms:** iOS, Android
- **Pros:** Latest libraries, excellent support
- **Cons:** Requires paid Capawesome Insiders subscription
- **Link:** https://capawesome.io/plugins/purchases/

**Module Applications:**
- App-wide: Premium features unlock
- Finance: Premium budgeting tools
- Nutrition: Advanced meal planning

---

### Location & Maps

#### Official Plugins

**@capacitor/geolocation**
- **Features:** GPS coordinates, location tracking
- **Platforms:** iOS, Android, Web
- **Use Cases:** Location-based features
- **Installation:** `npm install @capacitor/geolocation`

#### Community Plugins

**@capacitor-community/google-maps**
- **Features:** Full Google Maps integration
- **Platforms:** iOS, Android
- **Use Cases:** Interactive maps, directions
- **Installation:** `npm install @capacitor-community/google-maps`

**Module Applications:**
- Travel: Trip tracking, location logging
- Shopping: Store locations, navigation
- Meals: Restaurant discovery
- Finance: ATM/bank locator

---

### Device Features

**@capacitor/haptics**
- **Features:** Vibration feedback, haptic patterns
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor/haptics`

**@capacitor/status-bar**
- **Features:** Status bar styling, show/hide
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor/status-bar`

**@capacitor/keyboard**
- **Features:** Keyboard control, event handling
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/keyboard`

**@capacitor/network**
- **Features:** Network status, connection type
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/network`

**@capacitor/app**
- **Features:** App lifecycle events, state management
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor/app`

**@capacitor/browser**
- **Features:** In-app browser
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/browser`

**@capacitor/share**
- **Features:** Native share dialog
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/share`

**@capacitor/clipboard**
- **Features:** Clipboard read/write
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/clipboard`

**Module Applications:**
- UX: Haptic feedback for task completion
- Sharing: Shopping lists, meal plans, budgets
- Network: Offline mode detection

---

### Audio & Voice

**@capacitor/voice-recorder**
- **Features:** Audio recording
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor/voice-recorder`

**@capacitor-community/text-to-speech**
- **Features:** Text-to-speech synthesis
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor-community/text-to-speech`

**@capacitor-community/speech-recognition**
- **Features:** Voice input, speech-to-text
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor-community/speech-recognition`

**Module Applications:**
- Notes: Voice journaling
- Tasks: Voice task creation
- Shopping: Voice shopping list dictation
- Together: Voice messages

---

### Social & Sharing

**@capacitor/share**
- **Features:** Native share sheet
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor/share`

**@capacitor-community/contacts**
- **Features:** Access device contacts
- **Platforms:** iOS, Android
- **Installation:** `npm install @capacitor-community/contacts`

**Module Applications:**
- Together: Share with partner
- Shopping: Share lists with family
- Meals: Share recipes

---

### Barcode Scanning

**@capacitor/barcode-scanner** (Official)
- **Features:**
  - QR codes and various barcode formats
  - Basic scanning interface
  - OutSystems barcode libs
- **Platforms:** iOS, Android, Web
- **Note:** Requires Android SDK 26+
- **Installation:** `npm install @capacitor/barcode-scanner`
- **Link:** https://capacitorjs.com/docs/apis/barcode-scanner

**@capacitor-mlkit/barcode-scanning** ⭐⭐ (Recommended)
- **Features:**
  - Google ML Kit SDK
  - Extremely fast scanning
  - Scan multiple barcodes simultaneously
  - Offline (on-device processing)
  - Torch and autofocus support
  - Define detection areas
  - Read barcodes from images
  - Parse structured data (driver's license, email, URLs, GPS, Wi-Fi)
- **Supported Formats:**
  - QR Code, Data Matrix, PDF-417, Aztec
  - UPC-A, UPC-E, EAN-8, EAN-13
  - Code 39, Code 93, Code 128, ITF, Codabar
- **Platforms:** iOS, Android, Web
- **Installation:** `npm install @capacitor-mlkit/barcode-scanning`
- **Link:** https://capawesome.io/plugins/mlkit/barcode-scanning/

**@capacitor-community/barcode-scanner**
- **Features:**
  - Community-maintained
  - ZXing for web implementation
- **Platforms:** iOS, Android, Web (in development)
- **Installation:** `npm install @capacitor-community/barcode-scanner`
- **Link:** https://github.com/capacitor-community/barcode-scanner

**Module Applications:**
- Shopping: Scan product barcodes, batch scanning
- Nutrition: Scan nutrition labels, food products
- Meals: Scan ingredients
- Finance: Scan receipts, invoices, payment QR codes
- Together: Share Wi-Fi via QR code

---

## MCP SERVERS (Claude Integrations)

### Finance & Budgeting

**Drivetrain Finance MCP** ⭐
- **Features:**
  - Financial analysis and reporting
  - Performance monitoring
  - Variance analysis
  - Peer benchmarking
  - Secure data handling
- **Use Cases:** Enterprise financial planning
- **Link:** https://www.drivetrain.ai/post/mcp-server-finance-launch

**YNAB MCP Server**
- **Features:**
  - YNAB API integration
  - View account balances
  - Create transactions
  - Budget data access
  - Financial planning and analysis
- **Use Cases:** Personal budgeting with YNAB
- **Link:** https://www.pulsemcp.com/servers/klauern-ynab

**Stripe MCP**
- **Features:**
  - Payment processing
  - Customer management
  - Subscription handling
  - Invoice generation
- **Use Cases:** Payment integration, revenue tracking
- **Link:** https://fast.io/resources/claude-mcp-plugins/

**Plaid MCP** (if available)
- **Features:**
  - Bank account linking
  - Transaction data retrieval
  - Balance checking
- **Use Cases:** Financial aggregation

---

### Shopping & Groceries

**Bring! Shopping List MCP**
- **Features:**
  - Manage shopping lists via natural language
  - Add/remove items
  - Collaboration with other users
- **Use Cases:** Shared shopping lists
- **Link:** https://glama.ai/mcp/servers?query=shopping

**Picnic MCP**
- **Features:**
  - Online grocery shopping (Netherlands/Germany)
  - Cart management
  - Delivery tracking
  - Budget-conscious shopping
- **Use Cases:** Online grocery ordering
- **Link:** https://glama.ai/mcp/servers?query=shopping

**Amazon MCP** (if available)
- **Features:**
  - Product search
  - Price tracking
  - Order management
- **Use Cases:** E-commerce integration

---

### Meal Planning & Recipes

**Mealie MCP** ⭐
- **Features:**
  - Meal planning automation
  - Recipe management
  - Shopping list generation
  - Ingredient queries
  - Natural language interaction
- **Use Cases:** Automated meal prep workflows
- **Link:** https://glama.ai/mcp/servers/search/mcp-server-integration-with-mealie-for-meal-planning-and-shopping-list-queries

**Spoonacular API MCP** (if available)
- **Features:**
  - Recipe search (650k+ recipes)
  - Nutrition analysis
  - Meal planning suggestions
  - Ingredient substitutions
- **Use Cases:** Recipe discovery, nutrition tracking

**Open Food Facts MCP** (custom integration)
- **Features:**
  - Product nutrition data
  - Ingredient analysis
  - Allergen information
  - Eco-score
- **Use Cases:** Barcode nutrition lookup
- **API:** https://world.openfoodfacts.org/data

---

### Calendar & Scheduling

**Google Calendar MCP** ⭐
- **Features:**
  - Multi-account support (work, personal)
  - Multi-calendar support
  - Event management (create, update, delete, search)
  - Cross-account conflict detection
  - Natural language scheduling
- **Platforms:** Web, Desktop
- **Use Cases:** Automated scheduling, calendar management
- **Link:** https://github.com/nspady/google-calendar-mcp

**Calendar MCP Server**
- **Features:**
  - Natural language event creation
  - Event queries
  - Reminder management
- **Use Cases:** Simple calendar integration
- **Link:** https://lobehub.com/mcp/sms03-cal-mcp

**Unified Calendar API MCP**
- **Features:**
  - Real-time API integration
  - Multiple provider support (Google, Outlook, etc.)
  - Live state execution
- **Use Cases:** Multi-platform calendar sync
- **Link:** https://unified.to/blog/calendar_and_meetings_mcp_servers_real_time_scheduling_actions_for_ai_agents

---

### Task Management

**TaskUp MCP** ⭐
- **Features:**
  - Google Calendar integration
  - Notion database task management
  - Meeting link generation
  - Idempotency (duplicate prevention)
  - Intent analysis
- **Use Cases:** Workspace orchestration
- **Link:** https://glama.ai/mcp/servers/@CoderRahul01/Taskup-mcp

**Google Tasks MCP**
- **Features:**
  - Google Tasks API integration
  - Task creation/management
  - List organization
- **Use Cases:** Google Tasks integration
- **Link:** https://www.pulsemcp.com/servers/mstfe-google-tasks

**Scheduler MCP**
- **Features:**
  - Task automation via cron expressions
  - Shell command scheduling
  - API call automation
  - Desktop notifications
  - AI task scheduling
- **Use Cases:** Background job automation
- **Link:** https://github.com/PhialsBasement/scheduler-mcp

**Linear MCP**
- **Features:** Issue tracking, project management
- **Use Cases:** Software development workflows

**Jira MCP**
- **Features:** Issue management, sprint planning
- **Use Cases:** Enterprise project management

**Asana MCP**
- **Features:** Task lists, project tracking
- **Use Cases:** Team collaboration

**Trello MCP**
- **Features:** Board management, card organization
- **Use Cases:** Kanban workflows

---

### Notes & Documentation

**Notion MCP** ⭐ (Official, OAuth)
- **Features:**
  - Search pages
  - Create/update documents
  - Database management
  - Access team knowledge base
- **Use Cases:** Documentation, knowledge management
- **Link:** https://claude.com/plugins

**Obsidian MCP** (if available)
- **Features:**
  - Markdown note management
  - Vault access
  - Backlink navigation
- **Use Cases:** Personal knowledge management

**Evernote MCP** (if available)
- **Features:**
  - Note synchronization
  - Tag management
- **Use Cases:** Note-taking

---

### Communication

**Slack MCP**
- **Features:**
  - Search messages
  - Access channels
  - Read threads
  - Team communications
- **Use Cases:** Team collaboration integration

**Gmail MCP**
- **Features:**
  - Email access
  - Send/receive messages
  - Label management
- **Use Cases:** Email automation

**Outlook MCP**
- **Features:**
  - Email and calendar integration
  - Contact management
- **Use Cases:** Microsoft 365 integration

**Discord MCP**
- **Features:**
  - Chat integration
  - Bot features
- **Use Cases:** Community management

**Telegram MCP**
- **Features:**
  - Messaging API
  - Bot integration
- **Use Cases:** Notifications, chat automation

---

### Productivity & Automation

**MCP Productivity Servers**
- **Features:**
  - Knowledge management
  - Communication automation
  - Workflow automation
  - Calendar, email, task managers
- **Link:** https://fast.io/resources/best-mcp-servers-productivity/

**Zapier MCP** (if available)
- **Features:**
  - Workflow automation
  - Multi-app integrations (5000+ apps)
- **Use Cases:** No-code automation

**IFTTT MCP** (if available)
- **Features:**
  - Smart home integration
  - Automation recipes
- **Use Cases:** IoT automation

---

### Database & Storage

**PostgreSQL MCP** ⭐
- **Features:**
  - Natural language SQL queries
  - Schema inspection
  - Data operations
- **Use Cases:** Query Supabase database
- **Installation:** `npm install -g @modelcontextprotocol/server-postgres`

**SQLite MCP**
- **Features:**
  - Local database operations
  - Schema prototyping
- **Use Cases:** Development, testing

**MongoDB MCP**
- **Features:**
  - NoSQL database queries
  - Document management
- **Use Cases:** MongoDB integration

**MySQL MCP**
- **Features:**
  - Relational database queries
  - Data management
- **Use Cases:** MySQL integration

**Redis MCP**
- **Features:**
  - Cache operations
  - Key-value storage
- **Use Cases:** Performance optimization

**Google Drive MCP**
- **Features:**
  - File access
  - Document management
- **Use Cases:** Cloud storage integration

**Dropbox MCP**
- **Features:**
  - File synchronization
  - Sharing
- **Use Cases:** File storage

**S3 MCP**
- **Features:**
  - AWS S3 bucket access
  - Object storage
- **Use Cases:** Cloud file storage

---

### Business Tools

**Figma MCP** ⭐ (Official Dev Mode)
- **Features:**
  - Live design structure access
  - Layer hierarchy
  - Auto-layout information
  - Design token references
  - Component variants
- **Use Cases:** Design-to-code workflow
- **Link:** https://fast.io/resources/claude-mcp-plugins/

**GitHub MCP** ⭐ (Official)
- **Features:**
  - Repository management
  - Issue and PR management
  - Code reading
  - Workflow automation
- **Use Cases:** Code repository integration
- **Link:** https://github.com/modelcontextprotocol/servers

**GitLab MCP**
- **Features:**
  - Version control
  - CI/CD pipelines
- **Use Cases:** DevOps workflows

**Sentry MCP**
- **Features:**
  - Error tracking
  - Performance monitoring
- **Use Cases:** Application monitoring

**Google Analytics MCP**
- **Features:**
  - Analytics data access
  - User behavior insights
- **Use Cases:** Analytics integration

---

### AI & Memory

**Memory MCP** ⭐
- **Features:**
  - Persistent knowledge graphs
  - Long-term memory across sessions
  - Context retention
- **Use Cases:** Project-specific memory
- **Installation:** `npm install -g @modelcontextprotocol/server-memory`

**Claude-Mem Plugin**
- **Features:**
  - Long-term memory for Claude
  - Carry context across sessions
- **Use Cases:** Maintain project context

**OpenAI MCP**
- **Features:**
  - GPT API integration
  - Model access
- **Use Cases:** Multi-model AI workflows

**Anthropic MCP**
- **Features:**
  - Claude API access
  - Model management
- **Use Cases:** Claude API integration

---

### Barcode & QR Code

**qrcode-mcp-server**
- **Features:**
  - QR code generation
  - QR code scanning from images
  - Environment configuration
- **Use Cases:** QR code workflows
- **Link:** https://lobehub.com/mcp/qqlzfmn-qrcode-mcp-server

**mcp-scan-qr**
- **Features:**
  - Single image QR scanning (HTTPS URLs)
  - Batch processing (multiple images)
  - FastMCP framework
- **Published:** January 6, 2026
- **Link:** https://lobehub.com/mcp/pidanmoe-mcp-scan-qr

**scan-qr-code**
- **Features:**
  - Decode QR codes from base64 data URLs
  - Retrieve from HTTP(S) image URLs
  - Robust decoding
- **Use Cases:** QR code analysis
- **Link:** https://mcpmarket.com/server/scan-qr-code

**Azure Barcode Scanner MCP**
- **Features:**
  - Enterprise barcode scanning
  - Cloud-based processing
  - Ready-to-use configuration
- **Link:** https://apify.com/vivid_astronaut/azure-barcode-scanner/api/mcp

**PDF.co MCP** ⭐
- **Features:**
  - Generate barcode images (QR, Code128, Code39, PDF417)
  - Encode data into barcodes
  - Labeling and tracking
- **Use Cases:** Label generation, data encoding
- **Link:** https://composio.dev/toolkits/pdf_co/framework/claude-code

---

## RECOMMENDED PLUGINS BY MODULE

### Finance Module 💰

**Capacitor Plugins:**
1. **@capacitor/camera** - Receipt scanning
2. **@capawesome/capacitor-biometrics** - Secure account access
3. **@aparajita/capacitor-secure-storage** - Account credential storage
4. **@capacitor/filesystem** - Receipt document storage
5. **@capacitor-mlkit/barcode-scanning** - Scan invoices, payment codes

**MCP Servers:**
1. **YNAB MCP** or **Drivetrain Finance MCP** - Budget management
2. **Stripe MCP** - Payment processing
3. **PostgreSQL MCP** - Database queries for transactions
4. **Plaid MCP** - Bank account aggregation

**Implementation Priority:** High (security + functionality)

---

### Shopping Module 🛒

**Capacitor Plugins:**
1. **@capacitor-mlkit/barcode-scanning** ⭐ - Product barcode scanning
2. **@capacitor/camera** - Product photos
3. **@capacitor/share** - Share shopping lists
4. **@capacitor/geolocation** - Store locations and navigation

**MCP Servers:**
1. **Bring! MCP** - Shopping list management
2. **Open Food Facts API** - Product nutrition data
3. **Picnic MCP** - Online grocery ordering (EU)
4. **PostgreSQL MCP** - Shopping history queries

**Product Databases:**
- **Brocade.io** (Open Source) - Product GTIN/barcode lookup
- **Open Food Facts** - Nutrition and ingredient data

**Implementation Priority:** High (barcode scanning is key feature)

---

### Meals & Nutrition Module 🍽️

**Capacitor Plugins:**
1. **@capacitor-mlkit/barcode-scanning** - Nutrition label scanning
2. **@capacitor/camera** - Food photo logging
3. **@capgo/capacitor-health** - Calories burned tracking
4. **@capacitor/share** - Share recipes

**MCP Servers:**
1. **Mealie MCP** ⭐ - Meal planning automation
2. **Spoonacular API MCP** - Recipe database
3. **Open Food Facts MCP** - Nutrition data
4. **PostgreSQL MCP** - Meal plan queries

**Implementation Priority:** Medium (enhances meal planning workflow)

---

### Calendar Module 📅

**Capacitor Plugins:**
1. **@ebarooni/capacitor-calendar** - Native calendar sync
2. **@capacitor/local-notifications** - Event reminders
3. **@capacitor/push-notifications** - Real-time alerts

**MCP Servers:**
1. **Google Calendar MCP** ⭐ - Multi-calendar management
2. **Unified Calendar API MCP** - Multi-platform sync
3. **Scheduler MCP** - Automated task scheduling

**Implementation Priority:** Medium (improves scheduling capabilities)

---

### Tasks Module ✅

**Capacitor Plugins:**
1. **@capacitor/push-notifications** - Task deadline reminders
2. **@capacitor-community/speech-recognition** - Voice task creation
3. **@capacitor/share** - Share task lists
4. **@capacitor/haptics** - Completion feedback

**MCP Servers:**
1. **TaskUp MCP** ⭐ - Calendar + Notion task sync
2. **Google Tasks MCP** - Google Tasks integration
3. **Linear MCP** - Software project tasks
4. **PostgreSQL MCP** - Advanced task queries

**Implementation Priority:** Medium (voice input adds convenience)

---

### Goals & Habits Module 🎯

**Capacitor Plugins:**
1. **@capgo/capacitor-health** - Fitness goal tracking
2. **@capacitor/local-notifications** - Habit reminders
3. **@capacitor/haptics** - Completion celebration
4. **@capacitor/camera** - Progress photos

**MCP Servers:**
1. **Notion MCP** - Goal documentation and planning
2. **Google Calendar MCP** - Habit scheduling
3. **PostgreSQL MCP** - Streak and progress analytics

**Implementation Priority:** Low (current functionality sufficient)

---

### Together Module ❤️

**Capacitor Plugins:**
1. **@capacitor/push-notifications** - Partner notifications
2. **@capacitor/share** - Photo and list sharing
3. **@capacitor-community/contacts** - Partner contact info
4. **@capacitor/camera** - Shared memories

**MCP Servers:**
1. **Slack/Telegram MCP** - Enhanced messaging
2. **Google Calendar MCP** - Shared event planning
3. **Notion MCP** - Shared notes and lists
4. **PostgreSQL MCP** - Relationship data queries

**Implementation Priority:** Low (core features working)

---

### Travel Module ✈️

**Capacitor Plugins:**
1. **@capacitor/geolocation** - Trip tracking, location logging
2. **@capacitor/camera** - Travel photos
3. **@capacitor/filesystem** - Document storage (tickets, passports)
4. **@capacitor-community/google-maps** - Interactive maps

**MCP Servers:**
1. **Google Maps MCP** - Directions, place search
2. **Weather API MCP** - Destination weather
3. **Google Calendar MCP** - Itinerary management
4. **Notion MCP** - Travel planning documents

**Implementation Priority:** Low (basic features cover most needs)

---

### Self-care Module 💆

**Capacitor Plugins:**
1. **@capgo/capacitor-health** - Sleep and wellness tracking
2. **@capacitor/camera** - Progress photos (skincare, fitness)
3. **@capacitor/local-notifications** - Routine reminders
4. **@capacitor/haptics** - Meditation timer feedback

**MCP Servers:**
1. **Notion MCP** - Wellness journaling
2. **PostgreSQL MCP** - Skincare routine queries
3. **Google Calendar MCP** - Self-care scheduling

**Implementation Priority:** Low (current features adequate)

---

### Notes & Journal Module 📝

**Capacitor Plugins:**
1. **@capacitor/voice-recorder** - Voice journaling
2. **@capacitor-community/speech-recognition** - Voice-to-text
3. **@capacitor/camera** - Photo attachments
4. **@capacitor/share** - Share entries

**MCP Servers:**
1. **Notion MCP** - Advanced note organization
2. **Obsidian MCP** - Markdown knowledge base
3. **PostgreSQL MCP** - Note search and queries

**Implementation Priority:** Low (basic note-taking works)

---

## TOP 10 MUST-HAVE PLUGINS FOR LIFESYNC

### 1. @capacitor-mlkit/barcode-scanning ⭐⭐⭐
**Why:** Game-changer for Shopping, Nutrition, Finance modules
**Impact:** Product scanning, receipt OCR, nutrition labels
**Installation:** `npm install @capacitor-mlkit/barcode-scanning`

### 2. @capawesome/capacitor-biometrics ⭐⭐⭐
**Why:** Security across all sensitive modules
**Impact:** Secure login, protect Finance/Health data
**Installation:** `npm install @capawesome/capacitor-biometrics`

### 3. @capacitor/push-notifications ⭐⭐⭐
**Why:** Essential for Tasks, Habits, reminders
**Impact:** User engagement, habit formation
**Installation:** `npm install @capacitor/push-notifications`

### 4. @capacitor/camera ⭐⭐
**Why:** Used across multiple modules
**Impact:** Receipts, food logs, progress photos
**Installation:** `npm install @capacitor/camera`

### 5. @capgo/capacitor-health ⭐⭐
**Why:** Integrates Nutrition with fitness data
**Impact:** Calories burned, activity tracking, goals
**Installation:** `npm install @capgo/capacitor-health`

### 6. Google Calendar MCP ⭐⭐⭐
**Why:** Central to Calendar, Tasks, Events
**Impact:** Multi-account scheduling, conflict detection
**Setup:** Configure in `.claude/settings.local.json`

### 7. PostgreSQL MCP ⭐⭐⭐
**Why:** Direct database queries via natural language
**Impact:** Advanced data analysis, custom reports
**Setup:** Configure Supabase connection

### 8. Notion MCP ⭐⭐
**Why:** Enhanced documentation and planning
**Impact:** Goals, notes, meal plans, travel docs
**Setup:** OAuth authentication required

### 9. GitHub MCP ⭐⭐
**Why:** Code management and development workflow
**Impact:** Issue tracking, code review, automation
**Setup:** GitHub token required

### 10. Memory MCP ⭐⭐
**Why:** Persistent context across sessions
**Impact:** Remember user preferences, project decisions
**Installation:** `npm install -g @modelcontextprotocol/server-memory`

---

## QUICK INSTALLATION COMMANDS

### Essential Capacitor Plugins

```bash
# Barcode scanning (top priority)
npm install @capacitor-mlkit/barcode-scanning

# Security
npm install @capawesome/capacitor-biometrics
npm install @aparajita/capacitor-secure-storage

# Notifications
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications

# Media
npm install @capacitor/camera

# Health & Fitness
npm install @capgo/capacitor-health

# Calendar
npm install @ebarooni/capacitor-calendar

# Device features
npm install @capacitor/share
npm install @capacitor/haptics
npm install @capacitor/geolocation

# Voice
npm install @capacitor-community/speech-recognition

# Sync native projects
npx cap sync
```

### MCP Server Setup

MCP servers are configured in `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@host:5432/db"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "google-calendar-mcp"]
    }
  }
}
```

---

## RESOURCES

### Official Documentation

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Capacitor Plugins:** https://capacitorjs.com/docs/plugins
- **MCP Specification:** https://modelcontextprotocol.io/
- **Claude Code Docs:** https://code.claude.com/docs

### Plugin Directories

- **Awesome Capacitor:** https://github.com/riderx/awesome-capacitor
- **Capacitor Plugin Directory:** https://capacitorjs.com/directory
- **Official Capacitor Plugins:** https://github.com/ionic-team/capacitor-plugins
- **Capawesome Community:** https://github.com/capawesome-team/capacitor-plugins
- **Official MCP Registry:** https://registry.modelcontextprotocol.io/
- **Awesome MCP Servers:** https://github.com/wong2/awesome-mcp-servers
- **MCP Servers Directory:** https://apitracker.io/mcp-servers
- **Glama MCP Search:** https://glama.ai/mcp/servers

### Guides & Articles

- **Capacitor Health Plugin:** https://github.com/Cap-go/capacitor-health
- **ML Kit Barcode Scanning:** https://capawesome.io/plugins/mlkit/barcode-scanning/
- **RevenueCat for Capacitor:** https://www.revenuecat.com/docs/getting-started/installation/capacitor
- **Best MCP Servers for Productivity:** https://fast.io/resources/best-mcp-servers-productivity/
- **Top Financial MCP Servers:** https://medium.com/predict/top-5-mcp-servers-for-financial-data-in-2026-5bf45c2c559d
- **Calendar MCP Integration:** https://unified.to/blog/calendar_and_meetings_mcp_servers_real_time_scheduling_actions_for_ai_agents

### Product Databases (for Barcode Lookup)

- **Brocade.io (Open Source):** https://brocade.io
- **Open Food Facts API:** https://world.openfoodfacts.org/data
- **Go-UPC Database:** https://go-upc.com/
- **UPCitemdb API:** https://devs.upcitemdb.com/
- **EAN-Search.org:** https://www.ean-search.org/
- **Barcode Lookup API:** https://www.barcodelookup.com/api

---

## NEXT STEPS

1. **Review this document** and identify which plugins align with your priorities
2. **Start with high-priority modules** (Finance, Shopping, Nutrition)
3. **Install barcode scanning first** - highest user value
4. **Add biometric security** - builds user trust
5. **Configure essential MCP servers** (PostgreSQL, Google Calendar, Memory)
6. **Test on real devices** - iOS and Android
7. **Iterate based on user feedback**

---

**Document Version:** 1.0
**Last Updated:** February 24, 2026
**Maintained by:** Claude Code Assistant
