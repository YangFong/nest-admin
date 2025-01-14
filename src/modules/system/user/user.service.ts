import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserAuthService } from './userAuth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userAuthService: UserAuthService,
  ) {}

  async create(entityData: Partial<User>): Promise<User> {
    if (entityData.id) {
      throw new Error('不能设置id');
    }
    const entity = this.userRepository.create(entityData);
    if (entity.password) {
      entity.password = this.userAuthService.encryptPassword(entity.password);
    }
    return this.userRepository.save(entity);
  }

  async findAndCount(
    page: number,
    limit: number,
    options?: FindManyOptions<User>,
  ) {
    return await this.userRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      ...options,
    });
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id }, withDeleted: true });
  }

  async findOneByOptions(options: FindOneOptions<User>): Promise<User> {
    return this.userRepository.findOne(options);
  }

  /**
   * 修改用户信息，禁止修改密码
   */
  async update(id: string, entityData: Partial<User>): Promise<User> {
    delete entityData.password;
    await this.userRepository.update(id, entityData);
    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softRemove({ id });
  }
}
