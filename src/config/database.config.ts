import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',  // Changé de 'mysql' à 'postgres'
  host: 'localhost',
  port: 5432,  // Port par défaut de PostgreSQL
  username: 'postgres',  // Utilisateur par défaut PostgreSQL
  password: '',
  database: 'shop_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // À mettre à false en production
  logging: true,
  // Pour PostgreSQL, ajoutez cette option
  uuidExtension: 'pgcrypto',
};