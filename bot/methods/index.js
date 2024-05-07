module.exports.chunk = Array.prototype.chunk = function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  };  
  

  module.exports.isJSON = isJSON = (data) => {
    try {
     return JSON.parse(data);
    } catch (error) {
      console.log(error.message);
    }
 }