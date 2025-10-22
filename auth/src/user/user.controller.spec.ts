import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {RegisterDto} from "./dto/register.dto";
import {HttpException} from "@nestjs/common";
import {LoginDto} from "./dto/login.dto";
import {ClientProxy} from "@nestjs/microservices";
import { of } from 'rxjs';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let clientProxy: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            verifyEmail: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: {
            connect: jest.fn(),
            emit: jest.fn(),
          },
        },
      ],
    }).compile();
    process.env.BASE_URL = 'http://localhost:3002';
    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    clientProxy = module.get('USER_SERVICE');
  });

  afterEach(() => jest.clearAllMocks());

  // REGISTER
  describe('register', () => {
    it('should register a user', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: '123456', firstName: 'firstname', lastName: 'lastname' };
      const mockResult = { accessToken: 'mock-token', refreshToken: 'refresh-token', emailVerificationToken: 'email-verification-token' }

      userService.register.mockResolvedValue(mockResult);
      clientProxy.emit.mockReturnValue(of (undefined));

      const result = await controller.register(dto);

      expect(userService.register).toHaveBeenCalledWith(dto);
      expect(clientProxy.emit).toHaveBeenCalledWith('send_email', {
        to: dto.email,
        templateId: 41871910,
        templateModel: {
          name: dto.firstName,
          link: `http://localhost:3002/api/auth/verify?token=${mockResult.emailVerificationToken}`,
        },
      });

      expect(result).toEqual({
        accessToken: mockResult.accessToken,
        refreshToken: mockResult.refreshToken,
      });
    });

    it('should throw HttpException on registration failure', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      userService.register.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.register(dto)).rejects.toThrow(HttpException);
      await expect(controller.register(dto)).rejects.toThrow('Email already exists');
    });
  });

  //LOGIN
  describe('login', () => {
    it('should login successfully', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const mockResult = { accessToken: 'access123', refreshToken: 'refresh123' };

      userService.login.mockResolvedValue(mockResult);

      const result = await controller.login(dto);

      expect(userService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('should throw HttpException on login failure', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      userService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(dto)).rejects.toThrow(HttpException);
      await expect(controller.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  //LOGOUT
  describe('logout', () => {
    it('should logout successfully', async () => {
      const req = { user: { sub: 'user-id-123' } };
      userService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const result = await controller.logout(req);

      expect(userService.logout).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should throw HttpException if logout fails', async () => {
      const req = { user: { sub: 'user-id-123' } };
      userService.logout.mockRejectedValue(new Error('Service failed'));

      await expect(controller.logout(req)).rejects.toThrow(HttpException);
      await expect(controller.logout(req)).rejects.toThrow('Error encountered while logging out');
    });
  });

  //VERIFY EMAIL
  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      userService.verifyEmail.mockResolvedValue({ message: 'Email verified' });
      const result = await controller.verifyEmail('token123');
      expect(userService.verifyEmail).toHaveBeenCalledWith('token123');
      expect(result).toEqual({ message: 'Email verified' });
    });

    it('should throw HttpException on verify email failure', async () => {
      userService.verifyEmail.mockRejectedValue(new Error('Invalid token'));
      await expect(controller.verifyEmail('token123')).rejects.toThrow(HttpException);
    });
  });

  //REQUEST PASSWORD RESET
  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const mockUser = { email: 'test@example.com', firstName: 'John' };
      const mockToken = 'mocked-token';
      const mockResult = {
        message: 'Password reset email sent',
        data: { user: mockUser, token: mockToken },
      } as any;

      // Mock dependencies
      userService.requestPasswordReset.mockResolvedValue(mockResult);
      clientProxy.emit.mockReturnValue(of (undefined)); // mock event emitter

      const result = await controller.requestPasswordReset('test@example.com');

      // Check service was called correctly
      expect(userService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');

      // Verify email payload emitted
      expect(clientProxy.emit).toHaveBeenCalledWith(
          'send_email',
          expect.objectContaining({
            to: mockUser.email,
            templateId: 41920429,
            templateModel: expect.objectContaining({
              name: mockUser.firstName,
              link: `${process.env.BASE_URL}/api/auth/password-reset?token=${mockToken}`,
            }),
          }),
      );

      // Verify return value
      expect(result).toEqual({ message: mockResult.message });
    });

    it('should throw HttpException on failure', async () => {
      userService.requestPasswordReset.mockRejectedValue(new Error('User not found'));
      await expect(controller.requestPasswordReset('test@example.com')).rejects.toThrow(HttpException);
    });
  });

  //RESET PASSWORD
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      userService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });
      const result = await controller.resetPassword('token123', 'newpass123');
      expect(userService.resetPassword).toHaveBeenCalledWith('token123', 'newpass123');
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw HttpException on failure', async () => {
      userService.resetPassword.mockRejectedValue(new Error('Invalid token'));
      await expect(controller.resetPassword('token123', 'newpass123')).rejects.toThrow(HttpException);
    });
  });
});
