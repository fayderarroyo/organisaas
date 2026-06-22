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
  const { data: emps } = await supabase.from('employees').select('id, name, parent_id').eq('company_id', '2fed2ae8-4c73-4d63-b362-afefcadd7bc5');
  
  // Find Sergio
  const sergio = emps.find(e => e.name.includes('Sergio'));
  console.log('Sergio:', sergio);
  
  const children = emps.filter(e => e.parent_id === sergio.id);
  console.log('Sergio children:', children);
  
  // Find Antonio
  const antonio = emps.find(e => e.name.includes('Antonio'));
  console.log('Antonio children:', emps.filter(e => e.parent_id === antonio.id));
  
  // Find Luis
  const luis = emps.find(e => e.name.includes('Luis'));
  console.log('Luis children:', emps.filter(e => e.parent_id === luis.id));
}

run();
