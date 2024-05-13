// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

const {knexSnakeCaseMappers} = require('objection');

require('dotenv').config({path:__dirname+"/./../.env"});
module.exports = {

  development: {
    client: process.env.PG_CLIENT ?? 'postgresql',
    connection: {
      host: process.env.PG_HOST,
      database: process.env.PG_DB,
      user:     process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      port    : process.env.PG_PORT ?? 5432,
      ssl: { rejectUnauthorized: process.env.PG_SSL_REQUIRE == "true" ? true : false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    ...knexSnakeCaseMappers,
  },

  // staging: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // },

  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }

};
