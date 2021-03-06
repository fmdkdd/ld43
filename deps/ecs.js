// FILE utils

function fastBind(thisArg, methodFunc) {
  return function () {
    methodFunc.apply(thisArg, arguments);
  };
}

function fastSplice(array, startIndex, removeCount) {
  var len = array.length;
  var removeLen = 0;

  if (startIndex >= len || removeCount === 0) {
    return;
  }

  removeCount = startIndex + removeCount > len ? len - startIndex : removeCount;
  removeLen = len - removeCount;

  for (var i = startIndex; i < len; i += 1) {
    array[i] = array[i + removeCount];
  }

  array.length = removeLen;
}

// FILE uid

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @module  uid
 */
/*
 * UIDGenerator for multi-instance Entity Component System
 * Generate numeric unique ids for ECS entities. The requirements are:
 *  * generate Numbers for fast comparaison, low storage and bandwidth usage
 *  * generators can be salted so you can use multiple generators with
 *  uniqueness guaranty
 *  * each salted generator can generate reasonable amount of unique ids
 */

// maximum number of salted generators that can run concurently, once the
// number of allowed generators has been reached the salt of the next
// generator is silently reset to 0
var MAX_SALTS = 10000;

var MAX_ENTITY_PER_GENERATOR = Math.floor(Number.MAX_SAFE_INTEGER / MAX_SALTS) - 1;
var currentSalt = 0;

/**
 * Generate unique sequences of Numbers. Can be salted (up to 9999 salts)
 * to generate differents ids.
 *
 * To work properly, ECS needs to associate an unique id with each entity. But
 * to preserve efficiency, the unique id must be a Number (more exactly a safe
 * integer).
 *
 * The basic implementation would be an incremented Number to generate a unique
 * sequence, but this fails when several ecs instances are running and creating
 * entities concurrently (e.g. in a multiplayer networked game). To work around
 * this problem, ecs provide UIDGenerator class which allow you to salt your
 * generated ids sequence. Two generators with different salts will NEVER
 * generate the same ids.
 *
 * Currently, there is a maxumum of 9999 salts and about 900719925473 uid per
 * salt. These limits are hard-coded, but I plan to expose these settings in
 * the future.
 *
 * @class  UIDGenerator
 */

var UIDGenerator = (function () {
  /**
   * @constructor
   * @class  UIDGenerator
   * @param  {Number} [salt=0] The salt to use for this generator. Number
   * between 0 and 9999 (inclusive).
   */

  function UIDGenerator() {
    var salt = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

    _classCallCheck(this, UIDGenerator);

    /**
     * The salt of this generator.
     * @property {Number} salt
     */
    this.salt = salt;

    /**
     * The counter used to generate unique sequence.
     * @property {Number} uidCount
     */
    this.uidCounter = 0;
  }

  /**
   * @class UID
   */

  /**
   * Create a new unique id.
   *
   * @return {Number} An unique id.
   */

  _createClass(UIDGenerator, [{
    key: "next",
    value: function next() {
      var nextUid = this.salt + this.uidCounter * MAX_SALTS;

      // if we exceed the number of maximum entities (which is
      // very high) reset the counter.
      if (++this.uidCounter >= MAX_ENTITY_PER_GENERATOR) {
        this.uidCounter = 0;
      }

      return nextUid;
    }
  }]);

  return UIDGenerator;
})();

var UID = {
  /**
   * A reference to UIDGenerator class.
   *
   * @property {class} UIDGenerator
   */
  UIDGenerator: UIDGenerator,
  /**
   * The default generator to use if an entity is created without id or generator instance.
   *
   * @property {UIDGenerator} DefaultUIDGenerator
   */
  DefaultUIDGenerator: new UIDGenerator(currentSalt++),
  /**
   * Return true if the entity id was salted by given salt
   *
   * @param  {String} entityId Entity id to test
   * @param  {String} salt     Salt to test
   * @return {Boolean}         true if the id was generated by the salt, false
   * otherwise
   */
  isSaltedBy: function isSaltedBy(entityId, salt) {
    return entityId % MAX_SALTS === salt;
  },
  /**
   * Return the next unique salt.
   *
   * @method  nextSalt
   * @return {Number} A unique salt.
   */
  nextSalt: function nextSalt() {
    var salt = currentSalt;

    // if we exceed the number of maximum salts, silently reset
    // to 1 (since 0 will always be the default generator)
    if (++currentSalt > MAX_SALTS - 1) {
      currentSalt = 1;
    }

    return salt;
  },
  /**
   * Create a new generator with unique salt.
   *
   * @method  nextGenerator
   * @return {UIDGenerator} The created UIDGenerator.
   */
  nextGenerator: function nextGenerator() {
    return new UIDGenerator(UID.nextSalt());
  }
};

