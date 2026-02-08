// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres', // ou 'mysql', 'sqlite', etc. selon votre base de données
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'shop_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // À mettre à false en production
  logging: true,
};