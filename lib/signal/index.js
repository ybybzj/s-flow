var ctor = require('./ctor');
var check = require('@zj/check/type');
var pipe = require('@zj/fnkit/pipe');
var slice = require('@zj/fnkit/slice');
var t = require('typology');
function Signal(sigCtor){
  this._ctor =  sigCtor || ctor;
  check.t({
    createSignal: 'function',
    isSignal: 'function',
    onSignal: 'function',
    triggerSignal: 'function'
  }, this._ctor, '[Signal constructor]Invalid sigCtor parameter');
  this._depsMap = {};
  this._resolvedMap = {};
  this._capacity = 0;
}
Signal.prototype.add = function signal$add(name, deps){
  var composers; 
  if(t.get(deps) === 'array'){
    composers = slice(arguments, 2);
  }else{
    composers = slice(arguments, 1);
    deps = [];
  }
  check(t.get(name) === 'string', '[signal add]signal name should be a string! given: ' + name);
  check(this._depsMap[name] == null, '[signal add]signal named "' +name+ '" is already added!');
  if(deps.length){
    check.t(['string'], deps, '[signal add]deps should be an array of strings!');
  }
  check.t(['function'], composers, '[signal add]composers should be an array of functions!');
  this._depsMap[name] = {
    deps: deps,
    factory: composers
  };
  return this;
};
Signal.prototype.resolve = function signal$resolve(){
  check(this._isResolved !== true, '[signal resolve]cannot resolve signal twice!');
  var depsMap = this._depsMap,
      depsMapKeys = Object.keys(depsMap),
      i, l = depsMapKeys.length, name, def;
  for(i = 0; i < l; i++){
    name = depsMapKeys[i];
    def = depsMap[name];
    _resolve(name, def, depsMap, this._resolvedMap, this);
    if(this._capacity === l){
      break;
    }
  }
  this._isResolved = isResolved(this._depsMap, this._resolvedMap);
  check(this._isResolved === true, '[signal resolve]resolve signal failed!');
  this._depsMap = null;
  return this;
};
Signal.prototype.get = function signal$get(name){
  check(this._isResolved === true, '[signal get]should resolve signal first!');
  var result = this._resolvedMap[name];
  check(this._ctor.isSignal(result), '[signal get]couldn\'t find a signal with name "'+name+'"');
  return result;
};
Signal.prototype.on = function signal$on(name, f){
  check(this._isResolved === true, '[signal on]should resolve signal first!');
  this._ctor.onSignal(f, this.get(name));
  return this;
};
Signal.prototype.getEmitter = function signal$getEmitter(name){
  check(this._isResolved === true, '[signal getEmitter]should resolve signal first!');
  var signal = this.get(name);
  return function(v){
    return this._ctor.trigger(v, signal);
  };
};
module.exports = Signal;

function _resolve(name, def, depsMap, resolvedMap, self){
  if(resolvedMap[name]){return;}
  var deps = def.deps, factory = def.factory, resolvedSignal;
  deps = deps.map(function(depName){
    var depDef = depsMap[depName];
    check(depDef != null, '[signal resolve]Nonexist dependent signal name! given: ' + depName);
    _resolve(depName, depDef, depsMap, resolvedMap, self);
    return resolvedMap[depName];
  });
  factory = factory.length > 0 ? pipe.apply(null, factory) : self._ctor.createSignal;
  resolvedSignal = factory.apply(null, deps);
  check(self._ctor.isSignal(resolvedSignal), '[signal resolve]factory should produce a valid signal! given: ' + resolvedSignal);
  resolvedMap[name] = resolvedSignal;
  self._capacity++;
}

function isResolved(depsMap, resolvedMap){
  var depsMapKeys = Object.keys(depsMap),
      resolvedMapKeys = Object.keys(resolvedMap);

  if(depsMapKeys.length !== resolvedMapKeys.length){
    return false;
  }
  return depsMapKeys.sort().join('') === resolvedMapKeys.sort().join('');
}

//test
// if(require.main === module){
//   var merge$ = require('@zj/r-stream/composer/merge');
//   var map$ = require('@zj/r-stream/composer/map');
//   var fromSequence = require('@zj/r-stream/from/sequence');
//   var signal = new Signal();
//   signal
//     .add('s1', fromSequence.bind(null, 1000, ['aa','sdfsd','wew','retwdf', 'fwefweqf']))
//     .add('s2', fromSequence.bind(null, 2000, ['aa1','sd2fsd','w3ew','etwdf', 'fweqf']))
//     .add('s3', ['s1', 's2'], merge$, map$(function(s){return s.length;}))
//     .resolve()
//     .on('s3', console.log.bind(console));
//   // signal.get('s1')('hello1');
//   // signal.get('s2')('hello2');
//   signal.get('s2').log('s2');
// }