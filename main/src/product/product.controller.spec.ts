import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;
  let httpService: HttpService;

  const mockProductService = {
    all: jest.fn(),
    findOne: jest.fn(),
    likes: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockProduct = {
    id: 1,
    title: 'Test Product',
    image: 'image.jpg',
    likes: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('all', () => {
    it('should return all products', async () => {
      mockProductService.all.mockResolvedValue([mockProduct]);

      const result = await controller.all();
      expect(result).toEqual([mockProduct]);
      expect(mockProductService.all).toHaveBeenCalled();
    });

    it('should throw HttpException on error', async () => {
      mockProductService.all.mockRejectedValue(new Error('DB Error'));

      await expect(controller.all()).rejects.toThrow(HttpException);
    });
  });

  describe('like', () => {
    it('should like a product', async () => {
      const likedProduct = { ...mockProduct, likes: 1 };
      mockProductService.findOne.mockResolvedValue(mockProduct);
      mockProductService.likes.mockResolvedValue(likedProduct);

      // Mock HttpService post to return observable
      mockHttpService.post.mockReturnValue(of({ data: 'ok' }));

      const result = await controller.like(mockProduct.id);
      expect(result).toEqual(likedProduct);
      expect(mockProductService.findOne).toHaveBeenCalledWith(mockProduct.id);
      expect(mockProductService.likes).toHaveBeenCalledWith(mockProduct.id, {
        likes: 1,
      });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        `http://localhost:3000/api/products/${mockProduct.id}/like`,
        {},
      );
    });

    it('should throw HttpException on error', async () => {
      mockProductService.findOne.mockRejectedValue(new Error('Error'));
      await expect(controller.like(mockProduct.id)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('productCreated', () => {
    it('should create a product on event', async () => {
      await controller.productCreated(mockProduct);
      expect(mockProductService.create).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw HttpException on error', async () => {
      mockProductService.create.mockRejectedValue(new Error('Error'));
      await expect(controller.productCreated(mockProduct)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('productUpdate', () => {
    it('should update a product on event', async () => {
      await controller.productUpdate(mockProduct);
      expect(mockProductService.update).toHaveBeenCalledWith(
        mockProduct.id,
        mockProduct,
      );
    });

    it('should throw HttpException on error', async () => {
      mockProductService.update.mockRejectedValue(new Error('Error'));
      await expect(controller.productUpdate(mockProduct)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('productDeleted', () => {
    it('should delete a product on event', async () => {
      await controller.productDeleted(mockProduct.id);
      expect(mockProductService.delete).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should throw HttpException on error', async () => {
      mockProductService.delete.mockRejectedValue(new Error('Error'));
      await expect(controller.productDeleted(mockProduct.id)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
