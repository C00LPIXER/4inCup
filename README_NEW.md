# 4inCup - Tournament Management System

A modern React-based tournament management application with Firebase integration.

## Features

- **Tournament Management**: Create and manage teams, fixtures, and matches
- **Real-time Updates**: Live synchronization with Firebase Firestore
- **Authentication**: Protected settings with username/password
- **Dataset Switching**: Support for production and test environments
- **Bracket System**: Group stage, semi-finals, and finals with skeleton matches

## Dataset Configuration

The application supports two datasets controlled by the `VITE_DATASET` environment variable in `.env`:

### Production Environment (Default)
- Set `VITE_DATASET=production` in `.env`
- Data stored in `tournaments` collection in Firestore

### Test Environment
- Set `VITE_DATASET=test` in `.env`
- Data stored in `test_tournaments` collection in Firestore

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Update `.env` with your Firebase config and dataset preference

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Authentication

Default credentials (stored in Firebase):
- Username: `4inDegree`
- Password: `9778574627`

Access the settings at `/settings` to manage tournament data.

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Update Firestore rules with the content from `firestore.rules`
4. Add your Firebase config to `.env`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Data Management

- **Production Data**: Stored in `tournaments/default` collection
- **Test Data**: Stored in `test_tournaments/default` collection
- **Authentication**: Stored in `settings/auth` document

Use the dataset indicator in the bottom-right corner to see which environment you're using.

## Switching Datasets

To switch between production and test datasets:

1. Edit `.env` file
2. Change `VITE_DATASET=production` to `VITE_DATASET=test` or vice versa
3. Restart the development server