import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EmployeesModule } from './employees/employees.module.js';
import { PayrollsModule } from './payrolls/payrolls.module.js';
import { PayslipsModule } from './payslips/payslips.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ContractsModule } from './contracts/contracts.module.js';

function sessionAbsoluteTtl(): `${number}d` {
  const days = Number(process.env.SESSION_TTL_DAYS ?? '30');
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;
  return `${safeDays}d`;
}

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    AuthenticationModule.forRoot({
      session: {
        absoluteTtl: sessionAbsoluteTtl(),
        idleTtl: 0,
      },
    }),
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
    AuthModule,
    EmployeesModule,
    PayrollsModule,
    PayslipsModule,
    ContractsModule,
  ],
})
export class AppModule {}
