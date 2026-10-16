import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../generated/prisma/enums.js';
import { MIN_PASSWORD_LENGTH } from '../domain/password.js';

/** POST /users: a staff account of the lab (A-81). */
export class CreateUserDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** Initial password, handed over by the administrator; the user can't change it yet. */
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(200)
  password!: string;
}

/** PATCH /users/:id. */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** POST /users/:id/password: set a new password and sign the user out everywhere. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(200)
  password!: string;
}
