const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const MINIMUM_LENGTHS: Record<string, number> = {
  JWT_SECRET: 32,
  JWT_REFRESH_SECRET: 32,
};

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
      continue;
    }
    const minLength = MINIMUM_LENGTHS[key];
    if (minLength && value.length < minLength && isProduction) {
      invalid.push(`${key} (minimo ${minLength} chars, atual: ${value.length})`);
    }
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    invalid.push('JWT_SECRET e JWT_REFRESH_SECRET sao iguais — devem ser diferentes');
  }

  // Warn if CREDENTIALS_ENCRYPTION_KEY not set (falls back to JWT_SECRET)
  if (isProduction && !process.env.CREDENTIALS_ENCRYPTION_KEY) {
    console.warn('[WARN] CREDENTIALS_ENCRYPTION_KEY nao definida — usando JWT_SECRET como fallback. Recomendado definir chave separada.');
  }

  if (missing.length > 0 || invalid.length > 0) {
    if (missing.length > 0) {
      console.error('Variaveis de ambiente obrigatorias faltando:');
      missing.forEach(v => console.error(`   - ${v}`));
    }
    if (invalid.length > 0) {
      console.error('Variaveis de ambiente invalidas:');
      invalid.forEach(v => console.error(`   - ${v}`));
    }

    if (isProduction) {
      console.error('\nStartup abortado por configuracao invalida.');
      process.exit(1);
    } else {
      console.warn('\n[WARN] Configuracao incompleta — aceitavel apenas em desenvolvimento.');
    }
  } else {
    console.log('Variaveis de ambiente validadas.');
  }
}
