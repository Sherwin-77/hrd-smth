import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @Expose({ name: 'current_password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword: string;

  @Expose({ name: 'new_password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
