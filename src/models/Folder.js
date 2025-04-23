import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Folder = sequelize.define('Folder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Folders',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'folders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Folder.associate = (models) => {
  Folder.belongsTo(Folder, { as: 'parent', foreignKey: 'parent_id' });
  Folder.hasMany(Folder, { as: 'children', foreignKey: 'parent_id' });
};

export default Folder; 