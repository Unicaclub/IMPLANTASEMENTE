import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'copalite',
  password: process.env.DB_PASSWORD ?? (() => { throw new Error('DB_PASSWORD env var is required'); })(),
  database: process.env.DB_DATABASE || 'copalite_db',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
