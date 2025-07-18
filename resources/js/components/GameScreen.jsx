import React, { useState, useEffect } from 'react';
import GameMenu from './GameMenu';
import CenarioCanvas from './CenarioCanvas';

export default function GameScreen() {
  const [screen, setScreen] = useState('menu');
  const [tiles, setTiles] = useState([]);
  const [sceneWidth, setSceneWidth] = useState(10);
  const [sceneHeight, setSceneHeight] = useState(10);
  const [items, setItems] = useState([]);

  function handleMenuSelect(option) {
    if (option === 'novo') {
      setScreen('jogo');
    }
    if (option === 'carregar') setScreen('carregar');
    if (option === 'config') setScreen('config');
  }

  useEffect(() => {
    if (screen === 'jogo') {
      fetch('/api/scenes/1')
        .then(res => res.json())
        .then(data => {
          setTiles(data.scene.tiles || []);
          setItems(data.scene.items || []);
        })
        .catch(err => console.error('Erro ao carregar cenário:', err));
    }
  }, [screen]);

  return (
    <div>
      {screen === 'menu' && <GameMenu onSelect={handleMenuSelect} />}
      {screen === 'jogo' && (
        <CenarioCanvas
          tiles={tiles}
          items={items}
          width={sceneWidth}
          height={sceneHeight}
        />
      )}
      {screen === 'carregar' && (
        <div className="text-center text-gray-900 dark:text-white">Tela de Carregar (em breve)</div>
      )}
      {screen === 'config' && (
        <div className="text-center text-gray-900 dark:text-white">Tela de Configurações (em breve)</div>
      )}
    </div>
  );
}
