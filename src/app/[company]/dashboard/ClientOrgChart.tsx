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

const CustomNode = ({ nodeDatum, hierarchyPointNode, isEditMode, onAdd, onEdit, onDelete, onToggle, collapsedNodes: expandedNodes, nodePositionsRef, linkVersion }: any) => {
  
  // Registrar posición del nodo
  useEffect(() => {
    if (hierarchyPointNode && nodeDatum.id !== 'dummy' && nodePositionsRef) {
      nodePositionsRef.current.set(nodeDatum.id, { x: hierarchyPointNode.x, y: hierarchyPointNode.y });
    }
  }, [hierarchyPointNode?.x, hierarchyPointNode?.y, nodeDatum.id, nodePositionsRef]);

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

  // Calcular ruta de la línea secundaria (si existe) relativa a este nodo
  const secondaryParentId = nodeDatum.attributes?.secondary_parent_id;
  let secondaryPathD = null;

  if (secondaryParentId && nodePositionsRef?.current && hierarchyPointNode) {
    const targetPos = nodePositionsRef.current.get(secondaryParentId);
    if (targetPos) {
      const relX = targetPos.x - hierarchyPointNode.x;
      const relY = targetPos.y - hierarchyPointNode.y;
      
      const sourceY = -110; // Tope de la tarjeta origen (local: 0, -110)
      const targetY = relY + 130; // Fondo de la tarjeta destino
      const deltaY = targetY - sourceY;
      const halfY = sourceY + deltaY / 2;

      secondaryPathD = `M 0,${sourceY} C 0,${halfY} ${relX},${halfY} ${relX},${targetY}`;
    }
  }

  return (
    <g>
      {/* Secondary parent line (dotted orange) rendered as native SVG inside D3 node group */}
      {secondaryPathD && (
        <path
          d={secondaryPathD}
          stroke="#f97316"
          strokeWidth="3"
          strokeDasharray="6,6"
          fill="none"
          strokeOpacity="0.85"
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Visual card — pointer-events disabled so touch events bubble to SVG for D3 panning */}
      <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <div
          className="flex flex-col items-center text-center p-4 mt-3 mx-3 mb-6 bg-white rounded-2xl shadow-md border-2 border-[var(--brand-color)]"
          style={{ pointerEvents: 'none', userSelect: 'none', width: `${cardW - 24}px` }}
        >
          {/* Photo container without position: relative to prevent iOS Safari positioning bugs */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm mb-3">
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
            {nodeDatum.name && (
              <p className="text-xs font-semibold text-gray-500 mt-1">
                {nodeDatum.name}
              </p>
            )}
            {nodeDatum.attributes?.hierarchy_level && (
              <p className="text-[10px] font-bold text-[var(--brand-color)] mt-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full inline-block">
                {nodeDatum.attributes.hierarchy_level}
              </p>
            )}
          </div>
        </div>
      </foreignObject>

      {/* Direct reports count badge - rendered as native SVG at top-right corner of the card */}
      {hasChildren && !isEditMode && (
        <g transform="translate(80, -95)">
          <circle r="12" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
          <text
            dy="1"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#6b7280"
            stroke="none"
            fontSize="11"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {nodeDatum.attributes?._directReportsCount}
          </text>
        </g>
      )}

      {/* Expand/Collapse Toggle Button - rendered as native SVG at bottom-center of the card */}
      {hasChildren && !isEditMode && (
        <g 
          transform="translate(0, 125)" 
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(nodeDatum.id, hierarchyPointNode?.x, hierarchyPointNode?.y);
          }}
        >
          <circle r="12" fill="#1f2937" stroke="white" strokeWidth="2" />
          <path
            d={isCollapsed ? "M-4,0 L4,0 M0,-4 L0,4" : "M-4,0 L4,0"}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

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

      {/* Edit-mode action buttons — rendered as native SVG at the bottom of the card */}
      {isEditMode && (
        <g>
          {/* Add Button */}
          <g 
            transform={`translate(${isDummy ? 0 : -40}, 135)`} 
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onAdd(nodeDatum.id); }}
          >
            <circle r="15" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
            <text dy="5.5" textAnchor="middle" fill="#047857" fontSize="16" fontWeight="bold">+</text>
          </g>

          {!isDummy && (
            <>
              {/* Edit Button */}
              <g 
                transform="translate(0, 135)" 
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onEdit(nodeDatum); }}
              >
                <circle r="15" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                <text dy="4" textAnchor="middle" fill="#1d4ed8" fontSize="12">✎</text>
              </g>

              {/* Delete Button */}
              <g 
                transform="translate(40, 135)" 
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onDelete(nodeDatum.id); }}
              >
                <circle r="15" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
                <text dy="4.5" textAnchor="middle" fill="#b91c1c" fontSize="12">🗑</text>
              </g>
            </>
          )}
        </g>
      )}
    </g>
  );
};

export default function ClientOrgChart({ companyId, isAdmin }: { companyId: string, isAdmin: boolean }) {
  const [rawData, setRawData] = useState<any>(null);
  const [flatEmployees, setFlatEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [translate, setTranslate] = useState(() => {
    if (typeof window !== 'undefined') {
      return { x: window.innerWidth / 2, y: 100 };
    }
    return { x: 300, y: 100 };
  });
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
  const nodePositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map());
  const [linkVersion, setLinkVersion] = useState(0);

  const supabase = createClient();

  const fetchEmployees = async () => {
    setLoading(true);
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId);

    if (!error && employees) {
      setFlatEmployees(employees);
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
    // Limpiar posiciones anteriores al cargar nuevos datos
    nodePositionsRef.current.clear();
    setTreeKey(prev => prev + 1);
    setLoading(false);
  };

  // Funciones auxiliares para zoom responsivo
  const getDefaultZoom = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.5 : 0.8;
  const getExpandZoom = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.25 : 0.35;

  useEffect(() => {
    fetchEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
      setZoom(getDefaultZoom());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleToggle = (nodeId: string, nodeX?: number, nodeY?: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      const isExpanding = !next.has(nodeId);
      if (isExpanding) {
        next.add(nodeId);
        if (nodeX !== undefined && nodeY !== undefined && containerRef.current) {
          const { width } = containerRef.current.getBoundingClientRect();
          const targetZoom = getDefaultZoom();
          setTranslate({ x: width / 2 - (nodeX! * targetZoom), y: 100 - (nodeY! * targetZoom) });
          setZoom(targetZoom);
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
    // Forzar actualización de enlaces secundarios
    setTimeout(() => setLinkVersion(v => v + 1), 50);
    setTreeKey(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
      setZoom(getDefaultZoom());
    }
    setTimeout(() => setLinkVersion(v => v + 1), 50);
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
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
      setZoom(getExpandZoom());
    }
    setTimeout(() => setLinkVersion(v => v + 1), 50);
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

  // Trigger link redraw when zoom/translate change from drag events or initial load
  useEffect(() => {
    const timer = setTimeout(() => setLinkVersion(v => v + 1), 50);
    return () => clearTimeout(timer);
  }, [zoom, translate, treeKey]);

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
        <Tree
          key={treeKey}
          data={displayData}
          orientation="vertical"
          pathFunc={roundedStepPathFunc}
          translate={translate}
          zoom={zoom}
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
              nodePositionsRef={nodePositionsRef}
              linkVersion={linkVersion}
            />
          )}
          zoomable={true}
          collapsible={false}
          enableLegacyTransitions={true}
          transitionDuration={500}
        />
      )}

      <EmployeeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveModal} 
        initialData={modalData}
        isEdit={isEditAction}
        allEmployees={flatEmployees}
      />
    </div>
  );
}
