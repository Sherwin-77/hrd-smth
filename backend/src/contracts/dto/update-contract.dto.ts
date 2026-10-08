import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContractType } from '../entities/contract.entity.js';

/**
 * `employeeId`, `status`, and `signedDate` are managed through dedicated
 * flows (create pins the employee and `pending` status, `sign` / `decline`
 * / `void` drive status and the signed date), so they are intentionally
 * not updatable here.
 */
export class UpdateContractDto {
  @Expose({ name: 'type' })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @Expose({ name: 'title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @Expose({ name: 'start_date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Expose({ name: 'end_date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
