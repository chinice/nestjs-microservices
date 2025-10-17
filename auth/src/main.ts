import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Step 1: Create the main HTTP app
  const app = await NestFactory.create(AppModule);
  // Retrieve ConfigService from the application context
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:4000',
  });

  // Step 2: Connect the microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'auth_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  // Step 3: Start both (microservice + HTTP server)
  await app.startAllMicroservices();
  await app.listen(3002);

  console.log('Auth Microservice is listening...');
}
bootstrap();
