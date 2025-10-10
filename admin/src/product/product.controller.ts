import { Body, Controller, Get, HttpException, HttpStatus, Post } from "@nestjs/common";
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  /**
   * Constructor for the product controller class
   *
   * @param productService
   */
  constructor(private productService: ProductService) {}

  /**
   * Function to get all products
   * Calling the product services class
   */
  @Get()
  async all() {
    try {
      return this.productService.all();
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
      return this.productService.create({
        title,
        image,
      });
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
