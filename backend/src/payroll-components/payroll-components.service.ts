import { Injectable } from '@nestjs/common';
import { CreatePayrollComponentDto } from './dto/create-payroll-component.dto.js';
import { UpdatePayrollComponentDto } from './dto/update-payroll-component.dto.js';

@Injectable()
export class PayrollComponentsService {
  create(createPayrollComponentDto: CreatePayrollComponentDto) {
    return 'This action adds a new payrollComponent';
  }

  findAll() {
    return `This action returns all payrollComponents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payrollComponent`;
  }

  update(id: number, updatePayrollComponentDto: UpdatePayrollComponentDto) {
    return `This action updates a #${id} payrollComponent`;
  }

  remove(id: number) {
    return `This action removes a #${id} payrollComponent`;
  }
}
