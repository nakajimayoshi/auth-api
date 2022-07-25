import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    onModuleInit() {
        console.log('The prisma service has been initialized');
    }

    constructor(config: ConfigService) {
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL'),
                }
            }
        });
        }
    cleanDb() {
        return this.$transaction([
            this.user.deleteMany(),
            this.bookmark.deleteMany(),
    ]);
    }
}
