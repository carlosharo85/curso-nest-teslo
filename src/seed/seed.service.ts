import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { hashSync } from 'bcrypt';



@Injectable()
export class SeedService {

    constructor(
        private readonly productService: ProductsService,
        
        @InjectRepository( User )
        private readonly userRepository: Repository<User>
    ) { }


    async runSeed() {
        await this.deleteTables();
        const adminUser = await this.insertUsers();

        if (!await this.insertNewProducts(adminUser)) {
            throw new BadRequestException(`Error en la eliminación de productos`);
        }

        return 'SEED EXECUTE';
    }


    private async deleteTables() {
        await this.productService.deleteAllProducts();
        
        const queryBuilder = this.userRepository.createQueryBuilder();
        await queryBuilder
            .delete()
            .where({})
            .execute();
    }


    private async insertUsers() {
        const seedUsers = initialData.users;

        const users: User[] = [];

        seedUsers.forEach( user => {
            user.password = hashSync(user.password, 10);
            users.push(this.userRepository.create(user));
        });

        const dbUsers = await this.userRepository.save(seedUsers);

        return dbUsers[0];
    }


    private async insertNewProducts(user: User) {
        await this.productService.deleteAllProducts();


        const seedProductos = initialData.products;
        const insertPromises = [];


        seedProductos.forEach( _producto => {
            insertPromises.push( this.productService.create(_producto, user) );
        });


        await Promise.all(insertPromises);


        return true;
    }
}
