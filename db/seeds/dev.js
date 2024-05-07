/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex.raw('TRUNCATE TABLE "customers" CASCADE');
  await knex('customers').insert([
    {id: 1, colName: 'ratthew'}
  ]);
};
