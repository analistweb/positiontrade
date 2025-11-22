import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/nav-items';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AuthStatus } from '@/components/common/AuthStatus';

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-50 bg-card/90 backdrop-blur-sm"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 pt-safe-top">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Análise de Criptomoedas
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-3 sm:px-4 pb-6 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map(({ title, to, icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all touch-manipulation ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted active:bg-muted text-foreground'
                }`}
              >
                <span className={`${isActive ? 'text-primary-foreground' : 'text-primary'} flex-shrink-0`}>
                  {icon}
                </span>
                <span className="font-medium text-sm sm:text-base">{title}</span>
              </Link>
            );
          })}
          
          {/* Auth Status no mobile */}
          <div className="pt-4 mt-4 border-t border-border">
            <AuthStatus />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
