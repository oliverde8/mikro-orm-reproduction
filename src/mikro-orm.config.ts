import 'reflect-metadata';
import { defineConfig } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  metadataProvider: ReflectMetadataProvider,
  entities: ['dist/entities/*.entity.js'],
  entitiesTs: ['src/entities/*.entity.ts'],
  dbName: 'repro',
  host: '127.0.0.1',
  port: 3399,
  user: 'root',
  password: 'repro',
  extensions: [Migrator],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    snapshot: true,
  },
});
