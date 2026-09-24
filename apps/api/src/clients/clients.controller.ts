import {
    Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { ListClientsQueryDto } from './dto/list-clients-query.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@Controller('clients')
export class ClientsController {
    constructor(private readonly clients: ClientsService) { }

    @Get()
    findAll(@CurrentUser() user: AuthUser, @Query() query: ListClientsQueryDto) {
        return this.clients.findAll(user.id, query);
    }

    @Get(':id')
    findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return this.clients.findOne(user.id, id);
    }

    @Post()
    create(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
        return this.clients.create(user.id, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateClientDto,
    ) {
        return this.clients.update(user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return this.clients.remove(user.id, id);
    }
}