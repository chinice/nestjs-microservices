import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from "./user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import {ClientProviderOptions, ClientsModule, Transport} from "@nestjs/microservices";
import { JwtModule } from "@nestjs/jwt";
import { UserController } from './user.controller';
import {ConfigModule, ConfigService} from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([User]),
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService): {
          options: { urls: string[]; queueOptions: { durable: boolean }; queue: string };
          transport: Transport.RMQ
        } => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5672'],
            queue: 'mail_queue',
            queueOptions: {
              durable: false,
            },
          },
        })
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // read from env
      }),
    }),
  ],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
