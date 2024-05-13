/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Truncate all existing entries
  await knex.raw('TRUNCATE TABLE "customers" CASCADE');

  //Delete All exsisting entries
  return knex('customers').insert([
    {
      
    }
  ])
};
