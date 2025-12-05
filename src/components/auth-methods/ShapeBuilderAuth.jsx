import { Circle, Shapes, Square, Triangle } from 'lucide-react';
import { useState } from 'react';

const ShapeBuilderAuth = ({ mode, patterns, setPatterns, setAuthMethod, setShowSuccess, setMode }) => {
  const [placedShapes, setPlacedShapes] = useState([]);
  const [draggedShape, setDraggedShape] = useState(null);
  const [status, setStatus] = useState('');

  const availableShapes = [
    { type: 'circle', icon: Circle, color: '#ff6b6b' },
    { type: 'square', icon: Square, color: '#4ecdc4' },
    { type: 'triangle', icon: Triangle, color: '#ffd700' }
  ];

  const gridSize = 8;
  const cellSize = 60;

  const handleDragStart = (shapeType) => {
    setDraggedShape(shapeType);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, gridX, gridY) => {
    e.preventDefault();
    if (!draggedShape) return;

    // Check if position is already occupied
    const occupied = placedShapes.some(s => s.x === gridX && s.y === gridY);
    if (occupied) {
      setStatus('⚠️ Position already occupied');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    const newShape = {
      type: draggedShape.type,
      color: draggedShape.color,
      x: gridX,
      y: gridY,
      id: Date.now()
    };

    setPlacedShapes([...placedShapes, newShape]);
    setDraggedShape(null);
    setStatus('');
  };

  const handleCellClick = (gridX, gridY) => {
    // Remove shape if clicking on occupied cell
    const shapeIndex = placedShapes.findIndex(s => s.x === gridX && s.y === gridY);
    if (shapeIndex !== -1) {
      const newShapes = [...placedShapes];
      newShapes.splice(shapeIndex, 1);
      setPlacedShapes(newShapes);
    }
  };

  const clearAll = () => {
    setPlacedShapes([]);
    setStatus('');
  };

  const handleSubmit = async () => {
    if (placedShapes.length < 3) {
      setStatus('❌ Place at least 3 shapes');
      return;
    }

    const shapeData = placedShapes.map(s => ({
      type: s.type,
      x: s.x,
      y: s.y
    }));

    if (mode === 'register') {
      try {
        if (window.storage && typeof window.storage.set === 'function') {
          await window.storage.set('auth_shape', JSON.stringify(shapeData));
        }
        setPatterns(prev => ({ ...prev, shape: shapeData }));
        setStatus('✅ Your shape pattern has been saved!');
        setTimeout(() => {
          setAuthMethod(null);
          setStatus('');
        }, 2000);
      } catch (error) {
        setStatus('❌ Error saving pattern');
        console.error('Storage error:', error);
      }
    } else if (mode === 'login') {
      verifyShape(shapeData);
    }
  };

  const verifyShape = (newShapes) => {
    if (!patterns.shape || patterns.shape.length === 0) {
      setStatus('❌ No shape pattern registered');
      return;
    }

    // Check if same number of shapes
    if (newShapes.length !== patterns.shape.length) {
      checkAuthSuccess('shape', false);
      return;
    }

    // Check each shape with tolerance of ±1 grid unit
    let matchCount = 0;
    const tolerance = 1;

    for (const newShape of newShapes) {
      const matchingShape = patterns.shape.find(s => {
        return (
          s.type === newShape.type &&
          Math.abs(s.x - newShape.x) <= tolerance &&
          Math.abs(s.y - newShape.y) <= tolerance
        );
      });

      if (matchingShape) {
        matchCount++;
      }
    }

    // Require all shapes to match
    const match = matchCount === newShapes.length;
    checkAuthSuccess('shape', match);
  };

  const checkAuthSuccess = (method, success) => {
    if (success) {
      setStatus('✨ SESAME OPEN! ✨');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setMode('welcome');
        setStatus('');
        setAuthMethod(null);
      }, 3500);
    } else {
      setStatus('❌ Shape pattern incorrect. Ali Baba does not recognize this design!');
      setTimeout(() => {
        setStatus('');
      }, 2500);
    }
  };

  return (
    <div className="auth-interface">
      <h2>🧩 {mode === 'register' ? 'Build Your Shape' : 'Recreate Your Shape'}</h2>

      <div className="shape-palette">
        {availableShapes.map((shape) => {
          const Icon = shape.icon;
          return (
            <div
              key={shape.type}
              className="shape-item"
              draggable
              onDragStart={() => handleDragStart(shape)}
              style={{ borderColor: shape.color }}
            >
              <Icon size={40} style={{ color: shape.color }} />
              <span>{shape.type}</span>
            </div>
          );
        })}
      </div>

      <div className="shape-grid">
        {Array.from({ length: gridSize }).map((_, y) => (
          <div key={y} className="grid-row">
            {Array.from({ length: gridSize }).map((_, x) => {
              const placedShape = placedShapes.find(s => s.x === x && s.y === y);
              const ShapeIcon = placedShape
                ? availableShapes.find(s => s.type === placedShape.type)?.icon
                : null;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`grid-cell ${placedShape ? 'occupied' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, x, y)}
                  onClick={() => handleCellClick(x, y)}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {placedShape && ShapeIcon && (
                    <ShapeIcon
                      size={40}
                      style={{ color: placedShape.color }}
                      className="placed-shape-icon"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shape-info">
        <p>
          <Shapes size={20} />
          Shapes placed: {placedShapes.length}
        </p>
      </div>

      <button onClick={clearAll} className="btn-action btn-clear" disabled={placedShapes.length === 0}>
        🗑️ Clear All
      </button>

      <button onClick={handleSubmit} className="btn-submit" disabled={placedShapes.length < 3}>
        {mode === 'register' ? '✨ Save Pattern' : '🔓 Unlock'}
      </button>

      <p className="instruction">
        {mode === 'register'
          ? 'Drag and drop at least 3 shapes onto the grid to create your unique pattern'
          : 'Recreate your shape pattern to unlock (click shapes to remove them)'}
      </p>

      {status && (
        <p className={`status ${status.includes('❌') || status.includes('⚠️') ? 'error' : 'success'}`}>
          {status}
        </p>
      )}

      <button onClick={() => setAuthMethod(null)} className="btn-back">
        ← Change method
      </button>
    </div>
  );
};

export default ShapeBuilderAuth;
