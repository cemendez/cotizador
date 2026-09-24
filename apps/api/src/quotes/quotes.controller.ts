import {
    Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, StreamableFile
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto.js';
import { UpdateQuoteDto } from './dto/update-quote.dto.js';
import { QuotesService } from './quotes.service.js';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotes: QuotesService) { }

    @Get()
    findAll(@CurrentUser() user: AuthUser, @Query() query: ListQuotesQueryDto) {
        return this.quotes.findAll(user.id, query);
    }

    @Get(':id')
    findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return this.quotes.findOne(user.id, id);
    }

    @Post()
    create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuoteDto) {
        return this.quotes.create(user.id, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateQuoteDto,
    ) {
        return this.quotes.update(user.id, id, dto);
    }

    @Patch(':id/status')
    changeStatus(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeStatusDto,
    ) {
        return this.quotes.changeStatus(user.id, id, dto.status);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return this.quotes.remove(user.id, id);
    }

    @Get(':id/pdf')
    async quotePdf(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        const { buffer, filename } = await this.quotes.generatePdf(user.id, id, 'quote');
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `inline; filename="${filename}"`,
        });
    }

    @Get(':id/contract')
    async contractPdf(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        const { buffer, filename } = await this.quotes.generatePdf(user.id, id, 'contract');
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `inline; filename="${filename}"`, // Cambiar disposition a attachment para forzar descarga en el frontend
        });
    }
}