import { MarketplaceOrdersService } from './marketplace-orders.service';

describe('MarketplaceOrdersService.computeFees', () => {
  const service = new MarketplaceOrdersService(null as any, null as any, null as any);

  it('aplica 1% total dividido em 0,5% para cada parte', () => {
    const r = service.computeFees(1000);
    expect(r.subtotal).toBe(1000);
    expect(r.buyerFee).toBe(5);
    expect(r.sellerFee).toBe(5);
    expect(r.platformFee).toBe(10);
    expect(r.buyerTotal).toBe(1005);
    expect(r.sellerNet).toBe(995);
    expect(r.feeRatePct).toBe(1);
    expect(r.partyRatePct).toBe(0.5);
  });

  it('arredonda para 2 casas decimais', () => {
    const r = service.computeFees(385.5); // 128,50 * 3
    expect(r.buyerFee).toBeCloseTo(1.93, 2);
    expect(r.buyerTotal).toBeCloseTo(387.43, 2);
    expect(r.sellerNet).toBeCloseTo(383.57, 2);
  });

  it('trata subtotal zero sem erro', () => {
    const r = service.computeFees(0);
    expect(r.platformFee).toBe(0);
    expect(r.buyerTotal).toBe(0);
    expect(r.sellerNet).toBe(0);
  });
});
