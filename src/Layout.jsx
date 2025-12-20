import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Gem, User, Sparkles, Menu, X, Globe, Box, Shirt, UserCircle, Compass, Package, ShieldCheck, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import NotificationBell from '@/components/notifications/NotificationBell';
import { CartProvider, useCart } from '@/components/cart/CartProvider';
import CartSheet from '@/components/cart/CartSheet';

function CartButton() {
  const { cartCount, setIsOpen } = useCart();
  return (
    <Button variant="ghost" size="sm" className="relative" onClick={() => setIsOpen(true)}>
      <ShoppingBag className="w-5 h-5" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Button>
  );
}

function LayoutContent({ children }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t, language, setLanguage } = useLanguage();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUserLayout'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const navItems = [
    { label: t.nav.feed, icon: Compass, path: "/StyleFeed" },
    { label: t.nav.gallery, icon: Gem, path: "/" },
    { label: t.nav.studio, icon: Sparkles, path: "/Studio" },
    { label: t.nav.wardrobe, icon: User, path: "/Wardrobe" },
    { label: t.nav.closet, icon: Shirt, path: "/Closet" },
    { label: t.nav.jewelryBox, icon: Box, path: "/JewelryBox" },
    { label: t.nav.profile, icon: UserCircle, path: "/Profile" },
    { label: "Orders", icon: Package, path: "/Orders" },
    { label: "Stylists", icon: Star, path: "/Stylists" },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ label: "Admin", icon: ShieldCheck, path: "/AdminOrders" });
  }

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-amber-100">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo */}
          <Link to={createPageUrl("Gallery")} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center rounded-sm font-serif text-xl">
              É
            </div>
            <span className="font-serif text-xl tracking-tight font-medium group-hover:text-amber-600 transition-colors">
              L'Écrin Virtuel
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path === "/" ? "Gallery" : item.path.substring(1))}
                className={`flex items-center gap-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  isActive(item.path)
                    ? "text-amber-600"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive(item.path) ? "fill-amber-100" : ""}`} />
                {item.label}
              </Link>
            ))}

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 gap-2">
                  <Globe className="w-4 h-4" />
                  {languages.find(l => l.code === language)?.code.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className="gap-2"
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell & Cart */}
            <div className="ml-2 border-l border-neutral-200 pl-4 flex items-center gap-2">
               <CartButton />
               <NotificationBell />
            </div>
            </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-neutral-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 bg-white z-40 md:hidden p-6 flex flex-col gap-6"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path === "/" ? "Gallery" : item.path.substring(1))}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 text-lg font-medium p-4 rounded-xl ${
                  isActive(item.path)
                    ? "bg-amber-50 text-amber-700"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            ))}
            
            <div className="border-t pt-6">
              <p className="text-sm text-neutral-500 mb-3">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-200 py-8 text-center text-neutral-400 text-xs tracking-widest uppercase">
        {t.common.footer}
      </footer>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <LayoutContent>
           {children}
           <CartSheet />
        </LayoutContent>
      </CartProvider>
    </LanguageProvider>
  );
}