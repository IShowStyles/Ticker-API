const serverless = require('serverless-http');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./src/app.module');

let server; // Cache the server instance for performance.

const bootstrapServer = async () => {
  if (!server) {
    const app = await NestFactory.create(AppModule);
    await app.init();
    server = serverless(app.getHttpAdapter().getInstance());
  }
  return server;
};

exports.handler = async (event, context) => {
  const s = await bootstrapServer();
  return s(event, context);
};
