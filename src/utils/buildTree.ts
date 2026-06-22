export function buildTree(employees: any[]) {
  if (!employees || employees.length === 0) return null

  // Mapa para acceso rápido a los nodos
  const employeeMap = new Map(employees.map(e => [e.id, { ...e, children: [] }]))
  let root: any = null

  // Construir jerarquía
  employeeMap.forEach(employee => {
    if (!employee.parent_id) {
      root = employee
    } else {
      const parent = employeeMap.get(employee.parent_id)
      if (parent) {
        parent.children.push(employee)
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
      fotoUrl: node.photo_url
    },
    // Necesario para que d3-tree mantenga referencias originales si queremos editar
    id: node.id,
    parentId: node.parent_id,
    children: node.children.map(formatNode)
  })

  return root ? formatNode(root) : null
}
