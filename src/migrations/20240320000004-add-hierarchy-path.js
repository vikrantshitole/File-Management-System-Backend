import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  // First, add the hierarchy_path column
  await queryInterface.addColumn('folders', 'hierarchy_path', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // Update existing records with default values
  await queryInterface.sequelize.query(`
    UPDATE folders 
    SET hierarchy_path = name 
    WHERE hierarchy_path IS NULL;
  `);

  // Then make it not null
  await queryInterface.changeColumn('folders', 'hierarchy_path', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('folders', 'hierarchy_path');
}
