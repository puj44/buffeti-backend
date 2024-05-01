const knexConfig = require('./knexfile');
const Knex = require('knex');
const { Model } = require('objection');

function dbSetup(){
    const knex = Knex(knexConfig.development);
    Model.knex(knex);
}

module.exports = dbSetup;