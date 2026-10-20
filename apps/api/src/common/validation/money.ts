import { applyDecorators } from '@nestjs/common';
import { IsNumber, Max, Min } from 'class-validator';

export const Money = () => applyDecorators(IsNumber({ maxDecimalPlaces: 2 }), Min(0), Max(9_999_999_999));