import { Module } from '@nestjs/common';
import { PrismaClientModule } from './prisma-client/prisma-client.module';

@Module({
  imports: [PrismaClientModule],
})
export class AppModule {}
