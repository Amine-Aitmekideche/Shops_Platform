import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres', // ou 'mysql', 'mariadb', etc.
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE, // assurez-vous que c'est le bon nom
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.DB_SYNC === 'true',
}));
