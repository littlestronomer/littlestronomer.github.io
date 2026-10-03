import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './horizon.css'
import HorizonPage from './HorizonPage.tsx'

// /walk/: the walk along the water, my hobby corner. The build has already filled #root with
// the same notes as plain HTML; this swaps in the live page once three.js and GSAP have loaded.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HorizonPage />
  </StrictMode>,
)
