const nestedVariant = (nestedArray, attributes = [], variants = [], sku = "") => {
 nestedArray.forEach((item,index) => {
    attributes[item.type] = attributes[item.type] || [];

        item.properties.forEach((prop, index, properties) => {
            sku += prop.name.toLowerCase()+"-";

            attributes[item.type].push({
                name: prop.name,
                sku: prop.name,
                images: prop.images
            });

            let variant = {
                sku: sku,
                price: prop.price,
                quantity: prop.quantity
            };

            variants.push(variant);

            if (prop.children && prop.children.length > 0) {
                nestedVariant(prop.children, attributes, variants, sku); 
            }
        });


    });

    return {
        variants,
        attributes
    };
};

module.exports = {
    nestedVariant
}