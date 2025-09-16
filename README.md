# LifeSync Personal Assistant Platform

<div align="center">

![LifeSync Logo](https://img.shields.io/badge/LifeSync-Personal%20Assistant-blue?style=for-the-badge&logo=react)

A comprehensive personal productivity platform that helps you manage tasks, track habits, plan finances, and optimize your daily life.

[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE.md)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing) • [Support](#support)

</div>

## 🌟 Features

### 📋 **Task Management**
- **Project-based Organization**: Group tasks by projects with custom colors and icons
- **Smart Categories**: Work, personal, health, learning, and custom categories
- **Priority System**: High, medium, low priority with visual indicators
- **Time Tracking**: Estimated vs actual time with Pomodoro integration
- **Advanced Filters**: Filter by status, priority, project, and date ranges

### 🎯 **Habit Tracking**
- **Multiple Goal Types**: Daily targets, course completion, total goals
- **Visual Progress**: Streak counters, progress bars, and calendar views
- **Smart Increments**: Course goals progress one step at a time
- **Mood Tracking**: Track mood and notes with each habit completion
- **Analytics**: Detailed insights into habit patterns and success rates

### 💰 **Financial Management**
- **Transaction Tracking**: Income, expenses, and transfers with categories
- **Budget Planning**: Set and monitor budgets with alerts
- **Account Management**: Multiple accounts with real-time balances
- **Investment Tracking**: Portfolio performance and asset allocation
- **Bill Reminders**: Never miss a payment with smart notifications
- **Financial Goals**: Savings targets with progress tracking

### 🧘 **Focus Sessions**
- **Pomodoro Technique**: Customizable work/break intervals
- **Productivity Scoring**: Rate your focus and track improvements
- **Environment Tracking**: Monitor noise, lighting, and other factors
- **Task Integration**: Link focus sessions to specific tasks
- **Analytics Dashboard**: Detailed productivity insights and trends

### 🛒 **Smart Shopping**
- **Intelligent Lists**: AI-powered shopping list organization
- **Price Tracking**: Monitor price changes and find deals
- **Budget Integration**: Sync with your financial goals
- **Store Mapping**: Optimize your shopping route
- **Shared Lists**: Collaborate with family members

### 🍳 **Meal Planning**
- **Recipe Management**: Store and organize your favorite recipes
- **Nutrition Tracking**: Monitor calories, macros, and nutrients
- **Meal Prep Planning**: Weekly meal planning with shopping lists
- **Dietary Preferences**: Support for various diets and restrictions
- **Cost Analysis**: Track meal costs and optimize your food budget

### 📅 **Calendar Integration**
- **Unified View**: See all your commitments in one place
- **Smart Scheduling**: AI-powered time slot suggestions
- **Reminder System**: Never miss important events
- **Time Blocking**: Allocate time for focused work
- **Cross-platform Sync**: Works with Google Calendar, Outlook, and more

### 📊 **Analytics & Insights**
- **Personal Dashboard**: Overview of all your metrics
- **Trend Analysis**: Identify patterns in your productivity
- **Goal Progress**: Visual tracking of all your objectives
- **Performance Reports**: Weekly and monthly summaries
- **Data Export**: Export your data in multiple formats

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Docker** and Docker Compose
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikithasri24/lifesync-personal-assistant.git
   cd lifesync-personal-assistant/lifesync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL database**
   ```bash
   # Start PostgreSQL container
   docker run --name lifesync-postgres \
     -e POSTGRES_PASSWORD=lifesync123 \
     -e POSTGRES_DB=lifesync \
     -p 5433:5432 \
     -d postgres:16
   
   # Set up database schema
   docker exec lifesync-postgres psql -U postgres -d lifesync -c "
   CREATE TABLE IF NOT EXISTS users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     username VARCHAR(50) UNIQUE NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );"
   ```

5. **Start the API server**
   ```bash
   # Using the Docker-based API server
   PORT=3001 node start-with-db.js
   ```

6. **Start the development server**
   ```bash
   # In a new terminal
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:5173
   ```

### 🐳 Docker Deployment

For production deployment with Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture

### Frontend Stack
- **React 18** with hooks and concurrent features
- **TypeScript** for type safety and better DX
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Zustand** for lightweight state management

### Backend Stack
- **Express.js** REST API server
- **PostgreSQL** for reliable data persistence
- **Docker** for containerization
- **Node.js** runtime environment

### Project Structure
```
lifesync/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── stores/             # State management
│   ├── services/           # API and business logic
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── api-servers/            # Different API implementations
├── database/               # Schema and migrations
└── tests/                  # Test suites
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:watch   # Run tests in watch mode

# Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run format       # Format code with Prettier

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

### API Endpoints

The platform provides comprehensive REST APIs:

```
# Tasks
GET    /api/tasks              # Get all tasks
POST   /api/tasks              # Create new task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task

# Habits
GET    /api/habits             # Get all habits
POST   /api/habits             # Create new habit
POST   /api/habits/:id/entries # Add habit entry
PUT    /api/habits/:id         # Update habit

# Financial
GET    /api/financial/transactions    # Get transactions
POST   /api/financial/transactions    # Create transaction
GET    /api/financial/accounts        # Get accounts

# Focus
GET    /api/focus/sessions     # Get focus sessions
POST   /api/focus/sessions     # Create session
PUT    /api/focus/sessions/:id # Update session

# Analytics
GET    /api/analytics/dashboard # Get dashboard data
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:lifesync123@localhost:5433/lifesync
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=lifesync123
POSTGRES_DB=lifesync

# API
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# Features
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_REAL_TIME=true
```

### Database Configuration

The platform uses PostgreSQL with the following key tables:
- `users` - User accounts and profiles
- `tasks` - Task management with projects
- `habits` - Habit tracking and entries
- `financial_transactions` - Financial data
- `focus_sessions` - Productivity tracking

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- **TypeScript** for all new code
- **ESLint** and **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Jest** for unit tests
- **Playwright** for E2E tests

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check container logs
docker logs lifesync-postgres

# Restart container
docker restart lifesync-postgres
```

**API Server Not Starting**
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill process if needed
kill -9 $(lsof -t -i:3001)

# Start with debug logging
DEBUG=* PORT=3001 node start-with-db.js
```

**Frontend Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 📋 Roadmap

### Version 2.0 (Coming Soon)
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] AI-powered insights
- [ ] Advanced integrations
- [ ] Offline support
- [ ] Data synchronization

### Version 1.1 (In Progress)
- [x] Course goal increment fix
- [x] PostgreSQL integration
- [x] Docker deployment
- [ ] Performance optimizations
- [ ] Enhanced analytics
- [ ] Mobile responsiveness

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using React and TypeScript
- Icons by [Heroicons](https://heroicons.com/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/nikithasri24/lifesync-personal-assistant/wiki)
- **Issues**: [GitHub Issues](https://github.com/nikithasri24/lifesync-personal-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nikithasri24/lifesync-personal-assistant/discussions)

---

<div align="center">

**Made with ❤️ by the LifeSync Team**

[⭐ Star this repo](https://github.com/nikithasri24/lifesync-personal-assistant) • [🐛 Report Bug](https://github.com/nikithasri24/lifesync-personal-assistant/issues) • [✨ Request Feature](https://github.com/nikithasri24/lifesync-personal-assistant/issues)

</div>