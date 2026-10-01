import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EmployeesModule } from './employees/employees.module.js';
import { PayrollsModule } from './payrolls/payrolls.module.js';
import { PayrollComponentsModule } from './payroll-components/payroll-components.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_NAME || 'hrd',
      autoLoadEntities: true,
      synchronize: false,
    }),
    EmployeesModule,
    PayrollsModule,
    PayrollComponentsModule,
  ],
})
export class AppModule {}
