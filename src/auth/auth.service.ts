import {ForbiddenException, Injectable} from '@nestjs/common';
import  { PrismaService } from '../prisma-module/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {

    }

   async signup(dto: AuthDto) {
        // generate the password hash
        const hash = await argon.hash(dto.password);
        // save the new user in the db
       try {
           const user = await this.prisma.user.create({
               data: {
                   email: dto.email,
                   hash,
               },
           });
           
       } catch(e) {
           if (e instanceof PrismaClientKnownRequestError) {
               if (e.code === 'P2002') {
                   throw new ForbiddenException('Credentials Taken');
               }
           }
           throw e;
       }
    }

    async signin(dto: AuthDto) {

        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if(!user)
            throw new ForbiddenException('Credentials Incorrect');
        // if the user does not exit, throw exception

        // compare password
        const pwMatches = await argon.verify(user.hash, dto.password);

        // if password incorrect, throw exception
        if(!pwMatches)
            throw new ForbiddenException('Credentials Incorrect')

        return this.signToken(user.id, user.email);
    }

    signToken(userId: number, email: string): Promise<string> {
        const payload = {
            sub: userId,
            email
        }
        const secret = this.config.get('JWT_SECRET');

        return this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret,
        })
    }
}
