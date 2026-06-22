import { buildTree } from './src/utils/buildTree';

const employees = [
  { id: '1', parent_id: null, name: 'CEO', position: 'CEO', hierarchy_level: 'Nivel 0' },
  { id: 's', parent_id: '1', name: 'Sergio', position: 'Gerente', hierarchy_level: 'Nivel 1' },
  { id: 'x1', parent_id: 's', name: 'X1', position: 'Reg', hierarchy_level: 'Nivel 1' },
  { id: 'x2', parent_id: 's', name: 'X2', position: 'Reg', hierarchy_level: 'Nivel 1' },
  { id: 'a', parent_id: 's', name: 'Antonio', position: 'Dir', hierarchy_level: 'Nivel 1' },
  { id: 'l', parent_id: 's', name: 'Luis', position: 'Dir', hierarchy_level: 'Nivel 2' }
];

const tree = buildTree(employees);
console.log(JSON.stringify(tree, null, 2));
