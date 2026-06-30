import { ApplicationCategory, ApplicationStatus } from "@prisma/client";
import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsEnum(ApplicationCategory)
  category!: ApplicationCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2" })
  amount?: string;
}

export class UpdateApplicationDto extends CreateApplicationDto {}

export class TransitionCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ListQueueQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
