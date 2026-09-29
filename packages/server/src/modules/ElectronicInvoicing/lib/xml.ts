export const xmlEscape = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const xml = (name: string, value: unknown, attrs = '') =>
  `<${name}${attrs}>${xmlEscape(value)}</${name}>`;

export const xmlOptional = (name: string, value: unknown, attrs = '') =>
  value === undefined || value === null || value === '' ? '' : xml(name, value, attrs);

export const money = (value: number) => Number(value || 0).toFixed(2);
export const quantity = (value: number) => Number(value || 0).toFixed(4);

export const price = (value: number) => {
  const fixed = Number(value || 0).toFixed(8);
  return fixed.replace(/0+$/, '').replace(/\.$/, '') || '0';
};
