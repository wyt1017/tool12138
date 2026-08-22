import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '@/hooks/useSEO';
import Header from './Header';
import Footer from './Footer';
import MusicMiniPlayer from './MusicMiniPlayer';

export default function Layout() {
  useSEO();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh flex flex-col bg-grid"
    >
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <MusicMiniPlayer />
    </motion.div>
  );
}
