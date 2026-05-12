import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { PosRealtimeProvider } from "@/contexts/pos/RealtimeContext";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const POSLayout = lazy(() => import("./components/pos/POSLayout.tsx"));

// Refactored Modular Imports
const POSDashboard = lazy(() => import("./pages/dashboard/index.tsx"));
const POSScreen = lazy(() => import("./pages/pos-terminal/index.tsx"));
const OrderManagement = lazy(() => import("./pages/orders/index.tsx"));
const TableManagement = lazy(() => import("./pages/settings/tables/index.tsx"));
const KitchenDisplay = lazy(() => import("./pages/kitchen/index.tsx"));
const Billing = lazy(() => import("./pages/billing/index.tsx"));
const MenuManagement = lazy(() => import("./pages/menu/index.tsx"));
const Reports = lazy(() => import("./pages/reports/index.tsx"));
const PermissionManagement = lazy(() => import("./pages/hr/users/index.tsx"));
const InventoryManagement = lazy(() => import("./pages/inventory/index.tsx"));
const HRManagement = lazy(() => import("./pages/hr/index.tsx"));
const DeliveryTracking = lazy(() => import("./pages/delivery/index.tsx"));
const SalesAnalytics = lazy(() => import("./pages/analytics/index.tsx"));
const Login = lazy(() => import("./pages/auth/login/index.tsx"));
const Expenses = lazy(() => import("./pages/expenses/index.tsx"));
const RecipesPage = lazy(() => import("./pages/recipes/index.tsx"));

// Settings/Infrastructure
const PrinterIntegration = lazy(() => import("./pages/settings/printers/index.tsx"));
const POSTabsIntegration = lazy(() => import("./pages/settings/pos-tabs/index.tsx"));
const GiftLoyaltyCards = lazy(() => import("./pages/settings/gift-loyalty/index.tsx"));
const FBRIntegration = lazy(() => import("./pages/settings/fbr/index.tsx"));
const TaxDetails = lazy(() => import("./pages/settings/tax/index.tsx"));
const MobileApp = lazy(() => import("./pages/settings/mobile-app/index.tsx"));
const OutdoorDeliveryReport = lazy(() => import("./pages/delivery/outdoor-report.tsx"));

const PageGuard = lazy(() => import("./components/pos/PageGuard.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const RouteFallback = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <PosRealtimeProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/pos/login" element={<Login />} />
                <Route path="/pos" element={<POSLayout />}>
                  <Route index element={<PageGuard page="dashboard"><POSDashboard /></PageGuard>} />
                  <Route path="terminal" element={<PageGuard page="terminal"><POSScreen /></PageGuard>} />
                  <Route path="orders" element={<PageGuard page="orders"><OrderManagement /></PageGuard>} />
                  <Route path="tables" element={<PageGuard page="tables"><TableManagement /></PageGuard>} />
                  <Route path="kitchen" element={<PageGuard page="kitchen"><KitchenDisplay /></PageGuard>} />
                  <Route path="billing" element={<PageGuard page="billing"><Billing /></PageGuard>} />
                  <Route path="menu" element={<PageGuard page="menu"><MenuManagement /></PageGuard>} />
                  <Route path="recipes" element={<PageGuard page="recipes"><RecipesPage /></PageGuard>} />
                  <Route path="reports" element={<PageGuard page="reports"><Reports /></PageGuard>} />
                  <Route path="users" element={<PageGuard page="users"><PermissionManagement /></PageGuard>} />
                  <Route path="inventory" element={<PageGuard page="inventory"><InventoryManagement /></PageGuard>} />
                  <Route path="hr" element={<PageGuard page="hr"><HRManagement /></PageGuard>} />
                  <Route path="delivery" element={<PageGuard page="delivery"><DeliveryTracking /></PageGuard>} />
                  <Route path="analytics" element={<PageGuard page="analytics"><SalesAnalytics /></PageGuard>} />
                  <Route path="expenses" element={<PageGuard page="expenses"><Expenses /></PageGuard>} />
                  <Route path="printers" element={<PageGuard page="printers"><PrinterIntegration /></PageGuard>} />
                  <Route path="pos-tabs" element={<PageGuard page="postabs"><POSTabsIntegration /></PageGuard>} />
                  <Route path="gift-loyalty" element={<PageGuard page="giftcards"><GiftLoyaltyCards /></PageGuard>} />
                  <Route path="fbr" element={<PageGuard page="fbr"><FBRIntegration /></PageGuard>} />
                  <Route path="tax" element={<PageGuard page="tax"><TaxDetails /></PageGuard>} />
                  <Route path="mobile-app" element={<PageGuard page="mobileapp"><MobileApp /></PageGuard>} />
                  <Route path="outdoor-delivery-report" element={<PageGuard page="outdoordelivery"><OutdoorDeliveryReport /></PageGuard>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PosRealtimeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

