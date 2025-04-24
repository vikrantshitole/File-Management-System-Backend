import sequelize from '../config/sequelize.js';
import Folder from './Folder.js';
import File from './File.js';


// Initialize models
const models = {
  Folder,
  File,

};

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize, models };
