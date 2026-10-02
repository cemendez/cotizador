import { ValidateIf } from 'class-validator';

export const OptionalNotNull = () => ValidateIf((_object, value) => value !== undefined);