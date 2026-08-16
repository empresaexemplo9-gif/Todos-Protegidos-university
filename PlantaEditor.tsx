import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Ponto {
  id: string;
  codigo: string;
  x: number; // Posição X em % ou px na planta
  y: number;
}

interface PlantaEditorProps {
  plantaUrl: string;
  pontosIniciais?: Ponto[];
  onDeletePonto?: (id: string) => void;
}

export const PlantaEditor: React.FC<PlantaEditorProps> = ({
  plantaUrl,
  pontosIniciais = [],
  onDeletePonto,
}) => {
  // Estados para Transformação (Zoom e Movimentação/Pan)
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estado de Seleção
  const [pontoSelecionadoId, setPontoSelecionadoId] = useState<string | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>(pontosIniciais);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Zoom (Aumentar / Diminuir) via Scroll do Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 4); // Limite entre 0.5x e 4x
    setScale(newScale);
  };

  // Controles manuais de Zoom
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 2. Livre Movimentação (Pan / Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Permite mover ao clicar com o botão do meio (scroll) ou botão esquerdo se o fundo for clicado
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 3. Exclusão via Atalho no Teclado (Delete / Backspace)
  const removerPontoSelecionado = useCallback(() => {
    if (!pontoSelecionadoId) return;

    setPontos((prev) => prev.filter((p) => p.id !== pontoSelecionadoId));
    if (onDeletePonto) {
      onDeletePonto(pontoSelecionadoId);
    }
    setPontoSelecionadoId(null);
  }, [pontoSelecionadoId, onDeletePonto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o usuário estiver digitando em um campo de texto/input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removerPontoSelecionado();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removerPontoSelecionado]);

  return (
    <div className="relative w-full h-[600px] bg-gray-900 overflow-hidden select-none border border-gray-700 rounded-lg">
      {/* Barra de Ferramentas de Zoom */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 bg-white/90 p-2 rounded-md shadow-md">
        <button
          onClick={zoomIn}
          className="px-3 py-1 font-bold bg-gray-200 hover:bg-gray-300 rounded"
          title="Aumentar zoom"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="px-3 py-1 font-bold bg-gray-200 hover:bg-gray-300 rounded"
          title="Diminuir zoom"
        >
          -
        </button>
        <button
          onClick={resetZoom}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
        >
          Resetar
        </button>
      </div>

      {/* Área Recortada com Movimentação e Zoom */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            transformOrigin: 'center center',
          }}
          className="relative inline-block"
        >
          {/* Planta Baixa */}
          <img
            src={plantaUrl}
            alt="Planta Baixa"
            className="max-w-none pointer-events-none rounded shadow-lg"
            draggable={false}
          />

          {/* Renderização dos Pontos/Marcadores sobre a Planta */}
          {pontos.map((ponto) => {
            const isSelected = ponto.id === pontoSelecionadoId;
            return (
              <div
                key={ponto.id}
                onClick={(e) => {
                  e.stopPropagation(); // Evita desmarcar ao clicar no próprio ponto
                  setPontoSelecionadoId(ponto.id);
                }}
                style={{
                  top: `${ponto.y}%`,
                  left: `${ponto.x}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition- ${
                  isSelected
                    ? 'ring-4 ring-red-500 scale-125 z-10'
                    : 'hover:scale-110 z-0'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white">
                  {ponto.codigo}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
