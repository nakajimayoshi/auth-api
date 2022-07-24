import {ForbiddenException, Injectable} from '@nestjs/common';
import  { PrismaService } from '../prisma-module/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {

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

           delete user.hash // prevents password hash from being printed serverside


           return user  // return the saved user
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

        // send back the user
        delete user.hash;
        return user;
    }
}
