import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  /**
   * Constructor for the class
   * @param productRepository
   */
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Function to get all products
   */
  async all(): Promise<Product[]> {
    return this.productRepository.find();
  }

  /**
   * Function to create a mew product
   * @param data
   */
  async create(data: any): Promise<Product> {
    return this.productRepository.save(data);
  }
}
