import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Countries from "@/pages/countries";
import CountryPackages from "@/pages/country";
import Checkout from "@/pages/checkout";
import OrderStatus from "@/pages/order";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import HowItWorks from "@/pages/how-it-works";
import Help from "@/pages/help";
import About from "@/pages/about";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/countries" component={Countries} />
        <Route path="/countries/:slug" component={CountryPackages} />
        <Route path="/checkout/:packageId" component={Checkout} />
        <Route path="/orders/:id" component={OrderStatus} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/help" component={Help} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
