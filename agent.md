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
| **Orders & Checkout** | `orderController.js` | Status shifting, KOT generation, Receipt logic, Table lifecycle locks, Staff assignment & payment tracking. |
| **Tax & Govt. Logs** | `fbrController.json` & `taxController` | Integrates required FBR tracking logic alongside local taxation math. |
| **Printers & Tracking** | `printerController.js` | Directs POS and KOT printing tasks locally to hardware. |
| **Inventory & Staffing** | `inventoryController.js` / `hrController.js` | Logs deductions per-item sold, maps attendance records per shift, Employee CRUD with delete. |

---

## 6. Staff Bills Module (Implemented)

### Overview
A fully implemented module to track orders placed for staff members. Staff selection happens in the **billing page** (not during order placement), keeping the POS terminal workflow clean. A dedicated page shows pending and paid staff bills with date-wise grouping. Staff members are managed via the **HR Employee** system (not a separate User role).

### 6.1 Backend Changes

#### Order Model Updates (`backend/models/order.js`)
Two new fields added:
```javascript
staffMember: { type: ObjectId, ref: 'Employee', default: null, index: true },
staffBillPaid: { type: Boolean, default: false }
// + compound index: { staffMember: 1, staffBillPaid: 1 }
```

#### API Endpoints (`backend/routes/orders.routes.js`)

| Method | Endpoint | Request Body / Query | Purpose |
|--------|----------|---------------------|---------|
| `PATCH` | `/orders/:id/assign-staff` | `{ staffMember: employeeId \| null }` | Assign/remove staff member from an order |
| `GET` | `/orders/staff-summary` | - | Aggregated staff with pending/paid counts and totals |
| `GET` | `/orders/staff-bills` | `?employeeId=...&status=pending\|paid\|all&from=...&to=...` | Individual bills for a staff member |
| `PATCH` | `/orders/:id/mark-staff-paid` | - | Mark staff bill as paid + sets order status to `completed` |

#### Staff Summary Response Shape
```json
{
  "staff": [
    {
      "_id": "employeeMongoId",
      "name": "Ali Khan",
      "role": "Waiter",
      "pendingCount": 5,
      "pendingTotal": 17222,
      "paidCount": 0,
      "paidTotal": 0,
      "lastOrderDate": "2026-09-02T08:14:21.357Z"
    }
  ]
}
```

#### Order List Response — Staff Fields
The order list endpoint (`GET /orders`) now includes:
```json
{
  "staffMember": "employeeMongoId" | null,
  "staffBillPaid": false
}
```

#### HR Employee Delete Endpoint
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `DELETE` | `/hr/employees/:id` | Delete an HR employee |

---

### 6.2 Frontend Changes

#### A. Billing Page — Staff Assignment
**File**: `frontend/src/pages/billing/components/BillPaymentPanel.tsx`

- "Assign to Staff" section in the payment panel (between order header and items)
- Dropdown fetches active HR employees from `GET /hr/employees?limit=100`
- Default: "None (Customer)" — selecting removes assignment
- Assignment persists across page navigation (loaded from `order.staffMember`)
- Shows assigned staff name below the dropdown
- `Order` interface now includes `staffMember` and `staffBillPaid` fields

#### B. Staff Bills Page
**File**: `frontend/src/pages/staff-bills/index.tsx`
**Route**: `/pos/staff-bills`

**2-panel layout (desktop) / stacked (mobile):**

**Left Panel — Staff List:**
- Fetches from `GET /orders/staff-summary`
- Status filter tabs: Pending / Paid / All
- Each staff card shows name, role, pending count, pending total
- Click to select → right panel loads their bills

**Right Panel — Selected Staff's Bills:**
- Header with staff name, role, pending/paid stats
- Bills grouped by calendar day (date-wise)
- Each bill card: Order ID, date/time, type, items count, total, status badge
- "Mark as Paid" button → calls `PATCH /orders/:id/mark-staff-paid`
- Marking as paid also sets order status to `completed` (removes from billing list)

#### C. Sidebar Navigation
**File**: `frontend/src/components/pos/POSLayout.tsx`
```javascript
{ to: '/pos/staff-bills', icon: Users, label: 'Staff Bills', page: 'staffbills' }
```

#### D. Route Registration
**File**: `frontend/src/App.tsx`
```javascript
const StaffBills = lazy(() => import("./pages/staff-bills/index.tsx"));
<Route path="staff-bills" element={<PageGuard page="staffbills"><StaffBills /></PageGuard>} />
```

#### E. Page Permissions
**File**: `frontend/src/contexts/auth/AuthContext.tsx`
- `'staffbills'` added to `PageKey` type union

---

### 6.3 HR Module Enhancements

#### Add/Edit Employee Modal (`frontend/src/pages/hr/index.tsx`)
- All fields now have labels with required/optional indicators
- **Role** changed from free text input to **dropdown** with 13 options: Waiter, Chef, Head Chef, Sous Chef, Line Cook, Host, Manager, Assistant Manager, Cashier, Bartender, Busser, Delivery, Supervisor
- Photo upload marked as **Optional** with "Remove" button when selected
- Required fields marked with red asterisk `*` (Name, Role)
- Delete button added to each employee card (red, with confirmation prompt)

