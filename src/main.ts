import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 3001;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);

  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:5173', 'https://storage-eight-tau.vercel.app'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(PORT, () => console.log(`Сервер запущен. Port = ${PORT}`));
}
bootstrap();
