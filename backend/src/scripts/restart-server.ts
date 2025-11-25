import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function restartServer() {
  try {
    // Buscar proceso usando el puerto 3001
    const { stdout } = await execAsync("lsof -t -i:3001");
    
    if (stdout) {
      // Si hay un proceso, matarlo
      const pids = stdout.split('\n').filter(Boolean);
      for (const pid of pids) {
        await execAsync(`kill -9 ${pid}`);
      }
      console.log('🔄 Proceso anterior terminado correctamente');
    }
  } catch (error) {
    // Si no hay proceso, no hay problema
    console.log('✨ Puerto 3001 está libre');
  }
}

restartServer()
  .then(() => {
    console.log('🚀 Iniciando servidor...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al reiniciar el servidor:', error);
    process.exit(1);
  });
