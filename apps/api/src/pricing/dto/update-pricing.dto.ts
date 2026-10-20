import { IsNumber, Max, Min } from 'class-validator';
import { Money } from '../../common/validation/money.js';

export class UpdatePricingDto {
    @Money()
    monthlyNetIncome!: number;

    @Money()
    costEquipment!: number;

    @Money()
    costTools!: number;

    @Money()
    costOffice!: number;

    @Money()
    costTransport!: number;

    @Money()
    costServices!: number;

    @Money()
    costAdvertising!: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(200)
    marginPercent!: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(90)
    taxReservePercent!: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(400)
    billableHoursPerMonth!: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(1_000_000)
    hourlyRate!: number;
}