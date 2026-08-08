import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import * as express from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';

const server = express();
let bootstrap: Promise<void> | null = null;

async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  app.set('trust proxy', true);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.setGlobalPrefix('api');

  await app.init();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!bootstrap) bootstrap = createApp();
  await bootstrap;
  server(req, res);
}
