require('dotenv').config();
import { DataSource, DataSourceOptions } from "typeorm";

const config: DataSourceOptions = {
  type: (process.env.DB_TYPE || 'postgres') as any,
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'secretpassword',
  database: process.env.DB_NAME || 'mydb',
  synchronize: true,
  logging: false,
  migrations: [
    __dirname + '/migration/**.ts'
  ],
  entities: [
    __dirname + '/types/model/**/*.{ts,js}'
  ]
};

export const AppDataSource = new DataSource(config);
