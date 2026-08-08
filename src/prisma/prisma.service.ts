import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const url = new URL(process.env.DATABASE_URL as string);
    url.searchParams.set('sslmode', 'no-verify');

    const adapter = new PrismaPg({
      connectionString: url.toString(),
    });
    super({ adapter });
  }
}
