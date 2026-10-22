import app from './app';
import container from './container';
import chalk from 'chalk';
import { setupScheduler } from './scheduler';
import { env } from './config';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('🚀 Starting Job Scraper API...');

    await container.connect();
    if(env.ENABLE_SCHEDULER){
      setupScheduler();
      console.log('✓ Scheduler is enabled');
    }else{
      console.log('✓ Scheduler is disabled');
    }

    console.log(chalk.green('✓ Scheduler initialized'));

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(chalk.green(`✓ Server running on port ${PORT}`));
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(chalk.red(`❌ Port ${PORT} is already in use`));
      } else {
        console.error(chalk.red('❌ Server error:'), error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error);
    process.exit(1);
  }
}

startServer();