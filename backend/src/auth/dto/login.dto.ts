import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @Expose({ name: 'email' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Expose({ name: 'password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
