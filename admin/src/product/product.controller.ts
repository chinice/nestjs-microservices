import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ClientProxy } from '@nestjs/microservices';

@Controller('products')
export class ProductController {
  /**
   * Constructor for the product controller class
   *
   * @param productService
   * @param client
   */
  constructor(
    private productService: ProductService,
    @Inject('PRODUCT_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Function to get all products
   * Calling the product services class
   */
  @Get()
  async all() {
    try {
      return await this.productService.all();
    } catch (error) {
      //Log in error for debugging and throw an exception error
      throw new HttpException(
        'Failed to retrieve products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to create a new product
   * @param title
   * @param image
   */
  @Post()
  async create(@Body('title') title: string, @Body('image') image: string) {
    try {
      const product = await this.productService.create({
        title,
        image,
      });

      //Send data to microservice
      this.client.emit('product_created', product);
      //Return product
      return product;
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to get a single product by id
   * @param id
   */
  @Get(':id')
  async get(@Param('id') id: number) {
    try {
      return await this.productService.get(id);
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to update a product
   * @param id
   * @param title
   * @param image
   */
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body('title') title: string,
    @Body('image') image: string,
  ) {
    try {
      await this.productService.update(id, {
        title,
        image,
      });
      //Get updated product by id
      const product = await this.productService.get(id);
      //Emit product updated to microservice
      this.client.emit('product_updated', product);
      //Return updated product
      return product;
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to delete a product
   * @param id
   */
  @Delete(':id')
  async delete(@Param('id') id: number) {
    try {
      await this.productService.delete(id);

      this.client.emit('product_deleted', id);

      return true;
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Function to update product likes
   * @param id
   */
  @Post(':id/like')
  async like(@Param('id') id: number) {
    try {
      const product = await this.productService.get(id);

      return this.productService.update(id, {
        likes: product.likes + 1,
      });
    } catch (error) {
      throw new HttpException(
        'Error encountered while liking product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
