import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }),
  );
  const PORT = +process.env.PORT || 3001;
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(PORT);
  console.log(`Server started on http://localhost:${PORT} 🚀`);
}

bootstrap();
