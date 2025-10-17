import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {RegisterDto} from "./dto/register.dto";
import {User} from "./user.entity";
import {HttpException} from "@nestjs/common";
import {LoginDto} from "./dto/login.dto";

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

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
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  // REGISTER
  describe('register', () => {
    it('should register a user', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: '123456', firstName: 'firstname', lastName: 'lastname' };
      userService.register.mockResolvedValue({ accessToken: 'mock-token', refreshToken: 'refresh-token' });

      const result = await controller.register(dto);
      expect(result).toEqual({ accessToken: 'mock-token', refreshToken: 'refresh-token' });
      expect(userService.register).toHaveBeenCalledWith(dto);
    });

    it('should throw HttpException if service fails', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: '123456', firstName: 'firstname', lastName: 'lastname' };
      userService.register.mockRejectedValue(new Error('Service failed'));

      await expect(controller.register(dto)).rejects.toThrow(HttpException);
    });
  });

  //LOGIN
  describe('login', () => {
    it('should login and return accessToken and refreshToken', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: '123456' };

      userService.login.mockResolvedValue({ accessToken: 'mock-access', refreshToken: 'mock-refresh' });

      const result = await controller.login(dto);

      expect(userService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'mock-access', refreshToken: 'mock-refresh' });
    });

    it('should throw HttpException if login fails', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: '123456' };
      userService.login.mockRejectedValue(new Error('Service failed'));

      await expect(controller.login(dto)).rejects.toThrow(HttpException);
    });
  });

  //VERIFY EMAIL
  describe('verifyEmail', () => {
    it('should verify email and return success message', async () => {
      const token = 'email-token';
      userService.verifyEmail.mockResolvedValue({ message: 'Email successfully verified' });

      const result = await controller.verifyEmail(token);

      expect(userService.verifyEmail).toHaveBeenCalledWith(token);
      expect(result).toEqual({ message: 'Email successfully verified' });
    });

    it('should throw HttpException if verification fails', async () => {
      userService.verifyEmail.mockRejectedValue(new Error('Service failed'));
      await expect(controller.verifyEmail('token')).rejects.toThrow(HttpException);
    });
  });

  //REQUEST PASSWORD RESET
  describe('requestPasswordReset', () => {
    it('should request password reset and return message', async () => {
      const email = 'test@test.com';
      userService.requestPasswordReset.mockResolvedValue({ message: 'Password reset email sent' });

      const result = await controller.requestPasswordReset(email);

      expect(userService.requestPasswordReset).toHaveBeenCalledWith(email);
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should throw HttpException if request fails', async () => {
      userService.requestPasswordReset.mockRejectedValue(new Error('Service failed'));
      await expect(controller.requestPasswordReset('test@test.com')).rejects.toThrow(HttpException);
    });
  });

  //RESET PASSWORD
  describe('resetPassword', () => {
    it('should reset password and return success message', async () => {
      const token = 'reset-token';
      const newPassword = 'newpass';
      userService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      const result = await controller.resetPassword(token, newPassword);

      expect(userService.resetPassword).toHaveBeenCalledWith(token, newPassword);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw HttpException if reset fails', async () => {
      userService.resetPassword.mockRejectedValue(new Error('Service failed'));
      await expect(controller.resetPassword('token', 'newpass')).rejects.toThrow(HttpException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      userService.logout.mockResolvedValue({message: 'Logged out successfully'});

      // Mock authenticated request
      const req = {user: {sub: 'user-id-123'}};
      const result = await controller.logout(req);

      expect(userService.logout).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({message: 'Logged out successfully'});
    });

    it('should throw HttpException if logout fails', async () => {
      // Mock the service to throw any error
      userService.logout.mockImplementation(() => {
        throw new Error('Service failed');
      });


      const req = { user: { sub: 'user-id-123' } };

      const result = controller.logout(req); // Do NOT await here
      await expect(result).rejects.toThrow(HttpException);
      await expect(result).rejects.toThrow('Error encountered while logging out');
    });

  });
});
