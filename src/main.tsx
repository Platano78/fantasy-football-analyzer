import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { FantasyFootballProvider } from './contexts/FantasyFootballContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FantasyFootballProvider>
      <App />
    </FantasyFootballProvider>
  </React.StrictMode>,
)