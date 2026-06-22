import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Leer .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseUrl || !supabaseKey) {
  console.error('No se encontraron las variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  console.log('Obteniendo empleados...');
  const { data: employees, error } = await supabase.from('employees').select('id, position, hierarchy_level');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  let updatedCount = 0;
  
  for (const emp of employees) {
    const newLevel = determineLevel(emp.position);
    if (newLevel) {
      if (emp.hierarchy_level !== newLevel) {
        console.log(`Actualizando [${emp.position}] -> ${newLevel}`);
        await supabase.from('employees').update({ hierarchy_level: newLevel }).eq('id', emp.id);
        updatedCount++;
      }
    } else {
      console.log(`No se pudo inferir nivel para: [${emp.position}]`);
    }
  }
  
  console.log(`¡Completado! Se actualizaron ${updatedCount} empleados.`);
}

run();
