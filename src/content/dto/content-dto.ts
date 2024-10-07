import { ContentLevelEnum } from '../constant/content.enum';

export class CreateContentDto {
  title: string;
  level: ContentLevelEnum;
  instructorId: string;
  description: string;
}
