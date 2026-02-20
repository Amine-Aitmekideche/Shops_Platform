// src/users/dto/create-user.dto.ts
// export class CreateUserDto {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
//   role?: 'super_admin' | 'admin' | 'seller' | 'customer';
// }
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
  
}