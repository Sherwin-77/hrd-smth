import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ContractType } from '../entities/contract.entity.js';

export class CreateContractDto {
  @Expose({ name: 'employee_id' })
  @IsUUID()
  employeeId: string;

  @Expose({ name: 'type' })
  @IsEnum(ContractType)
  type: ContractType;

  @Expose({ name: 'title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Expose({ name: 'start_date' })
  @IsDateString()
  startDate: string;

  @Expose({ name: 'end_date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
