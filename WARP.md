# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Smart Wanderer is a tourist safety application built with React, TypeScript, and modern web technologies. The app provides digital ID cards, real-time location tracking, SOS functionality, and safety scoring for tourists, with a focus on Assam tourism.

## Technology Stack

### Frontend (Tourist App)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Maps**: Mapbox GL JS
- **Form Handling**: React Hook Form with Zod validation
- **Real-time**: Socket.IO client

### Backend (Admin System)
- **Runtime**: Node.js with Express
- **Language**: JavaScript (ES6 modules)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with bcryptjs
- **Real-time**: Socket.IO server
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston
- **Validation**: express-validator

### Database & Services
- **Primary Database**: Supabase (authentication, profiles, alerts)
- **Location Tracking**: Custom tourist_locations table
- **Admin Management**: Custom admin_users table
- **Real-time Features**: Socket.IO for live updates

## Common Development Commands

### Frontend (Tourist App)
```bash
npm run dev            # Start frontend dev server (port 8080)
npm run build          # Production build
npm run build:dev      # Development build
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm i                  # Install dependencies
```

### Backend (Admin System)
```bash
# Navigate to backend directory first
cd backend

# Development
npm run dev            # Start backend dev server (port 5000)
npm start              # Start production server
npm run seed           # Seed admin users and sample data
npm i                  # Install backend dependencies
```

### Full Stack Development
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
cd backend && npm run dev
```

## Project Architecture

### Core Application Structure

- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Routing**: Multi-route setup with tourist and admin paths
- **Tourist Authentication**: `src/pages/Index.tsx` manages tourist auth via Supabase
- **Admin Authentication**: `src/admin/hooks/useAdminAuth.tsx` manages admin auth via backend JWT

### Frontend Components Hierarchy

```
App.tsx (QueryClient, AdminAuthProvider, Tooltips, Toasts, Routing)
├── Tourist Routes
│   └── Index.tsx (Auth Management, User Profile Loading)
│       ├── LoginPage.tsx (Tourist Authentication UI)
│       └── TouristDashboard.tsx (Main Tourist Interface)
│           ├── SOSButton.tsx (Emergency Alert System)
│           ├── MapComponent.tsx (Mapbox Integration)
│           └── DigitalIDCard.tsx (Digital ID Modal)
└── Admin Routes (/admin/*)
    ├── AdminLogin.tsx (Admin Authentication UI)
    └── AdminDashboard.tsx (Admin Control Center)
        ├── AdminMap.tsx (Live Tourist Locations)
        └── AlertsTable.tsx (Emergency Alerts Management)
```

### Backend API Structure

```
backend/src/server.js (Express Server + Socket.IO)
├── Routes
│   ├── /api/auth/* (Admin Authentication)
│   ├── /api/admin/* (Dashboard, Users, System Status)
│   ├── /api/tourists/* (Location Tracking, Tourist Data)
│   └── /api/alerts/* (Emergency Alerts Management)
├── Middleware
│   ├── auth.js (JWT Authentication & Role Authorization)
│   ├── errorHandler.js (Centralized Error Handling)
│   └── requestLogger.js (Winston Request Logging)
└── Config
    ├── supabase.js (Database Client)
    └── logger.js (Winston Logger Setup)
```

### Database Schema (Supabase)

#### Existing Tourist Tables
- **profiles table**: Tourist information (safety scores, digital IDs, verification status)
- **emergency_alerts table**: SOS alerts with location data and status tracking

#### New Admin System Tables
- **admin_users table**: Admin accounts (email, password_hash, role, permissions)
- **tourist_locations table**: Real-time location tracking (lat/lng, address, accuracy, timestamps)

#### Enhanced Emergency Alerts
- Added fields: priority, assigned_admin_id, admin_notes, resolved_at
- Admin management workflow support
- Real-time status updates

### Styling System

- Uses Tailwind CSS with custom design tokens
- shadcn/ui component library for consistent UI patterns
- Custom CSS variables for theme colors and spacing
- Responsive design optimized for mobile-first approach

### State Management Patterns

- **Authentication**: Supabase auth state with React state synchronization
- **Server State**: TanStack Query for API data fetching and caching
- **Local State**: React hooks for component-specific state
- **Location State**: GPS coordinates and address information

## Development Guidelines

### Path Aliases
The project uses TypeScript path mapping with `@/*` pointing to `src/*`:
- `@/components` → `src/components`
- `@/lib` → `src/lib`  
- `@/hooks` → `src/hooks`
- `@/integrations` → `src/integrations`

### Component Organization
- **UI Components**: `/src/components/ui/` (shadcn/ui primitives)
- **Feature Components**: `/src/components/auth/`, `/src/components/dashboard/`
- **Pages**: `/src/pages/`
- **Hooks**: `/src/hooks/`
- **Utilities**: `/src/lib/`

### Supabase Integration
- Client configuration in `/src/integrations/supabase/client.ts`
- Type definitions auto-generated in `/src/integrations/supabase/types.ts`
- Environment variables expected for Supabase URL and keys

### Key Features Implementation

#### Authentication Flow
- Supabase auth with automatic profile fetching
- Session persistence with localStorage
- Loading states for auth transitions

#### Safety Dashboard
- Real-time location tracking with Mapbox
- Safety score calculation and display
- Emergency contact management
- Travel itinerary with status tracking

#### Emergency System
- SOS button with location broadcasting
- Emergency alert logging to database
- Safety alerts and notifications system

## Admin System Setup

### Database Migration
1. **Run SQL Schema**: Execute `backend/scripts/setup-admin-schema.sql` in Supabase SQL Editor
2. **Seed Admin Users**: Run `npm run seed` in backend directory
3. **Default Admin**: admin@smartwanderer.com / admin123456

### Environment Configuration
```bash
# Frontend (.env)
VITE_ADMIN_API_URL=http://localhost:5000
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Backend (backend/.env)
JWT_SECRET=your_secure_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_DEFAULT_EMAIL=admin@smartwanderer.com
ADMIN_DEFAULT_PASSWORD=admin123456
```

### Admin Roles & Permissions
- **super_admin**: Full system access, user management
- **admin**: Dashboard access, alert management
- **alert_manager**: Alert handling and response
- **operator**: Basic monitoring access

### Real-time Features
- **Location Updates**: Tourist locations automatically sync to admin dashboard
- **Emergency Alerts**: Instant notifications to admin users
- **Socket.IO Events**: new-alert, alert-updated, location-update

## Access Points

- **Tourist App**: http://localhost:8080/
- **Admin Login**: http://localhost:8080/admin/login
- **Admin Dashboard**: http://localhost:8080/admin/dashboard
- **Backend API**: http://localhost:5000/api/*
- **Health Check**: http://localhost:5000/health

## Important Notes

### Development
- Frontend optimized for mobile devices (tourist use case)
- Admin dashboard optimized for desktop/tablet (authority use case)
- Mapbox integration requires proper API key configuration
- Real-time features require both frontend and backend running
- Location tracking requires HTTPS in production (browser security)

### Security
- Admin JWT tokens expire in 24 hours by default
- Tourist authentication via Supabase Auth
- Admin authentication via custom JWT system
- Rate limiting enabled on backend APIs (100 req/15min)
- CORS configured for frontend domains

### Production Deployment
- Move all secrets to environment variables
- Use proper SSL certificates for HTTPS
- Configure production database backup
- Set up proper logging and monitoring
- Enable Supabase Row Level Security policies
