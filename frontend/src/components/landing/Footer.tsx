import { Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from '@/components/branding/Logo';

export default function Footer() {
  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="bg-deep-brown text-cream/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="mb-3">
              <Logo size={38} className="text-cream" textClassName="text-2xl text-cream" iconClassName="shrink-0" />
            </div>
            <p className="text-sm leading-relaxed">A legacy of culinary excellence, where every meal is a royal experience.</p>
          </div>
          <div>
            <h4 className="font-semibold text-cream mb-3 text-sm">Quick Links</h4>
            <div className="space-y-2">
              {['#about', '#menu', '#gallery', '#contact'].map(id => (
                <button key={id} onClick={() => scrollTo(id)} className="block text-sm hover:text-cream transition-colors capitalize">
                  {id.replace('#', '')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-cream mb-3 text-sm">Hours</h4>
            <p className="text-sm">Mon – Thu: 11AM – 10PM</p>
            <p className="text-sm">Fri – Sun: 11AM – 11PM</p>
          </div>
          <div>
            <h4 className="font-semibold text-cream mb-3 text-sm">Follow Us</h4>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-cream/10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Shiraz Restaurant. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
