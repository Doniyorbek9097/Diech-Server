const { throws } = require("assert");

module.exports.chunk = Array.prototype.chunk = function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  };  

  module.exports.real = Array.prototype.real = function() {
    if(!Array.isArray(this)) throw new Error("real methodidagi malumot array emas");
    return this.filter(item => item.details?.length ? true : false);
  };  

