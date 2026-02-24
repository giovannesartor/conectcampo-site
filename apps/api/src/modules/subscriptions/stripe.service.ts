/**
 * @deprecated Stripe foi substituído pelo Asaas (AG Digital).
 * Este arquivo é mantido apenas como referência histórica.
 * Use AsaasService para processamento de pagamentos.
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    this.logger.warn('StripeService é obsoleto. Use AsaasService.');
  }
}
