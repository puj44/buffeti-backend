/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTableIfNotExists('Customers', (table)=>{
        table.increments();
        table.string('name');
        table.integer('contact_number').notNullable();
        table.string('email');
        table.boolean('is_email_verified');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('Customers');
};
