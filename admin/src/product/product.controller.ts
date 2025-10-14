import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from "@nestjs/common";
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

  /**
   * Function to get a single product by id
   * @param id
   */
  @Get(':id')
  async get(@Param('id') id: number) {
    try {
      return this.productService.get(id);
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
      return this.productService.update(id, {
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

  /**
   * Function to delete a product
   *
   * @param id
   */
  @Delete(':id')
  async delete(@Param('id') id: number) {
    try {
      return this.productService.delete(id);
    } catch (error) {
      throw new HttpException(
        'Error encountered while creating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
