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

  return (
    <g>
      <foreignObject x="-110" y="-120" width="220" height="280">
        <div 
          onClick={isEditMode ? undefined : () => onToggle(nodeDatum.id, hierarchyPointNode?.x, hierarchyPointNode?.y)}
          className="relative flex flex-col items-center text-center p-4 mt-3 mx-3 mb-6 bg-white rounded-2xl shadow-md border-2 cursor-pointer hover:shadow-xl transition-all duration-300 border-[var(--brand-color)]"
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

          {isEditMode && (
            <div className="flex gap-2 mt-4 z-20">
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
          )}

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
    </g>
  );
};

export default function ClientOrgChart({ companyId, isAdmin }: { companyId: string, isAdmin: boolean }) {
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [translate, setTranslate] = useState({ x: 500, y: 100 });
  const [treeKey, setTreeKey] = useState(0);
  
  // Estado de expansión: los nodos en este Set están abiertos (muestran sus hijos directos).
  // Por defecto vacío = todo cerrado, solo se ve el nodo raíz.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [isEditAction, setIsEditAction] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTranslate({ x: window.innerWidth / 2, y: 100 });
    }
    fetchEmployees();
  }, [companyId, supabase]);

  const handleToggle = (nodeId: string, nodeX?: number, nodeY?: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      const isExpanding = !next.has(nodeId);
      
      if (isExpanding) {
        next.add(nodeId); // expandir
        // Si estamos expandiendo y tenemos coordenadas, centramos el nodo
        if (nodeX !== undefined && nodeY !== undefined && typeof window !== 'undefined') {
          // Centrado horizontal, y dejado a 100px del borde superior
          setTranslate({ x: window.innerWidth / 2 - nodeX, y: 100 - nodeY });
        }
      } else {
        next.delete(nodeId); // colapsar
      }
      return next;
    });

    // Re-render del árbol con los datos filtrados actualizados
    setTreeKey(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    if (typeof window !== 'undefined') {
      setTranslate({ x: window.innerWidth / 2, y: 100 });
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
    if (typeof window !== 'undefined') {
      setTranslate({ x: window.innerWidth / 2, y: 100 });
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
    <div className="w-full h-full bg-[#f8fafc] relative" ref={containerRef}>
      <div className="absolute top-4 right-6 flex gap-3 z-10">
         <button 
           onClick={handleExpandAll}
           className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-md font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
         >
           ↓ Desplegar todo
         </button>
         <button 
           onClick={handleCollapseAll}
           className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-md font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
         >
           ↑ Contraer todo
         </button>
         {isAdmin && (
           <button 
             onClick={() => setIsEditMode(!isEditMode)}
             className={`border px-4 py-2 rounded-full shadow-md font-bold text-sm flex items-center gap-2 transition-colors ${isEditMode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
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
      />
    </div>
  );
}
