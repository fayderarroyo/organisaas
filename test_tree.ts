import { buildTree } from './src/utils/buildTree';

const employees = [
  { id: '1', parent_id: null, name: 'CEO', position: 'CEO', hierarchy_level: 'Nivel 0' },
  { id: '2', parent_id: '1', name: 'Gerente', position: 'Gerente', hierarchy_level: 'Nivel 1' },
  { id: '3', parent_id: '1', name: 'Operativo', position: 'Operativo', hierarchy_level: 'Nivel 6' }
];

const tree = buildTree(employees);
console.log(JSON.stringify(tree, null, 2));
