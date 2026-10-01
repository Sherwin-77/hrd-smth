import { Injectable } from '@nestjs/common';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';

@Injectable()
export class PayrollsService {
  create(createPayrollDto: CreatePayrollDto) {
    return 'This action adds a new payroll';
  }

  findAll() {
    return `This action returns all payrolls`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payroll`;
  }

  update(id: number, updatePayrollDto: UpdatePayrollDto) {
    return `This action updates a #${id} payroll`;
  }

  remove(id: number) {
    return `This action removes a #${id} payroll`;
  }
}
