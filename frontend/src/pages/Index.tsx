import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import FeaturedMenu from '@/components/landing/FeaturedMenu';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import Reservation from '@/components/landing/Reservation';
import Testimonials from '@/components/landing/Testimonials';
import Gallery from '@/components/landing/Gallery';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <FeaturedMenu />
      <WhyChooseUs />
      <Reservation />
      <Testimonials />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
}
