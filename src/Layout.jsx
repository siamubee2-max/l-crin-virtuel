import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Gem, User, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageProvider } from '@/components/LanguageProvider';

export default function Layout({ children }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: "Galerie", icon: Gem, path: "/" },
    { label: "L'Atelier", icon: Sparkles, path: "/Studio" },
    { label: "Ma Bibliothèque", icon: User, path: "/Wardrobe" },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <LanguageProvider>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        {/* Simple Footer */}
        <footer className="border-t border-neutral-200 py-8 text-center text-neutral-400 text-xs tracking-widest uppercase">
          L'Écrin Virtuel © 2024 — Luxe & Technologie
        </footer>
      </div>
    </LanguageProvider>
  );
}