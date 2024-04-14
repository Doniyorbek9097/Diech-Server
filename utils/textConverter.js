exports.textConverter = function(text) {
    const UZB_RUS = {
        "Q":"К",
        "E":"Е",
        "R":"Р",
        "T":"Т",
        "Y":"Й",
        "U":"У", 
        "I":"И",
        "O":"О",
        "P":"П",
        "A":"А",
        "S":"С",
        "SH":"Ш",
        "SH":"Щ",
        "D":"Д",
        "F":"Ф",
        "G":"Г",
        "H":"Х",
        "J":"Ж",
        "L":"Л",
        "Z":"З",
        "X":"Х",
        "CH":"Ч",
        "V":"В",
        "B":"Б",
        "N":"Н",
        "M":"М"
    }

   let output = ""

    for (let index = 0; index < text.length; index++) {
        if(UZB_RUS[text[index]]) {
            output += UZB_RUS[text[index]]
        }else {
            output += text[index]
        }
    }

    return output;

}