import { DataSource } from 'typeorm';
require('dotenv').config();

export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  migrations: [__dirname + '/migrations/*.js'],
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
});
