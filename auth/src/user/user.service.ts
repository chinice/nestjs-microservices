import {BadRequestException, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "./user.entity";
import {Repository} from "typeorm";
import {JwtService} from "@nestjs/jwt";
import {RegisterDto} from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {LoginDto} from "./dto/login.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private jwtService: JwtService
    ) {}

    /**
     * Function to register a user
     *
     * @param registerDto
     */
    async register(registerDto: RegisterDto) {
        const { email, password, firstName, lastName } = registerDto;
        //check if user already exist in the database
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if(existingUser) throw new BadRequestException('Email already exists');

        //Encrypt the user password
        const hashedPassword = await bcrypt.hash(password, 12);
        //Generate the email verification token
        const emailVerificationToken = randomBytes(32).toString("hex");

        //Create new user
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            emailVerificationToken
        });

        await this.userRepository.save(user);

        const payload = { sub: user.id, email: user.email };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await this.userRepository.save(user);

        return { accessToken, refreshToken, emailVerificationToken };
    }

    /**
     * Function to log in a user
     *
     * @param loginDto
     */
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        //Check is user exist
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        //Check if the password matches the password entered
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        //Check if the user email is verified
        if (!user.isEmailVerified) throw new UnauthorizedException('Email not verified');

        //Generate and return token
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await this.userRepository.save(user);

        return { accessToken, refreshToken };
    }

    /**
     * Function to log out
     * @param userId
     */
    async logout(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        user.refreshToken = null; // assuming you store it
        await this.userRepository.save(user);

        return { message: 'Logged out successfully' };
    }

    /**
     * Function to verify a user email address
     *
     * @param token
     */
    async verifyEmail(token: string) {
        const user = await this.userRepository.findOne({ where: { emailVerificationToken: token } });
        if (!user) throw new BadRequestException('Invalid or expired token');

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        await this.userRepository.save(user);

        return { message: 'Email successfully verified' };
    }

    /**
     * Function to send password reset email
     *
     * @param email
     */
    async requestPasswordReset(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new BadRequestException('User not found');

        const token = randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await this.userRepository.save(user);



        return { message: 'Password reset email sent' };
    }

    /**
     * Function to reset a user password
     * @param token
     * @param newPassword
     */
    async resetPassword(token: string, newPassword: string) {
        const user = await this.userRepository.findOne({
            where: { resetPasswordToken: token },
        });

        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Invalid or expired token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await this.userRepository.save(user);

        return { message: 'Password reset successfully' };
    }
}
