// undefined — пустой фильтр; null — неверный ввод; строка — API EUR с 2 знаками.
export function catalogPrice(value: string): string | null | undefined {
  const text = value.trim().replace(',', '.');
  if (!text) return undefined;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) return null;
  const [euros, cents = ''] = text.split('.');
  return `${Number(euros)}.${cents.padEnd(2, '0')}`;
}
