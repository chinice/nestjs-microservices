import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryProvider } from './cloudinary.provider';
import { CLOUDINARY } from './cloudinary.constant';
import { FactoryProvider } from '@nestjs/common';

describe('CloudinaryProvider', () => {
  let mockConfigService: Partial<ConfigService>;
  let mockCloudinaryConfig: jest.SpyInstance;

  beforeEach(() => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        const env = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };
        return env[key];
      }),
    };

    // Spy on cloudinary.config
    mockCloudinaryConfig = jest
      .spyOn(cloudinary, 'config')
      .mockReturnValue({ cloud_name: 'test-cloud' } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined and provide CLOUDINARY token', () => {
    // Type assertion to FactoryProvider
    const provider = CloudinaryProvider as FactoryProvider;

    expect(provider.provide).toBe(CLOUDINARY);
    expect(typeof provider.useFactory).toBe('function');
    expect(provider.inject).toEqual([ConfigService]);
  });

  it('should configure Cloudinary using environment variables', () => {
    const provider = CloudinaryProvider as FactoryProvider;

    const result = provider.useFactory(mockConfigService as ConfigService);

    // ConfigService should be called for all keys
    expect(mockConfigService.get).toHaveBeenCalledTimes(3);
    expect(mockConfigService.get).toHaveBeenCalledWith('CLOUDINARY_CLOUD_NAME');
    expect(mockConfigService.get).toHaveBeenCalledWith('CLOUDINARY_API_KEY');
    expect(mockConfigService.get).toHaveBeenCalledWith('CLOUDINARY_API_SECRET');

    // Cloudinary config should be called with expected values
    expect(mockCloudinaryConfig).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });

    // The returned object should match the mocked Cloudinary config
    expect(result).toEqual({ cloud_name: 'test-cloud' });
  });
});
