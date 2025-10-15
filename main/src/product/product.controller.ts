import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { EventPattern } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private httpService: HttpService,
  ) {}

  /**
   * Function to get all products
   */
  @Get()
  async all() {
    try {
      return await this.productService.all();
    } catch (error) {
      throw new HttpException(
        'Error encountered while retrieving products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to like a product
   * @param id
   */
  @Post(':id/like')
  async like(@Param('id') id: number) {
    try {
      this.httpService
        .post(`http://localhost:3000/api/products/${id}/like`, {})
        .subscribe((res: any) => {
          console.log(res);
        });
      const product = await this.productService.findOne(id);
      return await this.productService.likes(id, { likes: product.likes + 1 });
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to list when a product is created
   * @param product
   */
  @EventPattern('product_created')
  async productCreated(product: any) {
    try {
      await this.productService.create({
        id: product.id,
        title: product.title,
        image: product.image,
        likes: product.likes,
      });
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to listen for product update
   * @param product
   */
  @EventPattern('product_updated')
  async productUpdate(product: any) {
    try {
      await this.productService.update(product.id, {
        id: product.id,
        title: product.title,
        image: product.image,
        likes: product.likes,
      });
    } catch (error) {
      throw new HttpException(
        'Error encountered while updating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to listen for product delete event
   * @param id
   */
  @EventPattern('product_deleted')
  async productDeleted(id: number) {
    try {
      await this.productService.delete(id);
    } catch (error) {
      throw new HttpException(
        'Error encountered while deleting product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
