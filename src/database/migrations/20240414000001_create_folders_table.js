exports.up = async function(knex) {
  await knex.schema.createTable('folders', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.integer('parent_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('folders', table => {
    table.foreign('parent_id')
      .references('id')
      .inTable('folders')
      .onDelete('CASCADE');
  });

  await knex.schema.raw('CREATE INDEX idx_folder_unique_name ON folders(name, parent_id)');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('folders');
}; 