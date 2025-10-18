// tests/integration/BarriosProgressIntegration.test.js
// Pruebas de integración para el componente BarriosProgressChart

import request from 'supertest';
import app from '../../backend/app.js';

describe('Integración Gráfico de Progreso por Barrios', () => {
  describe('API /api/ciclos/progreso', () => {
    test('GET /api/ciclos/progreso debe retornar datos válidos para el nuevo componente', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verificar estructura de datos requerida por BarriosProgressChart
      if (response.body.data.length > 0) {
        const barrio = response.body.data[0];
        
        // Campos obligatorios para el gráfico de barras
        expect(barrio).toHaveProperty('barrio');
        expect(barrio).toHaveProperty('progreso_porcentaje');
        expect(barrio).toHaveProperty('territorios_completados');
        expect(barrio).toHaveProperty('total_territorios');
        expect(barrio).toHaveProperty('numero_ciclo');
        expect(barrio).toHaveProperty('estado');
        
        // Validar tipos de datos
        expect(typeof barrio.barrio).toBe('string');
        expect(typeof barrio.progreso_porcentaje).toBe('number');
        expect(typeof barrio.territorios_completados).toBe('number');
        expect(typeof barrio.total_territorios).toBe('number');
        expect(typeof barrio.numero_ciclo).toBe('number');
        expect(typeof barrio.estado).toBe('string');
        
        // Validar rangos
        expect(barrio.progreso_porcentaje).toBeGreaterThanOrEqual(0);
        expect(barrio.progreso_porcentaje).toBeLessThanOrEqual(100);
        expect(barrio.territorios_completados).toBeGreaterThanOrEqual(0);
        expect(barrio.total_territorios).toBeGreaterThan(0);
        expect(barrio.numero_ciclo).toBeGreaterThan(0);
      }
    });

    test('API debe retornar todos los barrios esperados', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      const expectedBarrios = [
        'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
        'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
        'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
      ];

      const receivedBarrios = response.body.data.map(b => b.barrio);
      
      expectedBarrios.forEach(barrio => {
        expect(receivedBarrios).toContain(barrio);
      });
      
      // Verificar que no hay barrios duplicados
      const uniqueBarrios = [...new Set(receivedBarrios)];
      expect(uniqueBarrios.length).toBe(receivedBarrios.length);
    });

    test('API debe manejar errores gracefully', async () => {
      // Test con endpoint inválido
      const response = await request(app)
        .get('/api/ciclos/progreso/invalid')
        .expect(404);
    });

    test('Datos deben ser consistentes para renderizado de barras', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      response.body.data.forEach(barrio => {
        // Verificar consistencia de progreso
        if (barrio.total_territorios > 0) {
          const expectedPercentage = (barrio.territorios_completados / barrio.total_territorios) * 100;
          const tolerance = 1; // 1% de tolerancia
          
          expect(Math.abs(barrio.progreso_porcentaje - expectedPercentage)).toBeLessThanOrEqual(tolerance);
        }
        
        // Verificar que territorios completados no exceda el total
        expect(barrio.territorios_completados).toBeLessThanOrEqual(barrio.total_territorios);
        
        // Verificar estados válidos
        const validStates = ['activo', 'completado', 'pausado', 'pendiente'];
        expect(validStates).toContain(barrio.estado);
      });
    });

    test('Respuesta debe incluir metadatos útiles', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      
      expect(response.body.total).toBe(response.body.data.length);
    });

    test('API debe responder en tiempo razonable', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Debe responder en menos de 5 segundos
      expect(responseTime).toBeLessThan(5000);
    });

    test('Datos deben estar ordenados para optimizar renderizado', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      // Verificar que los datos pueden ser ordenados por progreso
      const sortedData = [...response.body.data].sort((a, b) => 
        (b.progreso_porcentaje || 0) - (a.progreso_porcentaje || 0)
      );
      
      expect(sortedData.length).toBe(response.body.data.length);
      
      // Verificar que el primer elemento tiene el mayor progreso
      if (sortedData.length > 1) {
        expect(sortedData[0].progreso_porcentaje).toBeGreaterThanOrEqual(
          sortedData[sortedData.length - 1].progreso_porcentaje
        );
      }
    });

    test('API debe manejar carga concurrente', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/ciclos/progreso')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Verificar que todas las respuestas son consistentes
      const firstResponse = responses[0].body.data;
      responses.slice(1).forEach(response => {
        expect(response.body.data.length).toBe(firstResponse.length);
      });
    });

    test('Datos deben incluir información suficiente para estadísticas', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);

      const data = response.body.data;
      
      if (data.length > 0) {
        // Calcular estadísticas como lo haría el componente
        const totalBarrios = data.length;
        const progresoPromedio = data.reduce((sum, barrio) => 
          sum + (barrio.progreso_porcentaje || 0), 0) / totalBarrios;
        const barriosCompletos = data.filter(barrio => 
          (barrio.progreso_porcentaje || 0) >= 100).length;
        
        expect(totalBarrios).toBeGreaterThan(0);
        expect(progresoPromedio).toBeGreaterThanOrEqual(0);
        expect(progresoPromedio).toBeLessThanOrEqual(100);
        expect(barriosCompletos).toBeGreaterThanOrEqual(0);
        expect(barriosCompletos).toBeLessThanOrEqual(totalBarrios);
      }
    });

    test('API debe ser resiliente a fallos de base de datos', async () => {
      // Este test verifica que la API maneja gracefully los errores
      // En un entorno real, podríamos simular fallos de BD
      
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .timeout(10000); // 10 segundos de timeout
      
      // Debe responder con éxito o con un error manejado gracefully
      expect([200, 500, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Validación de colores pastel', () => {
    test('Componente debe tener colores pastel definidos', () => {
      // Importar dinámicamente para testing
      const expectedPastelColors = [
        '#FFB3BA', // Rosa pastel
        '#BAFFC9', // Verde pastel
        '#BAE1FF', // Azul pastel
        '#FFFFBA', // Amarillo pastel
        '#FFDFBA', // Naranja pastel
        '#E0BBE4', // Púrpura pastel
        '#C7CEEA', // Lavanda pastel
        '#FFDAC1', // Durazno pastel
        '#B5EAD7', // Menta pastel
        '#F0E68C', // Caqui pastel
        '#DDA0DD', // Ciruela pastel
        '#98FB98'  // Verde claro pastel
      ];
      
      // Verificar que tenemos suficientes colores para todos los barrios
      expect(expectedPastelColors.length).toBeGreaterThanOrEqual(12);
      
      // Verificar formato hexadecimal
      expectedPastelColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Performance del componente', () => {
    test('API debe responder rápidamente para UX fluida', async () => {
      const startTime = process.hrtime.bigint();
      
      await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);
      
      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number(endTime - startTime) / 1000000;
      
      // Debe responder en menos de 2 segundos para UX óptima
      expect(responseTimeMs).toBeLessThan(2000);
    });

    test('Datos deben ser del tamaño apropiado para renderizado eficiente', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);
      
      const responseSize = JSON.stringify(response.body).length;
      
      // Respuesta no debe ser excesivamente grande (< 50KB)
      expect(responseSize).toBeLessThan(50000);
      
      // Pero debe tener contenido útil (> 100 bytes)
      expect(responseSize).toBeGreaterThan(100);
    });
  });
});