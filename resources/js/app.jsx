import React from 'react';
import { createRoot } from 'react-dom/client';
import GameScreen from './components/GameScreen';

if (document.getElementById('cenario-root')) {
    createRoot(document.getElementById('cenario-root')).render(<GameScreen />);
}
