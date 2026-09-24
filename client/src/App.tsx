import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import PaymentResult from "./pages/PaymentResult";
import OrderTracking from "./pages/OrderTracking";
import LegalPage from "./pages/LegalPage";
import AdminOrders from "./pages/AdminOrders";
import Bundles from "./pages/Bundles";
import StoreSupport from "./components/StoreSupport";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/pagamento/:status" component={PaymentResult} />
      <Route path="/pedido" component={OrderTracking} />
      <Route path="/combos" component={Bundles} />
      <Route path="/legal/:page" component={LegalPage} />
      <Route path="/admin/pedidos" component={AdminOrders} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <StoreSupport />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
