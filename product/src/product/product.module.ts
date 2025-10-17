import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`${process.env.RABBITMQ_URL}`],
          queue: 'main_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CloudinaryModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
