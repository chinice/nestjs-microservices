import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from "./user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { JwtService } from "@nestjs/jwt";
import { MailerModule } from "@nestjs-modules/mailer";
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`${process.env.RABBITMQ_URL}`],
          queue: 'auth_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
    }),
  ],
  providers: [UserService, JwtService],
  controllers: [UserController]
})
export class UserModule {}
