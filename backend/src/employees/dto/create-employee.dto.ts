import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmployeeSex } from '../entities/employee.entity.js';
import { Expose } from 'class-transformer';

export class CreateEmployeeDto {
  @Expose({ name: 'name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Expose({ name: 'email' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Expose({ name: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @Expose({ name: 'phone_number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber: string;

  @Expose({ name: 'address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @Expose({ name: 'sex' })
  @IsEnum(EmployeeSex)
  sex: EmployeeSex;

  @Expose({ name: 'birth_date' })
  @IsDateString()
  birthDate: string;

  @Expose({ name: 'join_at' })
  @IsDateString()
  joinAt: string;

  @Expose({ name: 'leave_at' })
  @IsOptional()
  @IsDateString()
  leaveAt?: string;
}
