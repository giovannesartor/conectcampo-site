import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidCPF, isValidCNPJ } from '@conectcampo/utils';

/**
 * Valida um documento que pode ser CPF (11 dígitos) ou CNPJ (14 dígitos).
 * Usado em campos como o documento do emitente/credor da CPR.
 */
@ValidatorConstraint({ async: false })
export class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true; // @IsOptional cuida do obrigatório
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return isValidCPF(value);
    if (digits.length === 14) return isValidCNPJ(value);
    return false;
  }

  defaultMessage(): string {
    return 'CPF ou CNPJ inválido';
  }
}

export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfOrCnpjConstraint,
    });
  };
}
