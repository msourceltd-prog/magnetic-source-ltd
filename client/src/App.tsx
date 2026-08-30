/**
 * Trade Ledger, Recut: a calm paper-and-ink commerce app, with Source Cobalt
 * leading trade navigation, canonical path-based deployment routes, and all public
 * pages nested in the shared shell with resilient lazy-route recovery after deploys.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import CustomerAuthDialog from "@/components/CustomerAuthDialog";
import { Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazyWithRetry } from "./lib/lazyWithRetry";
import "./styles/trade-refinements.css";
import "./styles/launch-readiness.css";
import "./styles/site-polish.css";

const Cart = lazyWithRetry(() => import("@/pages/Cart"));
const Admin = lazyWithRetry(() => import("@/pages/Admin"));
const Checkout = lazyWithRetry(() => import("@/pages/Checkout"));
const Contact = lazyWithRetry(() => import("@/pages/Contact"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));
const Home = lazyWithRetry(() => import("@/pages/Home"));
const InfoPage = lazyWithRetry(() => import("@/pages/InfoPage"));
const OrderConfirmation = lazyWithRetry(() => import("@/pages/OrderConfirmation"));
const ProductDetail = lazyWithRetry(() => import("@/pages/ProductDetail"));
const Shop = lazyWithRetry(() => import("@/pages/Shop"));
function Router() {
  return <Suspense fallback={<span className="sr-only" aria-live="polite">Loading page</span>}><Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/product/:slug" component={ProductDetail} />
    <Route path="/cart" component={Cart} />
    <Route path="/admin" component={Admin} />
    <Route path="/checkout" component={Checkout} />
    <Route path="/order-confirmation" component={OrderConfirmation} />
    <Route path="/about" component={InfoPage} />
    <Route path="/delivery-returns" component={InfoPage} />
    <Route path="/privacy" component={InfoPage} />
    <Route path="/terms" component={InfoPage} />
    <Route path="/trade-account" component={InfoPage} />
    <Route path="/contact" component={Contact} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><CustomerAuthProvider><CatalogProvider><CartProvider><Toaster /><Router /><CustomerAuthDialog /></CartProvider></CatalogProvider></CustomerAuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
