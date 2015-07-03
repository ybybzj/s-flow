var check = require('check/type');
var t = require('typology');
var slice = require('fnkit/slice');
var pipe = require('fnkit/pipe');
var Signal = require('./lib/signal');
var createState = require('./lib/state');
var Promise = require('promize');
var protos = {
  init: function init() {
    this.state = this._createState.apply(this, slice(arguments));
    return this;
  },
  snapshot: function snapshot(sigName,sigVal) {
    var signal = this.signal,
        snapshot = this._snapshot;
    if(snapshot == null) snapshot = this._snapshot = this._createState();
        // snapshot = this._createState();
    snapshot.reset(this._stateOptions.data);
    return Promise.resolve(signal.execute(sigName, snapshot, sigVal)).then(function(){
      snapshot.store.commit();
      return {
        state: snapshot,
        $type: '__$sf$__'
      };
    });
  },
  _createState: function(initData, options){
    var stateOpts = this._stateOptions;
    return createState(
      t.get(initData) === 'object' || t.get(initData) === 'array'? 
            initData: stateOpts.data,
      stateOpts.facets,
      stateOpts.refs,
      _merge(stateOpts.options, options||{})
      );
  },
  $type: '__$sf$__'
};

function SF(opts) {
  check.t({
    state:{
      data: 'object',
      facets: '?object',
      refs: '?object',
      options: '?object'
    },
    signal: 'function',
    watch: 'function'
  }, opts, '[sFlow constructor]Invalid state argument!');
  var signalCreator = opts.state.options && opts.state.options.signalCreator, sf;
  if (signalCreator) delete opts.state.options.signalCreator;
  sf = Object.create(protos);
  sf.signal = new Signal(sf, signalCreator);
  //register signals
  opts.signal(sf.signal);
  sf.signal.resolve();
  //watch signals
  opts.watch(_watch.bind(sf));
  sf._stateOptions = opts.state;
  return sf;
}
SF.isCtorOf = function(sf){
  return t.get(sf) === 'object' && sf.$type === '__$sf$__';
}
module.exports = SF;

function _watch(sigName) {
  var reactions = slice(arguments, 1),
    signal = this.signal,
    self = this,
    // state = this.state,
    sigHandler;
  check(typeof sigName === 'string', '[sFlow watch]first parameter should be a string! given: ' + sigName);
  check.t(['function'], reactions, '[sFlow watch]actions should be an array of functions! given: ' + reactions);
  sigHandler = function(state){
    var args = slice(arguments, 1),
        piped = pipe.apply(null, reactions.map(function(orgFn) {
            return orgFn.bind(this, state.store, state.refs);
          })
        );
    return piped.apply(self, args);
  };
  signal.on(sigName, sigHandler);
}
function _merge(t, o){
  for(var k in o){
    if(Object.prototype.hasOwnProperty.call(o, k)){
      t[k] = o[k];
    }
  }
  return t;
}
