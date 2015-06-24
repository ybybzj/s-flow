var check = require('@zj/check/type');
var slice = require('@zj/fnkit/slice');
var pipe = require('@zj/fnkit/pipe');
var Signal = require('./lib/signal');
var createState = require('./lib/state');
var protos = {
  setup: function setup(signalRegister) {
    check.t('function', signalRegister);
    signalRegister(this);
    return this;
  },
  watch: function watch(signalWatcher) {
    check.t('function', signalWatcher);
    signalWatcher(_watch.bind(this));
    return this;
  }
};

function SF(state, opts) {
  check.t({
    data: 'object',
    facets: '?object',
    refs: '?object'
  }, state, '[sFlow constructor]Invalid state argument!');
  var signalCreator = opts && opts.signalCreator, sf;
  if (signalCreator) delete opts.signalCreator;
  sf = Object.create(protos);
  sf.state = createState(state.data, state.facets, state.refs, opts);
  sf.signal = signalCreator ? new Signal(signalCreator) : new Signal();
  return sf;
}

module.exports = SF;

function _watch(sigName) {
  var actions = slice(arguments, 1),
    signal = this.signal,
    state = this.state,
    sigHandler;
  check(typeof sigName === 'string', '[sFlow watch]first parameter should be a string! given: ' + sigName);
  check.t(['function'], actions, '[sFlow watch]actions should be an array of functions! given: ' + actions);
  sigHandler = pipe.apply(null, actions.map(function(orgFn) {
    return function() {
      var args = slice(arguments);
      return orgFn.apply(this, [state].concat(args));
    };
  }));
  signal.on(sigName, sigHandler);
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