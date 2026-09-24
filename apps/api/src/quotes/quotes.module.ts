import { Module } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module.js';
import { QuotesService } from './quotes.service.js';
import { QuotesController } from './quotes.controller.js';

@Module({
  imports: [PdfModule],
  providers: [QuotesService],
  controllers: [QuotesController]
})
export class QuotesModule { }
