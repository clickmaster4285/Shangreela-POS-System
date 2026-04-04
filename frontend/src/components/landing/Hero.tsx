import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

export default function Hero() {
  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Fine dining restaurant interior"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-brown/70 via-deep-brown/50 to-deep-brown/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-rose-gold font-sans text-sm sm:text-base tracking-[0.3em] uppercase mb-4">
            Premium Dining Experience
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-cream leading-tight mb-6"
        >
          Experience the Taste of{' '}
          <span className="gradient-text">Royal Dining</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="text-cream/80 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-sans"
        >
          Indulge in a world of exquisite flavors, elegant ambiance, and impeccable service. Where every meal becomes a royal celebration.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button onClick={() => scrollTo('#menu')} className="bg-primary hover:bg-secondary text-primary-foreground px-8 py-3.5 rounded-full font-medium text-sm tracking-wide transition-all hover:shadow-lg">
            View Menu
          </button>
          <button onClick={() => scrollTo('#reservation')} className="border-2 border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-deep-brown px-8 py-3.5 rounded-full font-medium text-sm tracking-wide transition-all">
            Book a Table
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={() => scrollTo('#about')}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/60 hover:text-cream transition-colors"
      >
        <ChevronDown size={32} />
      </motion.button>
    </section>
  );
}
