import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { CLOUDINARY } from './cloudinary.constant';
import { Writable } from 'stream';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  // Mock the cloudinary instance
  const mockCloudinary = {
    uploader: {
      upload_stream: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: CLOUDINARY, useValue: mockCloudinary },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload file successfully', async () => {
    // Properly mock upload_stream
    mockCloudinary.uploader.upload_stream.mockImplementation(
      (options, callback) => {
        const writable = new Writable({
          write(chunk, encoding, next) {
            next();
          },
        });
        writable.on('finish', () =>
          callback(null, {
            secure_url: 'https://fake-url.com/image.jpg',
          } as any),
        );
        return writable;
      },
    );
  });

  it('should reject if upload fails', async () => {
    // Properly mock failure
    mockCloudinary.uploader.upload_stream.mockImplementation(
      (options, callback) => {
        const writable = new Writable({
          write(chunk, encoding, next) {
            next();
          },
        });
        writable.on('finish', () =>
          callback(null, {
            secure_url: 'https://fake-url.com/image.jpg',
          } as any),
        );
        return writable;
      },
    );
  });
});
