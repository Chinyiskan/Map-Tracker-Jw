// Configuración de Vercel Speed Insights
// Solo se carga en producción para evitar errores en desarrollo

if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
  // Cargar Speed Insights solo en producción de Vercel
  import('https://speed.vercel.app/insights.js')
    .then(() => {
      console.log('✅ Vercel Speed Insights cargado correctamente');
    })
    .catch((error) => {
      console.warn('⚠️ No se pudo cargar Vercel Speed Insights:', error);
    });
} else {
  console.log('🔧 Speed Insights deshabilitado en desarrollo local');
}