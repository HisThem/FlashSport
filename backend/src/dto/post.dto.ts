import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUrl,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUrl()
  cover_image_url?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  activity_id?: number;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsUrl()
  cover_image_url?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  activity_id?: number;
}

export class PostQueryDto {
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  activity_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  author_id?: number;
}
