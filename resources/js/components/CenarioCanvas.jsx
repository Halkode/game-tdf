import React, { useEffect, useRef, useState } from 'react';

const tileWidth = 64;
const tileHeight = 32;

function toIsometric(x, y, zoom = 1) {
    const screenX = (x - y) * (tileWidth / 2) * zoom;
    const screenY = (x + y) * (tileHeight / 2) * zoom;
    return { screenX, screenY };
}

function drawTile(ctx, x, y, type = 'floor', zoom = 1) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (tileWidth / 2) * zoom, y + (tileHeight / 2) * zoom);
    ctx.lineTo(x, y + tileHeight * zoom);
    ctx.lineTo(x - (tileWidth / 2) * zoom, y + (tileHeight / 2) * zoom);
    ctx.closePath();

    switch (type) {
        case 'floor': ctx.fillStyle = '#a3d977'; break;
        case 'wall': ctx.fillStyle = '#888'; break;
        case 'water': ctx.fillStyle = '#3da9fc'; break;
        default: ctx.fillStyle = '#ccc';
    }

    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.stroke();
    ctx.restore();
}

function drawItem(ctx, x, y, item, isHovered, zoom = 1) {
    ctx.save();
    if (item.icon) {
        const img = new window.Image();
        img.src = item.icon;
        img.onload = () => {
            ctx.drawImage(img, x - 16 * zoom, y - 32 * zoom, 32 * zoom, 32 * zoom);
        };
    } else {
        ctx.beginPath();
        ctx.arc(x, y, 12 * zoom, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? '#ff0' : '#f00';
        ctx.fill();
    }
    if (isHovered) {
        ctx.font = `bold ${14 * zoom}px Arial`;
        ctx.fillStyle = '#222';
        ctx.fillText(item.name, x - 20 * zoom, y - 40 * zoom);
    }
    ctx.restore();
}

const CenarioCanvas = ({ tiles, items = [], width = 10, height = 10 }) => {
    const canvasRef = useRef(null);
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const offsetX = canvas.width / 2 + camera.x;
        const offsetY = 100 + camera.y;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const { screenX, screenY } = toIsometric(x, y, zoom);
                const tile = tiles.find(t => t.x === x && t.y === y);
                const type = tile ? tile.type : 'floor';
                drawTile(ctx, screenX + offsetX, screenY + offsetY, type, zoom);
            }
        }

        items.forEach(item => {
            const { screenX, screenY } = toIsometric(item.position_x, item.position_y, zoom);
            drawItem(ctx, screenX + offsetX, screenY + offsetY, item, hoveredItem && hoveredItem.id === item.id, zoom);
        });
    }, [tiles, items, width, height, camera, hoveredItem, zoom]);

    function handleMouseDown(e) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }

    function handleMouseMove(e) {
        if (isDragging.current) {
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            setCamera(cam => ({ x: cam.x + dx, y: cam.y + dy }));
        } else {
            // Hover dos itens
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - canvasRef.current.width / 2 - camera.x;
            const mouseY = e.clientY - rect.top - 100 - camera.y;

            let found = null;
            for (const item of items) {
                const { screenX, screenY } = toIsometric(item.position_x, item.position_y, zoom);
                const dx = mouseX - screenX;
                const dy = mouseY - screenY;
                if (Math.sqrt(dx * dx + dy * dy) < 20 * zoom) {
                    found = item;
                    break;
                }
            }
            setHoveredItem(found);
        }
    }

    function handleMouseUp() {
        isDragging.current = false;
    }

    function handleClick(e) {
        if (hoveredItem) {
            setSelectedItem(hoveredItem);
        } else {
            setSelectedItem(null);
        }
    }

    function handleWheel(e) {
        e.preventDefault();
        setZoom(z => {
            let next = z + (e.deltaY < 0 ? 0.1 : -0.1);
            if (next < 0.3) next = 0.3;
            if (next > 2) next = 2;
            return next;
        });
    }

    return (
        <div style={{ position: 'relative', margin: '0 auto', width: '800px'  }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '1px solid #333', backgroundColor: '#f0f0f0', cursor: isDragging.current ? 'grabbing' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
            />
            {selectedItem && (
                <div style={{
                    position: 'absolute',
                    left: 20,
                    top: 20,
                    background: '#fff',
                    border: '1px solid #333',
                    padding: 12,
                    zIndex: 10
                }}>
                    <strong>{selectedItem.name}</strong>
                    <div>{selectedItem.description}</div>
                    <div>
                        {selectedItem.is_pickable && <button>Pegar</button>}
                        {selectedItem.type === 'cenario' && <button>Examinar</button>}
                        <button onClick={() => setSelectedItem(null)}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CenarioCanvas;
