const removeDuplicates = (attributes) => {
    for (let key in attributes) {
      const unique = new Map();
      attributes[key] = attributes[key].filter(item => {
        const identifier = item.name + item.sku;
        if (!unique.has(identifier)) {
          unique.set(identifier, true);
          return true;
        }
        return false;
      });
    }
    return attributes;
  }

  module.exports = {
    removeDuplicates
  }