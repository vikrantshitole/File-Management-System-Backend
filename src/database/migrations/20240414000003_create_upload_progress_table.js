exports.up = async function(knex) {
  await knex.schema.createTable('upload_progress', table => {
    table.increments('id').primary();
    table.integer('file_id').unsigned().notNullable()
         .references('id').inTable('files')
         .onDelete('CASCADE');
    table.integer('percentage').defaultTo(0);
    table.enu('status', ['uploading', 'completed', 'failed']).defaultTo('uploading');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('upload_progress');
}; 