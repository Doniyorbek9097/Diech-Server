module.exports = function langReplace(elem, lang) {
    if (Array.isArray(elem)) {
        if (elem.length <= 0) return elem;
        for (const item of elem) {
            const objKeys = Object.keys(item);
            for (const val of objKeys) {
                if (!Array.isArray(item[val]) && typeof item[val] == "object" && item[val] !== null) {
                    let keys = Object.keys(item[val]);
                    if (keys.includes(lang)) {
                        item[val] = item[val][lang];
                    }
                }


            }
        }

        return elem;
    }

    else if (typeof elem == "object"
        && !Array.isArray(elem)
        && elem !== null) {
        const objKeys = Object.keys(elem);
        for (const val of objKeys) {
            if (!Array.isArray(elem[val]) && typeof elem[val] == "object" && elem[val] !== null) {
                let keys = Object.keys(elem[val]);
                if (keys.includes(lang)) {
                    elem[val] = elem[val][lang];
                }
            }


        }

        return elem;
    }

}