// FILE system

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/**
 * @module  ecs
 */

// forced to disable this check for abstract methods
// jshint unused:false
/**
 * @class  System
 *
 * @description  A system update all eligible entities at a given frequency.
 * This class is not meant to be used directly and should be sub-classed to
 * define specific logic.
 */

var System = (function () {
  /**
   * @class  System
   * @constructor
   * @param [frequency=1] {Number} Frequency of execution.
   */

  function System() {
    var frequency = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    _classCallCheck(this, System);

    /**
     * Frequency of update execution, a frequency of `1` run the system every
     * update, `2` will run the system every 2 updates, ect.
     * @property {Number} frequency
     */
    this.frequency = frequency;

    /**
     * Entities of the system.
     *
     * @property {Array[Entity]} entities
     */
    this.entities = [];
  }

  // jshint unused:true

  /**
   * Add an entity to the system entities.
   *
   * @param {Entity} entity The entity to add to the system.
   */

  _createClass(System, [{
    key: 'addEntity',
    value: function addEntity(entity) {
      entity.addSystem(this);
      this.entities.push(entity);

      this.enter(entity);
    }

    /**
     * Remove an entity from the system entities. exit() handler is executed
     * only if the entity actually exists in the system entities.
     *
     * @param  {Entity} entity Reference of the entity to remove.
     */
  }, {
    key: 'removeEntity',
    value: function removeEntity(entity) {
      var index = this.entities.indexOf(entity);

      if (index !== -1) {
        entity.removeSystem(this);
        (0, fastSplice)(this.entities, index, 1);

        this.exit(entity);
      }
    }

    /**
     * Apply update to each entity of this system.
     *
     * @method  updateAll
     */
  }, {
    key: 'updateAll',
    value: function updateAll(elapsed) {
      this.preUpdate();

      for (var i = 0, entity = undefined; entity = this.entities[i]; i += 1) {
        this.update(entity, elapsed);
      }

      this.postUpdate();
    }

    /**
     * dispose the system by exiting all the entities
     *
     * @method  dispose
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      for (var i = 0, entity = undefined; entity = this.entities[i]; i += 1) {
        entity.removeSystem(this);
        this.exit(entity);
      }
    }

    // methods to be extended by subclasses
    /**
     * Abstract method to subclass. Called once per update, before entities
     * iteration.
     *
     * @method  preUpdate
     */
  }, {
    key: 'preUpdate',
    value: function preUpdate() {}

    /**
     * Abstract method to subclass. Called once per update, after entities
     * iteration.
     *
     * @method  postUpdate
     */
  }, {
    key: 'postUpdate',
    value: function postUpdate() {}

    /**
     * Abstract method to subclass. Should return true if the entity is eligible
     * to the system, false otherwise.
     *
     * @method  test
     * @param  {Entity} entity The entity to test.
     */
  }, {
    key: 'test',
    value: function test(entity) {
      return false;
    }

    /**
     * Abstract method to subclass. Called when an entity is added to the system.
     *
     * @method  enter
     * @param  {Entity} entity The added entity.
     */
  }, {
    key: 'enter',
    value: function enter(entity) {}

    /**
     * Abstract method to subclass. Called when an entity is removed from the system.
     *
     * @method  exit
     * @param  {Entity} entity The removed entity.
     */
  }, {
    key: 'exit',
    value: function exit(entity) {}

    /**
     * Abstract method to subclass. Called for each entity to update. This is
     * the only method that should actual mutate entity state.
     *
     * @method  update
     * @param  {Entity} entity The entity to update.
     */
  }, {
    key: 'update',
    value: function update(entity) {}
  }]);

  return System;
})();

