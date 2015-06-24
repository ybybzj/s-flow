var NULL_ID = '__$NULL_ID$__';
var check = require('@zj/check');
function Ref(){
  this._refs = [];
  this._ids = [];
  this._counter = 0;
  this._idx = -1;
}

var proto = Ref.prototype;
proto.create = function(id){
  var ref, id = id != null ? id : NULL_ID;
  if(this.hasId(id)){
    return this._refs[this._idx];
  }
  ref = this._counter++;
  this._ids[this._refs.push(ref) - 1] = id;
  return ref;
};

proto.get = function(id){
  return this.hasId(id) ? this._refs[this._idx] : undefined;
};

proto.update = function(ref, id){
  ref = Number(ref);
  check(!this.hasId(id),
    '[State Ref update]id('+id+ ') has already been added!'
    );
  check(this.hasRef(ref),
    '[State Ref update]ref('+ref+ ') does not exist!'
    );
  check(this._ids[this._idx] === NULL_ID,
    '[State Ref update]ref('+ref+ ') has already been updated!'
    );
  this._ids[this._idx] = id;
  return ref;
};
proto.add = function(ref, id){
  ref = Number(ref);
  check(!this.hasId(id), 
    '[State Ref update]id('+id+ ') has already been added!'
    );
  check(!this.hasRef(ref), 
    '[State Ref update]ref('+ref+ ') already exists!'
    );
  
  id = id != null ? id : NULL_ID;
  this._ids[this._refs.push(ref) - 1] = id;
  this._counter = this._counter < ref ? ref + 1 : this._counter;
  return ref;
};
proto.remove = function(ref){
  ref = Number(ref);
  var i;
  if(this.hasRef(ref)){
    i = this._idx;
    this._refs.splice(i, 1);
    this._ids.splice(i, 1);
  }
};

proto.hasId = function(id){
  return _has(this, this._ids, id, isEqualIds);
};

proto.hasRef = function(ref){
  return _has(this, this._refs, ref);
}

function isEqualIds(ida, idb){
  return String(ida) === String(idb);
}
function _has(self, list, item, eqFn){
  var i = list.length - 1;
  while(i >=0){
    if((!eqFn ? list[i] === item : eqFn(list[i], item))){
      break;
    }
    i--;
  }
  self._idx = i;
  return -1 < i;
}

module.exports = Ref;