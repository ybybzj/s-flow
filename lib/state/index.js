var Baobab = require('baobab');
var t = require('typology');
var Ref = require('./reference');

function createState(initialData, facetsCfg, refsCfg, opts) {
  opts = opts || {};
  var tree, facets, refs;
  tree = new Baobab(initialData, opts);
  refs = createRefs(tree, refsCfg);
  facets = createFacets(facetsCfg, refs);
  if (facets) {
    Object.keys(facets).forEach(function(k) {
      tree.addFacet(k, facets[k]);
    });
  }

  function reset(initialData){
    var refs = this.refs,
        store = this.store;
    store.set(initialData);
    store.commit();
    Object.keys(refsCfg).forEach(function(k) {
      var ref = refs[k];
      ref.reset();
      var refDef = refsCfg[k];
      updateRef(store, refDef, ref);
    });
  }
  return {
    store: tree,
    refs: refs,
    reset: reset
  };
};


function createRefs(store, refsCfg) {
  if (t.get(refsCfg) !== 'object') {
    return {};
  }
  var refs = Object.keys(refsCfg).reduce(function(m, k) {
    var refDef = refsCfg[k];
    m[k] = updateRef(store, refDef,(new Ref()));
    return m;
  }, {});
  return refs;
}

function updateRef(store, refDef, ref) {
  var refKeys, refData, idName = 'id';
  if (t.check('string|array', refDef)) {
    refData = store.get(refDef);
  } else if (t.check({
      path: 'string|array',
      id: '?string'
    }, refDef)) {
    refData = store.get(refDef.path);
    idName = refDef.id || 'id';
  }
  if (t.get(refData) !== 'object' || (refKeys = Object.keys(refData)).length === 0) {
    return ref;
  }
  refKeys.forEach(function(refK) {
    var itemData = refData[refK];
    ref.add(refK, itemData[idName]);
  });
  return ref;
}

function createFacets(facetsCfg, refs) {
  var fKeys;
  if (t.get(facetsCfg) !== 'object' || (fKeys = Object.keys(facetsCfg)).length === 0) {
    return null;
  }
  fKeys.forEach(function(fk) {
    var fdef = facetsCfg[fk],
      orgGet = fdef.get;
    if (t.get(orgGet) === 'function') {
      fdef.get = function(data) {
        return orgGet.call(this, data, refs);
      };
    }
  });
  return facetsCfg;
}
module.exports = createState;
//test
// if (require.main === module) {
//   var curItemFacet = {
//     cursors: {
//       list: 'list',
//       messages: 'messages',
//       curId: 'curItemId'
//     },
//     get: function(data, refs) {
//       console.log(data);
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
//   var facets = {
//     curItem: curItemFacet
//   };
//   var refs = {
//     list: 'list',
//     message: 'messages'
//   };
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
//   var state = createState({
//     list: {},
//     messages: {},
//     curItemId: 1
//   }, 
//    facets,
//    refs,
//    {
//     syncwrite: true,
//     // immutable: true
//   });
//   list.forEach(function(item){
//     var ref = state.refs.list.create(item.id);
//     state.store.set(['list', ref], item);
//   });
//   messages.forEach(function(msg){
//     var ref = state.refs.message.create(msg.id);
//     state.store.set(['messages', ref], msg);
//   });
//   // state.store.commit();
//   console.log(JSON.stringify(state.store.facets.curItem.get()));
//   var curRef = state.refs.list.get(state.store.get('curItemId'));
//   var curItem = state.store.get(['list', curRef]);
//   console.log(curItem);
// }