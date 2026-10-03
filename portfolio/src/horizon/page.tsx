import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './horizon.css'
import OnePage from './OnePage.tsx'

// /walk/page/: the walk's notes as one plain page, without three.js or GSAP.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OnePage />
  </StrictMode>,
)
