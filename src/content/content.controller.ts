import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateContentDto } from './dto/content-dto';
import { GetAccessToken } from '../decorators/get-access-token.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentLevelEnum } from './constant/content.enum';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
  @Get('contents')
  @ApiOperation({ summary: '전체 콘텐츠 목록 조회' })
  @ApiResponse({ status: 200, description: '강사 목록을 반환함' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getContents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetAccessToken() accessToken: string,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.contentService.getContents(
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 10 : parsedLimit,
    );
  }

  @Post()
  @ApiOperation({ summary: '콘텐츠 생성' })
  @ApiResponse({ status: 200, description: '성공' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'string', enum: Object.values(ContentLevelEnum) },
        instructorId: { type: 'string' },
      },
    },
  })
  async createContent(
    @Body() createContentDto: CreateContentDto,
    @GetAccessToken() accessToken: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contentService.createContent(
      createContentDto,
      accessToken,
      file,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: '콘텐츠 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  @UseInterceptors(FileInterceptor('file'))
  async updateContent(
    @Param('id') id: string,
    @Body() updateContentDto: Partial<CreateContentDto>,
    @GetAccessToken() accessToken: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contentService.updateContent(
      id,
      updateContentDto,
      accessToken,
      file,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '콘텐츠 삭제' })
  @ApiResponse({ status: 200, description: '성공' })
  async deleteContent(
    @Param('id') id: string,
    @GetAccessToken() accessToken: string,
  ) {
    return this.contentService.deleteContent(id, accessToken);
  }
}
