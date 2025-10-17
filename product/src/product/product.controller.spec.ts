import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ClientProxy } from '@nestjs/microservices';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;
  let client: ClientProxy;
  let cloudinaryService: CloudinaryService;

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
          useValue: { emit: jest.fn() },
        },
        {
          provide: CloudinaryService,
          useValue: { uploadFile: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
    client = module.get<ClientProxy>('PRODUCT_SERVICE');
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('all', () => {
    it('should return all products', async () => {
      const result = [{ id: 1, title: 'Product 1' }] as any;
      jest.spyOn(productService, 'all').mockResolvedValue(result);

      expect(await controller.all()).toBe(result);
      expect(productService.all).toHaveBeenCalled();
    });

    it('should throw an exception on error', async () => {
      jest
        .spyOn(productService, 'all')
        .mockRejectedValue(new Error('DB error'));

      await expect(controller.all()).rejects.toThrow(
        new HttpException(
          'Failed to retrieve products',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const mockProduct = {
        id: 1,
        title: 'Test Product',
        image: 'https://fake-url.com/image.jpg',
      } as any;

      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue({
        secure_url: 'https://fake-url.com/image.jpg',
      } as any);

      jest.spyOn(productService, 'create').mockResolvedValue(mockProduct);

      const result = await controller.create('Test Product', '', mockFile);

      expect(result).toEqual(mockProduct);
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(productService.create).toHaveBeenCalledWith({
        title: 'Test Product',
        image: 'https://fake-url.com/image.jpg',
      });
      expect(client.emit).toHaveBeenCalledWith('product_created', mockProduct);
    });

    it('should throw an exception if creation fails', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      jest
        .spyOn(cloudinaryService, 'uploadFile')
        .mockRejectedValue(new Error('Upload error'));

      await expect(controller.create('Test', '', mockFile)).rejects.toThrow(
        new HttpException(
          'Error encountered while creating product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('get', () => {
    it('should return a product by id', async () => {
      const product = { id: 1, title: 'Product 1' } as any;
      jest.spyOn(productService, 'get').mockResolvedValue(product);

      expect(await controller.get(1)).toBe(product);
    });

    it('should throw an exception on error', async () => {
      jest
        .spyOn(productService, 'get')
        .mockRejectedValue(new Error('DB error'));

      await expect(controller.get(1)).rejects.toThrow(
        new HttpException(
          'Error encountered while creating product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('update', () => {
    it('should update and return product', async () => {
      const product = { id: 1, title: 'Updated Product', image: 'url' } as any;
      jest.spyOn(productService, 'update').mockResolvedValue(undefined);
      jest.spyOn(productService, 'get').mockResolvedValue(product);

      const result = await controller.update(1, 'Updated Product', 'url');

      expect(result).toBe(product);
      expect(productService.update).toHaveBeenCalledWith(1, {
        title: 'Updated Product',
        image: 'url',
      });
      expect(client.emit).toHaveBeenCalledWith('product_updated', product);
    });

    it('should throw exception on error', async () => {
      jest
        .spyOn(productService, 'update')
        .mockRejectedValue(new Error('DB error'));

      await expect(controller.update(1, 'Title', 'url')).rejects.toThrow(
        new HttpException(
          'Error encountered while creating product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      jest.spyOn(productService, 'delete').mockResolvedValue(undefined);

      expect(await controller.delete(1)).toBe(true);
      expect(client.emit).toHaveBeenCalledWith('product_deleted', 1);
    });

    it('should throw exception on error', async () => {
      jest
        .spyOn(productService, 'delete')
        .mockRejectedValue(new Error('DB error'));

      await expect(controller.delete(1)).rejects.toThrow(
        new HttpException(
          'Error encountered while creating product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('like', () => {
    it('should increase likes of a product', async () => {
      const product = { id: 1, title: 'Product', likes: 2 } as any;
      jest.spyOn(productService, 'get').mockResolvedValue(product);
      jest.spyOn(productService, 'update').mockResolvedValue(undefined);

      await controller.like(1);

      expect(productService.get).toHaveBeenCalledWith(1);
      expect(productService.update).toHaveBeenCalledWith(1, { likes: 3 });
    });

    it('should throw exception on error', async () => {
      jest
        .spyOn(productService, 'get')
        .mockRejectedValue(new Error('DB error'));

      await expect(controller.like(1)).rejects.toThrow(
        new HttpException(
          'Error encountered while liking product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
