export function buildTree(employees: any[]) {
  if (!employees || employees.length === 0) return null

  // Mapa para acceso rápido a los nodos
  const employeeMap = new Map(employees.map(e => [e.id, { ...e, children: [] }]))
  let root: any = null

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
        const parentLvl = getLevelNum(parent.hierarchy_level);
        const childLvl = getLevelNum(employee.hierarchy_level);
        const diff = childLvl - parentLvl;

        if (diff > 1) {
          let currentParent = parent;
          // Inyectar (diff - 1) nodos falsos
          for (let i = 1; i < diff; i++) {
            const dummyId = `dummy_${parent.id}_${employee.id}_${i}`;
            const dummyNode = { 
              id: dummyId, 
              name: 'Invisible', 
              is_invisible_dummy: true, 
              children: [],
              parent_id: currentParent.id
            };
            currentParent.children.push(dummyNode);
            currentParent = dummyNode;
          }
          currentParent.children.push(employee);
        } else {
          parent.children.push(employee);
        }
      } else {
        // Fallback: Si el padre no existe, lo hacemos huérfano colgando de root (o él mismo root si no hay root)
        if (!root) root = employee
        else root.children.push(employee)
      }
    }
  })

  // Transformar al formato exacto que espera react-d3-tree
  const formatNode = (node: any): any => ({
    name: node.name,
    attributes: {
      idEmpleado: node.id,
      cargo: node.position,
      hierarchy_level: node.hierarchy_level,
      fotoUrl: node.photo_url,
      is_invisible_dummy: node.is_invisible_dummy
    },
    // Necesario para que d3-tree mantenga referencias originales si queremos editar
    id: node.id,
    parentId: node.parent_id,
    children: node.children.map(formatNode)
  })

  return root ? formatNode(root) : null
}
