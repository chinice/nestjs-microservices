import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ClientProxy } from '@nestjs/microservices';
import { HttpException } from '@nestjs/common';
import { Product } from './product.entity';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: jest.Mocked<ProductService>;
  let clientProxy: jest.Mocked<ClientProxy>;

  // Helper to test HttpException throwing
  async function expectHttpException(
    fn: () => Promise<any>,
    message: string,
    status = 500,
  ) {
    try {
      await fn();
      fail('Expected HttpException to be thrown');
    } catch (error) {
      const httpError = error as HttpException;
      expect(httpError).toBeInstanceOf(HttpException);
      expect(httpError.message).toBe(message);
      expect(httpError.getStatus()).toBe(status);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            all: jest.fn(),
            create: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: 'PRODUCT_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get(ProductService);
    clientProxy = module.get('PRODUCT_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------ TESTS ------------------

  describe('all()', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, title: 'Phone', image: 'img1', likes: 0 },
        { id: 2, title: 'Laptop', image: 'img2', likes: 0 },
      ] as Product[];

      productService.all.mockResolvedValue(mockProducts);

      const result = await controller.all();

      expect(result).toEqual(mockProducts);
      expect(productService.all).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException on failure', async () => {
      productService.all.mockImplementation(() =>
        Promise.reject(new Error('DB error')),
      );
      await expectHttpException(
        () => controller.all(),
        'Failed to retrieve products',
      );
    });
  });

  describe('create()', () => {
    it('should create a product and emit "product_created"', async () => {
      const mockProduct = {
        id: 1,
        title: 'TV',
        image: 'img.jpg',
        likes: 0,
      } as Product;
      productService.create.mockResolvedValue(mockProduct);

      const result = await controller.create('TV', 'img.jpg');

      expect(result).toEqual(mockProduct);
      expect(productService.create).toHaveBeenCalledWith({
        title: 'TV',
        image: 'img.jpg',
      });
      expect(clientProxy.emit).toHaveBeenCalledWith(
        'product_created',
        mockProduct,
      );
    });

    it('should throw HttpException on error', async () => {
      productService.create.mockImplementation(() =>
        Promise.reject(new Error('Create failed')),
      );
      await expectHttpException(
        () => controller.create('TV', 'img.jpg'),
        'Error encountered while creating product',
      );
    });
  });

  describe('get()', () => {
    it('should return a product by id', async () => {
      const mockProduct: Product = {
        id: 1,
        title: 'Phone',
        image: 'p.jpg',
        likes: 0,
      };
      productService.get.mockResolvedValue(mockProduct);

      const result = await controller.get(1);
      expect(result).toEqual(mockProduct);
      expect(productService.get).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException on error', async () => {
      productService.get.mockImplementation(() =>
        Promise.reject(new Error('Not found')),
      );
      await expectHttpException(
        () => controller.get(999),
        'Error encountered while creating product',
      );
    });
  });

  describe('update()', () => {
    it('should update product, emit "product_updated", and return updated product', async () => {
      const mockProduct: Product = {
        id: 1,
        title: 'Laptop',
        image: 'l.jpg',
        likes: 0,
      };
      productService.update.mockResolvedValue(mockProduct);
      productService.get.mockResolvedValue(mockProduct);

      const result = await controller.update(1, 'Laptop', 'l.jpg');

      expect(productService.update).toHaveBeenCalledWith(1, {
        title: 'Laptop',
        image: 'l.jpg',
      });
      expect(clientProxy.emit).toHaveBeenCalledWith(
        'product_updated',
        mockProduct,
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw HttpException on error', async () => {
      productService.update.mockImplementation(() =>
        Promise.reject(new Error('Update failed')),
      );
      await expectHttpException(
        () => controller.update(1, 'Laptop', 'l.jpg'),
        'Error encountered while creating product',
      );
    });
  });

  describe('delete()', () => {
    it('should delete a product and emit "product_deleted"', async () => {
      productService.delete.mockResolvedValue({ affected: 1 });

      const result = await controller.delete(1);

      expect(result).toBe(true);
      expect(productService.delete).toHaveBeenCalledWith(1);
      expect(clientProxy.emit).toHaveBeenCalledWith('product_deleted', 1);
    });

    it('should throw HttpException on error', async () => {
      productService.delete.mockImplementation(() =>
        Promise.reject(new Error('Delete failed')),
      );
      await expectHttpException(
        () => controller.delete(1),
        'Error encountered while creating product',
      );
    });
  });

  describe('like()', () => {
    it('should increment product likes', async () => {
      const mockProduct: Product = {
        id: 1,
        title: 'Watch',
        image: 'w.jpg',
        likes: 2,
      };
      productService.get.mockResolvedValue(mockProduct);
      productService.update.mockResolvedValue({ ...mockProduct, likes: 3 });

      const result = await controller.like(1);

      expect(productService.get).toHaveBeenCalledWith(1);
      expect(productService.update).toHaveBeenCalledWith(1, { likes: 3 });
      expect(result).toEqual({ ...mockProduct, likes: 3 });
    });

    it('should throw HttpException on error', async () => {
      productService.get.mockImplementation(() =>
        Promise.reject(new Error('Like failed')),
      );
      await expectHttpException(
        () => controller.like(1),
        'Error encountered while liking product',
      );
    });
  });
});
