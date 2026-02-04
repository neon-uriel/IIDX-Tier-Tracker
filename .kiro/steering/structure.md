# Project Structure

## Organization Philosophy

Layered architecture with clear separation between frontend (React SPA) and backend (Express API). Each layer follows conventional patterns for its ecosystem.

## Directory Patterns

### Frontend (`/frontend/src/`)
**Purpose**: React application source code

- `components/` - Reusable UI components (PascalCase naming)
- `components/ui/` - Design system primitives (shadcn/ui style)
- `pages/` - Route-level page components (`*Page.jsx`)
- `context/` - React context providers for global state
- `services/` - API client functions
- `lib/` - Utility functions
- `test/` - Test setup and utilities
- `assets/` - Static assets (images, etc.)

### Backend (`/backend/src/`)
**Purpose**: Express API application

- `routes/` - Express route definitions (`*Routes.js`)
- `controllers/` - Route handlers (`*Controller.js`)
- `services/` - Business logic and external integrations
- `config/` - Configuration (passport, etc.)
- `db/` - Database connection setup

### Database (`/backend/`)
- `migrations/` - node-pg-migrate migration files
- `db/` - Database initialization scripts

## Naming Conventions

- **React Components**: PascalCase (`Header.jsx`, `LampSelector.jsx`)
- **Pages**: PascalCase with `Page` suffix (`DashboardPage.jsx`)
- **Backend routes**: camelCase with `Routes` suffix (`userLampRoutes.js`)
- **Backend controllers**: camelCase with `Controller` suffix (`statsController.js`)
- **Test files**: Same name as source with `.test` suffix (`App.test.jsx`)
- **CSS files**: Same name as component (`App.css`)

## Import Organization

```jsx
// Frontend - React components
import { useState, useEffect } from 'react';      // React
import { useNavigate } from 'react-router-dom';   // External libs
import { Button } from '@/components/ui/button';  // Internal (alias)
import { api } from '../services/api';            // Relative
```

```javascript
// Backend - Node.js modules
const express = require('express');               // External
require('dotenv').config();                       // Config
const controller = require('../controllers/x');   // Internal
```

**Path Aliases**:
- `@/` → `./src` (frontend only, via Vite config)

## Code Organization Principles

- **Component co-location**: Test files live alongside source files
- **Context pattern**: Global state via React Context (`AuthContext`, `ThemeContext`)
- **Service layer**: API calls abstracted in `/services`
- **MVC-like backend**: Routes → Controllers → Services → Database

---
_created_at: 2025-02-04_
