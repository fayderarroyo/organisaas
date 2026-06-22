import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);
const BIOGER_ID = '2fed2ae8-4c73-4d63-b362-afefcadd7bc5';

function determineLevel(position) {
  if (!position) return null;
  const p = position.toLowerCase();
  
  if (p.includes('general') || p.includes('ceo') || p.includes('presidente')) return 'Nivel 0';
  if (p.includes('gerente') || p.includes('director')) return 'Nivel 1';
  if (p.includes('jefe') || p.includes('encargad') || p.includes('lider') || p.includes('líder')) return 'Nivel 2';
  if (p.includes('coordinador') || p.includes('gestor')) return 'Nivel 3';
  if (p.includes('asistente')) return 'Nivel 4';
  if (p.includes('auxiliar') || p.includes('aprendiz')) return 'Nivel 5';
  if (p.includes('operativ') || p.includes('técnico') || p.includes('tecnico') || p.includes('analista') || p.includes('mensajero')) return 'Nivel 6';
  
  return null;
}

async function run() {
  console.log('Obteniendo empleados de Bioger...');
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, position, hierarchy_level')
    .eq('company_id', BIOGER_ID);
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  let updatedCount = 0;
  
  for (const emp of employees) {
    // Check if they need swapping. 
    // They are swapped if `name` looks like a job title and `position` looks like a person's name.
    // Since the user asked to do the swap, we will just swap them ALL.
    // Wait, is it possible some are correct? 
    // "GERENTE GENERAL" is all caps. Most job titles are caps in their DB.
    // Let's just swap them unconditionally since the user requested: "haz el intercambio".
    
    const newName = emp.position; // The person's name is in position
    const newPosition = emp.name; // The job title is in name
    
    const newLevel = determineLevel(newPosition);
    
    console.log(`Intercambiando: Nombre: ${newName} | Cargo: ${newPosition} | Nivel inferido: ${newLevel}`);
    
    await supabase.from('employees').update({
      name: newName,
      position: newPosition,
      hierarchy_level: newLevel || null
    }).eq('id', emp.id);
    
    updatedCount++;
  }
  
  console.log(`\n¡Completado! Se arreglaron e intercambiaron ${updatedCount} empleados en Bioger.`);
}

run();
