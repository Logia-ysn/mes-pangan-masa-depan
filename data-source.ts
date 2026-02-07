require('dotenv').config();
import { DataSource, DataSourceOptions } from "typeorm";

const config: DataSourceOptions = {
  type: (process.env.DB_TYPE || 'postgres') as any,
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'secretpassword',
  database: process.env.DB_NAME || 'mydb',
  synchronize: process.env.NODE_ENV !== 'production', // CRITICAL: Disable in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Required for Railway/Heroku
  logging: false,
  migrations: [
    __dirname + '/migration/**.ts'
  ],
  entities: [
    __dirname + '/types/model/**/*.{ts,js}'
  ]
};

export const AppDataSource = new DataSource(config);
