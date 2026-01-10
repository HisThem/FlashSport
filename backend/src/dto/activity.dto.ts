import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUrl,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityStatus } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  cover_image_url?: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsDateString()
  registration_deadline: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  max_participants: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fee_amount: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  category_id: number;

  @IsOptional()
  @IsUrl({}, { each: true })
  image_urls?: string[];
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  cover_image_url?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  province?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsDateString()
  registration_deadline?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  max_participants?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fee_amount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsUrl({}, { each: true })
  image_urls?: string[];
}

export class ActivityQueryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  organizer_id?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' | 'start_time' | 'participants';

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
