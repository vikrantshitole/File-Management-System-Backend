
// Recursive function to build tree
export const buildFolderTree = (folders, parentId = null) => {
    return folders
      .filter(folder => folder.parent_id === parentId)
      .map(folder => ({
        ...folder,
        sub_folders: buildFolderTree(folders, folder.id)
      }));
  };