module.exports.chunk = Array.prototype.chunk = function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  };  
  

  module.exports.isObject = (data) => {
    try {
      const parsedData = JSON.parse(data);
      return typeof parsedData === 'object';
  } catch (error) {
      return false;
  }
 }