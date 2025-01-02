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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateContentDto } from './dto/content-dto';
import { GetAccessToken } from '../decorators/get-access-token.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentLevelEnum } from './constant/content.enum';
import CheckPendingUserGuard from '../guard/checkPendingUser.guard';

@Controller('content')
// @UseGuards(JwtAuthGuard)
@UseGuards(CheckPendingUserGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
  @Get('contents')
  @ApiOperation({ summary: '내강사 콘텐츠 목록 조회' })
  @ApiResponse({ status: 200, description: '내강사 콘텐츠 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getContents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetAccessToken() accessToken: string,
    @Query('instructorId') instructorId?: string,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.contentService.getContents(
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 10 : parsedLimit,
      accessToken,
      instructorId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '특정컨텐츠 진입전 pose 데이터 조회' })
  async getContentById(@Param('id') id: string) {
    return this.contentService.getContentById(id);
  }

  @Post()
  @ApiOperation({ summary: '콘텐츠 생성' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'string', enum: Object.values(ContentLevelEnum) },
      },
    },
  })
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     fileFilter: imageFileFilter,
  //     limits: {
  //       fileSize: 1024 * 1024 * 5, // 5MB
  //     },
  //   }),
  // )
  @UseInterceptors(FileInterceptor('file'))
  async createContent(
    @UploadedFile() file: Express.Multer.File,
    @Body() createContentDto: CreateContentDto,
    @GetAccessToken() accessToken: string,
  ) {
    return this.contentService.createContent(
      file,
      createContentDto,
      accessToken,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: '콘텐츠 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     fileFilter: imageFileFilter,
  //     limits: {
  //       fileSize: 1024 * 1024 * 5, // 5MB
  //     },
  //   }),
  // )
  @UseInterceptors(FileInterceptor('file'))
  async updateContent(
    @Param('id') id: string,
    @Body() updateContentDto: Partial<CreateContentDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contentService.updateContent(id, updateContentDto, file);
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