#### User Management Modal (`frontend/src/pages/hr/users/index.tsx`)
- All fields labeled with red asterisk `*` for required
- "Add Staff" and "Edit Staff" modals have consistent labeled layout

---

### 6.4 Realtime Updates (Socket.IO)

**File**: `frontend/src/contexts/pos/RealtimeContext.tsx`

All React Query keys are properly invalidated per scope:

| Scope | Query Keys Invalidated |
|-------|----------------------|
| `orders` / `deliveries` | `deliveries`, `orders-management`, `staff-summary`, `staff-bills` |
| `orders` / `tables` | `pos-tables`, `pos-init-data`, `orders-init-data`, `order-mgmt-init`, `orders-management` |
| `menu` | `pos-menu-items`, `pos-init-data`, `orders-init-data`, `order-mgmt-init`, `menu-categories` |
| `floors` / `tables` | `floors-list`, `pos-floors`, `pos-init-data`, `orders-init-data`, `order-mgmt-init` |
| `inventory` / `dashboard` | All `inventory-*` keys (stock, alerts, stats, suppliers, logs, transfers, locations, transfer-categories, all) |
| `settings` | `pos-init-data`, `dashboard-overview`, `reports-dashboard`, `analytics-dashboard` |
| `users` | `orders-init-data`, `order-mgmt-init`, `users-list` |
| `hr` | `hr-employees` |
| `dashboard` (any data change) | `dashboard-overview`, `reports-dashboard`, `analytics-dashboard` |

---

### 6.5 UI/UX Flow

```
Billing Page Flow:
1. Cashier selects a bill from the list
2. In BillPaymentPanel, scrolls to "Assign to Staff" section
3. Selects a staff member from dropdown (HR employees)
4. Assignment saves immediately via PATCH /orders/:id/assign-staff
5. Staff assignment persists when navigating away and back

Staff Bills Page Flow:
1. User navigates to /pos/staff-bills
2. Summary cards: Total Pending Bills, Total Pending Amount, Staff Count
3. Left panel: Staff list with Pending/Paid/All filter tabs
4. Clicks on a staff member → right panel loads their bills
5. Bills grouped by calendar day with date headers
6. "Mark as Paid" button on each pending bill
7. Marking paid → order status becomes "completed" → clears from billing
8. All updates via Socket.IO (instant across tabs)
```

---

### 6.6 Files Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/models/order.js` | Modified | Added `staffMember` (ObjectId, indexed) and `staffBillPaid` (Boolean) fields |
| `backend/controllers/orderController.js` | Modified | Added 4 staff endpoints + `staffMember`/`staffBillPaid` in order list response |
| `backend/routes/orders.routes.js` | Modified | Registered staff routes (GET routes before POST /:id) |
| `backend/controllers/hrController.js` | Modified | Added `deleteEmployee` endpoint |
| `backend/routes/hr.routes.js` | Modified | Added `DELETE /hr/employees/:id` route |
| `frontend/src/contexts/auth/AuthContext.tsx` | Modified | Added `'staffbills'` to PageKey type |
| `frontend/src/data/pos/mockData.ts` | Modified | Added `staffMember` and `staffBillPaid` to Order interface |
| `frontend/src/components/pos/POSLayout.tsx` | Modified | Added sidebar link for Staff Bills |
| `frontend/src/App.tsx` | Modified | Added route and lazy import |
| `frontend/src/pages/billing/components/BillPaymentPanel.tsx` | Modified | Added staff assignment dropdown with HR employees |
| `frontend/src/pages/staff-bills/index.tsx` | **Created** | New Staff Bills page (2-panel layout) |
| `frontend/src/pages/hr/index.tsx` | Modified | Labeled form, role dropdown, delete button, optional photo |
| `frontend/src/pages/hr/users/index.tsx` | Modified | Labeled form with required indicators |
| `frontend/src/contexts/pos/RealtimeContext.tsx` | Modified | Added all missing query key invalidations |

---

### 6.7 Key Design Decisions

1. **No POS Terminal Changes**: Staff selection happens in billing only, keeping order placement fast
2. **Uses HR Employees**: Staff members come from `/hr/employees`, not a separate User role
3. **Simple Payment Tracking**: No credit/debt logic — just pending vs paid status
4. **Mark as Paid = Completed**: Marking a staff bill as paid also sets order status to `completed`
5. **Staff Assignment Persists**: `staffMember` field returned in order list response, loaded on revisit
6. **Date-wise Grouping**: Bills organized by calendar day for easy review
7. **Real-time Updates**: Socket.IO broadcasts on all changes, all query keys properly invalidated
8. **No Duplicate Role**: Avoided creating a "staff" User role — HR Employees already serve this purpose
