# Shangreela POS System: Comprehensive Technical Architecture

This document provides an exhaustive, up-to-date analysis of the Shangreela POS system's architecture, data structures, UI/UX logic, and system workflows.

---

## 1. System Architecture & Tech Stack

### Backend: Node.js / Express / MongoDB
The backend is a high-availability, modular REST API designed for extreme data consistency and high-velocity POS loads.
- **Entry Point**: `server.js` initializes the application, sets up global middleware (CORS, caching), connects via Mongoose, and triggers data auto-initialization.
- **Data Persistence**: MongoDB with Mongoose ODM.
- **Controllers & Modules**: The backend is extremely feature-rich, maintaining modular controllers for: `analytics`, `auth`, `dashboard`, `delivery`, `expense`, `fbr`, `floor`, `giftCard`, `hr`, `inventory`, `loyalty`, `menu`, `mobile`, `order`, `posTab`, `printer`, `reports`, `table`, `tax`, and `user`.
- **Security**: Stateless JWT-based authentication. Role Based Access Control (RBAC) middleware forces explicit endpoint security.
- **Anti-Caching Mechanism**: Server explicitly sets `Cache-Control: no-store` on all `/api` routes ensuring the POS never fetches stale 304 payloads during high-speed caching.

### Frontend: React / Vite / TypeScript / Tailwind
A highly optimized, type-safe Single Page Application specifically designed to minimize cashier friction.
- **Build Infrastructure**: Vite providing lightning-fast HMR and optimized production bundles.
- **Global State Management**: Shifted heavily to **Zustand** (`usePOSStore`, `useOrderStore`) replacing old Context APIs for maximum re-render efficiency across POS views.
- **Server State & Caching**: **TanStack Query (React Query)** handles data polling, mutation states, and background synchronization via custom hooks like `usePosRealtimeScopes`.
- **UI Architecture**: Tailwind CSS mapped via Radix UI primitives (Shadcn UI). Features a sophisticated "Bento Grid" dark-mode/glassmorphism design language.

---

## 2. Core Business Logic & State Flow

### The POS Terminal (`usePOSStore`)
The heart of cashier interaction.
- **Instant Workflow**: Optimized for extreme speed. Menu items clicked in the `MenuGrid` are **instantly added to the cart** without modal interruption. Customization modals only appear locally when explicitly selecting variations or addons.
- **Zustand Engine**: Tracks `menuItems`, `taxRates`, `orderType` (Dine-in, Takeaway, Delivery), multiple search queries natively, and deep cart modifications (qty deltas, custom addons, discount states).

### The Order & Billing Lifecycle (`useOrderStore`)
- **Pagination & Limits**: The backend restricts payload loads with a precise robust query filter (`page`, `limit=50`, `size`). Backend structures return a `pagination` object (`{ pages, total, limit }`). **Crucial Frontend Rule**: The frontend must access `pagination.pages` to limit UI loops. `totalPages` does not exist on the response.
- **Time/Data Guarding**: Filters are heavily opinionated to default `DateRange` to `today` (the current operating day) rather than `null`. This prevents the POS from accidentally requesting years of historical data simultaneously.
- **Empty States ("Verbose UX")**: When `Order` or `Billing` filters yield zero results, the UI renders a **Verbose Empty State**. Instead of a generic "No Orders Found," the UI prints exactly which variables are constrained: `Date Range`, `Status`, `Type`, `Floor`, `Cashier`, allowing immediate operator correction.
- **Taxation & Pakistani Logic**: The system dynamically handles Pakistan's specific taxation breakdown. GST and Service Charges conditionally apply based on Order Types (e.g., Service charge strictly on Dine-in). 

### Kitchen Flow & Table Locking
- Items added to dine-in orders automatically shift physical `Tables` into `occupied` statuses via `tableMap` linking. 
- The Kitchen Display (`Kitchen` view) automatically filters unprinted or `preparing` queued status items, grouped by sub-requests so line cooks don't remake existing items.

---

## 3. Frontend Views & Modules

- **`pos-terminal`**: The primary operational screen. High-density cart grid.
- **`orders/index.tsx`**: A dashboard grid view of all existing active lifecycle orders allowing rapid mutation (Cancel, Edit, Switch Table).
- **`billing/index.tsx`**: A split-panel interface. Filter buttons dynamically reflect total item counts (e.g., `ALL (14)`, `PENDING (5)`). Order metadata is aggregated strictly at the top of the `BillPaymentPanel` so the operational item grid mounts higher.
- **`inventory` / `kitchen` / `delivery` / `hr` / `analytics`**: Peripheral high-functioning tracking screens integrating closely into the overarching reporting matrices.

---

## 4. Key Security & Operational Safeguards

- **Submit Locks**: Actions like `Complete Payment` or `Void Order` utilize a native system `useSubmitLock()` preventing double-clicks or multiple identical API requests from destroying the DB structure.
- **Print Guards**: Bills track explicit `printed` Booleans via `localStorage` maps overlaid with backend persistence so kitchen routing isn't duplicated on refresh.
- **Role Permissions Context**: Extensive `hasAction` and `hasDataAccess` mapping ensures Cashiers cannot execute Refunds or voids without higher managerial authentication via the backend.

---

## 5. Summary of API Controller Pipelines

| Feature Area | Controller | Responsibilities |
| :--- | :--- | :--- |
| **Orders & Checkout** | `orderController.js` | Status shifting, KOT generation, Receipt logic, Table lifecycle locks. |
| **Tax & Govt. Logs** | `fbrController.json` & `taxController` | Integrates required FBR tracking logic alongside local taxation math. |
| **Printers & Tracking** | `printerController.js` | Directs POS and KOT printing tasks locally to hardware. |
| **Inventory & Staffing** | `inventoryController.js` / `hrController.js` | Logs deductions per-item sold and maps attendance records per shift. |
