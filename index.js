var check = require('@zj/check/type');
var t = require('typology');
var slice = require('@zj/fnkit/slice');
var pipe = require('@zj/fnkit/pipe');
var Signal = require('./lib/signal');
var createState = require('./lib/state');
var Promise = require('@zj/promise');
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
  // sf.state = createState(state.data, state.facets, state.refs, opts);
  sf.signal = new Signal(sf, signalCreator);
  //register signals
  opts.signal(sf.signal);
  //watch signals
  opts.watch(_watch.bind(sf));
  sf._stateOptions = opts.state;
  return sf;
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
            return orgFn.bind(this, state);
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
//test
// if (require.main === module) {
//   var list = [{
//     id: '0',
//     msg: [1]
//   }, {
//     id: 1,
//     msg: [0, 2]
//   }, {
//     id: '2',
//     msg: [3]
//   }];
//   var messages = [{
//     id: 0,
//     content: "message0"
//   }, {
//     id: 1,
//     content: "message1"
//   }, {
//     id: 2,
//     content: "message2"
//   }, {
//     id: 3,
//     content: "message3"
//   }];
//   var curItemFacet = {
//     cursors: {
//       list: 'list',
//       messages: 'messages',
//       curId: 'curItemId'
//     },
//     get: function(data, refs) {
//       // console.log(data);
//       var item = data.list[refs.list.get(data.curId)];
//       if (item) {
//         item = Object.create(item);
//         item.messages = item.msg.map(function(msgId) {
//           return data.messages[refs.message.get(msgId)].content;
//         }).join('\n');
//       }
//       return item;
//     }
//   };
//   var refs = {
//     list: 'list',
//     message: 'messages'
//   };
//   var app = SF({
//     data: {
//       list: {},
//       messages: {},
//       curItemId: 1
//     },
//     facets: {
//       curItem: curItemFacet
//     },
//     refs: refs
//   }, {
//     syncwrite: true
//   });
//   app.setup(function(app) {
//     app.signal.add('load');
//     app.signal.resolve();
//   }).watch(function(watch) {
//     watch('load', function(state) {
//       setTimeout(function() {
//         // console.log(state);
//         list.forEach(function(item) {
//           var ref = state.refs.list.create(item.id);
//           state.store.set(['list', ref], item);
//         });
//         messages.forEach(function(msg) {
//           var ref = state.refs.message.create(msg.id);
//           state.store.set(['messages', ref], msg);
//         });
//       }, 1000);
//     });
//   });
//   app.state.store.on('update', function() {
//     console.log(app.state.store.facets.curItem.get());
//   })
//   app.signal.get('load')('start');
// }