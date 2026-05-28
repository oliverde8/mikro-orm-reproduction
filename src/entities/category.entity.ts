import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class Category {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}
