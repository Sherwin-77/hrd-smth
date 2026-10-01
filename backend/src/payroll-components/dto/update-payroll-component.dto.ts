import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollComponentDto } from './create-payroll-component.dto.js';

export class UpdatePayrollComponentDto extends PartialType(CreatePayrollComponentDto) {}
