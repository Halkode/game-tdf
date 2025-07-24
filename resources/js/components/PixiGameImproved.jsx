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
        
        // Store initial values for later access
        this._lightX = lightX;
        this._lightY = lightY;
        this._lightRadius = lightRadius;
    }

    updateLight(x, y, radius) {
        // Update the stored values
        this._lightX = x;
        this._lightY = y;
        this._lightRadius = radius;
        
        // Update uniforms safely
        if (this.uniforms) {
            this.uniforms.lightPos = [x, y];
            this.uniforms.lightRadius = radius;
        }
    }
}

const PixiGameImproved = ({ 
    width = 800, 
    height = 600, 
    tiles = [
        // Default tiles for demo
        { x: 0, y: 0, type: "floor" },
        { x: 1, y: 0, type: "floor" },
        { x: 0, y: 1, type: "floor" },
        { x: 1, y: 1, type: "wall" },
        { x: 2, y: 0, type: "water" },
        { x: 2, y: 1, type: "floor" },
        { x: -1, y: 0, type: "floor" },
        { x: -1, y: 1, type: "floor" },
        { x: 0, y: -1, type: "floor" },
        { x: 1, y: -1, type: "floor" },
    ], 
    items = [
        // Default items for demo
        { 
            id: 1, 
            name: "Mysterious Key", 
            description: "An old rusty key with strange markings", 
            position_x: 1, 
            position_y: 0 
        },
        { 
            id: 2, 
            name: "Health Potion", 
            description: "A glowing red potion that looks magical", 
            position_x: -1, 
            position_y: 1 
        }
    ], 
    playerInitialPosition = { x: 0, y: 0 }, 
    onPick, 
    onExamine, 
    onMove 
}) => {
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
                backgroundColor: 0x1a1a1a,
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

            // Create fog of war filter with safer initialization
            try {
                fogFilter = new FogOfWarFilter(150, width / 2, height / 2);
                mapContainer.filters = [fogFilter];
            } catch (error) {
                console.warn("Fog of war filter failed to initialize:", error);
                fogFilter = null;
            }

            // Render tiles with atmospheric colors
            tiles.forEach(tile => {
                const { screenX, screenY } = toIsometric(tile.x, tile.y);
                const g = new Graphics();
                
                let fillColor;
                switch (tile.type) {
                    case "floor":
                        fillColor = 0x4a5d23;
                        break;
                    case "wall":
                        fillColor = 0x3d3d3d;
                        break;
                    case "water":
                        fillColor = 0x1e3a5f;
                        break;
                    default:
                        fillColor = 0x2d2d2d;
                }
                
                g.lineStyle(1, 0x222222)
                    .beginFill(fillColor)
                    .moveTo(screenX, screenY)
                    .lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2)
                    .lineTo(screenX, screenY + tileHeight)
                    .lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2)
                    .lineTo(screenX, screenY)
                    .endFill();
                    
                g.interactive = true;
                g.buttonMode = true;
                g.on('pointerdown', () => {
                    movePlayerTo(tile.x, tile.y);
                });
                
                mapContainer.addChild(g);
            });

            // Create player sprite
            const playerGraphics = new Graphics();
            playerGraphics.beginFill(0xff6b35)
                .drawCircle(0, 0, 8)
                .endFill();
            
            const playerTexture = app.renderer.generateTexture(playerGraphics);
            playerSprite = new Sprite(playerTexture);
            
            const { screenX: playerScreenX, screenY: playerScreenY } = toIsometric(playerPosition.x, playerPosition.y);
            playerSprite.x = playerScreenX;
            playerSprite.y = playerScreenY;
            playerSprite.anchor.set(0.5, 0.5);
            playerSprite.zIndex = 1000;
            
            mapContainer.addChild(playerSprite);

            // Render items
            for (const item of items) {
                const { screenX, screenY } = toIsometric(item.position_x, item.position_y);
                
                // Create a simple colored circle for items since we don't have icons
                const itemGraphics = new Graphics();
                itemGraphics.beginFill(0xcc4125)
                    .drawCircle(0, 0, 12)
                    .endFill();
                
                const itemTexture = app.renderer.generateTexture(itemGraphics);
                const sprite = new Sprite(itemTexture);
                sprite.x = screenX;
                sprite.y = screenY;
                sprite.anchor.set(0.5, 0.5);
                sprite.zIndex = item.position_x + item.position_y;

                sprite.interactive = true;
                sprite.buttonMode = true;

                sprite
                    .on('pointerover', () => {
                        sprite.tint = 0xffff88;
                        setHoveredItem(item);
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
                            x: Math.min(globalPos.x, width - 120),
                            y: Math.min(globalPos.y, height - 80) 
                        });
                    });

                mapContainer.addChild(sprite);
            }

            mapContainer.sortableChildren = true;

            // Function to move player
            function movePlayerTo(targetX, targetY) {
                setPlayerPosition({ x: targetX, y: targetY });
                const { screenX, screenY } = toIsometric(targetX, targetY);
                
                // Safety check - make sure playerSprite exists
                if (!playerSprite) return;
                
                const startX = playerSprite.x;
                const startY = playerSprite.y;
                const duration = 500;
                const startTime = Date.now();
                let animationId;
                
                function animate() {
                    // Safety check - component might have been destroyed
                    if (destroyed || !playerSprite || !mapContainer) {
                        if (animationId) {
                            cancelAnimationFrame(animationId);
                        }
                        return;
                    }
                    
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    playerSprite.x = startX + (screenX - startX) * easeProgress;
                    playerSprite.y = startY + (screenY - startY) * easeProgress;
                    
                    // Update fog of war light position safely
                    if (fogFilter && fogFilter.updateLight && mapContainer) {
                        const lightX = mapContainer.x + playerSprite.x * zoom;
                        const lightY = mapContainer.y + playerSprite.y * zoom;
                        fogFilter.updateLight(lightX, lightY, 150 * zoom);
                    }
                    
                    if (progress < 1 && !destroyed) {
                        animationId = requestAnimationFrame(animate);
                    }
                }
                
                animate();
            }

            function setZoom(newZoom) {
                zoom = Math.max(0.3, Math.min(2, newZoom));
                
                // Safety check before accessing mapContainer
                if (!mapContainer) return;
                
                mapContainer.scale.set(zoom, zoom);
                
                // Update fog of war with new zoom safely
                if (fogFilter && fogFilter.updateLight && playerSprite && mapContainer) {
                    const lightX = mapContainer.x + playerSprite.x * zoom;
                    const lightY = mapContainer.y + playerSprite.y * zoom;
                    fogFilter.updateLight(lightX, lightY, 150 * zoom);
                }
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
                if (dragging && mapContainer) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    mapContainer.x += dx;
                    mapContainer.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                    
                    // Update fog of war safely
                    if (fogFilter && fogFilter.updateLight && playerSprite && mapContainer) {
                        const lightX = mapContainer.x + playerSprite.x * zoom;
                        const lightY = mapContainer.y + playerSprite.y * zoom;
                        fogFilter.updateLight(lightX, lightY, 150 * zoom);
                    }
                }
            };
            
            onWheel = (e) => {
                e.preventDefault();
                setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
            };

            onCanvasClick = (e) => {
                if (selectedItem) {
                    setSelectedItem(null);
                }
            };

            app.canvas.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mouseup', onMouseUp);
            app.canvas.addEventListener('mousemove', onMouseMove);
            app.canvas.addEventListener('wheel', onWheel);
            app.canvas.addEventListener('click', onCanvasClick);

            // Initialize light position safely
            if (fogFilter && fogFilter.updateLight && playerSprite && mapContainer) {
                const lightX = mapContainer.x + playerSprite.x * zoom;
                const lightY = mapContainer.y + playerSprite.y * zoom;
                fogFilter.updateLight(lightX, lightY, 150 * zoom);
            }
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

    // Context menu action functions
    const handlePick = (item) => {
        if (onPick) {
            onPick(item);
        } else {
            console.log(`Picking up item: ${item.name}`);
            alert(`You picked up: ${item.name}`);
        }
        setSelectedItem(null);
    };

    const handleExamine = (item) => {
        if (onExamine) {
            onExamine(item);
        } else {
            console.log(`Examining item: ${item.name}`);
            alert(`${item.name}: ${item.description || 'An interesting object.'}`);
        }
        setSelectedItem(null);
    };

    const handleMove = (item) => {
        if (onMove) {
            onMove(item);
        } else {
            console.log(`Moving to: ${item.name}`);
            setPlayerPosition({ x: item.position_x, y: item.position_y });
        }
        setSelectedItem(null);
    };

    return (
        <div style={{ position: 'relative', width, height, backgroundColor: '#0a0a0a' }}>
            <div ref={pixiRef} />
            
            {/* Hover tooltip */}
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
            
            {/* Context menu */}
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
                        🤏 Pick Up
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
                        🔍 Examine
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
                        🚶 Move To
                    </div>
                </div>
            )}
            
            {/* Minimalist HUD */}
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
                Position: ({playerPosition.x}, {playerPosition.y})
            </div>
            
            {/* Instructions */}
            <div style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                color: '#aaa',
                fontSize: '11px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '6px',
                borderRadius: '4px',
                maxWidth: '200px'
            }}>
                • Click tiles to move
                • Click items for context menu
                • Drag to pan, scroll to zoom
            </div>
        </div>
    );
};

export default PixiGameImproved;