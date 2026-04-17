import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PosRealtimeProvider } from "@/contexts/RealtimeContext";
import { CartProvider } from "@/contexts/CartContext";
const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const POSLayout = lazy(() => import("./components/pos/POSLayout.tsx"));
const POSDashboard = lazy(() => import("./pages/pos/POSDashboard.tsx"));
const POSScreen = lazy(() => import("./pages/pos/POSScreen.tsx"));
const OrderManagement = lazy(() => import("./pages/pos/OrderManagement.tsx"));
const TableManagement = lazy(() => import("./pages/pos/TableManagement.tsx"));
const KitchenDisplay = lazy(() => import("./pages/pos/KitchenDisplay.tsx"));
const Billing = lazy(() => import("./pages/pos/Billing.tsx"));
const MenuManagement = lazy(() => import("./pages/pos/MenuManagement.tsx"));
const Reports = lazy(() => import("./pages/pos/Reports.tsx"));
const PermissionManagement = lazy(() => import("./pages/pos/PermissionManagement.tsx"));
const InventoryManagement = lazy(() => import("./pages/pos/InventoryManagement.tsx"));
const HRManagement = lazy(() => import("./pages/pos/HRManagement.tsx"));
const DeliveryTracking = lazy(() => import("./pages/pos/DeliveryTracking.tsx"));
const SalesAnalytics = lazy(() => import("./pages/pos/SalesAnalytics.tsx"));
const Login = lazy(() => import("./pages/pos/Login.tsx"));
const PageGuard = lazy(() => import("./components/pos/PageGuard.tsx"));
const PrinterIntegration = lazy(() => import("./pages/pos/PrinterIntegration.tsx"));
const POSTabsIntegration = lazy(() => import("./pages/pos/POSTabsIntegration.tsx"));
const GiftLoyaltyCards = lazy(() => import("./pages/pos/GiftLoyaltyCards.tsx"));
const FBRIntegration = lazy(() => import("./pages/pos/FBRIntegration.tsx"));
const TaxDetails = lazy(() => import("./pages/pos/TaxDetails.tsx"));
const MobileApp = lazy(() => import("./pages/pos/MobileApp.tsx"));
const OutdoorDeliveryReport = lazy(() => import("./pages/pos/OutdoorDeliveryReport.tsx"));
const Expenses = lazy(() => import("./pages/pos/Expenses.tsx"));

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
        <CartProvider>
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
        </CartProvider>
        </PosRealtimeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
