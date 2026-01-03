import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Gem, User, Sparkles, Menu, X, Globe, Box, Shirt, UserCircle, Compass, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBell from '@/components/notifications/NotificationBell';

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
    { label: "Brands", icon: Star, path: "/BrandPartnerships" },
    { label: t.nav.profile, icon: UserCircle, path: "/Profile" },
      { label: "Abonnement", icon: Star, path: "/Subscription" },
        ];

        if (currentUser?.role === 'admin') {
          navItems.push({ label: "Partnerships", icon: Star, path: "/AdminPartnerships" });
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

  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = React.useNavigate ? React.useNavigate() : null; // Safe check although Layout is in Router context usually

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Using window.location.href or similar if navigate not available, but usually Layout is wrapped.
      // Assuming navigate is available via context or we can import useNavigate from react-router-dom
       window.location.href = createPageUrl(`SearchResults?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen gradient-luxury font-sans text-neutral-900 selection:bg-amber-100">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to={createPageUrl("Gallery")} className="flex items-center gap-2 group">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6942ff9b2efb59336aebfa58/a0c7900de_ElegantLogowithAbstractGemIcon.png" 
              alt="L'Écrin Virtuel" 
              className="w-8 h-8 object-contain rounded-sm"
            />
            <span className="font-serif text-xl tracking-tight font-medium accent-shimmer">
              L'Écrin Virtuel
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex relative max-w-xs w-full ml-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
             <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 h-9 bg-neutral-100 border-transparent focus:bg-white transition-all rounded-full"
             />
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path === "/" ? "Gallery" : item.path.substring(1))}
                className={`flex items-center gap-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  isActive(item.path)
                    ? "text-gold"
                    : "text-neutral-400 hover:text-neutral-900"
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

            {/* Notification Bell */}
            <div className="ml-2 border-l border-neutral-200 pl-4 flex items-center gap-2">
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
      <footer className="border-t border-neutral-100 py-8 text-center">
                    <span className="accent-shimmer font-medium text-xs tracking-widest uppercase">{t.common.footer}</span>
                    <p className="mt-2 text-[10px] text-neutral-400">Powered by <a href="https://inferencevision.store" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">Inferencevision.store</a></p>
                  </footer>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <style>{`
        :root {
          --gold: #C9A962;
          --gold-light: #E8D9B5;
          --silver: #A8A9AD;
          --silver-light: #E5E5E7;
        }
        .text-gold { color: var(--gold); }
        .text-silver { color: var(--silver); }
        .bg-gold { background-color: var(--gold); }
        .bg-gold-light { background-color: var(--gold-light); }
        .bg-silver-light { background-color: var(--silver-light); }
        .border-gold { border-color: var(--gold); }
        .border-silver { border-color: var(--silver); }
        .gradient-luxury {
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #fafafa 100%);
        }
        .accent-shimmer {
          background: linear-gradient(90deg, var(--gold) 0%, var(--silver) 50%, var(--gold) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
      <LayoutContent>
         {children}
      </LayoutContent>
    </LanguageProvider>
  );
}