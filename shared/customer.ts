export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (!/^\d{11}$/.test(cpf) || /^([0-9])\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index += 1) sum += Number(cpf[index]) * (10 - index);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index += 1) sum += Number(cpf[index]) * (11 - index);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  const now = new Date();
  const age = now.getUTCFullYear() - date.getUTCFullYear() - ((now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) ? 1 : 0);
  return !Number.isNaN(date.getTime()) && date <= now && age >= 18 && age <= 120;
}
