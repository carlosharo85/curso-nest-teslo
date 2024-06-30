import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';


async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const puerto = process.env.PORT;
    const logger = new Logger('Boostrap');


    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true
        })
    );


    const config = new DocumentBuilder()
        .setTitle('Teslo RESTFull API')
        .setDescription('Teslo shop endpoints')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    

    await app.listen(puerto);
    logger.log(`App escuchando en el puerto ${puerto}`);
}
bootstrap();
