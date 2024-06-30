import { Controller, Post, Body, Get, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

import { GetUser, GetRawHeaders, RoleProtected, Auth } from './decorators/index';

import { User } from './entities/user.entity';

import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { ValidRoles } from './interfaces';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    

    @Post('register')
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.authService.create(createUserDto);
    }


    @Post('login')
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }


    @Get('check-status')
    @Auth()
    checkAuthStatus(
        @GetUser() user: User
    ) {
        return this.authService.checkAuthStatus(user);
    }


    @Get('private')
    @UseGuards(AuthGuard())
    testingPrivateRoute(
        @GetUser() user: User,
        @GetUser('email') userEmail: string,
        @GetRawHeaders() rawHeaders: string[]
    ) {
        return {
            ok: true,
            message: "Hola mundo",
            user,
            userEmail,
            rawHeaders
        }
    }


    //@SetMetadata('roles', ['admin', 'user'])
    @Get('private2')
    @RoleProtected(ValidRoles.admin, ValidRoles.user)
    @UseGuards(AuthGuard(), UserRoleGuard)
    testingPrivateRoute2(
        @GetUser() user: User
    ) {
        return {
            ok: true,
            user
        }
    }


    @Get('private3')
    @Auth()
    testingPrivateRoute3(
        @GetUser() user: User
    ) {
        return {
            ok: true,
            user
        }
    }
}
