import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/nav-items';
import { AuthStatus } from '@/components/common/AuthStatus';

export const EditorialHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-lg border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="editorial-container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 min-h-0 min-w-0"
            >
              <span className="font-serif text-xl lg:text-2xl font-bold text-foreground tracking-tight">
                CryptoAnalytics
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.slice(0, 5).map(({ title, to }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-0 min-w-0 ${
                      isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-alt'
                    }`}
                  >
                    {title}
                  </Link>
                );
              })}
              {navItems.length > 5 && (
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground rounded-md transition-colors min-h-0">
                    Mais
                    <ChevronRight className="inline-block w-4 h-4 ml-1 rotate-90" />
                  </button>
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-background border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
                      {navItems.slice(5).map(({ title, to }) => (
                        <Link
                          key={to}
                          to={to}
                          className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                            location.pathname === to
                              ? 'text-primary bg-primary/5'
                              : 'text-foreground-muted hover:text-foreground hover:bg-background-alt'
                          }`}
                        >
                          {title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <AuthStatus />
              </div>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden min-h-10 min-w-10"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background z-50 lg:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-serif text-xl font-bold text-foreground">
                    Menu
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {navItems.map(({ title, to, icon, description }, index) => {
                      const isActive = location.pathname === to;
                      return (
                        <motion.div
                          key={to}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                              isActive
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-background-alt'
                            }`}
                          >
                            <span className={`mt-0.5 ${isActive ? 'text-primary' : 'text-foreground-subtle'}`}>
                              {icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className={`block font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                {title}
                              </span>
                              {description && (
                                <span className="block text-sm text-foreground-subtle mt-0.5 line-clamp-2">
                                  {description}
                                </span>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 mt-0.5 ${isActive ? 'text-primary' : 'text-foreground-subtle'}`} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </nav>

                {/* Mobile Footer */}
                <div className="p-4 border-t border-border">
                  <AuthStatus />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EditorialHeader;
