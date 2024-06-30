import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PaginationDto } from 'src/common/dto/paginations.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { User } from 'src/auth/entities/user.entity';
import { Product } from './entities/product.entity';



@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}
    

    @Post()
    @Auth(ValidRoles.user)
    @ApiResponse({
        status: 201,
        description: 'Product was created',
        type: Product
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request'
    })
    @ApiResponse({
        status: 406,
        description: 'Token  related'
    })
    create(
        @Body() createProductDto: CreateProductDto,
        @GetUser() user: User
    ) {
        return this.productsService.create(createProductDto, user);
    }
    

    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.productsService.findAll(paginationDto);
    }
    

    @Get(':termino')
    findOne(@Param('termino') termino: string) {
        return this.productsService.findOnePlain(termino);
    }
    

    @Patch(':uuid')
    @Auth(ValidRoles.user)
    update(
        @Param('uuid', ParseUUIDPipe) uuid: string, 
        @Body() updateProductDto: UpdateProductDto,
        @GetUser() user: User
    ) {
        return this.productsService.update(uuid, updateProductDto, user);
    }
    
    
    @Delete(':uuid')
    @Auth(ValidRoles.admin)
    remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.productsService.remove(uuid);
    }
}
