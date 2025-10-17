import {Body, Controller, HttpException, HttpStatus, Post, Req, UseGuards} from '@nestjs/common';
import { UserService } from "./user.service";
import { RegisterDto } from "./dto/register.dto";
import {LoginDto} from "./dto/login.dto";

@Controller('auth')
export class UserController {
    constructor(private userService: UserService) {}

    /**
     * Function to log out
     * @param data
     */
    @Post('register')
    async register(@Body() data: RegisterDto) {
        try {
            return await this.userService.register(data);
        } catch (error) {
            throw new HttpException(
                'Error encountered while registering',
                HttpStatus.INTERNAL_SERVER_ERROR,
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
                'Error encountered during log in',
                HttpStatus.INTERNAL_SERVER_ERROR,
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
            return await this.userService.requestPasswordReset(email);
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
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ) {
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
            return this.userService.logout(req.user.sub);
        } catch (error) {
            throw new HttpException(
                'Error encountered while logging out',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
