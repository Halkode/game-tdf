import React, { useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Assets } from "pixi.js";
import TileMap from "./TileMap";
import TileSpriteFactory from "../utils/TileSpriteFactory";
import FogOfWarFilter from "../filters/FogOfWarFilter";
import { GAME_CONFIG, ASSET_PATHS, ALL_ASSETS, THEME_COLORS } from "../constants/assets";

// Componente de Loading Animado
const LoadingSpinner = ({ progress = 0, message = "Carregando..." }) => {
    const [dots, setDots] = useState("");
    
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 500);
        
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            color: 'white'
        }}>
            {/* Spinner */}
            <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            
            {/* Barra de progresso */}
            <div style={{
                width: '200px',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#3498db',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                }} />
            </div>
            
            {/* Mensagem */}
            <div style={{ fontSize: '16px', textAlign: 'center' }}>
                {message}{dots}
            </div>
            
            {/* Progresso em % */}
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                {Math.round(progress)}%
            </div>
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const PixiGameNew = ({ 
    width = GAME_CONFIG?.CANVAS_WIDTH || 800, 
    height = GAME_CONFIG?.CANVAS_HEIGHT || 600, 
    tiles = [], 
    items = [],
    playerInitialPosition = { x: 0, y: 0 },
    onPick,
    onExamine,
    onMove
}) => {
    const pixiRef = useRef(null);
    const appRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [playerPosition, setPlayerPosition] = useState(playerInitialPosition);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("Iniciando...");
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Refs para componentes do jogo
    const tileMapRef = useRef(null);
    const fogOfWarRef = useRef(null);
    const itemContainerRef = useRef(null);
    const playerSpriteRef = useRef(null);
    const cleanupRef = useRef(null);
    const timeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    const MAX_RETRIES = 3;
    const INIT_TIMEOUT = 15000; // 15 segundos timeout
    const DOM_READY_DELAY = 200; // Delay inicial

    useEffect(() => {
        let destroyed = false;
        let dragging = false;
        let lastPos = { x: 0, y: 0 };
        let zoom = 1;

        async function initPixi() {
            try {
                setLoadingProgress(5);
                setLoadingMessage("Verificando DOM...");

                // Aguardar o DOM estar pronto com timeout
                if (!pixiRef.current) {
                    console.warn("pixiRef não está pronto ainda");
                    throw new Error("Elemento DOM não encontrado");
                }

                setLoadingProgress(10);
                setLoadingMessage("Criando aplicação Pixi...");

                // Criar aplicação Pixi
                const app = new Application();
                await app.init({
                    width,
                    height,
                    backgroundColor: THEME_COLORS?.BACKGROUND || 0x1a1a1a,
                    webgl: { antialias: true },
                    webgpu: { antialias: false },
                });

                if (destroyed || !pixiRef.current) {
                    app.destroy(true, { children: true });
                    return;
                }

                setLoadingProgress(20);
                setLoadingMessage("Anexando canvas...");

                appRef.current = app;
                
                // Verificar se o elemento ainda existe antes de appendChild
                if (pixiRef.current && app.canvas) {
                    pixiRef.current.appendChild(app.canvas);
                } else {
                    throw new Error("Elemento DOM não disponível para appendChild");
                }

                setLoadingProgress(30);
                setLoadingMessage("Carregando assets...");

                // Pré-carregar assets essenciais
                await preloadAssets();

                if (destroyed) return;

                setLoadingProgress(50);
                setLoadingMessage("Configurando containers...");

                // Configurar containers principais
                const gameContainer = new Container();
                app.stage.addChild(gameContainer);
                
                // Posicionar container do jogo
                gameContainer.x = width / 2;
                gameContainer.y = height / 3;
                gameContainer.scale.set(zoom, zoom);

                setLoadingProgress(60);
                setLoadingMessage("Renderizando mapa...");

                // Inicializar TileMap se existe
                if (tiles && tiles.length > 0) {
                    tileMapRef.current = new TileMap(tiles, ASSET_PATHS);
                    await tileMapRef.current.render();
                    gameContainer.addChild(tileMapRef.current.getContainer());
                }

                setLoadingProgress(70);
                setLoadingMessage("Renderizando itens...");

                // Inicializar container de itens
                itemContainerRef.current = new Container();
                gameContainer.addChild(itemContainerRef.current);
                
                if (items && items.length > 0) {
                    await renderItems();
                }

                setLoadingProgress(80);
                setLoadingMessage("Criando jogador...");

                // Inicializar player
                await createPlayer();
                if (playerSpriteRef.current) {
                    gameContainer.addChild(playerSpriteRef.current);
                }

                setLoadingProgress(90);
                setLoadingMessage("Configurando fog of war...");

                // Inicializar Fog of War se temos tiles
                if (tiles && tiles.length > 0) {
                    const mapBounds = calculateMapBounds();
                    fogOfWarRef.current = new FogOfWarFilter(
                        mapBounds.width, 
                        mapBounds.height, 
                        GAME_CONFIG?.TILE_WIDTH || 64
                    );
                    fogOfWarRef.current.updatePlayerPosition(playerPosition.x, playerPosition.y);
                    gameContainer.addChild(fogOfWarRef.current.getContainer());
                }

                setLoadingProgress(95);
                setLoadingMessage("Configurando controles...");

                // Configurar controles
                const cleanup = setupControls(app, gameContainer);
                cleanupRef.current = cleanup;

                setLoadingProgress(100);
                setLoadingMessage("Finalizando...");

                // Pequeno delay para mostrar 100%
                await new Promise(resolve => setTimeout(resolve, 300));

                setIsInitialized(true);
                setLoading(false);
                retryCountRef.current = 0; // Reset contador de retry

                console.log("Pixi inicializado com sucesso!");

            } catch (err) {
                console.error("Erro ao inicializar Pixi:", err);
                
                // Se ainda temos tentativas, tentar novamente
                if (retryCountRef.current < MAX_RETRIES && !destroyed) {
                    retryCountRef.current++;
                    setLoadingMessage(`Tentativa ${retryCountRef.current}/${MAX_RETRIES}...`);
                    setLoadingProgress(0);
                    
                    console.log(`Tentando novamente (${retryCountRef.current}/${MAX_RETRIES})...`);
                    
                    // Aguardar um pouco antes de tentar novamente
                    setTimeout(() => {
                        if (!destroyed) {
                            initPixi();
                        }
                    }, 2000);
                } else {
                    setError(`Erro ao carregar o jogo: ${err.message}`);
                    setLoading(false);
                }
            }
        }

        async function preloadAssets() {
            try {
                // Verificar se ALL_ASSETS existe e é um array
                if (ALL_ASSETS && Array.isArray(ALL_ASSETS)) {
                    const assetsToLoad = ALL_ASSETS.filter(asset => asset && asset.length > 0);
                    
                    if (assetsToLoad.length > 0) {
                        // Carregar assets com progresso
                        for (let i = 0; i < assetsToLoad.length; i++) {
                            await Assets.load(assetsToLoad[i]);
                            const progress = 30 + (i / assetsToLoad.length) * 15; // 30-45%
                            setLoadingProgress(progress);
                        }
                    }
                }
            } catch (err) {
                console.warn("Alguns assets não puderam ser carregados:", err);
                // Não falhar por causa de assets
            }
        }

        async function renderItems() {
            if (!itemContainerRef.current || !items) return;

            itemContainerRef.current.removeChildren();

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    const sprite = await TileSpriteFactory.createObjectSprite(item, ASSET_PATHS);
                    
                    if (sprite) {
                        const { screenX, screenY } = toIsometric(item.position_x, item.position_y);
                        sprite.x = screenX;
                        sprite.y = screenY;
                        sprite.anchor.set(0.5, 1);
                        sprite.zIndex = item.position_x + item.position_y + 100; // Acima dos tiles

                        // Tornar interativo
                        sprite.interactive = true;
                        sprite.buttonMode = true;

                        sprite
                            .on('pointerover', () => {
                                sprite.tint = THEME_COLORS?.HIGHLIGHT || 0xffff00;
                            })
                            .on('pointerout', () => {
                                sprite.tint = 0xffffff;
                            })
                            .on('pointerdown', (event) => {
                                handleItemClick(item, event);
                            });

                        itemContainerRef.current.addChild(sprite);
                    }
                    
                    // Atualizar progresso durante renderização
                    const progress = 70 + (i / items.length) * 10; // 70-80%
                    setLoadingProgress(progress);
                    
                } catch (err) {
                    console.warn(`Erro ao renderizar item ${item.name}:`, err);
                }
            }

            itemContainerRef.current.sortableChildren = true;
        }

        async function createPlayer() {
            try {
                // Criar sprite simples para o player por enquanto
                const playerGraphic = new Graphics();
                playerGraphic.beginFill(0xff0000);
                playerGraphic.drawCircle(0, 0, 16);
                playerGraphic.endFill();

                const { screenX, screenY } = toIsometric(playerPosition.x, playerPosition.y);
                playerGraphic.x = screenX;
                playerGraphic.y = screenY;
                playerGraphic.zIndex = 1000; // Sempre no topo

                playerSpriteRef.current = playerGraphic;
            } catch (err) {
                console.error("Erro ao criar player:", err);
            }
        }

        function calculateMapBounds() {
            if (!tiles || tiles.length === 0) return { width: 10, height: 10 };

            const minX = Math.min(...tiles.map(t => t.x));
            const maxX = Math.max(...tiles.map(t => t.x));
            const minY = Math.min(...tiles.map(t => t.y));
            const maxY = Math.max(...tiles.map(t => t.y));

            return {
                width: maxX - minX + 5,
                height: maxY - minY + 5
            };
        }

        function setupControls(app, gameContainer) {
            const zoomConfig = {
                min: GAME_CONFIG?.ZOOM_MIN || 0.5,
                max: GAME_CONFIG?.ZOOM_MAX || 3,
                step: GAME_CONFIG?.ZOOM_STEP || 0.1
            };

            function setZoom(newZoom) {
                zoom = Math.max(zoomConfig.min, Math.min(zoomConfig.max, newZoom));
                gameContainer.scale.set(zoom, zoom);
            }

            const onMouseDown = (e) => {
                dragging = true;
                lastPos = { x: e.clientX, y: e.clientY };
            };

            const onMouseUp = () => {
                dragging = false;
            };

            const onMouseMove = (e) => {
                if (dragging) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    gameContainer.x += dx;
                    gameContainer.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            };

            const onWheel = (e) => {
                e.preventDefault();
                setZoom(zoom + (e.deltaY < 0 ? zoomConfig.step : -zoomConfig.step));
            };

            const onKeyDown = (e) => {
                handlePlayerMovement(e.key);
            };

            // Adicionar event listeners
            if (app.canvas) {
                app.canvas.addEventListener('mousedown', onMouseDown);
                app.canvas.addEventListener('mousemove', onMouseMove);
                app.canvas.addEventListener('wheel', onWheel);
            }
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('keydown', onKeyDown);

            // Cleanup function
            return () => {
                if (app.canvas) {
                    app.canvas.removeEventListener('mousedown', onMouseDown);
                    app.canvas.removeEventListener('mousemove', onMouseMove);
                    app.canvas.removeEventListener('wheel', onWheel);
                }
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('keydown', onKeyDown);
            };
        }

        function handlePlayerMovement(key) {
            let newX = playerPosition.x;
            let newY = playerPosition.y;

            switch (key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    newY -= 1;
                    break;
                case 's':
                case 'arrowdown':
                    newY += 1;
                    break;
                case 'a':
                case 'arrowleft':
                    newX -= 1;
                    break;
                case 'd':
                case 'arrowright':
                    newX += 1;
                    break;
                default:
                    return;
            }

            // Verificar se a posição é válida (tem tile de chão)
            if (tileMapRef.current) {
                const targetTile = tileMapRef.current.getTileAt(newX, newY);
                if (targetTile && targetTile.type === 'floor') {
                    movePlayer(newX, newY);
                }
            } else {
                // Se não temos tilemap, permitir movimento livre
                movePlayer(newX, newY);
            }
        }

        function movePlayer(newX, newY) {
            setPlayerPosition({ x: newX, y: newY });
            
            if (playerSpriteRef.current) {
                const { screenX, screenY } = toIsometric(newX, newY);
                playerSpriteRef.current.x = screenX;
                playerSpriteRef.current.y = screenY;
            }

            // Atualizar fog of war
            if (fogOfWarRef.current) {
                fogOfWarRef.current.updatePlayerPosition(newX, newY);
            }

            // Callback externo
            if (onMove) {
                onMove({ x: newX, y: newY });
            }
        }

        function handleItemClick(item, event) {
            const { clientX, clientY } = event.data.originalEvent;
            setSelectedItem(item);
            setMenuPosition({ x: clientX, y: clientY });
        }

        function toIsometric(x, y) {
            const tileWidth = GAME_CONFIG?.TILE_WIDTH || 64;
            const tileHeight = GAME_CONFIG?.TILE_HEIGHT || 32;
            
            const screenX = (x - y) * (tileWidth / 2);
            const screenY = (x + y) * (tileHeight / 2);
            return { screenX, screenY };
        }

        // Configurar timeout para detectar travamento
        timeoutRef.current = setTimeout(() => {
            if (!destroyed && loading) {
                console.error("Timeout na inicialização do Pixi");
                setError(`Timeout na inicialização (${INIT_TIMEOUT/1000}s). Tente recarregar a página.`);
                setLoading(false);
            }
        }, INIT_TIMEOUT);

        // Aguardar um pouco para garantir que o DOM está pronto
        const domTimeoutId = setTimeout(() => {
            if (!destroyed) {
                initPixi();
            }
        }, DOM_READY_DELAY);

        return () => {
            destroyed = true;
            clearTimeout(domTimeoutId);
            clearTimeout(timeoutRef.current);
            
            // Cleanup dos controles
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            
            // Cleanup dos componentes
            if (tileMapRef.current && tileMapRef.current.destroy) {
                tileMapRef.current.destroy();
            }
            if (fogOfWarRef.current && fogOfWarRef.current.destroy) {
                fogOfWarRef.current.destroy();
            }
            
            // Cleanup da aplicação Pixi
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
            }
        };
    }, [width, height, tiles, items, playerInitialPosition]);

    // Atualizar posição do player quando playerInitialPosition mudar
    useEffect(() => {
        if (isInitialized && playerSpriteRef.current) {
            setPlayerPosition(playerInitialPosition);
            const { screenX, screenY } = toIsometric(playerInitialPosition.x, playerInitialPosition.y);
            playerSpriteRef.current.x = screenX;
            playerSpriteRef.current.y = screenY;
            
            if (fogOfWarRef.current) {
                fogOfWarRef.current.updatePlayerPosition(playerInitialPosition.x, playerInitialPosition.y);
            }
        }
    }, [playerInitialPosition, isInitialized]);

    // Função para tentar novamente manualmente
    const handleRetry = () => {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);
        setLoadingMessage("Reiniciando...");
        retryCountRef.current = 0;
        
        // Limpar timeout anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Reiniciar o componente
        window.location.reload(); // Solução mais drástica mas efetiva
    };

    const handlePick = (item) => {
        if (onPick) onPick(item);
        setSelectedItem(null);
    };

    const handleExamine = (item) => {
        if (onExamine) onExamine(item);
        setSelectedItem(null);
    };

    const handleMove = (item) => {
        if (onMove) onMove(item);
        setSelectedItem(null);
    };

    const toIsometric = (x, y) => {
        const tileWidth = GAME_CONFIG?.TILE_WIDTH || 64;
        const tileHeight = GAME_CONFIG?.TILE_HEIGHT || 32;
        
        const screenX = (x - y) * (tileWidth / 2);
        const screenY = (x + y) * (tileHeight / 2);
        return { screenX, screenY };
    };

    if (loading) {
        return (
            <div style={{ 
                width, 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#1a1a1a', 
                color: 'white',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <LoadingSpinner 
                    progress={loadingProgress} 
                    message={loadingMessage}
                />
                {retryCountRef.current > 0 && (
                    <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.8, 
                        textAlign: 'center',
                        marginTop: '10px' 
                    }}>
                        Tentativa {retryCountRef.current} de {MAX_RETRIES}
                    </div>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                width, 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#1a1a1a', 
                color: 'red',
                flexDirection: 'column',
                gap: '15px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '24px' }}>⚠️</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Erro ao carregar o jogo</div>
                <div style={{ fontSize: '14px', maxWidth: '400px' }}>{error}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, maxWidth: '400px' }}>
                    Verifique se todas as dependências estão instaladas corretamente.
                    Se o problema persistir, tente recarregar a página.
                </div>
                <button
                    onClick={handleRetry}
                    style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '10px'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                >
                    🔄 Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width, height }}>
            <div ref={pixiRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Controles */}
            <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                maxWidth: '200px'
            }}>
                <div>Use WASD ou setas para mover</div>
                <div>Mouse para arrastar e zoom</div>
                <div>Clique nos objetos para interagir</div>
                <div>Posição: ({playerPosition.x}, {playerPosition.y})</div>
                {!isInitialized && <div style={{ color: 'yellow' }}>Inicializando...</div>}
            </div>

            {/* Menu de interação */}
            {selectedItem && (
                <div style={{
                    position: 'absolute',
                    top: Math.min(menuPosition.y, height - 200),
                    left: Math.min(menuPosition.x, width - 150),
                    backgroundColor: '#222',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    color: '#fff',
                    zIndex: 1000,
                    minWidth: '120px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {selectedItem.name}
                    </div>
                    <div 
                        style={{ cursor: 'pointer', padding: '2px 5px', borderRadius: '3px' }} 
                        onClick={() => handlePick(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Pegar
                    </div>
                    <div 
                        style={{ cursor: 'pointer', padding: '2px 5px', borderRadius: '3px' }} 
                        onClick={() => handleExamine(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Examinar
                    </div>
                    <div 
                        style={{ cursor: 'pointer', padding: '2px 5px', borderRadius: '3px' }} 
                        onClick={() => handleMove(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Mover
                    </div>
                    <div 
                        style={{ 
                            cursor: 'pointer', 
                            padding: '2px 5px', 
                            borderRadius: '3px', 
                            borderTop: '1px solid #555', 
                            marginTop: '5px' 
                        }} 
                        onClick={() => setSelectedItem(null)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Fechar
                    </div>
                </div>
            )}
        </div>
    );
};

export default PixiGameNew;