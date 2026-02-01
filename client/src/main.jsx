import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // <--- PASTIKAN INI ADA

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* <--- PASTIKAN APP DIBUNGKUS INI */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)