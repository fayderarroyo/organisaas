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

async function run() {
  const { data: luis } = await supabase.from('employees').select('name, hierarchy_level').eq('name', 'Luis Cerchiaro ').single();
  console.log('Luis:', luis);
  
  const { data: ant } = await supabase.from('employees').select('name, hierarchy_level').eq('name', 'Antonio Andrade ').single();
  console.log('Antonio:', ant);
}

run();
