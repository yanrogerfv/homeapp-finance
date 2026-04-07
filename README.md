<div align="center">
  <h1>HomeApp Finance</h1>
  <p><strong>A secure and modular mobile application for comprehensive household financial and operational management.</strong></p>
</div>

---

## Overview

**HomeApp Finance** is a mobile-first application designed to streamline the complexities of household management. By combining robust financial tracking with shared utility features, such as a public shopping list, it serves as a central hub for household operations. 

Built with an emphasis on seamless user experience, strict data security, and maintainability, the application utilizes a scalable architecture and modern engineering practices.

## Core Features

* **Secure Authentication Layer:** Authentication system integrating a biometric capability (FaceID/Fingerprint) with hardware-backed secure storage for credential management.
* **Financial Dashboard:** Immediate visualization of financial health, displaying total balances, monthly income/expense metrics, and quick-action interfaces.
* **Transaction Engine:** Comprehensive CRUD operations for standard and periodic transactions (weekly, monthly, yearly), featuring algorithmic forecasting for recurring expenses.
* **Shared Shopping List (Public Flow):** An unauthenticated, frictionless route designed for immediate adjustments to household inventory, featuring state management and unit configurations.
* **Cross-Platform User Interface:** Responsive design implementing tailored empty states, pull-to-refresh mechanics, and intuitive tab navigation to ensure cross-device consistency.

---

## Technical Architecture & Design Decisions

The application architecture implements industry standards and modern engineering patterns to ensure scalability and reliability:

* **End-to-End Type Safety (tRPC & Zod):** Establishes a strictly typed communication layer between the React Native frontend and the Node.js/Express backend. Utilizing tRPC ensures that API contracts are immutable, mitigating runtime payload errors and enabling deterministic data handling.
* **Resilient Data Access (Drizzle ORM):** Implements Drizzle ORM to facilitate high-performance, strictly typed SQL queries. Schema generation and migrations are managed programmatically to minimize impedance mismatch.
* **Zero-Trust Navigation Model:** Employs a React Navigation routing strategy that strictly segregates public interactions (`/shopping-list`) from authenticated views (`/dashboard`). The navigation controller dynamically resolves routing intents based on secure authentication states.
* **Offline-Ready State Handling:** Balances immediate UI responsiveness with eventual consistency. The integration of `AsyncStorage` alongside global React Context guarantees instantaneous UI interactions while securely persisting offline states and user preferences.
* **Universal Utility Styling (NativeWind):** Incorporates Tailwind CSS paradigms across native mobile components. This unifies the design system, reducing formatting boilerplate while maintaining native bridging performance.

---

## Technology Stack

**Frontend Ecosystem:**
* [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 54)
* [TypeScript](https://www.typescriptlang.org/) for static typing
* [NativeWind](https://www.nativewind.dev/) (Tailwind CSS bridging for React Native)
* [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing

**Backend Architecture:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [tRPC](https://trpc.io/) for RPC-based APIs
* [Drizzle ORM](https://orm.drizzle.team/) with MySQL driver
* Cryptography: `bcryptjs` and session management via `jose`

**Device Integration:**
* `expo-local-authentication`
* `expo-secure-store`
* `expo-haptics`

---

## Getting Started

### Prerequisites

Ensure the presence of [Node.js](https://nodejs.org/) in the local environment, alongside the Expo Go client or a configured iOS/Android emulator.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd homeapp-finance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Configuration:**
   * Configure the target MySQL database settings (e.g., via a `.env` file).
   * Execute the schema migration push:
   ```bash
   npm run db:push
   ```

4. **Initialize the Environment:**
   * The predefined script executes both the backend Node/tRPC server and the Expo Metro bundler concurrently.
   ```bash
   npm run dev
   ```

5. **Client Execution:**
   * Enter `a` via the terminal interface to compile for Android.
   * Enter `i` via the terminal interface to compile for iOS.
   * Alternatively, scan the generated QR code utilizing the Expo Go physical device client.

---

## Future Enhancements

* **Advanced Data Visualization:** Integration with graphic libraries (`react-native-chart-kit`) to provide granular category breakdowns and analytical models.
* **Custom Taxonomies:** Dynamic systems allowing users to define and orchestrate bespoke transaction categories and reporting structures.
* **Automated Data Export:** Mechanisms to generate standardized report snapshots (CSV/PDF) for external archival.
