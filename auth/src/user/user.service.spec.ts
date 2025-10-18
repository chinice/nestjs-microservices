import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from "@nestjs/typeorm";
import {BadRequestException, UnauthorizedException} from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { of } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  //REGISTER TEST
  describe('register', () => {
    it('should register a new user', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      userRepository.findOne.mockResolvedValue(null);
      const mockUser = { id: 1, ...dto };
      userRepository.create.mockReturnValue(mockUser as any);
      userRepository.save.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.register(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledTimes(2); // once for user, once for refreshToken
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        emailVerificationToken: result.emailVerificationToken,
      });

    });

    it('should throw BadRequestException if email exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 } as any);
      await expect(
          service.register({
            email: 'test@example.com',
            password: 'pass',
            firstName: 'John',
            lastName: 'Doe',
          }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  //LOGIN TEST
  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 1,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        isEmailVerified: true,
      } as any;

      userRepository.findOne.mockResolvedValue(user);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      userRepository.save.mockResolvedValue(user);

      const result = await service.login(dto as any);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'x', password: 'x' } as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const user = { password: await bcrypt.hash('correct', 10), isEmailVerified: true } as any;
      userRepository.findOne.mockResolvedValue(user);
      await expect(service.login({ email: 'x', password: 'wrong' } as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const user = { password: await bcrypt.hash('pass', 10), isEmailVerified: false } as any;
      userRepository.findOne.mockResolvedValue(user);
      await expect(service.login({ email: 'x', password: 'pass' } as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  // 🔹 LOGOUT
  describe('logout', () => {
    it('should logout successfully', async () => {
      const user = { id: 1, refreshToken: 'token' } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.logout(1);

      expect(user.refreshToken).toBeNull();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.logout(1)).rejects.toThrow(BadRequestException);
    });
  });

  //VERIFY EMAIL TEST
  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const user = { id: 1, isEmailVerified: false, emailVerificationToken: 'token' } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.verifyEmail('token');

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeNull();
      expect(result).toEqual({ message: 'Email successfully verified' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });
  });

  // REQUEST PASSWORD RESET TEST
  describe('requestPasswordReset', () => {
    it('should generate reset token and save', async () => {
      const user = { id: 1 } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.requestPasswordReset('test@example.com');

      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.requestPasswordReset('x')).rejects.toThrow(BadRequestException);
    });
  });

  // RESET PASSWORD TEST
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const user = { id: 1, resetPasswordExpires: new Date(Date.now() + 1000), password: '' } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.resetPassword('token', 'newpass');

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();
    });

    it('should throw BadRequestException if token invalid or expired', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('token', 'newpass')).rejects.toThrow(BadRequestException);
    });
  });
});
