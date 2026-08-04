import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ErrorCode } from '../common/constants/error-codes';

// multer ships with @nestjs/platform-express; avoid @types/multer dep
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer') as {
  diskStorage: (opts: {
    destination: (
      req: unknown,
      file: { originalname?: string },
      cb: (e: Error | null, dest: string) => void,
    ) => void;
    filename: (
      req: unknown,
      file: { originalname?: string },
      cb: (e: Error | null, name: string) => void,
    ) => void;
  }) => unknown;
};

const UPLOAD_DIR = join(process.cwd(), 'uploads');

function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

type Uploaded = {
  filename: string;
  size: number;
  mimetype: string;
};

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiOperation({ summary: '上传图片（本地磁盘，U4 证件图）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
          const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
            ? ext
            : '.jpg';
          cb(null, `${randomUUID()}${safe}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          cb(
            new BadRequestException({
              code: ErrorCode.BAD_REQUEST,
              message: '仅支持图片文件',
            }) as unknown as Error,
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Uploaded) {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '请选择图片文件',
      });
    }
    const url = `/uploads/${file.filename}`;
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
