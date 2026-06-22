'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { buildTree } from '@/utils/buildTree';
import { addEmployee, updateEmployee, deleteEmployee } from './actions';
import EmployeeModal from './EmployeeModal';

const Tree = dynamic(() => import('react-d3-tree'), { ssr: false });

const roundedStepPathFunc = (linkData: any) => {
  const { source, target } = linkData;
  const deltaY = target.y - source.y;
  const deltaX = target.x - source.x;
  
  if (Math.abs(deltaX) < 1) {
    return `M${source.x},${source.y} L${target.x},${target.y}`;
  }

  const radius = Math.min(25, Math.abs(deltaY) / 2, Math.abs(deltaX) / 2);
  const halfY = source.y + deltaY / 2;
  const dirX = Math.sign(deltaX);

  return `
    M${source.x},${source.y}
    L${source.x},${halfY - radius}
    Q${source.x},${halfY} ${source.x + (dirX * radius)},${halfY}
    L${target.x - (dirX * radius)},${halfY}
    Q${target.x},${halfY} ${target.x},${halfY + radius}
    L${target.x},${target.y}
  `;
};

// Filtra el árbol mostrando SOLO los hijos directos de nodos expandidos.
// Los nodos fantasmas son transparentes: siempre pasan sus hijos al siguiente nivel.
function filterExpanded(node: any, expanded: Set<string>): any {
  if (!node) return null;

  // Los nodos fantasmas son transparentes: siempre muestran sus hijos (el real hijo está abajo)
  if (node.attributes?.is_invisible_dummy) {
    return {
      ...node,
      children: (node.children || []).map((c: any) => filterExpanded(c, expanded))
    };
  }

  const isExpanded = expanded.has(node.id);

  if (!isExpanded) {
    // Nodo cerrado: mostrar el nodo pero sin sus hijos
    return { ...node, children: [] };
  }

  // Nodo abierto: mostrar sus hijos directos (pero los hijos solo muestran sus propios
  // hijos si también están expandidos — así solo vemos un nivel a la vez)
  return {
    ...node,
    children: (node.children || []).map((c: any) => filterExpanded(c, expanded))
  };
}

