// src/scripts/create-super-admin.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

async function createSuperAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const superAdminData = {
    email: 'superadmin@shop.com',
    password: await bcrypt.hash('admin123', 10),
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin' as any,
  };
  
  try {
    await usersService.create(superAdminData as User);
    console.log('✅ Super admin created successfully');
  } catch (error) {
    console.log('❌ Error creating super admin:', error.message);
  }

  await app.close();
}

createSuperAdmin();