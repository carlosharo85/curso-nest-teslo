import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { Product, ProductImage } from './entities/index';

import { PaginationDto } from 'src/common/dto/paginations.dto';
import { User } from 'src/auth/entities/user.entity';


@Injectable()
export class ProductsService {

    private readonly logger = new Logger('ProductsService');


    constructor(
        @InjectRepository(Product)
        private readonly productoRepository: Repository<Product>,

        @InjectRepository(ProductImage)
        private readonly productoImageRepository: Repository<ProductImage>,

        private readonly dataSource: DataSource
    ) { }


    async create(createProductDto: CreateProductDto, user: User) {
        try {
            const { images = [], ...productDetails } = createProductDto;

            const producto = this.productoRepository.create({
                ...productDetails,
                images: images.map( image => this.productoImageRepository.create({ url: image }) ),
                user
            });
            await this.productoRepository.save(producto);

            return {
                ...producto,
                images
            };
        } catch(error) {
            this.handleDBExceptions(error);
        }
    }

    
    async findAll(paginationDto: PaginationDto) {
        const { limit = 10, offset = 0 } = paginationDto;


        const productos = await this.productoRepository.find({
            take: limit,
            skip: offset,
            relations: {
                images: true
            }
        });


        return productos.map(({ images, ...resto }) => ({
            ...resto,
            images: images.map( img => img.url )
        }) );
    }
    

    async findOne(termino: string) {
        let producto: Product; 
        
        if (isUUID(termino)) {
            producto = await this.productoRepository.findOneBy({ id: termino });
        } else {
            //producto = await this.productoRepository.findOneBy({ slug: termino });
            const queryBuilder = this.productoRepository.createQueryBuilder('prod');
            producto = await queryBuilder.where(`UPPER(title) = :title or slug = :slug`, {
                title: termino.toUpperCase(),
                slug: termino.toLowerCase()
            })
            .leftJoinAndSelect('prod.images', 'prodImages')
            .getOne();
        }

        if (!producto) {
            throw new NotFoundException(`Product with term: ${termino} not found`);
        }

        return producto;
    }


    async findOnePlain(termino: string) {
        const { images, ...resto } = await this.findOne(termino);

        return {
            ...resto,
            images: images.map(_img => _img.url )
        }
    }
    

    async update(uuid: string, updateProductDto: UpdateProductDto, user: User) {
        const { images, ...resto } = updateProductDto;


        const producto = await this.productoRepository.preload({
            id: uuid,
            ...resto
        });

        if (!producto) {
            throw new NotFoundException(`Product with uuid: ${uuid} not found`);
        }


        // Create query runner
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();


        try {
            if (images) {
                await queryRunner.manager.delete(ProductImage, { product: { id: uuid }});

                producto.images = images.map( 
                    _img => this.productoImageRepository.create({ url: _img })
                );
            }

            producto.user = user;

            await queryRunner.manager.save(producto);
            await queryRunner.commitTransaction();
            await queryRunner.release();

            //await this.productoRepository.save(producto);
            return this.findOnePlain(uuid);
        } catch(error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();

            this.handleDBExceptions(error);
        }
    }
    

    async remove(uuid: string) {
        const producto = await this.findOne(uuid);
        await this.productoRepository.remove(producto);
    }


    private handleDBExceptions(error: any) {
        if (error.code === '23505') {
            throw new BadRequestException(error.detail);
        }

        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }


    async deleteAllProducts() {
        const query = this.productoRepository.createQueryBuilder('product');

        try {
            return await query
                .delete()
                .where({})
                .execute();
        } catch(error) {
            this.handleDBExceptions(error);
        }
    }
}
