exports.up = async function(knex) {
  // First create the files table without foreign key
  await knex.schema.createTable('files', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.enu('type', ['pdf', 'png', 'docx','jpg','svg']).notNullable();
    table.integer('folder_id').unsigned();
    table.text('file_path').notNullable();
    table.bigInteger('size');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add foreign key constraint after table creation
  await knex.schema.alterTable('files', table => {
    table.foreign('folder_id')
      .references('id')
      .inTable('folders')
      .onDelete('CASCADE');
  });

  // Add indexes
  await knex.schema.raw('CREATE INDEX idx_file_folder_name ON files(folder_id, name)');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('files');
}; 