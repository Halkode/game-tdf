import React, { useState, useEffect } from 'react';
import GameMenu from './GameMenu';
import PixiGameNew from './PixiGameNew';

export default function GameScreen() {
  const [screen, setScreen] = useState('menu');
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para exibir mensagens (pode ser customizada para usar toast/modal)
  const showMessage = (message, isError = false) => {
    console.log(isError ? 'ERRO:' : 'INFO:', message);
    alert(message); // Pode ser substituído por um sistema de notificação melhor
  };

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
            throw new Error(`Erro HTTP! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Novo jogo iniciado:', data);
          
          // Verificar se temos os dados necessários
          if (!data.player_id) {
            throw new Error('ID do jogador não retornado pela API');
          }
          
          // Após iniciar o jogo, carregar os dados completos
          return fetch(`/api/game/load?player_id=${data.player_id}`);
        })
        .then(res => {
          if (!res.ok) {
            throw new Error(`Erro ao carregar jogo! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          // Validar estrutura dos dados recebidos
          if (!data || typeof data !== 'object') {
            throw new Error('Dados do jogo inválidos recebidos da API');
          }
          
          console.log('Dados do jogo carregados:', data);
          setGameData(data);
          setScreen('jogo');
          setError(null); // Limpar erro anterior se houver
        })
        .catch(err => {
          console.error('Erro ao iniciar ou carregar novo jogo:', err);
          const errorMessage = err.message || 'Erro desconhecido';
          setError(`Erro ao iniciar novo jogo: ${errorMessage}`);
          showMessage(`Erro ao iniciar novo jogo: ${errorMessage}`, true);
        })
        .finally(() => {
          setLoading(false);
        });
        
    } else if (option === 'carregar') {
      setScreen('carregar');
    } else if (option === 'config') {
      setScreen('config');
    } else {
      console.warn('Opção de menu desconhecida:', option);
    }
  }

  // Função para atualizar o estado do jogo
  const updateGameData = async (playerId) => {
    if (!playerId) {
      console.error('ID do jogador não fornecido para updateGameData');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/game/load?player_id=${playerId}`);
      
      if (!res.ok) {
        throw new Error(`Erro HTTP! Status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Validar dados recebidos
      if (!data || typeof data !== 'object') {
        throw new Error('Dados inválidos recebidos da API');
      }
      
      setGameData(data);
      console.log('Dados do jogo atualizados:', data);
      
    } catch (err) {
      console.error('Erro ao atualizar dados do jogo:', err);
      const errorMessage = err.message || 'Erro desconhecido';
      setError(`Erro ao atualizar jogo: ${errorMessage}`);
      showMessage(`Erro ao atualizar jogo: ${errorMessage}`, true);
    } finally {
      setLoading(false);
    }
  };

  // Função genérica para interações com itens
  const handleItemInteraction = async (item, actionType) => {
    if (!gameData?.player?.id) {
      console.error('Dados do jogador não disponíveis');
      showMessage('Erro: Dados do jogador não disponíveis', true);
      return;
    }

    if (!item?.id) {
      console.error('Item inválido para interação');
      showMessage('Erro: Item inválido', true);
      return;
    }

    console.log(`${actionType} item: ${item.name}`);
    
    try {
      const res = await fetch('/api/game/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          item_id: item.id,
          action_type: actionType,
          player_id: gameData.player.id,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log('Interação bem-sucedida:', data.message);
        showMessage(data.message || 'Ação realizada com sucesso');
        
        // Atualizar dados do jogo apenas para ações que modificam o estado
        if (actionType === 'pick') {
          await updateGameData(gameData.player.id);
        }
      } else {
        const errorMessage = data.error || 'Erro desconhecido na interação';
        console.error(`Erro ao ${actionType} item:`, errorMessage);
        showMessage(`Erro ao ${actionType} item: ${errorMessage}`, true);
      }
      
    } catch (err) {
      console.error(`Erro de rede ao ${actionType} item:`, err);
      showMessage(`Erro de rede ao ${actionType} item`, true);
    }
  };

  const handlePick = (item) => handleItemInteraction(item, 'pick');
  const handleExamine = (item) => handleItemInteraction(item, 'examine');

  const handleMove = async (newPosition) => {
    // Se recebemos um item, extrair posição
    if (newPosition && typeof newPosition === 'object' && 'position_x' in newPosition) {
      const targetPosition = { x: newPosition.position_x, y: newPosition.position_y };
      console.log(`Movendo para posição:`, targetPosition);
      showMessage(`Movendo para posição (${targetPosition.x}, ${targetPosition.y})`);
      return;
    }
    
    // Se recebemos uma posição direta
    if (newPosition && typeof newPosition === 'object' && 'x' in newPosition) {
      console.log(`Player movido para:`, newPosition);
      
      // Se temos gameData, podemos atualizar a posição no backend
      if (gameData?.player?.id) {
        try {
          const res = await fetch('/api/game/move', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              player_id: gameData.player.id,
              x: newPosition.x,
              y: newPosition.y,
            }),
          });

          if (!res.ok) {
            throw new Error(`Erro HTTP! Status: ${res.status}`);
          }

          const data = await res.json();
          console.log('Posição atualizada no servidor:', data);
          
        } catch (err) {
          console.error('Erro ao atualizar posição no servidor:', err);
          // Não mostrar erro para o usuário, pois o movimento local já funcionou
        }
      }
    }
  };

  // Função para voltar ao menu
  const handleBackToMenu = () => {
    setScreen('menu');
    setGameData(null);
    setError(null);
    setLoading(false);
  };

  // Função para calcular posição inicial do player
  const getPlayerInitialPosition = () => {
    if (gameData?.player) {
      return {
        x: gameData.player.position_x || 0,
        y: gameData.player.position_y || 0
      };
    }
    return { x: 0, y: 0 };
  };

  return (
    <div className="w-full h-full">
      {screen === 'menu' && (
        <GameMenu 
          onSelect={handleMenuSelect} 
          loading={loading}
          error={error}
        />
      )}
      
      {screen === 'jogo' && (
        <div className="relative w-full h-full">
          {/* Botão para voltar ao menu */}
          <button
            onClick={handleBackToMenu}
            className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg"
          >
            Voltar ao Menu
          </button>
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
              <div className="text-white text-xl">Carregando...</div>
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="absolute top-16 right-4 bg-red-600 text-white p-4 rounded shadow-lg z-40 max-w-sm">
              <div className="font-bold">Erro:</div>
              <div>{error}</div>
              <button 
                onClick={() => setError(null)}
                className="mt-2 bg-red-800 hover:bg-red-900 px-2 py-1 rounded text-sm"
              >
                Fechar
              </button>
            </div>
          )}
          
          {/* Game component */}
          {gameData ? (
            <PixiGameNew
              tiles={gameData.scene_tiles || []}
              items={gameData.scene_items || []}
              width={800}
              height={600}
              playerInitialPosition={getPlayerInitialPosition()}
              onPick={handlePick}
              onExamine={handleExamine}
              onMove={handleMove}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white">
              <div>Carregando dados do jogo...</div>
            </div>
          )}
        </div>
      )}
      
      {screen === 'carregar' && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white">
          <div className="text-xl mb-4">Tela de Carregar Jogo</div>
          <div className="text-gray-400 mb-8">(funcionalidade em desenvolvimento)</div>
          <button
            onClick={handleBackToMenu}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Voltar ao Menu
          </button>
        </div>
      )}
      
      {screen === 'config' && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white">
          <div className="text-xl mb-4">Configurações</div>
          <div className="text-gray-400 mb-8">(funcionalidade em desenvolvimento)</div>
          <button
            onClick={handleBackToMenu}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Voltar ao Menu
          </button>
        </div>
      )}
    </div>
  );
}