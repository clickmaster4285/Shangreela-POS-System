# Shanfreela POS System: Comprehensive Technical Analysis

This document provides an in-depth exploration of the Shanfreela POS architecture, data structures, and system logic.

---

## 1. System Architecture & Tech Stack

### Backend: Node.js / Express / MongoDB
The backend is a robust, modular REST API designed for high availability and strict data consistency.
- **Entry Point**: `server.js` initializes the Express application, sets up middleware (CORS, Morgan, Cache-Control), connects to MongoDB via Mongoose, and triggers auto-initialization.
- **Data Persistence**: MongoDB with Mongoose ODM. Models are centralized in `backend/models/index.js` for clean imports across the application.
- **Security**: Stateless JWT-based authentication. Passwords hashed with `bcryptjs` (10 rounds).
- **Static Assets**: Dedicated `/uploads` directory served via `express.static`, organized into `menu`, `staff`, and `expenses` subfolders.

### Frontend: React / Vite / TypeScript / Tailwind
A modern, type-safe SPA (Single Page Application) built for speed and a professional user experience.
- **Build Tool**: Vite provides near-instant HMR (Hot Module Replacement).
- **State Management**: 
    - **Global**: React Context API (`AuthContext`, `CartContext`).
    - **Server State**: TanStack Query (React Query) for efficient caching and background synchronization.
- **UI Framework**: Tailwind CSS with Shadcn UI (Radix UI primitives). Focus on accessibility and a consistent "Bento Grid" inspired aesthetic.
- **Forms & Validation**: `react-hook-form` coupled with `zod` for schema-based client-side validation.

---

## 2. Deep Dive: Data Models (Schemas)

### Core: Orders (`Order.js`)
The most complex schema in the system, tracking every transaction.
- **Key Fields**:
    - `code`: Unique human-readable ID (e.g., `ORD-123456`).
    - `type`: `dine-in`, `takeaway`, `delivery`.
    - `status`: Lifecycle tracking from `pending` to `completed` or `cancelled`.
    - `items`: Array of sub-documents containing `menuItem` snapshots, `quantity`, `notes`, and `requestId` (for KOT tracking).
    - `billing`: Stores snapshots of `subtotal`, `tax`, `discount`, `gstAmount`, and `serviceCharge`.

### Menu Management (`MenuItem.js`)
- **Fields**: `name`, `price`, `category`, `description`, `image`, `available` (Boolean), `kitchenRequired` (Boolean - determines if it goes to the Kitchen Display).

### Inventory & Logistics
- **`InventoryItem.js`**: Tracks `quantity`, `unit`, `minStock` (for low-stock alerts), `costPerUnit`, and `supplier`.
- **`InventoryLog.js`**: Audit trail for every stock change, recording the `action` (`restocked`, `wasted`, `used`), `quantity`, and `userId`.

### Human Resources
- **`Employee.js`**: Stores profile data, `salary`, `role`, and `status`.
- **`Attendance.js`**: Daily logs of `checkIn`, `checkOut`, `lateMinutes`, and `hoursWorked`.

---

## 3. Business Logic & Data Flow

### The Order Lifecycle
1.  **Creation**: When an order is placed, the backend calls `calculateGrandTotal` (in `utils/orderTotals.js`). 
    - **GST**: Applied based on `TaxConfig` (default ~16%).
    - **Service Charge**: Automatically applied **only to dine-in** orders.
    - **KOT Generation**: Items are grouped by `requestId` to ensure the kitchen only sees "new" additions to an existing table order.
2.  **Table Locking**: For dine-in, the `Table` status is flipped to `occupied` and linked via `currentOrder` code.
3.  **Kitchen Flow**: The `KitchenDisplay` component polls (via React Query) for orders with `status: pending/preparing`.
4.  **Completion**: Payment updates the status to `completed`. For dine-in, this **releases the table** back to `available`.

### Authentication & Permissions (RBAC)
The system uses a sophisticated Permission-based access control:
- **Roles**: `superadmin`, `hassaan`, `fahad`, `cashier`.
- **`AuthContext.tsx`**: Centralizes the `hasPageAccess`, `hasAction`, and `hasDataAccess` logic.
- **`PageGuard.tsx`**: A HOC (Higher Order Component) that wraps routes. If a user tries to access a page they aren't permitted for, it either redirects them to their "home" page or shows an "Access Denied" state.
- **Middleware**: Backend routes use `authRequired` to verify the JWT and `attachPermissions` to inject the user's role-based rules into the `req` object for controller-level checks.

---

## 4. Frontend Component Architecture

- **Layout System**: `POSLayout.tsx` provides the persistent sidebar and header. It handles navigation and "Discard Changes" protection (if items are in the cart when navigating away from the terminal).
- **API Wrapper (`lib/api.ts`)**:
    - Centralizes `fetch` logic.
    - Automatically injects the `Authorization` header.
    - Handles global error reporting.
    - Manages token persistence in `localStorage`.
- **Contexts**:
    - **`CartContext`**: Manages the transient state of an active order before it's saved to the DB.
    - **`AuthContext`**: Manages user session, login/logout, and RBAC rules.

---

## 5. Security & Optimizations

- **Cache Control**: The backend explicitly disables ETag and sets `Cache-Control: no-store` for all `/api` routes in `server.js` to prevent 304 (Not Modified) responses, ensuring the POS always shows live data.
- **Input Sanitization**: Controllers use regex escaping (`escapeRegex`) for search queries and strict numeric conversion for billing fields.
- **Auto-Initialization**: On the first run, `utils/autoInitialization.js` creates:
    - Default `superadmin` and other management accounts.
    - Seed menu items (if the DB is empty).
    - Initial role-based permission configurations.

---

## 6. Summary of Key Workflows

| Feature | Data Flow | Backend Utility |
| :--- | :--- | :--- |
| **Placing Order** | Frontend POST -> Order Controller -> Table Update -> Delivery Creation (if applicable) | `calculateGrandTotal` |
| **Stock Adjustment** | Frontend PATCH -> Inventory Controller -> Item Update -> Log Creation | `InventoryLog.create` |
| **Attendance** | Frontend POST -> HR Controller -> Attendance Record Creation | Date-fns (frontend) |
| **Login** | Frontend POST -> Auth Controller -> JWT Generation -> Permission Injection | `bcrypt.compare` |
