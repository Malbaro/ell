import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { Auth } from "./pages/Auth";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Favorites } from "./pages/Favorites";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && !isAuthRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </main>
      {!isAdminRoute && !isAuthRoute && <Footer />}
      <CartDrawer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
