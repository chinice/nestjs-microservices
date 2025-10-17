import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from "@nestjs/typeorm";
import {BadRequestException, UnauthorizedException} from "@nestjs/common";
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let mailerService: jest.Mocked<MailerService>;

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
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => jest.clearAllMocks());

  //REGISTER TEST
  describe('register', () => {
    it('should register a new user and send a verification email', async () => {
      const dto = { email: 'test@example.com', password: '123456', firstName: 'John', lastName: 'Doe' };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(dto as any);
      userRepository.save.mockResolvedValue({ id: 1, ...dto } as unknown as User);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(mailerService.sendMail).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'jwt-token', refreshToken: 'jwt-token' });
    });

    it('should throw if email already exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: '123456',
        firstName: 'John',
        lastName: 'Doe'
      } as unknown as User);

      await expect(
          service.register({ email: 'test@example.com', password: '123456' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  //LOGIN TEST
  describe('login', () => {
    it('should login successfully', async () => {
      const dto = { email: 'user@test.com', password: '123456' };
      const user = {
        id: 1,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        isEmailVerified: true,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(dto);
      expect(result).toEqual({ accessToken: 'jwt-token', refreshToken: 'jwt-token' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'no@test.com', password: '123456' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const user = { id: 1, email: 'test@test.com', password: await bcrypt.hash('wrong', 10), isEmailVerified: true } as User;
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.login({ email: user.email, password: '123456' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if email not verified', async () => {
      const user = { id: 1, email: 'test@test.com', password: await bcrypt.hash('123456', 10), isEmailVerified: false } as User;
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.login({ email: user.email, password: '123456' })).rejects.toThrow(UnauthorizedException);
    });
  });

  //VERIFY EMAIL TEST
  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const user = { id: 1, email: 'user@test.com', emailVerificationToken: 'token', isEmailVerified: false } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, isEmailVerified: true });

      const result = await service.verifyEmail('token');
      expect(result).toEqual({ message: 'Email successfully verified' });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw if token is invalid', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('wrong')).rejects.toThrow(BadRequestException);
    });
  });

  // REQUEST PASSWORD RESET TEST
  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      const user = { id: 1, email: 'user@test.com' } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.requestPasswordReset('user@test.com');
      expect(mailerService.sendMail).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should throw if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.requestPasswordReset('no@test.com')).rejects.toThrow(BadRequestException);
    });
  });

  // RESET PASSWORD TEST
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const user = {
        id: 1,
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.resetPassword('token', 'newpassword');
      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw if token invalid or expired', async () => {
      const user = {
        id: 1,
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(Date.now() - 3600000), // expired
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      await expect(service.resetPassword('token', 'newpass')).rejects.toThrow(BadRequestException);
    });
  });

  // 🔹 LOGOUT
  describe('logout', () => {
    it('should remove the refresh token and return success message', async () => {
      const mockUser = { id: '123', refreshToken: 'token123' } as any;
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, refreshToken: null });

      const result = await service.logout(123);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 123 } });
      expect(userRepository.save).toHaveBeenCalledWith({ ...mockUser, refreshToken: null });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.logout(9999)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 9999 } });
    });
  });
});
