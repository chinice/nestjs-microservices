import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {MicroserviceOptions, Transport} from "@nestjs/microservices";
import {ConfigService} from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Step 2: Connect the microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'mail_queue', 
      queueOptions: {
        durable: false,
      },
    },
  });

  // Step 3: Start both (microservice + HTTP server)
  await app.startAllMicroservices();
  console.log('✅ Email verification service started!')
}
bootstrap();
