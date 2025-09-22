import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from '../contexts/AnimationContext';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' }
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { animationsEnabled, toggleAnimations } = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: scrolled ? '2px solid #76b900' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
          {/* Logo */}
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            <span style={{ color: '#76b900' }}>Dev</span>
            <span style={{ color: '#a0e426' }}>CUDA</span>
          </div>

          {/* Desktop Navigation */}
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '2rem',
            margin: 0,
            padding: 0
          }} className="desktop-nav">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  style={{
                    color: '#a0e426',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'color 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#33ff33'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#a0e426'}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Matrix Toggle and Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Animation Toggle */}
            <button
              onClick={toggleAnimations}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '8px 12px',
                border: `1px solid ${animationsEnabled ? '#76b900' : '#2a6340'}`,
                borderRadius: '4px',
                backgroundColor: animationsEnabled ? 'rgba(118, 185, 0, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              title={`${animationsEnabled ? 'Disable' : 'Enable'} matrix animations`}
            >
              <span style={{ 
                fontSize: '0.75rem', 
                fontFamily: 'monospace',
                color: '#76b900'
              }}>
                MATRIX
              </span>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                border: '1px solid #76b900',
                backgroundColor: animationsEnabled ? '#76b900' : 'transparent',
                transition: 'all 0.3s ease'
              }} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '32px',
                height: '32px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              className="mobile-menu-btn"
            >
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                backgroundColor: '#76b900',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none'
              }} />
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                backgroundColor: '#76b900',
                margin: '4px 0',
                transition: 'all 0.3s ease',
                opacity: mobileMenuOpen ? 0 : 1
              }} />
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                backgroundColor: '#76b900',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
              }} />
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
            className="mobile-nav"
          >
            <ul style={{ 
              listStyle: 'none', 
              padding: '20px 0',
              margin: 0
            }}>
              {navItems.map((item) => (
                <li key={item.label} style={{ marginBottom: '1rem' }}>
                  <a
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      color: '#a0e426',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}