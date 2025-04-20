

export const buildHierarchy = (items, parentId = null) => {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => {
      if (item.type === 'folder') {
        return {
          ...item,
          children: buildHierarchy(items, item.id)
        };
      } else {
        return {
          ...item,
          children: []
        };
      }
    });
};