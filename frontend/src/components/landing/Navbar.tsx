import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandHeader } from '@/components/branding/BrandHeader';

const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
        <button onClick={() => scrollTo('#hero')} type="button" className="inline-flex min-w-0 items-center text-left">
          <BrandHeader variant="landing" />
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <button key={l.href} onClick={() => scrollTo(l.href)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </button>
          ))}
          <button onClick={() => scrollTo('#reservation')} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
            Book a Table
          </button>
          <Link to="/pos" className="border border-primary text-primary px-5 py-2 rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
            LOGIN
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map(l => (
                <button key={l.href} onClick={() => scrollTo(l.href)} className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-primary py-2">
                  {l.label}
                </button>
              ))}
              <button onClick={() => scrollTo('#reservation')} className="block w-full bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium text-center">
                Book a Table
              </button>
              <Link to="/pos" onClick={() => setOpen(false)} className="block w-full border border-primary text-primary px-5 py-2 rounded-full text-sm font-medium text-center">
                LOGIN
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
