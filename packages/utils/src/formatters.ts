/**
 * Formata valor em BRL
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  );
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Formata hectares
 */
export function formatArea(hectares: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(hectares)} ha`;
}

/**
 * Formata porcentagem
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata data BR
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}
