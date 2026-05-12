import { motion } from 'framer-motion';
import { Utensils, Wine, Award } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden aspect-[4/5]">
              <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80" alt="Restaurant interior" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg hidden sm:block">
              <p className="font-serif text-3xl font-bold">15+</p>
              <p className="text-sm opacity-80">Years of Excellence</p>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <p className="text-primary font-sans text-sm tracking-[0.2em] uppercase mb-3">Our Story</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              A Legacy of <span className="text-primary">Culinary</span> Excellence
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Founded in 2009, Shangreela Heights has been a beacon of fine dining, blending traditional recipes with modern culinary artistry. Our chefs craft each dish with passion, using only the freshest ingredients sourced from premium suppliers around the world.
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Utensils, label: 'Master Chefs', value: '12+' },
                { icon: Wine, label: 'Menu Items', value: '150+' },
                { icon: Award, label: 'Awards Won', value: '28' },
              ].map((item) => (
                <div key={item.label} className="glass-card p-4 text-center">
                  <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-serif text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
