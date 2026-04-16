import 'reflect-metadata';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { Ref, ref } from '@mikro-orm/core';

@Entity()
class Building {
  @PrimaryKey() id!: number;
  @Property() reference!: number;
  @Property() name!: string;
}

@Entity()
class Unit {
  @PrimaryKey() id!: number;
  @Property() reference!: number;

  @ManyToOne(() => Building, { ref: true })
  building!: Ref<Building>;

  @Property({ persist: false })
  get buildingReference(): number {
    // This is part of the issue, removing this condition will "fix" the issue
    if (!this.building?.isInitialized()) {
      return 0;
    }
    return this.building.getEntity().reference;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Building, Unit],
    metadataProvider: ReflectMetadataProvider,
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
  orm.em.create(Building, { id: 1, reference: 900000, name: 'Test Building' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

// ---------------------------------------------------------------------------
// THE BUG
//
// ---------------------------------------------------------------------------

test('em.create() with plain-object FK value should not throw', () => {
  orm.em.clear();
  expect(() => {
    orm.em.create(Unit, { id: 1, reference: 42, building: { id: 1 } }, { persist: false, partial: true });
  }).not.toThrow();
});

// ---------------------------------------------------------------------------
// THE WORKAROUND
// ---------------------------------------------------------------------------

test('em.create() with ref() FK value should not throw', () => {
  orm.em.clear();
  expect(() => {
    orm.em.create(Unit, { id: 3, reference: 42, building: ref(Building, 1) }, { persist: false, partial: true });
  }).not.toThrow();
});

test('em.upsert() with ref() FK value should not throw', async () => {
  orm.em.clear();
  await expect(orm.em.upsert(Unit, { id: 4, reference: 44, building: ref(Building, 1) })).resolves.not.toThrow();
});

test('em.upsertMany() with ref() FK values should not throw', async () => {
  orm.em.clear();
  await expect(orm.em.upsertMany(Unit, [{ id: 5, reference: 46, building: ref(Building, 1) }])).resolves.not.toThrow();
});
