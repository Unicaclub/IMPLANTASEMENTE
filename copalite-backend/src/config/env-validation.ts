const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const REQUIRED_IN_PRODUCTION = ['CREDENTIALS_ENCRYPTION_KEY'];

const MINIMUM_LENGTHS: Record<string, number> = {
  JWT_SECRET: 32,
  JWT_REFRESH_SECRET: 32,
  CREDENTIALS_ENCRYPTION_KEY: 32,
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

  // Production-only required vars
  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
        continue;
      }
      const minLength = MINIMUM_LENGTHS[key];
      if (minLength && value.length < minLength) {
        invalid.push(`${key} (minimo ${minLength} chars, atual: ${value.length})`);
      }
    }
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    invalid.push('JWT_SECRET e JWT_REFRESH_SECRET sao iguais — devem ser diferentes');
  }

  // CREDENTIALS_ENCRYPTION_KEY checked above via REQUIRED_IN_PRODUCTION

  if (missing.length > 0 || invalid.length > 0) {
    if (missing.length > 0) {
      console.error('Variaveis de ambiente obrigatorias faltando:');
      missing.forEach((v) => console.error(`   - ${v}`));
    }
    if (invalid.length > 0) {
      console.error('Variaveis de ambiente invalidas:');
      invalid.forEach((v) => console.error(`   - ${v}`));
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
