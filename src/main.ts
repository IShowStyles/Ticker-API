import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as csurf from 'csurf';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // app.enableCors({
  //   origin: 'http://localhost:3000',
  // });
  const PORT = +process.env.PORT || 3001;
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(PORT);
  console.log(`Server started on http://localhost:${PORT} 🚀`);
}

bootstrap();
