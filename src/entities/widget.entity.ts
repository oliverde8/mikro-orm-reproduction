import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Category } from './category.entity';

@Entity()
export class Widget {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @Property({ columnType: 'text' })
  description!: string;

  @Enum({ items: () => ['small', 'medium', 'large'] })
  size!: 'small' | 'medium' | 'large';

  @Property({ columnType: 'decimal(10,2)', default: 0 })
  price: number = 0;

  @ManyToOne(() => Category, { deleteRule: 'cascade', updateRule: 'cascade' })
  category!: Category;
}
