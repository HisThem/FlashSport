import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  Length,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsNumber()
  @Min(1)
  activity_id: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content?: string;
}

export class CommentQueryDto {
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(1)
  activity_id: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
