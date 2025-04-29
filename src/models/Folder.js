import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import File from './File.js';

class Folder extends Model {
  

  // Get all descendants
  async getDescendants() {
    const folder = await Folder.findByPk(this.id, {
      include: [
        { model: File, as: 'files' },
        { model: Folder, as: 'children' },
      ],
    });
    const folderFiles = await Folder.count({
      where: {
        parent_id: this.id,
      },
    });
    if (!folder) return null;

    const children = await Promise.all(folder.children.map(child => child.getDescendants()));

    return {
      id: folder.id,
      name: folder.name,
      subfolder_count: folderFiles,
      description: folder.description,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
      parent_id: folder.parent_id,
      level: folder.hierarchy_level,
      hierarchy_path: folder.hierarchy_path,
      path: folder.hierarchy_path,
      type: 'folder',
      children: [
        ...children.filter(Boolean),
        ...folder.files.map(f => ({ ...f.toJSON(), children: [], type: 'file' })),
      ],
    };
  }

}

Folder.init(
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Folders',
        key: 'id',
      },
    },
    hierarchy_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    hierarchy_path: {
      type: DataTypes.STRING(1000),
      allowNull: true,
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
    modelName: 'Folder',
    tableName: 'folders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: async folder => {
        if (folder.parent_id) {
          const parent = await Folder.findByPk(folder.parent_id);
          folder.hierarchy_level = parent ? parent.hierarchy_level + 1 : 0;
          const path = (parent?.hierarchy_path) || '';          
          folder.hierarchy_path = path ? `${path},${folder.id}` : folder.id;
        } else {
          folder.hierarchy_level = 0;
          folder.hierarchy_path = folder.id;
        }
      },
    },
  }
);

// Define associations
Folder.associate = models => {
  Folder.hasMany(Folder, { as: 'children', foreignKey: 'parent_id' });
  Folder.hasMany(models.File, { as: 'files', foreignKey: 'folder_id' });
  Folder.belongsTo(Folder, { as: 'parent', foreignKey: 'parent_id' });
};

export default Folder;
