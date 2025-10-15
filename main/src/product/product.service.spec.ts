import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './product.model';
import { Model } from 'mongoose';

const mockProduct = {
  id: 1,
  title: 'Test Product',
  image: 'image.jpg',
  likes: 0,
};

describe('ProductService', () => {
  let service: ProductService;
  let model: Model<Product>;

  const mockModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    model = module.get<Model<Product>>(getModelToken(Product.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('all', () => {
    it('should return an array of products', async () => {
      (mockModel.exec as jest.Mock).mockResolvedValue([mockProduct]);

      const products = await service.all();
      expect(products).toEqual([mockProduct]);
      expect(model.find).toHaveBeenCalled();
      expect(model.find().exec).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockProduct);

      // Mock the constructor to return an object with save
      const ProductModelMock: any = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      service = new ProductService(ProductModelMock);

      const result = await service.create(mockProduct);
      expect(result).toEqual(mockProduct);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a product by id', async () => {
      (mockModel.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const product = await service.findOne(1);
      expect(product).toEqual(mockProduct);
      expect(model.findOne).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('likes', () => {
    it('should update product likes', async () => {
      const updatedProduct = { ...mockProduct, likes: 10 };
      (mockModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedProduct,
      );

      const result = await service.likes(1, { likes: 10 });
      expect(result).toEqual(updatedProduct);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 1 },
        { likes: 10 },
        { new: true },
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updatedProduct = { ...mockProduct, title: 'Updated' };
      (mockModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedProduct,
      );

      const result = await service.update(1, { title: 'Updated' });
      expect(result).toEqual(updatedProduct);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 1 },
        { title: 'Updated' },
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      (mockModel.findOneAndDelete as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.delete(1);
      expect(result).toEqual(mockProduct);
      expect(model.findOneAndDelete).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
