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

---

## 6. Staff Bills Module (Planned Feature)

### Overview
A new module to track orders placed for staff members. Staff selection happens in the **billing page** (not during order placement), keeping the POS terminal workflow clean. A dedicated page shows pending and paid staff bills with date-wise grouping.

### 6.1 Backend Changes

#### Order Model Updates (`backend/models/order.js`)
Add two new fields:
```javascript
staffMember: { type: ObjectId, ref: 'Employee', default: null },
staffBillPaid: { type: Boolean, default: false }
```

#### New API Endpoints (`backend/routes/orders.routes.js`)

| Method | Endpoint | Request Body / Query | Purpose |
|--------|----------|---------------------|---------|
| `PATCH` | `/orders/:id/assign-staff` | `{ staffMember: employeeId }` | Assign staff member to an order |
| `GET` | `/orders/staff-bills` | `?employeeId=...&status=pending\|paid&from=...&to=...` | Get staff bills with filters |
| `PATCH` | `/orders/:id/mark-staff-paid` | `{}` | Mark a staff bill as paid |
| `GET` | `/orders/staff-summary` | - | Get all staff with pending/paid bill counts and totals |

#### Staff Summary Response Shape
```json
{
  "staff": [
    {
      "_id": "employeeId",
      "name": "Ahmed",
      "role": "Waiter",
      "pendingCount": 3,
      "pendingTotal": 4500,
      "paidCount": 12,
      "paidTotal": 18000,
      "lastOrderDate": "2026-09-01"
    }
  ]
}
```

#### Staff Bills Response Shape
```json
{
  "bills": [
    {
      "_id": "orderId",
      "code": "ORD-123456",
      "type": "dine-in",
      "total": 1500,
      "status": "completed",
      "staffBillPaid": false,
      "createdAt": "2026-09-01T10:30:00Z",
      "items": [...]
    }
  ],
  "pagination": { "page": 1, "pages": 3, "total": 25, "limit": 10 }
}
```

---

### 6.2 Frontend Changes

#### A. Billing Page - Staff Assignment
**File**: `frontend/src/pages/billing/components/BillPaymentPanel.tsx`

Add a "Assign to Staff" section in the payment panel (before payment buttons):
- Dropdown fetching employees from `GET /hr/employees`
- Shows "None (Customer)" as default + list of active employees
- "Assign" button calls `PATCH /orders/:id/assign-staff`
- Display currently assigned staff name with badge when already assigned
- Visual indicator on bill cards in BillList showing "Staff: [Name]"

#### B. New Staff Bills Page
**File**: `frontend/src/pages/staff-bills/index.tsx` (NEW)
**Route**: `/pos/staff-bills`

**2-panel layout (desktop) / stacked (mobile):**

**Left Panel - Staff List:**
- Fetches from `GET /orders/staff-summary`
- Each staff card shows:
  - Employee name and role
  - Pending bills count (highlighted badge)
  - Pending total amount (PKR)
  - Paid bills count
  - Last order date
- Click to select staff member
- Filter: All / Has Pending / Has Paid

**Right Panel - Selected Staff's Bills:**
- Header with staff name and summary stats
- Bills grouped by calendar day (newest first)
- Each bill card shows:
  - Order ID (`ORD-xxxxxx`)
  - Date and time
  - Items count and total amount
  - Status badge (Pending / Paid)
  - "Mark as Paid" button for pending bills (calls `PATCH /orders/:id/mark-staff-paid`)
- Bottom summary: Total pending amount, Total paid amount

#### C. Sidebar Navigation
**File**: `frontend/src/components/pos/POSLayout.tsx`

Add new link in `allLinks` array:
```javascript
{ to: '/pos/staff-bills', icon: Users, label: 'Staff Bills', page: 'staffbills' }
```

#### D. Route Registration
**File**: `frontend/src/App.tsx`

Add lazy import:
```javascript
const StaffBills = lazy(() => import("./pages/staff-bills/index.tsx"));
```

Add route inside `/pos`:
```javascript
<Route path="staff-bills" element={<PageGuard page="staffbills"><StaffBills /></PageGuard>} />
```

#### E. Page Permissions
**File**: `frontend/src/contexts/auth/AuthContext.tsx`

Add `'staffbills'` to `PageKey` type union.

---

### 6.3 UI/UX Flow

```
Billing Page Flow:
1. Cashier selects a bill from the list
2. In BillPaymentPanel, scrolls to "Assign to Staff" section
3. Selects a staff member from dropdown
4. Clicks "Assign" → order is tagged to that staff member
5. Bill card now shows "Staff: [Name]" badge

Staff Bills Page Flow:
1. Cashier navigates to /pos/staff-bills
2. Sees list of staff with pending/paid stats
3. Clicks on a staff member
4. Right panel shows all their bills grouped by date
5. When staff pays, clicks "Mark as Paid" on each bill
6. Stats update in real-time via React Query invalidation
```

---

### 6.4 Files Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/models/order.js` | Modify | Add `staffMember` (ObjectId) and `staffBillPaid` (Boolean) fields |
| `backend/controllers/orderController.js` | Modify | Add 4 new endpoint handlers |
| `backend/routes/orders.routes.js` | Modify | Register new routes |
| `frontend/src/contexts/auth/AuthContext.tsx` | Modify | Add `'staffbills'` to PageKey type |
| `frontend/src/components/pos/POSLayout.tsx` | Modify | Add sidebar link for Staff Bills |
| `frontend/src/App.tsx` | Modify | Add route and lazy import |
| `frontend/src/pages/billing/components/BillPaymentPanel.tsx` | Modify | Add staff assignment dropdown |
| `frontend/src/pages/staff-bills/index.tsx` | **Create** | New Staff Bills page (2-panel layout) |

---

### 6.5 Key Design Decisions

1. **No POS Terminal Changes**: Staff selection happens in billing only, keeping order placement fast
2. **Uses Existing Employees**: Reuses HR Employee model, no new data source
3. **Simple Payment Tracking**: No credit/debt logic - just pending vs paid status
4. **Date-wise Grouping**: Bills organized by calendar day for easy review
5. **Real-time Updates**: Socket.IO broadcasts on staff assignment and payment marking
