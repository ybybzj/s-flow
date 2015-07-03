var r$ = require('r-stream');
module.exports = {
  createSignal: function(){
    return r$();
  },
  isSignal: function(s){
    return r$.isStream(s);
  },
  onSignal: function(f, s){
    return r$.on(f, s);
  },
  triggerSignal: function(s, val){
    s(val);
    return s;
  }
};