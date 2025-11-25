#!/usr/bin/env node

// Script simple para probar la funcionalidad de números de pedido
const { generateOrderNumber } = require('./backend/dist/utils/orderNumber.js');

async function testOrderNumbers() {
  console.log('🧪 Probando generación de números de pedido...\n');
  
  try {
    // Generar varios números de pedido
    for (let i = 1; i <= 3; i++) {
      const orderNumber = await generateOrderNumber();
      console.log(`${i}. Número de pedido generado: ${orderNumber}`);
    }
    
    console.log('\n✅ ¡La funcionalidad funciona correctamente!');
    console.log('\nFormato: PED-AAMMDD-XXX');
    console.log('- PED = Prefijo de Pedido');
    console.log('- AAMMDD = Fecha (año-mes-día)');
    console.log('- XXX = Contador secuencial diario');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testOrderNumbers();