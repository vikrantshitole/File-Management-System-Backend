import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  // First, add the hierarchy_level column
  await queryInterface.addColumn('folders', 'hierarchy_level', {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  });

  // Update existing records with default values
  await queryInterface.sequelize.query(`
    UPDATE folders 
    SET hierarchy_level = 0 
    WHERE hierarchy_level IS NULL;
  `);

  // Then make it not null
  await queryInterface.changeColumn('folders', 'hierarchy_level', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('folders', 'hierarchy_level');
}
