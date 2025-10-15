import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './product.model';
import { Model } from 'mongoose';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Function to get all products
   */
  async all(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Function to save a product data
   * @param data
   */
  async create(data: any): Promise<Product> {
    return new this.productModel(data).save();
  }

  /**
   * Function to get a product by id
   * @param id
   */
  async findOne(id: number): Promise<Product> {
    return this.productModel.findOne({ id });
  }

  /**
   * Function to like a product
   * @param id
   * @param data
   */
  async likes(id: number, data: any) {
    return this.productModel.findOneAndUpdate({ id }, data, { new: true });
  }

  /**
   * Function to update a product
   * @param id
   * @param data
   */
  async update(id: number, data: any) {
    return this.productModel.findOneAndUpdate({ id }, data, { new: true });
  }

  /**
   * Function to delete a product
   * @param id
   */
  async delete(id: number) {
    return this.productModel.findOneAndDelete({ id });
  }
}
