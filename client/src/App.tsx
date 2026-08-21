/**
 * Trade Ledger, Recut: a calm paper-and-ink commerce app, with Source Cobalt
 * leading trade navigation, canonical path-based deployment routes, and all public
 * pages nested in the shared shell.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/trade-refinements.css";
import "./styles/launch-readiness.css";

const Cart = lazy(() => import("@/pages/Cart"));
const Admin = lazy(() => import("@/pages/Admin"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const InfoPage = lazy(() => import("@/pages/InfoPage"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Shop = lazy(() => import("@/pages/Shop"));

function Router() {
  return <Suspense fallback={<main className="route-loading" aria-live="polite"><span>Loading catalogue</span></main>}><Switch>
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
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><CatalogProvider><CartProvider><Toaster /><Router /></CartProvider></CatalogProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
