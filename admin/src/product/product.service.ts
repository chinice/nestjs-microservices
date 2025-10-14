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

  /**
   * Function to get a single product by ID
   * @param id
   */
  async get(id: number): Promise<Product | undefined> {
    return this.productRepository.findOneBy({ id });
  }

  /**
   * Function to update a product
   *
   * @param id
   * @param data
   */
  async update(id: number, data): Promise<any> {
    return this.productRepository.update(id, data);
  }

  /**
   * Function to delete from the repository
   *
   * @param id
   */
  async delete(id: number): Promise<any> {
    return this.productRepository.delete(id);
  }
}
