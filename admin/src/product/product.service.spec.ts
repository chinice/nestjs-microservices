import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('all', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, title: 'Product 1', image: 'Product 1 Image', likes: 0 },
        { id: 2, title: 'Product 2', image: 'Product 2 Image', likes: 0 },
      ] as Product[];

      repository.find.mockResolvedValue(mockProducts);

      const result = await service.all();
      expect(result).toEqual(mockProducts);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should save and return the created product', async () => {
      const productData = {
        title: 'Product 1',
        image: 'Product 1 Image',
        likes: 0,
      } as Product;
      const savedProduct = { id: 1, ...productData } as Product;

      repository.save.mockResolvedValue(savedProduct);

      const result = await service.create(productData);
      expect(result).toEqual(savedProduct);
      expect(repository.save).toHaveBeenCalledWith(productData);
    });
  });

  describe('get', () => {
    it('should return a product by id', async () => {
      const product = {
        id: 1,
        title: 'Product 1',
        image: 'Product 1 Image',
        likes: 0,
      } as Product;

      repository.findOneBy.mockResolvedValue(product);

      const result = await service.get(1);
      expect(result).toEqual(product);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return undefined if product not found', async () => {
      repository.findOneBy.mockResolvedValue(undefined);

      const result = await service.get(999);
      expect(result).toBeUndefined();
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.update.mockResolvedValue(updateResult as any);

      const result = await service.update(1, {
        title: 'Product 1',
        image: 'Product 1 Image',
      });
      expect(result).toEqual(updateResult);
      expect(repository.update).toHaveBeenCalledWith(1, {
        title: 'Product 1',
        image: 'Product 1 Image',
      });
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      const deleteResult = { affected: 1, raw: [] };
      repository.delete.mockResolvedValue(deleteResult as any);

      const result = await service.delete(1);
      expect(result).toEqual(deleteResult);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });
  });
});
