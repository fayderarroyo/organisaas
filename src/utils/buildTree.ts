export function buildTree(employees: any[]) {
  if (!employees || employees.length === 0) return null

  // Mapa para acceso rápido a los nodos
  const employeeMap = new Map(employees.map(e => [e.id, { ...e, children: [], _directReportsCount: 0 }]))
  let root: any = null

  // Contar subalternos directos reales antes de procesar niveles/fantasmas
  employees.forEach(e => {
    if (e.parent_id) {
      const parent = employeeMap.get(e.parent_id);
      if (parent) {
        parent._directReportsCount += 1;
      }
    }
  });

  // Función auxiliar para extraer el número del nivel (ej: "Nivel 3" -> 3)
  const getLevelNum = (lvlStr: string) => {
    if (!lvlStr) return 0;
    const match = lvlStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Construir jerarquía
  employeeMap.forEach(employee => {
    if (!employee.parent_id) {
      root = employee
    } else {
      const parent = employeeMap.get(employee.parent_id)
      if (parent) {
        // El nivel indica cuántos saltos visuales hay entre el jefe y este empleado.
        // Nivel 1 = 1 salto directo. Nivel 2 = 2 saltos (1 nodo fantasma intermedio).
        const childLvl = getLevelNum(employee.hierarchy_level);
        let diff = childLvl;

        // Si es 0 o sin nivel, hacemos un salto directo
        if (diff < 1) diff = 1;

        if (diff > 1) {
          let currentParent = parent;
          // Inyectar (diff - 1) nodos fantasmas
          for (let i = 1; i < diff; i++) {
            const dummyId = `dummy_${parent.id}_${employee.id}_${i}`;
            const dummyNode = {
              id: dummyId,
              name: 'Invisible',
              is_invisible_dummy: true,
              _hasChildren: true,
              children: [],
              parent_id: currentParent.id,
            };
            currentParent.children.push(dummyNode);
            currentParent = dummyNode;
          }
          currentParent.children.push(employee);
        } else {
          parent.children.push(employee);
        }
      } else {
        // Fallback: huérfano colgando de root
        if (!root) root = employee
        else root.children.push(employee)
      }
    }
  })

  // Marcar _hasChildren en cada nodo real de forma recursiva
  const hasRealDescendant = (node: any): boolean => {
    if (!node.is_invisible_dummy) return true; // este mismo es un nodo real
    return node.children.some(hasRealDescendant);
  };

  const markHasChildren = (node: any): void => {
    if (!node) return;
    if (node.is_invisible_dummy) {
      // Los nodos fantasmas no necesitan _hasChildren, solo recurrir
      node.children.forEach(markHasChildren);
      return;
    }
    // Un nodo real tiene hijos si alguno de sus children directos (o a través de dummies) es real
    node._hasChildren = node.children.some(hasRealDescendant);
    // Recurrir en todos los hijos para que también queden marcados
    node.children.forEach(markHasChildren);
  };
  if (root) markHasChildren(root);

  // Transformar al formato exacto que espera react-d3-tree
  const formatNode = (node: any): any => ({
    name: node.name,
    attributes: {
      idEmpleado: node.id,
      cargo: node.position,
      hierarchy_level: node.hierarchy_level,
      fotoUrl: node.photo_url,
      is_invisible_dummy: node.is_invisible_dummy ?? false,
      _hasChildren: node._hasChildren ?? false,
      _directReportsCount: node._directReportsCount ?? 0,
      secondary_parent_id: node.secondary_parent_id || null,
    },
    id: node.id,
    parentId: node.parent_id,
    children: node.children.map(formatNode)
  })

  return root ? formatNode(root) : null
}
