import React, { useEffect, useRef, useState } from "react";
import { Application, Texture, Sprite, Graphics, Container, Assets, Filter } from "pixi.js";

const tileWidth = 64;
const tileHeight = 32;

function toIsometric(x, y) {
    const screenX = (x - y) * (tileWidth / 2);
    const screenY = (x + y) * (tileHeight / 2);
    return { screenX, screenY };
}

class FogOfWarFilter extends Filter {
    constructor(lightRadius = 100, lightX = 0, lightY = 0) {
        const fragmentShader = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform vec2 lightPos;
            uniform float lightRadius;
            uniform vec2 screenSize;

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                vec2 pixelPos = vTextureCoord * screenSize;
                float distance = length(pixelPos - lightPos);
                float visibility = smoothstep(lightRadius, lightRadius * 0.3, distance);
                color.rgb *= visibility;
                gl_FragColor = color;
            }
        `;

        const uniforms = {
            lightPos: [lightX, lightY],
            lightRadius: lightRadius,
            screenSize: [800, 600],
        };

        super(null, fragmentShader, uniforms);
    }

    updateLight(x, y, radius) {
        this.uniforms.lightPos = [x, y];
        this.uniforms.lightRadius = radius;
    }
}

const PixiGameImproved = ({ width = 800, height = 600, tiles = [], items = [], playerInitialPosition = { x: 0, y: 0 }, onPick, onExamine, onMove }) => {
    const pixiRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [playerPosition, setPlayerPosition] = useState(playerInitialPosition);
    const [hoveredItem, setHoveredItem] = useState(null);

    useEffect(() => {
        let app;
        let destroyed = false;
        let dragging = false;
        let lastPos = { x: 0, y: 0 };
        let zoom = 1;
        let mapContainer;
        let playerSprite;
        let fogFilter;

        let onMouseDown, onMouseUp, onMouseMove, onWheel, onCanvasClick;

        async function initPixi() {
            app = new Application();
            await app.init({
                width,
                height,
                backgroundColor: 0x1a1a1a, // Cor mais escura para atmosfera Darkwood
                webgl: { antialias: true },
                webgpu: { antialias: false },
            });

            if (destroyed) {
                app.destroy(true, { children: true });
                return;
            }

            pixiRef.current.appendChild(app.canvas);
            app.stage.removeChildren();

            mapContainer = new Container();
            app.stage.addChild(mapContainer);
            mapContainer.x = width / 2;
            mapContainer.y = 100;
            mapContainer.scale.set(zoom, zoom);

            // Criar fog of war filter
            fogFilter = new FogOfWarFilter(150, width / 2, height / 2);
            mapContainer.filters = [fogFilter];

            // Renderizar tiles com cores atmosféricas
            tiles.forEach(tile => {
                const { screenX, screenY } = toIsometric(tile.x, tile.y);
                const g = new Graphics();
                
                // Paleta de cores inspirada em Darkwood
                let fillColor;
                switch (tile.type) {
                    case "floor":
                        fillColor = 0x4a5d23; // Verde escuro terroso
                        break;
                    case "wall":
                        fillColor = 0x3d3d3d; // Cinza escuro
                        break;
                    case "water":
                        fillColor = 0x1e3a5f; // Azul escuro
                        break;
                    default:
                        fillColor = 0x2d2d2d; // Cinza muito escuro
                }
                
                g.lineStyle(1, 0x222222) // Bordas mais escuras
                    .beginFill(fillColor)
                    .moveTo(screenX, screenY)
                    .lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2)
                    .lineTo(screenX, screenY + tileHeight)
                    .lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2)
                    .lineTo(screenX, screenY)
                    .endFill();
                    
                // Adicionar interatividade para movimento
                g.interactive = true;
                g.buttonMode = true;
                g.on('pointerdown', () => {
                    movePlayerTo(tile.x, tile.y);
                });
                
                mapContainer.addChild(g);
            });

            // Criar sprite do player
            const playerGraphics = new Graphics();
            playerGraphics.beginFill(0xff6b35) // Cor laranja para visibilidade
                .drawCircle(0, 0, 8)
                .endFill();
            
            const playerTexture = app.renderer.generateTexture(playerGraphics);
            playerSprite = new Sprite(playerTexture);
            
            const { screenX: playerScreenX, screenY: playerScreenY } = toIsometric(playerPosition.x, playerPosition.y);
            playerSprite.x = playerScreenX;
            playerSprite.y = playerScreenY;
            playerSprite.anchor.set(0.5, 0.5);
            playerSprite.zIndex = 1000; // Sempre no topo
            
            mapContainer.addChild(playerSprite);

            // Renderizar itens com melhor feedback visual
            for (const item of items) {
                const { screenX, screenY } = toIsometric(item.position_x, item.position_y);
                
                if (item.icon) {
                    await Assets.load(item.icon);
                    const texture = Assets.get(item.icon) || Texture.from(item.icon);
                    const sprite = new Sprite(texture);
                    sprite.x = screenX;
                    sprite.y = screenY;

                    const scaleX = tileWidth / sprite.texture.width;
                    const scaleY = tileHeight / sprite.texture.height;
                    const scale = Math.max(scaleX, scaleY);
                    sprite.scale.set(scale, scale);
                    sprite.anchor.set(0.5, 1);
                    sprite.zIndex = item.position_x + item.position_y;

                    sprite.interactive = true;
                    sprite.buttonMode = true;

                    sprite
                        .on('pointerover', () => {
                            sprite.tint = 0xffff88; // Amarelo mais suave
                            setHoveredItem(item);
                            // Mudar cursor
                            app.canvas.style.cursor = 'pointer';
                        })
                        .on('pointerout', () => {
                            sprite.tint = 0xffffff;
                            setHoveredItem(null);
                            app.canvas.style.cursor = 'default';
                        })
                        .on('pointerdown', (event) => {
                            event.stopPropagation();
                            const globalPos = event.data.global;
                            setSelectedItem(item);
                            setMenuPosition({ 
                                x: Math.min(globalPos.x, width - 120), // Evita sair da tela
                                y: Math.min(globalPos.y, height - 80) 
                            });
                        });

                    mapContainer.addChild(sprite);
                } else {
                    // Item sem sprite - círculo vermelho
                    const g = new Graphics();
                    g.beginFill(0xcc4125) // Vermelho mais escuro
                        .drawCircle(screenX, screenY, 12)
                        .endFill();
                    g.interactive = true;
                    g.buttonMode = true;
                    g.on('pointerdown', (event) => {
                        event.stopPropagation();
                        const globalPos = event.data.global;
                        setSelectedItem(item);
                        setMenuPosition({ 
                            x: Math.min(globalPos.x, width - 120),
                            y: Math.min(globalPos.y, height - 80) 
                        });
                    });
                    mapContainer.addChild(g);
                }
            }

            mapContainer.sortableChildren = true;

            // Função para mover o player
            function movePlayerTo(targetX, targetY) {
                setPlayerPosition({ x: targetX, y: targetY });
                const { screenX, screenY } = toIsometric(targetX, targetY);
                
                // Animação suave do movimento
                const startX = playerSprite.x;
                const startY = playerSprite.y;
                const duration = 500; // 500ms
                const startTime = Date.now();
                
                function animate() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Interpolação suave
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    playerSprite.x = startX + (screenX - startX) * easeProgress;
                    playerSprite.y = startY + (screenY - startY) * easeProgress;
                    
                    // Atualizar posição da luz
                    const lightX = mapContainer.x + playerSprite.x * zoom;
                    const lightY = mapContainer.y + playerSprite.y * zoom;
                    fogFilter.updateLight(lightX, lightY, 150 * zoom);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                }
                
                animate();
            }

            function setZoom(newZoom) {
                zoom = Math.max(0.3, Math.min(2, newZoom));
                mapContainer.scale.set(zoom, zoom);
                
                // Atualizar fog of war com novo zoom
                const lightX = mapContainer.x + playerSprite.x * zoom;
                const lightY = mapContainer.y + playerSprite.y * zoom;
                fogFilter.updateLight(lightX, lightY, 150 * zoom);
            }

            // Event listeners
            onMouseDown = (e) => { 
                dragging = true; 
                lastPos = { x: e.clientX, y: e.clientY }; 
            };
            
            onMouseUp = () => { 
                dragging = false; 
            };
            
            onMouseMove = (e) => {
                if (dragging) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    mapContainer.x += dx;
                    mapContainer.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                    
                    // Atualizar fog of war
                    const lightX = mapContainer.x + playerSprite.x * zoom;
                    const lightY = mapContainer.y + playerSprite.y * zoom;
                    fogFilter.updateLight(lightX, lightY, 150 * zoom);
                }
            };
            
            onWheel = (e) => {
                e.preventDefault();
                setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
            };

            onCanvasClick = (e) => {
                // Fechar menu se clicar fora
                if (selectedItem) {
                    setSelectedItem(null);
                }
            };

            app.canvas.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mouseup', onMouseUp);
            app.canvas.addEventListener('mousemove', onMouseMove);
            app.canvas.addEventListener('wheel', onWheel);
            app.canvas.addEventListener('click', onCanvasClick);

            // Inicializar posição da luz
            const lightX = mapContainer.x + playerSprite.x * zoom;
            const lightY = mapContainer.y + playerSprite.y * zoom;
            fogFilter.updateLight(lightX, lightY, 150 * zoom);
        }

        initPixi();

        return () => {
            destroyed = true;
            if (app) {
                if (app.canvas) {
                    app.canvas.removeEventListener('mousedown', onMouseDown);
                    app.canvas.removeEventListener('mousemove', onMouseMove);
                    app.canvas.removeEventListener('wheel', onWheel);
                    app.canvas.removeEventListener('click', onCanvasClick);
                }
                window.removeEventListener('mouseup', onMouseUp);
                if (app.destroy && typeof app.destroy === "function") {
                    app.destroy(true, { children: true });
                }
            }
        };
    }, [width, height, tiles, items, playerPosition]);

    // Funções de ação do menu contextual
    const handlePick = (item) => {
        if (onPick) {
            onPick(item);
        } else {
            console.log(`Pegando item: ${item.name}`);
        }
        setSelectedItem(null);
    };

    const handleExamine = (item) => {
        if (onExamine) {
            onExamine(item);
        } else {
            console.log(`Examinando item: ${item.name}`);
            alert(`${item.name}: ${item.description || 'Um objeto interessante.'}`);
        }
        setSelectedItem(null);
    };

    const handleMove = (item) => {
        if (onMove) {
            onMove(item);
        } else {
            console.log(`Movendo para: ${item.name}`);
            // Mover player para a posição do item
            setPlayerPosition({ x: item.position_x, y: item.position_y });
        }
        setSelectedItem(null);
    };

    return (
        <div style={{ position: 'relative', width, height, backgroundColor: '#0a0a0a' }}>
            <div ref={pixiRef} />
            
            {/* Tooltip para item em hover */}
            {hoveredItem && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    pointerEvents: 'none',
                    zIndex: 1001
                }}>
                    {hoveredItem.name}
                </div>
            )}
            
            {/* Menu contextual */}
            {selectedItem && (
                <div style={{
                    position: 'absolute',
                    top: menuPosition.y,
                    left: menuPosition.x,
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    color: '#fff',
                    fontSize: '14px',
                    zIndex: 1000,
                    minWidth: '100px'
                }}>
                    <div 
                        style={{ 
                            cursor: 'pointer', 
                            padding: '4px 8px', 
                            borderRadius: '2px',
                            transition: 'background-color 0.2s'
                        }} 
                        onClick={() => handlePick(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        🤏 Pegar
                    </div>
                    <div 
                        style={{ 
                            cursor: 'pointer', 
                            padding: '4px 8px', 
                            borderRadius: '2px',
                            transition: 'background-color 0.2s'
                        }} 
                        onClick={() => handleExamine(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        🔍 Examinar
                    </div>
                    <div 
                        style={{ 
                            cursor: 'pointer', 
                            padding: '4px 8px', 
                            borderRadius: '2px',
                            transition: 'background-color 0.2s'
                        }} 
                        onClick={() => handleMove(selectedItem)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        🚶 Mover para
                    </div>
                </div>
            )}
            
            {/* HUD minimalista */}
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                color: '#fff',
                fontSize: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '8px',
                borderRadius: '4px'
            }}>
                Posição: ({playerPosition.x}, {playerPosition.y})
            </div>
        </div>
    );
};

export default PixiGameImproved;

