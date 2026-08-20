/**
 * Trade Ledger, Recut: a calm paper-and-ink commerce app, with Source Cobalt
 * leading trade navigation, hash-safe static deployment routes, and all public
 * pages nested in the shared shell.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import Cart from "@/pages/Cart";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import InfoPage from "@/pages/InfoPage";
import OrderConfirmation from "@/pages/OrderConfirmation";
import ProductDetail from "@/pages/ProductDetail";
import Shop from "@/pages/Shop";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/trade-refinements.css";
import "./styles/launch-readiness.css";

const useCloudflareHashLocation = Object.assign(
  (options?: Parameters<typeof useHashLocation>[0]) => useHashLocation(options),
  {
    hrefs: (href: string) => {
      const [path, search] = href.split("?");
      return `${search ? `?${search}` : ""}#${path}`;
    },
  },
);

function Router() {
  return <Switch>
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
    <Route path="/contact" component={Contact} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><WouterRouter hook={useCloudflareHashLocation}><ThemeProvider defaultTheme="light"><TooltipProvider><CatalogProvider><CartProvider><Toaster /><Router /></CartProvider></CatalogProvider></TooltipProvider></ThemeProvider></WouterRouter></ErrorBoundary>;
}

export default App;
