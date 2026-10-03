import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './home.css'
import HomePage from './HomePage.tsx'

// The portfolio at /. The build has already filled #root with the same page as plain HTML;
// this swaps in the live one, with the night sky and the network moving.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
)
