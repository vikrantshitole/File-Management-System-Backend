exports.up = async function(knex) {
  // Create folders table
  await knex.schema.createTable('folders', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('parent_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add self-referential foreign key after table creation
  await knex.schema.alterTable('folders', table => {
    table.foreign('parent_id')
      .references('id')
      .inTable('folders')
      .onDelete('CASCADE');
  });

  // Add index for folder name uniqueness within parent
  await knex.schema.raw('CREATE INDEX idx_folder_unique_name ON folders(name, parent_id)');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('folders');
}; 