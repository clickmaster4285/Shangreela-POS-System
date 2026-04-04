import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuCategories, type MenuItem } from '@/data/mockData';
import { api, type PaginatedResponse } from '@/lib/api';

export default function FeaturedMenu() {
  const [active, setActive] = useState('All');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  useEffect(() => {
    api<PaginatedResponse<MenuItem>>('/menu?page=1&limit=12')
      .then((response) => setMenuItems(response.items))
      .catch(() => {});
  }, []);
  const filtered = active === 'All' ? menuItems : menuItems.filter(i => i.category === active);
  const formatPKR = (price: number) => `Rs. ${price.toLocaleString('en-PK')}`;

  return (
    <section id="menu" className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-primary font-sans text-sm tracking-[0.2em] uppercase mb-3">Our Menu</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">Curated for Royalty</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Every dish tells a story of passion, tradition, and culinary innovation.</p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {menuCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                active === cat
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-elevated hover-lift p-5"
              >
                <span className="text-xs text-primary font-medium uppercase tracking-wider">{item.category}</span>
                <h3 className="font-serif text-lg font-semibold text-foreground mt-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <p className="font-serif text-xl font-bold text-primary mt-3">{formatPKR(item.price)}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