const CustomNode = ({ nodeDatum, hierarchyPointNode, isEditMode, onAdd, onEdit, onDelete, onToggle, collapsedNodes: expandedNodes }: any) => {
  // Nodos fantasmas: totalmente invisibles
  if (nodeDatum.attributes?.is_invisible_dummy) {
    return (
      <g>
        <circle r={0.1} opacity={0} fill="transparent" stroke="none" />
      </g>
    );
  }

  const hasChildren = nodeDatum.attributes?._hasChildren;
  const isCollapsed = !expandedNodes?.has(nodeDatum.id);
  const isDummy = nodeDatum.id === 'dummy';

  // Card dimensions
  const cardW = 200;
  const cardH = 240;
  const cardX = -100;
  const cardY = -110;

  return (
    <g>
      {/* Visual card — pointer-events disabled so touch events bubble to SVG for D3 panning */}
      <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <div
          className="relative flex flex-col items-center text-center p-4 mt-3 mx-3 mb-6 bg-white rounded-2xl shadow-md border-2 border-[var(--brand-color)]"
          style={{ pointerEvents: 'none', userSelect: 'none', width: `${cardW - 24}px` }}
        >
          {hasChildren && !isEditMode && (
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold border-2 border-gray-200 shadow-sm">
              {nodeDatum.attributes?._directReportsCount}
            </div>
          )}

          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm mb-3">
            {nodeDatum.attributes?.fotoUrl ? (
              <img src={nodeDatum.attributes.fotoUrl} alt={nodeDatum.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 font-bold text-2xl">{nodeDatum.name.charAt(0) || '?'}</span>
              </div>
            )}
          </div>

          <div className="w-full">
            <h3 className="text-sm font-bold text-gray-800 leading-tight uppercase">
              {nodeDatum.attributes?.cargo}
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              {nodeDatum.name}
            </p>
            {nodeDatum.attributes?.hierarchy_level && (
              <p className="text-[10px] font-bold text-[var(--brand-color)] mt-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full inline-block">
                {nodeDatum.attributes.hierarchy_level}
              </p>
            )}
          </div>

          {hasChildren && !isEditMode && (
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                )}
              </svg>
            </div>
          )}
        </div>
      </foreignObject>

      {/* Transparent SVG rect — captures taps/clicks for toggle without blocking D3 drag */}
      {!isEditMode && (
        <rect
          x={cardX}
          y={cardY}
          width={cardW}
          height={cardH}
          fill="transparent"
          stroke="none"
          style={{ cursor: 'pointer' }}
          onClick={() => onToggle(nodeDatum.id, hierarchyPointNode?.x, hierarchyPointNode?.y)}
        />
      )}

      {/* Edit-mode action buttons */}
      {isEditMode && (
        <foreignObject x={cardX} y={cardY + cardH - 50} width={cardW} height={60} style={{ overflow: 'visible' }}>
          <div className="flex gap-2 justify-center" style={{ pointerEvents: 'auto' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(nodeDatum.id); }}
              className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors border border-green-200"
              title="Añadir subalterno"
            >
              +
            </button>
            {!isDummy && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(nodeDatum); }}
                  className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 text-xs"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(nodeDatum.id); }}
                  className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors border border-red-200 text-xs"
                  title="Eliminar"
                >
                  🗑
                </button>
              </>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default function ClientOrgChart({ companyId, isAdmin }: { companyId: string, isAdmin: boolean }) {
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [translate, setTranslate] = useState({ x: 500, y: 100 });
  const [zoom, setZoom] = useState(1);
  const [treeKey, setTreeKey] = useState(0);
  
  // Estado de expansión: los nodos en este Set están abiertos (muestran sus hijos directos).
  // Por defecto vacío = todo cerrado, solo se ve el nodo raíz.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [isEditAction, setIsEditAction] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // CSS-transform based pan/zoom state for mobile (independent of D3)
  const panRef = useRef({ x: 0, y: 0, scale: 0.5 });
  const [panState, setPanState] = useState({ x: 0, y: 0, scale: 0.5 });
  const touchRef = useRef<{ sx: number; sy: number; px: number; py: number; dist: number } | null>(null);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

  const fetchEmployees = async () => {
    setLoading(true);
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId);

    if (!error && employees) {
      if (employees.length === 0) {
        setRawData([{
           id: 'dummy',
           name: 'Haz clic aquí para añadir tu primer empleado',
           attributes: { cargo: 'Director General', _hasChildren: false },
           children: []
        }]);
      } else {
        const treeData = buildTree(employees);
        setRawData(treeData ? [treeData] : null);
      }
    }
    setTreeKey(prev => prev + 1);
    setLoading(false);
  };

  // Funciones auxiliares para zoom responsivo
  const getDefaultZoom = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.5 : 0.8;
  const getExpandZoom = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.25 : 0.35;

  useEffect(() => {
    const mobile = isMobile();
    const w = typeof window !== 'undefined' ? window.innerWidth : 800;
    if (mobile) {
      setTranslate({ x: w / 2, y: 120 });
      setZoom(1);
      panRef.current = { x: 0, y: 0, scale: 0.5 };
      setPanState({ x: 0, y: 0, scale: 0.5 });
    } else {
      const containerW = containerRef.current?.getBoundingClientRect().width || w;
      setTranslate({ x: containerW / 2, y: 100 });
      setZoom(0.8);
    }
    fetchEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // ─── Native DOM touch listeners (MUST be non-passive to call preventDefault on iOS Safari) ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile()) return;

    const applyTransform = () => {
      if (wrapperRef.current) {
        const p = panRef.current;
        wrapperRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.scale})`;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchRef.current = { sx: t.clientX, sy: t.clientY, px: panRef.current.x, py: panRef.current.y, dist: 0 };
      } else if (e.touches.length === 2) {
        // Pinch start: compute initial distance
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchRef.current) {
          touchRef.current.dist = dist;
        } else {
          touchRef.current = { sx: 0, sy: 0, px: panRef.current.x, py: panRef.current.y, dist };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current) return;
      e.preventDefault(); // THIS works because listener is { passive: false }

      if (e.touches.length === 1) {
        // Single finger pan
        const t = e.touches[0];
        panRef.current.x = touchRef.current.px + (t.clientX - touchRef.current.sx);
        panRef.current.y = touchRef.current.py + (t.clientY - touchRef.current.sy);
        applyTransform();
      } else if (e.touches.length === 2 && touchRef.current.dist > 0) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / touchRef.current.dist;
        const newScale = Math.max(0.15, Math.min(2, panRef.current.scale * ratio));
        panRef.current.scale = newScale;
        touchRef.current.dist = dist; // reset baseline
        applyTransform();
      }
    };

    const onTouchEnd = () => {
      touchRef.current = null;
      // Sync back to React state (for re-renders from toggle, etc.)
      setPanState({ ...panRef.current });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (nodeId: string, nodeX?: number, nodeY?: number) => {
    const mobile = isMobile();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      const isExpanding = !next.has(nodeId);
      if (isExpanding) {
        next.add(nodeId);
        if (nodeX !== undefined && nodeY !== undefined) {
          if (mobile) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const s = panRef.current.scale;
            // In CSS transform world: screen pos = panX + (translate.x + nodeX) * scale
            // We want screen pos = w/2 horizontally, h/3 vertically
            const newPanX = (w / 2) - (translate.x + nodeX) * s;
            const newPanY = (h / 3) - (translate.y + nodeY) * s;
            panRef.current.x = newPanX;
            panRef.current.y = newPanY;
            setPanState({ ...panRef.current });
          } else {
            const targetZoom = getDefaultZoom();
            const containerW = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
            setTranslate({ x: containerW / 2 - (nodeX! * targetZoom), y: 100 - (nodeY! * targetZoom) });
            setZoom(targetZoom);
          }
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
    setTreeKey(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    const mobile = isMobile();
    if (mobile) {
      panRef.current = { x: 0, y: 0, scale: 0.5 };
      setPanState({ x: 0, y: 0, scale: 0.5 });
    } else {
      const containerW = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
      setTranslate({ x: containerW / 2, y: 100 });
      setZoom(getDefaultZoom());
    }
    setTreeKey(prev => prev + 1);
  };

  const handleExpandAll = () => {
    if (!rawData) return;
    const allIds = new Set<string>();
    const extractIds = (node: any) => {
      allIds.add(node.id);
      if (node.children) node.children.forEach(extractIds);
    };
    rawData.forEach(extractIds);
    setExpandedNodes(allIds);
    const mobile = isMobile();
    if (mobile) {
      panRef.current = { x: 0, y: 0, scale: 0.25 };
      setPanState({ x: 0, y: 0, scale: 0.25 });
    } else {
      const containerW = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
      setTranslate({ x: containerW / 2, y: 100 });
      setZoom(getExpandZoom());
    }
    setTreeKey(prev => prev + 1);
  };

  const handleAdd = (parentId: string) => {
    setIsEditAction(false);
    setModalData({ parentId: parentId === 'dummy' ? null : parentId });
    setModalOpen(true);
  };

  const handleEdit = (node: any) => {
    setIsEditAction(true);
    setModalData({
      id: node.id,
      name: node.name,
      position: node.attributes?.cargo,
      hierarchy_level: node.attributes?.hierarchy_level,
      photo_url: node.attributes?.fotoUrl,
      parentId: node.parentId
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar a este empleado? Los subalternos subirán de nivel si es posible o quedarán huérfanos.")) return;
    const res = await deleteEmployee(id);
    if (res.error) alert(res.error);
    else fetchEmployees();
  };

  const handleSaveModal = async (formData: any) => {
    if (isEditAction) {
      const res = await updateEmployee(modalData.id, { ...formData, parent_id: modalData.parentId });
      if (res.error) throw new Error(res.error);
    } else {
      const res = await addEmployee(companyId, { ...formData, parent_id: modalData.parentId });
      if (res.error) throw new Error(res.error);
    }
    fetchEmployees();
  };

  // Aplicar filtro de expansión a los datos crudos
  const displayData = rawData
    ? rawData.map((root: any) => filterExpanded(root, expandedNodes))
    : null;

  if (loading && !rawData) {
    return <div className="w-full h-full flex items-center justify-center">Cargando jerarquía...</div>;
  }

  return (
    <div
      className="w-full h-full bg-[#f8fafc] relative overflow-hidden"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute top-2 sm:top-4 left-0 w-full px-2 sm:px-4 flex flex-wrap justify-center sm:justify-end gap-2 z-10 pointer-events-none">
         <button 
           onClick={handleExpandAll}
           className="pointer-events-auto bg-white border border-gray-200 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2"
         >
           ↓ Desplegar todo
         </button>
         <button 
           onClick={handleCollapseAll}
           className="pointer-events-auto bg-white border border-gray-200 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2"
         >
           ↑ Contraer todo
         </button>
         {isAdmin && (
           <button 
             onClick={() => setIsEditMode(!isEditMode)}
             className={`pointer-events-auto border px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-colors ${isEditMode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
           >
              {isEditMode ? 'Terminar Edición' : '⚙️ Modo Edición'}
           </button>
         )}
      </div>

      {displayData && (
        <div
          ref={wrapperRef}
          style={{
            position: 'absolute',
            inset: 0,
            transform: isMobile() ? `translate(${panState.x}px, ${panState.y}px) scale(${panState.scale})` : undefined,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <Tree
            key={treeKey}
            data={displayData}
            orientation="vertical"
            pathFunc={roundedStepPathFunc}
            translate={translate}
            zoom={isMobile() ? 1 : zoom}
            nodeSize={{ x: 230, y: 280 }}
            separation={{ siblings: 1.05, nonSiblings: 1.2 }}
            renderCustomNodeElement={(rd3tProps) => (
              <CustomNode 
                {...rd3tProps} 
                isEditMode={isEditMode}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                collapsedNodes={expandedNodes}
              />
            )}
            zoomable={!isMobile()}
            draggable={!isMobile()}
            collapsible={false}
            enableLegacyTransitions={true}
            transitionDuration={500}
          />
        </div>
      )}

      <EmployeeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveModal} 
        initialData={modalData}
        isEdit={isEditAction}
      />
    </div>
  );
}
