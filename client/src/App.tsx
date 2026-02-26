import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import ScannerDashboard from './pages/ScannerDashboard';
import ScanHistory from './pages/ScanHistory';
import ResultsPage from './pages/ResultsPage';
import Settings from './pages/Settings';

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-50 glass-card border-b border-primary/20">
      <Link to="/" className="flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-3xl">shield_lock</span>
        <h1 className="text-2xl font-bold tracking-tighter text-secondary">CipherSentinel</h1>
      </Link>
      <div className="flex items-center gap-4">
        {/* Top right UI removed as per requirement, maintaining flex layout for future extensions if needed */}
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-primary/20 bg-background-dark/80 px-6 pb-6 pt-3">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        <Link to="/" className={`flex flex-col items-center gap-1 group ${isActive('/') ? 'text-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}>
          <span className={`material-symbols-outlined text-2xl ${isActive('/') ? 'fill-1' : ''}`}>dashboard</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
        </Link>
        <Link to="/scan" className={`flex flex-col items-center gap-1 group ${isActive('/scan') ? 'text-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}>
          <span className={`material-symbols-outlined text-2xl ${isActive('/scan') ? 'fill-1' : ''}`}>radar</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Scan</span>
        </Link>



        <Link to="/history" className={`flex flex-col items-center gap-1 group ${isActive('/history') ? 'text-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}>
          <span className={`material-symbols-outlined text-2xl ${isActive('/history') ? 'fill-1' : ''}`}>analytics</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Results</span>
        </Link>
        <Link to="/settings" className={`flex flex-col items-center gap-1 group ${isActive('/settings') ? 'text-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}>
          <span className={`material-symbols-outlined text-2xl ${isActive('/settings') ? 'fill-1' : ''}`}>settings</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
        </Link>
      </div>
    </nav>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto space-y-6 w-full"
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative grid-pattern bg-background-dark font-display text-slate-100 pb-24">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5 pointer-events-none z-0" />

        <Header />

        <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden p-4 md:p-6">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
              <Route path="/scan" element={<PageWrapper><ScannerDashboard /></PageWrapper>} />
              <Route path="/scan/:id" element={<PageWrapper><ResultsPage /></PageWrapper>} />
              <Route path="/history" element={<PageWrapper><ScanHistory /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
