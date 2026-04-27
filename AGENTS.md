# AI Agent Guide for HomeApp Finance

This guide provides essential context and conventions for AI agents working in this codebase.

## 🏗️ Architecture & Boundaries

- **Frontend Only:** This repository contains the React Native frontend (Expo SDK 54, Expo Router). 
- **External Backend:** The backend is a separate Java Spring Boot application deployed externally (e.g., on Render). Do not attempt to write server-side API logic or database queries (tRPC/Drizzle boilerplate in the project should be ignored or phased out).
- **Communication:** The app connects to the Java backend via REST API using Axios. The main client configuration is in `lib/apiClient.ts`.
- **API Mappings:** Endpoints and fetch logic are centralized in `lib/api.ts` (e.g., fetching house balance, adding expenses, getting dashboard resumes).
- **Styling:** NativeWind is used for universal styling. Rely on Tailwind CSS utility classes.

## ⚙️ Critical Developer Workflows

- **Local Development:** Run `npx expo start` or `npm run dev:metro` to start the Expo bundler.
- **Adding New Features:**
  1. Define the REST API call in `lib/api.ts`.
  2. Implement the UI using Expo Router in `app/`.
  3. Manage local state using React Context or local storage where needed.

## 🛠️ Project-Specific Conventions

- **Authentication Handling:** The app uses Bearer tokens. 
  - Tokens are retrieved via the `getSecureToken` utility in `lib/apiClient.ts`, which uses `expo-secure-store` for native devices and `AsyncStorage` for the web.
  - The Axios interceptor automatically injects the token into outgoing requests.
- **Public vs Protected:** The app maintains a strict separation. Some features like the shopping list (`/shopping-list`) rely heavily on `AsyncStorage` for public/offline use, while features like `/dashboard` require the bearer token to fetch data from the Java backend.
- **Data Fetching:** Always use the encapsulated functions from `lib/api.ts` rather than making raw Axios calls from the UI components.

## 🔌 Integrations

- **Biometrics & Local Storage:** Uses `expo-local-authentication` for FaceID/Fingerprint and `expo-secure-store` for session tokens.
