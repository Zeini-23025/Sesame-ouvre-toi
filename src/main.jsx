import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VoiceAuth from './VoiceAuth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VoiceAuth />
  </StrictMode>,
)
