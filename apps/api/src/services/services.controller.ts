import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServicesService } from './services.service.js';

@Controller('services')
export class ServicesController {
    constructor(private readonly services: ServicesService) { }

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.services.findAll(user.id);
    }

    @Post()
    create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
        return this.services.create(user.id, dto);
    }

    @Post('defaults')
    seedDefaults(@CurrentUser() user: AuthUser) {
        return this.services.seedDefaults(user.id);
    }

    @Patch(':id')
    update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
        return this.services.update(user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return this.services.remove(user.id, id);
    }
}