// Configuración de Vercel Speed Insights
// TEMPORALMENTE DESHABILITADO: El endpoint https://speed.vercel.app/insights.js devuelve 404
// Esto estaba causando errores CORS y 404 que interfieren con la funcionalidad del mapa
console.log('🔧 Speed Insights temporalmente deshabilitado para evitar errores CORS/404');
// TODO: Implementar Speed Insights cuando Vercel solucione el endpoint
// if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
//   // Cargar Speed Insights solo en producción de Vercel
//   import('https://speed.vercel.app/insights.js')
//     .then(() => {
//       console.log('✅ Vercel Speed Insights cargado correctamente');
//     })
//     .catch((error) => {
//       console.warn('⚠️ No se pudo cargar Vercel Speed Insights:', error);
//     });
// } else {
//   console.log('🔧 Speed Insights deshabilitado en desarrollo local');
// }
//# sourceMappingURL=speed-insights.js.map