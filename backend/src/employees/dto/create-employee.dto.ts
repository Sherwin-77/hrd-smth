import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EmployeeSex } from '../entities/employee.entity.js';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsEnum(EmployeeSex)
  sex: EmployeeSex;

  @IsDateString()
  birthDate: string;

  @IsDateString()
  joinAt: string;

  @IsOptional()
  @IsDateString()
  leaveAt?: string;
}
