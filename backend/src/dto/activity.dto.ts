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
import { ActivityStatus, FeeType } from '../entities/activity.entity';

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
  location: string;

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

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsEnum(FeeType)
  fee_type: FeeType;

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
  location?: string;

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
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsEnum(FeeType)
  fee_type?: FeeType;

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
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsEnum(FeeType)
  fee_type?: FeeType;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' | 'start_time' | 'participants';
}

export class CreateCommentDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
