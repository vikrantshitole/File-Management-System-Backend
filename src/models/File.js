import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class File extends Model {}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    folder_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Folders',
        key: 'id',
      },
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('pdf', 'png', 'docx', 'jpg', 'svg', 'gif', 'txt'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

File.associate = models => {
  File.belongsTo(models.Folder, { as: 'folder', foreignKey: 'folder_id' });
};

export default File;
