const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'insert-hero-slides.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL directamente usando Prisma
    const result = await prisma.$executeRawUnsafe(sql);
    
    console.log('SQL ejecutado exitosamente');
    
    // Verificar que los datos se hayan insertado
    const slides = await prisma.heroSlide.findMany();
    console.log('Hero Slides encontrados después de la inserción:', slides.length);
    console.log(JSON.stringify(slides, null, 2));
  } catch (error) {
    console.error('Error al ejecutar SQL:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());