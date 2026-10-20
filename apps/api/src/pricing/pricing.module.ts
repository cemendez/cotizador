import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service.js';
import { PricingController } from './pricing.controller.js';

@Module({
  providers: [PricingService],
  controllers: [PricingController]
})
export class PricingModule {}
