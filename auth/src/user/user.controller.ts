import {Body, Controller, HttpException, HttpStatus, Inject, Post, Req, UseGuards} from '@nestjs/common';
import { UserService } from "./user.service";
import { RegisterDto } from "./dto/register.dto";
import {LoginDto} from "./dto/login.dto";
import {ClientProxy} from "@nestjs/microservices";

@Controller('auth')
export class UserController {
    constructor(
        private userService: UserService,
        @Inject('USER_SERVICE') private readonly client: ClientProxy
    ) {}

    /**
     * Check my Rabbit MQ connection
     */
    async onModuleInit() {
        try {
            await this.client.connect();
            console.log('✅ RabbitMQ Client connected successfully!');
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ:', error.message);
        }
    }

    /**
     * Function to log out
     * @param data
     */
    @Post('register')
    async register(@Body() data: RegisterDto) {
        try {
            const result = await this.userService.register(data);
            const payload = {
                to: data.email,
                templateId: 41871910,
                templateModel: {
                    name: data.firstName,
                    link: `${process.env.BASE_URL}/api/auth/verify?token=${result.emailVerificationToken}`
                }
            };
            //Send verification email to the email service to dispatch
            this.client.emit('send_email', payload);
            return { accessToken: result.accessToken, refreshToken: result.refreshToken };
        } catch (error) {
            throw new HttpException(
                error.message,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Function to log in
     * @param data
     */
    @Post('login')
    async login(@Body() data: LoginDto) {
        try {
            return await this.userService.login(data);
        } catch (error) {
            throw new HttpException(
                error.message,
                HttpStatus.UNAUTHORIZED,
            );
        }
    }

    /**
     * Function to verify user email
     *
     * @param token
     */
    @Post('verify-email')
    async verifyEmail(@Body('token') token: string) {
        try {
            return await this.userService.verifyEmail(token);
        } catch (error) {
            throw new HttpException(
                'Error encountered while trying to verify email',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Function to send password reset email
     *
     * @param email
     */
    @Post('request-password-reset')
    async requestPasswordReset(@Body('email') email: string) {
        try {
            const result = await this.userService.requestPasswordReset(email);
            //payload to send email
            const payload = {
                to: result.data.user.email,
                templateId: 41920429,
                templateModel: {
                    name: result.data.user.firstName,
                    link: `${process.env.BASE_URL}/api/auth/password-reset?token=${result.data.token}`
                }
            };
            //Send verification email to the email service to dispatch
            this.client.emit('send_email', payload);

            return { message: result.message };
        } catch (error) {
            throw new HttpException(
                'Error encountered while requesting password reset',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Function to reset a password
     * @param token
     * @param newPassword
     */
    @Post('reset-password')
    async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
        try {
            return await this.userService.resetPassword(token, newPassword);
        } catch (error) {
            throw new HttpException(
                'Error encountered while resetting password',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Log out function
     *
     * @param req
     */
    @Post('logout')
    async logout(@Req() req: any) {
        try {
            // req.user.sub comes from validated JWT payload
            return await this.userService.logout(req.user.sub);
        } catch (error) {
            throw new HttpException(
                'Error encountered while logging out',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
