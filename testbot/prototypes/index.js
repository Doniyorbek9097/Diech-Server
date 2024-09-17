module.exports.chunk = Array.prototype.chunk = function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  };  


  module.exports.clearNumber = String.prototype.clearNumber = function() {
    let result = '';
    
    for (const letter of this) {
      // Agar belgimiz '\n' bo'lsa, uni qo'shamiz
      if (letter === '\n') {
        result += letter;
      } 
      // Agar belgimiz raqam emas bo'lsa, uni ham qo'shamiz
      else if (isNaN(letter) || letter === ' ') {
        result += letter;
      }
      // Raqam bo'lsa, uni o'tkazib yuboramiz
    }
  
    return result.trim();
  }
  