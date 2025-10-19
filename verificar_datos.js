const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sornquimztfbrcxwjirl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mzk0OCwiZXhwIjoyMDY4NjY5OTQ4fQ.wRCnpSyB89wEXkKJgQc8_liS3AByfOCfUiEY1y8FIQQ'
);

async function verificarDatos() {
  console.log('🔍 Verificando datos en manzanas_barrio_referencia...');
  
  const { data, error } = await supabase
    .from('manzanas_barrio_referencia')
    .select('barrio, manzana, es_valida')
    .eq('es_valida', true)
    .order('barrio');
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  const barrioStats = {};
  data.forEach(row => {
    if (!barrioStats[row.barrio]) {
      barrioStats[row.barrio] = 0;
    }
    barrioStats[row.barrio]++;
  });
  
  console.log('📊 Estadísticas por barrio:');
  Object.entries(barrioStats).forEach(([barrio, count]) => {
    console.log(`  ${barrio}: ${count} manzanas`);
  });
  
  console.log(`\n📈 Total: ${data.length} manzanas válidas en ${Object.keys(barrioStats).length} barrios`);
  
  // Verificar también ciclos activos
  console.log('\n🔍 Verificando ciclos activos...');
  const { data: ciclos, error: ciclosError } = await supabase
    .from('ciclos')
    .select('barrio, numero_ciclo, estado, total_territorios, territorios_completados')
    .eq('estado', 'activo');
    
  if (ciclosError) {
    console.error('❌ Error obteniendo ciclos:', ciclosError);
  } else {
    console.log('📊 Ciclos activos:');
    ciclos.forEach(ciclo => {
      console.log(`  ${ciclo.barrio}: Ciclo ${ciclo.numero_ciclo} - ${ciclo.territorios_completados}/${ciclo.total_territorios}`);
    });
  }
}

verificarDatos().catch(console.error);