import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/updateSettings.dto';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const data = {
      ...dto,
      ...(dto.maintenanceMessage !== undefined && {
        maintenanceMessage: dto.maintenanceMessage?.trim() || null,
      }),
    };

    return await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
  }
}
