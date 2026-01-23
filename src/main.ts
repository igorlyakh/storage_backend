import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 3001;

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'all',
  });

  await app.listen(PORT, () => console.log('Сервер запущен.'));
}
bootstrap();
