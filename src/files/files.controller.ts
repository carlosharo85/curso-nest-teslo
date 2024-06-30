import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags } from '@nestjs/swagger';

import { FilesService } from './files.service';

import { fileFilter, fileNamer } from './helpers/';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';


@ApiTags('Files')
@Controller('files')
export class FilesController {

    constructor(
        private readonly filesService: FilesService,
        private readonly configService: ConfigService
    ) {}


    @Get('product/:imageName')
    findProductFile(
        @Res() res: Response,
        @Param('imageName') imageName: string
    ) {
        const path = this.filesService.getStaticProductImage(imageName);
        
        res.sendFile(path);
    }


    @Post('product')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: fileFilter,
        storage: diskStorage({
            destination: './private/uploads',
            filename: fileNamer
        })
    }))
    uploadProductFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Make sure that file is a image');
        }

        const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;

        return {
            secureUrl
        };
    }
}