// FILE performance

/*global global */

var perf = null,
    start = Date.now();

// use global browser performance module
// for node create a polyfill
//if (!global) {
  perf = window.performance;
/*} else {
  perf = {
    now: function now() {
      return Date.now() - start;
    }
  };
}*/

// FILE entity

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/**
 * @module  ecs
 */

/**
 * An entity.
 *
 * @class  Entity
 */

var Entity = (function () {
  /**
   * @class Entity
   * @constructor
   *
   * @param  {Number|UIDGenerator} [idOrUidGenerator=null] The entity id if
   * a Number is passed. If an UIDGenerator is passed, the entity will use
   * it to generate a new id. If nothing is passed, the entity will use
   * the default UIDGenerator.
   *
   * @param {Array[Component]} [components=[]] An array of initial components.
   */

  function Entity(idOrUidGenerator) {
    var components = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, Entity);

    /**
     * Unique identifier of the entity.
     *
     * @property {Number} id
     */
    this.id = null;

    // initialize id depending on what is the first argument
    if (typeof idOrUidGenerator === 'number') {
      // if a number was passed then simply set it as id
      this.id = idOrUidGenerator;
    } else if (idOrUidGenerator instanceof UID.UIDGenerator) {
      // if an instance of UIDGenerator was passed then use it to generate
      // the id. This allow the user to use multiple UID generators and
      // therefore to create entities with unique ids accross a cluster
      // or an async environment. See uid.js for more details
      this.id = idOrUidGenerator.next();
    } else {
      // if nothing was passed simply use the default generator
      this.id = UID.DefaultUIDGenerator.next();
    }

    /**
     * Systems applied to the entity.
     *
     * @property {Array[System]} systems
     */
    this.systems = [];

    /**
     * Indiquate a change in components (a component was removed or added)
     * which require to re-compute entity eligibility to all systems.
     *
     * @property {Boolean} systemsDirty
     */
    this.systemsDirty = false;

    /**
     * Components of the entity stored as key-value pairs.
     *
     * @property {Object} components
     */
    this.components = {};

    // components initialisation
    for (var i = 0, component = undefined; component = components[i]; i += 1) {
      // if a getDefaults method is provided, use it. First because let the
      // runtime allocate the component is way more faster than using a copy
      // function. Secondly because the user may want to provide some kind
      // of logic in components initialisation ALTHOUGH these kind of
      // initialisation should be done in enter() handler
      if (component.getDefaults) {
        this.components[component.name] = component.getDefaults();
      } else {
        this.components[component.name] = Object.assign({}, components[i].defaults);
      }
    }

    /**
     * A reference to parent ECS class.
     * @property {ECS} ecs
     */
    this.ecs = null;
  }

  /**
   * Set the parent ecs reference.
   *
   * @private
   * @param {ECS} ecs An ECS class instance.
   */

  _createClass(Entity, [{
    key: 'addToECS',
    value: function addToECS(ecs) {
      this.ecs = ecs;
      this.setSystemsDirty();
    }

    /**
     * Set the systems dirty flag so the ECS knows this entity
     * needs to recompute eligibility at the beginning of next
     * tick.
     */
  }, {
    key: 'setSystemsDirty',
    value: function setSystemsDirty() {
      if (!this.systemsDirty && this.ecs) {
        this.systemsDirty = true;

        // notify to parent ECS that this entity needs to be tested next tick
        this.ecs.entitiesSystemsDirty.push(this);
      }
    }

    /**
     * Add a system to the entity.
     *
     * @private
     * @param {System} system The system to add.
     */
  }, {
    key: 'addSystem',
    value: function addSystem(system) {
      this.systems.push(system);
    }

    /**
     * Remove a system from the entity.
     *
     * @private
     * @param  {System} system The system reference to remove.
     */
  }, {
    key: 'removeSystem',
    value: function removeSystem(system) {
      var index = this.systems.indexOf(system);

      if (index !== -1) {
        (0, fastSplice)(this.systems, index, 1);
      }
    }

    /**
     * Add a component to the entity. WARNING this method does not copy
     * components data but assign directly the reference for maximum
     * performances. Be sure not to pass the same component reference to
     * many entities.
     *
     * @param {String} name Attribute name of the component to add.
     * @param {Object} data Component data.
     */
  }, {
    key: 'addComponent',
    value: function addComponent(name, data) {
      this.components[name] = data || {};
      this.setSystemsDirty();
    }

    /**
     * Remove a component from the entity. To preserve performances, we
     * simple set the component property to `undefined`. Therefore the
     * property is still enumerable after a call to removeComponent()
     *
     * @param  {String} name Name of the component to remove.
     */
  }, {
    key: 'removeComponent',
    value: function removeComponent(name) {
      if (!this.components[name]) {
        return;
      }

      this.components[name] = undefined;
      this.setSystemsDirty();
    }

    /**
     * Update a component field by field, NOT recursively. If the component
     * does not exists, this method create it silently.
     *
     * @method updateComponent
     * @param  {String} name Name of the component
     * @param  {Object} data Dict of attributes to update
     * @example
     *   entity.addComponent('kite', {vel: 0, pos: {x: 1}});
     *   // entity.component.pos is '{vel: 0, pos: {x: 1}}'
     *   entity.updateComponent('kite', {angle: 90, pos: {y: 1}});
     *   // entity.component.pos is '{vel: 0, angle: 90, pos: {y: 1}}'
     */
  }, {
    key: 'updateComponent',
    value: function updateComponent(name, data) {
      var component = this.components[name];

      if (!component) {
        this.addComponent(name, data);
      } else {
        var keys = Object.keys(data);

        for (var i = 0, key = undefined; key = keys[i]; i += 1) {
          component[key] = data[key];
        }
      }
    }

    /**
     * Update a set of components.
     *
     * @param  {Object} componentsData Dict of components to update.
     */
  }, {
    key: 'updateComponents',
    value: function updateComponents(componentsData) {
      var components = Object.keys(componentsData);

      for (var i = 0, component = undefined; component = components[i]; i += 1) {
        this.updateComponent(component, componentsData[component]);
      }
    }

    /**
     * Dispose the entity.
     *
     * @private
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      for (var i = 0, system; system = this.systems[0]; i += 1) {
        system.removeEntity(this);
      }
    }
  }]);

  return Entity;
})();

// FILE ecs

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/**
 * Entity Component System module
 *
 * @module ecs
 */

/**
 * @class  ECS
 */

var ECS = (function () {
  /**
   * @constructor
   * @class  ECS
   */

  function ECS() {
    _classCallCheck(this, ECS);

    /**
     * Store all entities of the ECS.
     *
     * @property entities
     * @type {Array}
     */
    this.entities = [];

    /**
     * Store entities which need to be tested at beginning of next tick.
     *
     * @property entitiesSystemsDirty
     * @type {Array}
     */
    this.entitiesSystemsDirty = [];

    /**
     * Store all systems of the ECS.
     *
     * @property systems
     * @type {Array}
     */
    this.systems = [];

    /**
     * Count how many updates have been done.
     *
     * @property updateCounter
     * @type {Number}
     */
    this.updateCounter = 0;

    this.lastUpdate = perf.now();
  }

  // expose user stuff

  /**
   * Retrieve an entity by id
   * @param  {Number} id id of the entity to retrieve
   * @return {Entity} The entity if found null otherwise
   */

  _createClass(ECS, [{
    key: 'getEntityById',
    value: function getEntityById(id) {
      for (var i = 0, entity = undefined; entity = this.entities[i]; i += 1) {
        if (entity.id === id) {
          return entity;
        }
      }

      return null;
    }

    /**
     * Add an entity to the ecs.
     *
     * @method addEntity
     * @param {Entity} entity The entity to add.
     */
  }, {
    key: 'addEntity',
    value: function addEntity(entity) {
      this.entities.push(entity);
      entity.addToECS(this);
    }

    /**
     * Remove an entity from the ecs by reference.
     *
     * @method removeEntity
     * @param  {Entity} entity reference of the entity to remove
     * @return {Entity}        the remove entity if any
     */
  }, {
    key: 'removeEntity',
    value: function removeEntity(entity) {
      var index = this.entities.indexOf(entity);
      var entityRemoved = null;

      // if the entity is not found do nothing
      if (index !== -1) {
        entityRemoved = this.entities[index];

        entity.dispose();
        this.removeEntityIfDirty(entityRemoved);

        (0, fastSplice)(this.entities, index, 1);
      }

      return entityRemoved;
    }

    /**
     * Remove an entity from the ecs by entity id.
     *
     * @method removeEntityById
     * @param  {Entity} entityId id of the entity to remove
     * @return {Entity}          removed entity if any
     */
  }, {
    key: 'removeEntityById',
    value: function removeEntityById(entityId) {
      for (var i = 0, entity = undefined; entity = this.entities[i]; i += 1) {
        if (entity.id === entityId) {
          entity.dispose();
          this.removeEntityIfDirty(entity);

          (0, fastSplice)(this.entities, i, 1);

          return entity;
        }
      }
    }

    /**
     * Remove an entity from dirty entities by reference.
     *
     * @private
     * @method removeEntityIfDirty
     * @param  {[type]} entity entity to remove
     */
  }, {
    key: 'removeEntityIfDirty',
    value: function removeEntityIfDirty(entity) {
      var index = this.entitiesSystemsDirty.indexOf(entity);

      if (index !== -1) {
        (0, fastSplice)(this.entities, index, 1);
      }
    }

    /**
     * Add a system to the ecs.
     *
     * @method addSystem
     * @param {System} system system to add
     */
  }, {
    key: 'addSystem',
    value: function addSystem(system) {
      this.systems.push(system);

      // iterate over all entities to eventually add system
      for (var i = 0, entity = undefined; entity = this.entities[i]; i += 1) {
        if (system.test(entity)) {
          system.addEntity(entity);
        }
      }
    }

    /**
     * Remove a system from the ecs.
     *
     * @method removeSystem
     * @param  {System} system system reference
     */
  }, {
    key: 'removeSystem',
    value: function removeSystem(system) {
      var index = this.systems.indexOf(system);

      if (index !== -1) {
        (0, fastSplice)(this.systems, index, 1);
        system.dispose();
      }
    }

    /**
     * "Clean" entities flagged as dirty by removing unecessary systems and
     * adding missing systems.
     *
     * @private
     * @method cleanDirtyEntities
     */
  }, {
    key: 'cleanDirtyEntities',
    value: function cleanDirtyEntities() {
      // jshint maxdepth: 4

      for (var i = 0, entity = undefined; entity = this.entitiesSystemsDirty[i]; i += 1) {
        for (var s = 0, system = undefined; system = this.systems[s]; s += 1) {
          // for each dirty entity for each system
          var index = entity.systems.indexOf(system);
          var entityTest = system.test(entity);

          if (index === -1 && entityTest) {
            // if the entity is not added to the system yet and should be, add it
            system.addEntity(entity);
          } else if (index !== -1 && !entityTest) {
            // if the entity is added to the system but should not be, remove it
            system.removeEntity(entity);
          }
          // else we do nothing the current state is OK
        }

        entity.systemsDirty = false;
      }
      // jshint maxdepth: 3

      this.entitiesSystemsDirty = [];
    }

    /**
     * Update the ecs.
     *
     * @method update
     */
  }, {
    key: 'update',
    value: function update() {
      var now = perf.now();
      var elapsed = now - this.lastUpdate;

      for (var i = 0, system = undefined; system = this.systems[i]; i += 1) {
        if (this.updateCounter % system.frequency > 0) {
          break;
        }

        if (this.entitiesSystemsDirty.length) {
          // if the last system flagged some entities as dirty check that case
          this.cleanDirtyEntities();
        }

        system.updateAll(elapsed);
      }

      this.updateCounter += 1;
      this.lastUpdate = now;
    }
  }]);

  return ECS;
})();

ECS.Entity = Entity;
ECS.System = System;
ECS.uid = UID;
