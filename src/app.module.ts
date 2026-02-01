import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, StoresModule],
})
export class AppModule {}
