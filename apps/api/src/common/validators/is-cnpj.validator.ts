import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidCNPJ } from '@conectcampo/utils';

@ValidatorConstraint({ async: false })
export class IsCNPJConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true; // @IsOptional handles required check
    return isValidCNPJ(value);
  }

  defaultMessage(): string {
    return 'CNPJ inválido';
  }
}

export function IsCNPJ(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCNPJConstraint,
    });
  };
}
