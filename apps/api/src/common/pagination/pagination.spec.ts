import { paginated, resolvePagination, wantsPagination } from './pagination';

describe('pagination helpers', () => {
  describe('resolvePagination', () => {
    it('aplica defaults quando ausente', () => {
      const r = resolvePagination(undefined, undefined, 20);
      expect(r).toEqual({ page: 1, perPage: 20, skip: 0, take: 20 });
    });

    it('calcula skip a partir de page/perPage', () => {
      const r = resolvePagination(3, 10);
      expect(r).toEqual({ page: 3, perPage: 10, skip: 20, take: 10 });
    });

    it('limita perPage a 100 e mínimo 1', () => {
      expect(resolvePagination(1, 999).perPage).toBe(100);
      expect(resolvePagination(1, 0, 20).perPage).toBe(20);
      expect(resolvePagination(0, 5).page).toBe(1);
    });
  });

  describe('paginated', () => {
    it('monta envelope com totalPages arredondado para cima', () => {
      const r = paginated([1, 2], 25, 1, 10);
      expect(r.data).toEqual([1, 2]);
      expect(r.meta).toEqual({ total: 25, page: 1, perPage: 10, totalPages: 3 });
    });

    it('totalPages nunca é menor que 1', () => {
      expect(paginated([], 0, 1, 10).meta.totalPages).toBe(1);
    });
  });

  describe('wantsPagination', () => {
    it('true quando page ou perPage informados', () => {
      expect(wantsPagination(1, undefined)).toBe(true);
      expect(wantsPagination(undefined, 10)).toBe(true);
    });
    it('false quando nenhum informado', () => {
      expect(wantsPagination(undefined, undefined)).toBe(false);
    });
  });
});
