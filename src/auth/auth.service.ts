import { BadGatewayException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './dto/index';

import { User } from './entities/user.entity';

import { JwtPayload } from './interfaces/jwt-payload.interface';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService
    ) {}


    async create(createUserDto: CreateUserDto) {
        try {
            const { password, ...userData } = createUserDto;

            const user = this.userRepository.create({
                ...userData,
                password: hashSync(password, 10)
            });

            await this.userRepository.save(user);
            delete user.password;

            return {
                ...user,
                token: this.getJwtToken({ id: user.id })
            };
        } catch(error) {
            this.handleDBErrors(error);
        }
    }


    async login (loginUserDto: LoginUserDto) {
        const { password, email } = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: { email: true, password: true, id: true }
        });

        if (!user) {
            throw new UnauthorizedException('Credentials are not valid');
        }

        if (!compareSync(password, user.password)) {
            throw new UnauthorizedException('Credentials are not valid');
        }

        return {
            ...user,
            token: this.getJwtToken({ id: user.id })
        };
    }


    checkAuthStatus(user: User) {
        return {
            ...user,
            token: this.getJwtToken({ id: user.id })
        };
    }


    private getJwtToken(payload: JwtPayload) {
        const token = this.jwtService.sign(payload);
        return token;
    }


    private handleDBErrors (error: any): never {
        if (error.code === '23505') {
            throw new BadGatewayException(error.detail);
        }

        console.log(error);

        throw new InternalServerErrorException('Please check server logs');
    }
}
