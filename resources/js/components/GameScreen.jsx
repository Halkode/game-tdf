import React, { useState, useEffect } from 'react';
import GameMenu from './GameMenu';
import PixiGame from './PixiGame';

export default function GameScreen() {
  const [screen, setScreen] = useState('menu');
  const [tiles, setTiles] = useState([]);
  const [sceneWidth, setSceneWidth] = useState(10);
  const [sceneHeight, setSceneHeight] = useState(10);
  const [items, setItems] = useState([]);

  function handleMenuSelect(option) {
    if (option === 'novo') setScreen('jogo');
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
          if (data.scene.tiles && data.scene.tiles.length > 0) {
            const maxX = Math.max(...data.scene.tiles.map(t => t.x));
            const maxY = Math.max(...data.scene.tiles.map(t => t.y));
            setSceneWidth(maxX + 1);
            setSceneHeight(maxY + 1);
          }
        })
        .catch(err => console.error('Erro ao carregar cenário:', err));
    }
  }, [screen]);

  return (
    <div>
      {screen === 'menu' && <GameMenu onSelect={handleMenuSelect} />}
      {screen === 'jogo' && (
        <PixiGame
          tiles={tiles}
          items={items}
          width={sceneWidth * 64}
          height={sceneHeight * 32}
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