import { useEffect } from 'react';
import { AnimationProvider } from './contexts/AnimationContext';
import MatrixBackground from './components/MatrixBackground';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import './App.css';

function App() {
  useEffect(() => {
    // Scroll to top on page load/refresh
    window.scrollTo(0, 0);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <AnimationProvider>
      <div className="app">
        <MatrixBackground />
        <Navigation />
        <main className="main-content">
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </main>
        <footer className="footer">
          <div className="container">
            <p>
              © {currentYear} Göktürk Batın Dervişoğlu. Built in React, styled around code,
              latency, and GPU systems.
            </p>
          </div>
        </footer>
      </div>
    </AnimationProvider>
  );
}

export default App;
