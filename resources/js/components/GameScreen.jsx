import React, { useState, useEffect } from 'react';
import GameMenu from './GameMenu';
import PixiGameImproved from './PixiGameImproved'; // Importa a versão melhorada

export default function GameScreen() {
  const [screen, setScreen] = useState('menu');
  const [gameData, setGameData] = useState(null); // Para armazenar todos os dados do jogo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleMenuSelect(option) {
    if (option === 'novo') {
      setLoading(true);
      setError(null);
      // Chamar a API para iniciar um novo jogo
      fetch('/api/game/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Novo jogo iniciado:', data);
          // Após iniciar o jogo, carregar os dados completos
          return fetch(`/api/game/load?player_id=${data.player_id}`);
        })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setGameData(data);
          setScreen('jogo');
        })
        .catch(err => {
          console.error('Erro ao iniciar ou carregar novo jogo:', err);
          setError('Erro ao iniciar ou carregar novo jogo: ' + err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (option === 'carregar') {
      // Lógica para carregar jogo existente (ainda a ser implementada)
      setScreen('carregar');
    } else if (option === 'config') {
      setScreen('config');
    }
  }

  // Função para atualizar o estado do jogo (ex: após interação com item)
  const updateGameData = async (playerId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/load?player_id=${playerId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGameData(data);
    } catch (err) {
      console.error('Erro ao atualizar dados do jogo:', err);
      setError('Erro ao atualizar dados do jogo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Passar as funções de interação para o PixiGameImproved
  const handlePick = async (item) => {
    if (!gameData || !gameData.player) return;
    console.log(`Tentando pegar item: ${item.name}`);
    try {
      const res = await fetch('/api/game/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          item_id: item.id,
          action_type: 'pick',
          player_id: gameData.player.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(data.message);
        alert(data.message);
        updateGameData(gameData.player.id); // Recarregar dados do jogo
      } else {
        console.error('Erro ao pegar item:', data.error);
        alert('Erro ao pegar item: ' + data.error);
      }
    } catch (err) {
      console.error('Erro de rede ao pegar item:', err);
      alert('Erro de rede ao pegar item.');
    }
  };

  const handleExamine = async (item) => {
    if (!gameData || !gameData.player) return;
    console.log(`Examinando item: ${item.name}`);
    try {
      const res = await fetch('/api/game/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          item_id: item.id,
          action_type: 'examine',
          player_id: gameData.player.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(data.message);
        alert(data.message);
      } else {
        console.error('Erro ao examinar item:', data.error);
        alert('Erro ao examinar item: ' + data.error);
      }
    } catch (err) {
      console.error('Erro de rede ao examinar item:', err);
      alert('Erro de rede ao examinar item.');
    }
  };

  const handleMove = async (item) => {
    if (!gameData || !gameData.player) return;
    console.log(`Movendo para item: ${item.name}`);
    // Para a mecânica de mover, vamos assumir que move o player para a posição do item
    // No futuro, isso pode ser uma ação mais complexa (empurrar, etc.)
    // Por enquanto, apenas atualiza a posição do player no frontend
    // E se for um item que pode ser movido no backend, a API de interação pode ser usada
    alert(`Movendo para a posição do item: ${item.name}`);
    // A lógica de movimento do player já está no PixiGameImproved, só precisamos acionar
    // o PixiGameImproved com a nova posição do player.
    // Para isso, o PixiGameImproved precisa receber uma prop para atualizar a posição do player.
    // Ou, o GameScreen pode gerenciar a posição do player e passar para o PixiGameImproved.
    // Por enquanto, a função handleMove no PixiGameImproved já atualiza o playerPosition.
    // Então, não precisamos de uma chamada de API aqui para o movimento do player.
    // Se fosse para mover o item, aí sim a API seria chamada.
  };

  return (
    <div>
      {screen === 'menu' && <GameMenu onSelect={handleMenuSelect} />}
      {screen === 'jogo' && gameData && (
        <PixiGameImproved
          tiles={gameData.scene_tiles || []}
          items={gameData.scene_items || []}
          width={800} // Definir largura e altura fixas ou calcular dinamicamente
          height={600}
          playerInitialPosition={gameData.player.position_x ? { x: gameData.player.position_x, y: gameData.player.position_y } : { x: 0, y: 0 }} // Posição inicial do player
          onPick={handlePick}
          onExamine={handleExamine}
          onMove={handleMove}
        />
      )}
      {screen === 'jogo' && loading && <div className="text-center text-white">Carregando jogo...</div>}
      {screen === 'jogo' && error && <div className="text-center text-red-500">Erro: {error}</div>}
      {screen === 'carregar' && (
        <div className="text-center text-gray-900 dark:text-white">Tela de Carregar (em breve)</div>
      )}
      {screen === 'config' && (
        <div className="text-center text-gray-900 dark:text-white">Tela de Configurações (em breve)</div>
      )}
    </div>
  );
}


