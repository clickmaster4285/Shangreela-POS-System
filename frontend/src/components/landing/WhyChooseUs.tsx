import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, Zap, Crown } from 'lucide-react';

const features = [
  { icon: Leaf, title: 'Premium Ingredients', desc: 'Sourced from the finest farms and suppliers worldwide for unparalleled freshness.' },
  { icon: ShieldCheck, title: 'Hygienic Kitchen', desc: 'HACCP-certified kitchen with the highest standards of cleanliness and safety.' },
  { icon: Zap, title: 'Swift Service', desc: 'Expertly trained staff ensuring prompt and attentive dining experience.' },
  { icon: Crown, title: 'Luxury Ambiance', desc: 'Elegant interiors designed to make every visit feel like a royal occasion.' },
];

export default function WhyChooseUs() {
  return (
    <section className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-primary font-sans text-sm tracking-[0.2em] uppercase mb-3">Why Shangreela Heights</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">The Royal Difference</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card-elevated p-6 text-center hover-lift"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
