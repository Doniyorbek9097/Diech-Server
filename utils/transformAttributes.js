exports.transformAttributes = (data) => {
    const attributeMap = new Map();
  
  data.forEach(item => {
      item.variant.attributes.forEach(attribute => {
          if (!attributeMap.has(attribute.label)) {
              attributeMap.set(attribute.label, {
                  label: attribute.label,
                  children: new Map()
              });
          }

          const childrenMap = attributeMap.get(attribute.label).children;

          if (!childrenMap.has(attribute.value)) {
              childrenMap.set(attribute.value, {
                  name: attribute.value,
                  _id: attribute._id,
                  images: attribute?.images
              });
          }
      });
  });

  // Transform children Map to array for each attribute
  attributeMap.forEach((value, key) => {
      value.children = Array.from(value.children.values());
  });

  return Array.from(attributeMap.values());
}