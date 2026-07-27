(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e2) {
      throw mod = 0, e2;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context2, once) {
        this.fn = fn;
        this.context = context2;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context2, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context2 || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0) return names;
        for (name in events = this._events) {
          if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i2 = 0, l2 = handlers.length, ee = new Array(l2); i2 < l2; i2++) {
          ee[i2] = handlers[i2].fn;
        }
        return ee;
      };
      EventEmitter.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i2;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i2 = 1, args = new Array(len - 1); i2 < len; i2++) {
            args[i2 - 1] = arguments[i2];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length, j2;
          for (i2 = 0; i2 < length; i2++) {
            if (listeners[i2].once) this.removeListener(event, listeners[i2].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i2].fn.call(listeners[i2].context);
                break;
              case 2:
                listeners[i2].fn.call(listeners[i2].context, a1);
                break;
              case 3:
                listeners[i2].fn.call(listeners[i2].context, a1, a2);
                break;
              case 4:
                listeners[i2].fn.call(listeners[i2].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j2 = 1, args = new Array(len - 1); j2 < len; j2++) {
                  args[j2 - 1] = arguments[j2];
                }
                listeners[i2].fn.apply(listeners[i2].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter.prototype.on = function on(event, fn, context2) {
        return addListener(this, event, fn, context2, false);
      };
      EventEmitter.prototype.once = function once(event, fn, context2) {
        return addListener(this, event, fn, context2, true);
      };
      EventEmitter.prototype.removeListener = function removeListener(event, fn, context2, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context2 || listeners.context === context2)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i2 = 0, events = [], length = listeners.length; i2 < length; i2++) {
            if (listeners[i2].fn !== fn || once && !listeners[i2].once || context2 && listeners[i2].context !== context2) {
              events.push(listeners[i2]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
        var evt;
        if (event) {
          evt = prefix ? prefix + event : event;
          if (this._events[evt]) clearEvent(this, evt);
        } else {
          this._events = new Events();
          this._eventsCount = 0;
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.addListener = EventEmitter.prototype.on;
      EventEmitter.prefixed = prefix;
      EventEmitter.EventEmitter = EventEmitter;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter;
      }
    }
  });

  // node_modules/earcut/src/earcut.js
  var require_earcut = __commonJS({
    "node_modules/earcut/src/earcut.js"(exports, module) {
      "use strict";
      module.exports = earcut;
      module.exports.default = earcut;
      function earcut(data, holeIndices, dim) {
        dim = dim || 2;
        var hasHoles = holeIndices && holeIndices.length, outerLen = hasHoles ? holeIndices[0] * dim : data.length, outerNode = linkedList(data, 0, outerLen, dim, true), triangles = [];
        if (!outerNode || outerNode.next === outerNode.prev) return triangles;
        var minX, minY, maxX, maxY, x2, y2, invSize;
        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
        if (data.length > 80 * dim) {
          minX = maxX = data[0];
          minY = maxY = data[1];
          for (var i2 = dim; i2 < outerLen; i2 += dim) {
            x2 = data[i2];
            y2 = data[i2 + 1];
            if (x2 < minX) minX = x2;
            if (y2 < minY) minY = y2;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
          }
          invSize = Math.max(maxX - minX, maxY - minY);
          invSize = invSize !== 0 ? 32767 / invSize : 0;
        }
        earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);
        return triangles;
      }
      function linkedList(data, start, end, dim, clockwise) {
        var i2, last;
        if (clockwise === signedArea(data, start, end, dim) > 0) {
          for (i2 = start; i2 < end; i2 += dim) last = insertNode(i2, data[i2], data[i2 + 1], last);
        } else {
          for (i2 = end - dim; i2 >= start; i2 -= dim) last = insertNode(i2, data[i2], data[i2 + 1], last);
        }
        if (last && equals(last, last.next)) {
          removeNode(last);
          last = last.next;
        }
        return last;
      }
      function filterPoints(start, end) {
        if (!start) return start;
        if (!end) end = start;
        var p3 = start, again;
        do {
          again = false;
          if (!p3.steiner && (equals(p3, p3.next) || area(p3.prev, p3, p3.next) === 0)) {
            removeNode(p3);
            p3 = end = p3.prev;
            if (p3 === p3.next) break;
            again = true;
          } else {
            p3 = p3.next;
          }
        } while (again || p3 !== end);
        return end;
      }
      function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) return;
        if (!pass && invSize) indexCurve(ear, minX, minY, invSize);
        var stop = ear, prev, next;
        while (ear.prev !== ear.next) {
          prev = ear.prev;
          next = ear.next;
          if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            triangles.push(prev.i / dim | 0);
            triangles.push(ear.i / dim | 0);
            triangles.push(next.i / dim | 0);
            removeNode(ear);
            ear = next.next;
            stop = next.next;
            continue;
          }
          ear = next;
          if (ear === stop) {
            if (!pass) {
              earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
            } else if (pass === 1) {
              ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
              earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
            } else if (pass === 2) {
              splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }
            break;
          }
        }
      }
      function isEar(ear) {
        var a2 = ear.prev, b2 = ear, c2 = ear.next;
        if (area(a2, b2, c2) >= 0) return false;
        var ax = a2.x, bx = b2.x, cx = c2.x, ay = a2.y, by = b2.y, cy = c2.y;
        var x0 = ax < bx ? ax < cx ? ax : cx : bx < cx ? bx : cx, y0 = ay < by ? ay < cy ? ay : cy : by < cy ? by : cy, x1 = ax > bx ? ax > cx ? ax : cx : bx > cx ? bx : cx, y1 = ay > by ? ay > cy ? ay : cy : by > cy ? by : cy;
        var p3 = c2.next;
        while (p3 !== a2) {
          if (p3.x >= x0 && p3.x <= x1 && p3.y >= y0 && p3.y <= y1 && pointInTriangle(ax, ay, bx, by, cx, cy, p3.x, p3.y) && area(p3.prev, p3, p3.next) >= 0) return false;
          p3 = p3.next;
        }
        return true;
      }
      function isEarHashed(ear, minX, minY, invSize) {
        var a2 = ear.prev, b2 = ear, c2 = ear.next;
        if (area(a2, b2, c2) >= 0) return false;
        var ax = a2.x, bx = b2.x, cx = c2.x, ay = a2.y, by = b2.y, cy = c2.y;
        var x0 = ax < bx ? ax < cx ? ax : cx : bx < cx ? bx : cx, y0 = ay < by ? ay < cy ? ay : cy : by < cy ? by : cy, x1 = ax > bx ? ax > cx ? ax : cx : bx > cx ? bx : cx, y1 = ay > by ? ay > cy ? ay : cy : by > cy ? by : cy;
        var minZ = zOrder(x0, y0, minX, minY, invSize), maxZ = zOrder(x1, y1, minX, minY, invSize);
        var p3 = ear.prevZ, n3 = ear.nextZ;
        while (p3 && p3.z >= minZ && n3 && n3.z <= maxZ) {
          if (p3.x >= x0 && p3.x <= x1 && p3.y >= y0 && p3.y <= y1 && p3 !== a2 && p3 !== c2 && pointInTriangle(ax, ay, bx, by, cx, cy, p3.x, p3.y) && area(p3.prev, p3, p3.next) >= 0) return false;
          p3 = p3.prevZ;
          if (n3.x >= x0 && n3.x <= x1 && n3.y >= y0 && n3.y <= y1 && n3 !== a2 && n3 !== c2 && pointInTriangle(ax, ay, bx, by, cx, cy, n3.x, n3.y) && area(n3.prev, n3, n3.next) >= 0) return false;
          n3 = n3.nextZ;
        }
        while (p3 && p3.z >= minZ) {
          if (p3.x >= x0 && p3.x <= x1 && p3.y >= y0 && p3.y <= y1 && p3 !== a2 && p3 !== c2 && pointInTriangle(ax, ay, bx, by, cx, cy, p3.x, p3.y) && area(p3.prev, p3, p3.next) >= 0) return false;
          p3 = p3.prevZ;
        }
        while (n3 && n3.z <= maxZ) {
          if (n3.x >= x0 && n3.x <= x1 && n3.y >= y0 && n3.y <= y1 && n3 !== a2 && n3 !== c2 && pointInTriangle(ax, ay, bx, by, cx, cy, n3.x, n3.y) && area(n3.prev, n3, n3.next) >= 0) return false;
          n3 = n3.nextZ;
        }
        return true;
      }
      function cureLocalIntersections(start, triangles, dim) {
        var p3 = start;
        do {
          var a2 = p3.prev, b2 = p3.next.next;
          if (!equals(a2, b2) && intersects(a2, p3, p3.next, b2) && locallyInside(a2, b2) && locallyInside(b2, a2)) {
            triangles.push(a2.i / dim | 0);
            triangles.push(p3.i / dim | 0);
            triangles.push(b2.i / dim | 0);
            removeNode(p3);
            removeNode(p3.next);
            p3 = start = b2;
          }
          p3 = p3.next;
        } while (p3 !== start);
        return filterPoints(p3);
      }
      function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        var a2 = start;
        do {
          var b2 = a2.next.next;
          while (b2 !== a2.prev) {
            if (a2.i !== b2.i && isValidDiagonal(a2, b2)) {
              var c2 = splitPolygon(a2, b2);
              a2 = filterPoints(a2, a2.next);
              c2 = filterPoints(c2, c2.next);
              earcutLinked(a2, triangles, dim, minX, minY, invSize, 0);
              earcutLinked(c2, triangles, dim, minX, minY, invSize, 0);
              return;
            }
            b2 = b2.next;
          }
          a2 = a2.next;
        } while (a2 !== start);
      }
      function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [], i2, len, start, end, list;
        for (i2 = 0, len = holeIndices.length; i2 < len; i2++) {
          start = holeIndices[i2] * dim;
          end = i2 < len - 1 ? holeIndices[i2 + 1] * dim : data.length;
          list = linkedList(data, start, end, dim, false);
          if (list === list.next) list.steiner = true;
          queue.push(getLeftmost(list));
        }
        queue.sort(compareX);
        for (i2 = 0; i2 < queue.length; i2++) {
          outerNode = eliminateHole(queue[i2], outerNode);
        }
        return outerNode;
      }
      function compareX(a2, b2) {
        return a2.x - b2.x;
      }
      function eliminateHole(hole, outerNode) {
        var bridge = findHoleBridge(hole, outerNode);
        if (!bridge) {
          return outerNode;
        }
        var bridgeReverse = splitPolygon(bridge, hole);
        filterPoints(bridgeReverse, bridgeReverse.next);
        return filterPoints(bridge, bridge.next);
      }
      function findHoleBridge(hole, outerNode) {
        var p3 = outerNode, hx = hole.x, hy = hole.y, qx = -Infinity, m2;
        do {
          if (hy <= p3.y && hy >= p3.next.y && p3.next.y !== p3.y) {
            var x2 = p3.x + (hy - p3.y) * (p3.next.x - p3.x) / (p3.next.y - p3.y);
            if (x2 <= hx && x2 > qx) {
              qx = x2;
              m2 = p3.x < p3.next.x ? p3 : p3.next;
              if (x2 === hx) return m2;
            }
          }
          p3 = p3.next;
        } while (p3 !== outerNode);
        if (!m2) return null;
        var stop = m2, mx = m2.x, my = m2.y, tanMin = Infinity, tan;
        p3 = m2;
        do {
          if (hx >= p3.x && p3.x >= mx && hx !== p3.x && pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p3.x, p3.y)) {
            tan = Math.abs(hy - p3.y) / (hx - p3.x);
            if (locallyInside(p3, hole) && (tan < tanMin || tan === tanMin && (p3.x > m2.x || p3.x === m2.x && sectorContainsSector(m2, p3)))) {
              m2 = p3;
              tanMin = tan;
            }
          }
          p3 = p3.next;
        } while (p3 !== stop);
        return m2;
      }
      function sectorContainsSector(m2, p3) {
        return area(m2.prev, m2, p3.prev) < 0 && area(p3.next, m2, m2.next) < 0;
      }
      function indexCurve(start, minX, minY, invSize) {
        var p3 = start;
        do {
          if (p3.z === 0) p3.z = zOrder(p3.x, p3.y, minX, minY, invSize);
          p3.prevZ = p3.prev;
          p3.nextZ = p3.next;
          p3 = p3.next;
        } while (p3 !== start);
        p3.prevZ.nextZ = null;
        p3.prevZ = null;
        sortLinked(p3);
      }
      function sortLinked(list) {
        var i2, p3, q, e2, tail, numMerges, pSize, qSize, inSize = 1;
        do {
          p3 = list;
          list = null;
          tail = null;
          numMerges = 0;
          while (p3) {
            numMerges++;
            q = p3;
            pSize = 0;
            for (i2 = 0; i2 < inSize; i2++) {
              pSize++;
              q = q.nextZ;
              if (!q) break;
            }
            qSize = inSize;
            while (pSize > 0 || qSize > 0 && q) {
              if (pSize !== 0 && (qSize === 0 || !q || p3.z <= q.z)) {
                e2 = p3;
                p3 = p3.nextZ;
                pSize--;
              } else {
                e2 = q;
                q = q.nextZ;
                qSize--;
              }
              if (tail) tail.nextZ = e2;
              else list = e2;
              e2.prevZ = tail;
              tail = e2;
            }
            p3 = q;
          }
          tail.nextZ = null;
          inSize *= 2;
        } while (numMerges > 1);
        return list;
      }
      function zOrder(x2, y2, minX, minY, invSize) {
        x2 = (x2 - minX) * invSize | 0;
        y2 = (y2 - minY) * invSize | 0;
        x2 = (x2 | x2 << 8) & 16711935;
        x2 = (x2 | x2 << 4) & 252645135;
        x2 = (x2 | x2 << 2) & 858993459;
        x2 = (x2 | x2 << 1) & 1431655765;
        y2 = (y2 | y2 << 8) & 16711935;
        y2 = (y2 | y2 << 4) & 252645135;
        y2 = (y2 | y2 << 2) & 858993459;
        y2 = (y2 | y2 << 1) & 1431655765;
        return x2 | y2 << 1;
      }
      function getLeftmost(start) {
        var p3 = start, leftmost = start;
        do {
          if (p3.x < leftmost.x || p3.x === leftmost.x && p3.y < leftmost.y) leftmost = p3;
          p3 = p3.next;
        } while (p3 !== start);
        return leftmost;
      }
      function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) >= (ax - px) * (cy - py) && (ax - px) * (by - py) >= (bx - px) * (ay - py) && (bx - px) * (cy - py) >= (cx - px) * (by - py);
      }
      function isValidDiagonal(a2, b2) {
        return a2.next.i !== b2.i && a2.prev.i !== b2.i && !intersectsPolygon(a2, b2) && // dones't intersect other edges
        (locallyInside(a2, b2) && locallyInside(b2, a2) && middleInside(a2, b2) && // locally visible
        (area(a2.prev, a2, b2.prev) || area(a2, b2.prev, b2)) || // does not create opposite-facing sectors
        equals(a2, b2) && area(a2.prev, a2, a2.next) > 0 && area(b2.prev, b2, b2.next) > 0);
      }
      function area(p3, q, r2) {
        return (q.y - p3.y) * (r2.x - q.x) - (q.x - p3.x) * (r2.y - q.y);
      }
      function equals(p1, p22) {
        return p1.x === p22.x && p1.y === p22.y;
      }
      function intersects(p1, q1, p22, q2) {
        var o1 = sign2(area(p1, q1, p22));
        var o2 = sign2(area(p1, q1, q2));
        var o3 = sign2(area(p22, q2, p1));
        var o4 = sign2(area(p22, q2, q1));
        if (o1 !== o2 && o3 !== o4) return true;
        if (o1 === 0 && onSegment(p1, p22, q1)) return true;
        if (o2 === 0 && onSegment(p1, q2, q1)) return true;
        if (o3 === 0 && onSegment(p22, p1, q2)) return true;
        if (o4 === 0 && onSegment(p22, q1, q2)) return true;
        return false;
      }
      function onSegment(p3, q, r2) {
        return q.x <= Math.max(p3.x, r2.x) && q.x >= Math.min(p3.x, r2.x) && q.y <= Math.max(p3.y, r2.y) && q.y >= Math.min(p3.y, r2.y);
      }
      function sign2(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
      }
      function intersectsPolygon(a2, b2) {
        var p3 = a2;
        do {
          if (p3.i !== a2.i && p3.next.i !== a2.i && p3.i !== b2.i && p3.next.i !== b2.i && intersects(p3, p3.next, a2, b2)) return true;
          p3 = p3.next;
        } while (p3 !== a2);
        return false;
      }
      function locallyInside(a2, b2) {
        return area(a2.prev, a2, a2.next) < 0 ? area(a2, b2, a2.next) >= 0 && area(a2, a2.prev, b2) >= 0 : area(a2, b2, a2.prev) < 0 || area(a2, a2.next, b2) < 0;
      }
      function middleInside(a2, b2) {
        var p3 = a2, inside = false, px = (a2.x + b2.x) / 2, py = (a2.y + b2.y) / 2;
        do {
          if (p3.y > py !== p3.next.y > py && p3.next.y !== p3.y && px < (p3.next.x - p3.x) * (py - p3.y) / (p3.next.y - p3.y) + p3.x)
            inside = !inside;
          p3 = p3.next;
        } while (p3 !== a2);
        return inside;
      }
      function splitPolygon(a2, b2) {
        var a22 = new Node2(a2.i, a2.x, a2.y), b22 = new Node2(b2.i, b2.x, b2.y), an = a2.next, bp = b2.prev;
        a2.next = b2;
        b2.prev = a2;
        a22.next = an;
        an.prev = a22;
        b22.next = a22;
        a22.prev = b22;
        bp.next = b22;
        b22.prev = bp;
        return b22;
      }
      function insertNode(i2, x2, y2, last) {
        var p3 = new Node2(i2, x2, y2);
        if (!last) {
          p3.prev = p3;
          p3.next = p3;
        } else {
          p3.next = last.next;
          p3.prev = last;
          last.next.prev = p3;
          last.next = p3;
        }
        return p3;
      }
      function removeNode(p3) {
        p3.next.prev = p3.prev;
        p3.prev.next = p3.next;
        if (p3.prevZ) p3.prevZ.nextZ = p3.nextZ;
        if (p3.nextZ) p3.nextZ.prevZ = p3.prevZ;
      }
      function Node2(i2, x2, y2) {
        this.i = i2;
        this.x = x2;
        this.y = y2;
        this.prev = null;
        this.next = null;
        this.z = 0;
        this.prevZ = null;
        this.nextZ = null;
        this.steiner = false;
      }
      earcut.deviation = function(data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;
        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
          for (var i2 = 0, len = holeIndices.length; i2 < len; i2++) {
            var start = holeIndices[i2] * dim;
            var end = i2 < len - 1 ? holeIndices[i2 + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
          }
        }
        var trianglesArea = 0;
        for (i2 = 0; i2 < triangles.length; i2 += 3) {
          var a2 = triangles[i2] * dim;
          var b2 = triangles[i2 + 1] * dim;
          var c2 = triangles[i2 + 2] * dim;
          trianglesArea += Math.abs(
            (data[a2] - data[c2]) * (data[b2 + 1] - data[a2 + 1]) - (data[a2] - data[b2]) * (data[c2 + 1] - data[a2 + 1])
          );
        }
        return polygonArea === 0 && trianglesArea === 0 ? 0 : Math.abs((trianglesArea - polygonArea) / polygonArea);
      };
      function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i2 = start, j2 = end - dim; i2 < end; i2 += dim) {
          sum += (data[j2] - data[i2]) * (data[i2 + 1] + data[j2 + 1]);
          j2 = i2;
        }
        return sum;
      }
      earcut.flatten = function(data) {
        var dim = data[0][0].length, result = { vertices: [], holes: [], dimensions: dim }, holeIndex = 0;
        for (var i2 = 0; i2 < data.length; i2++) {
          for (var j2 = 0; j2 < data[i2].length; j2++) {
            for (var d3 = 0; d3 < dim; d3++) result.vertices.push(data[i2][j2][d3]);
          }
          if (i2 > 0) {
            holeIndex += data[i2 - 1].length;
            result.holes.push(holeIndex);
          }
        }
        return result;
      };
    }
  });

  // node_modules/punycode/punycode.js
  var require_punycode = __commonJS({
    "node_modules/punycode/punycode.js"(exports, module) {
      (function(root) {
        var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
        var freeModule = typeof module == "object" && module && !module.nodeType && module;
        var freeGlobal = typeof global == "object" && global;
        if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
          root = freeGlobal;
        }
        var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
          "overflow": "Overflow: input needs wider integers to process",
          "not-basic": "Illegal input >= 0x80 (not a basic code point)",
          "invalid-input": "Invalid input"
        }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
        function error(type) {
          throw new RangeError(errors[type]);
        }
        function map4(array, fn) {
          var length = array.length;
          var result = [];
          while (length--) {
            result[length] = fn(array[length]);
          }
          return result;
        }
        function mapDomain(string, fn) {
          var parts = string.split("@");
          var result = "";
          if (parts.length > 1) {
            result = parts[0] + "@";
            string = parts[1];
          }
          string = string.replace(regexSeparators, ".");
          var labels = string.split(".");
          var encoded = map4(labels, fn).join(".");
          return result + encoded;
        }
        function ucs2decode(string) {
          var output = [], counter = 0, length = string.length, value, extra;
          while (counter < length) {
            value = string.charCodeAt(counter++);
            if (value >= 55296 && value <= 56319 && counter < length) {
              extra = string.charCodeAt(counter++);
              if ((extra & 64512) == 56320) {
                output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
              } else {
                output.push(value);
                counter--;
              }
            } else {
              output.push(value);
            }
          }
          return output;
        }
        function ucs2encode(array) {
          return map4(array, function(value) {
            var output = "";
            if (value > 65535) {
              value -= 65536;
              output += stringFromCharCode(value >>> 10 & 1023 | 55296);
              value = 56320 | value & 1023;
            }
            output += stringFromCharCode(value);
            return output;
          }).join("");
        }
        function basicToDigit(codePoint) {
          if (codePoint - 48 < 10) {
            return codePoint - 22;
          }
          if (codePoint - 65 < 26) {
            return codePoint - 65;
          }
          if (codePoint - 97 < 26) {
            return codePoint - 97;
          }
          return base;
        }
        function digitToBasic(digit, flag) {
          return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
        }
        function adapt(delta, numPoints, firstTime) {
          var k2 = 0;
          delta = firstTime ? floor(delta / damp) : delta >> 1;
          delta += floor(delta / numPoints);
          for (; delta > baseMinusTMin * tMax >> 1; k2 += base) {
            delta = floor(delta / baseMinusTMin);
          }
          return floor(k2 + (baseMinusTMin + 1) * delta / (delta + skew));
        }
        function decode(input) {
          var output = [], inputLength = input.length, out, i2 = 0, n3 = initialN, bias = initialBias, basic, j2, index, oldi, w2, k2, digit, t3, baseMinusT;
          basic = input.lastIndexOf(delimiter);
          if (basic < 0) {
            basic = 0;
          }
          for (j2 = 0; j2 < basic; ++j2) {
            if (input.charCodeAt(j2) >= 128) {
              error("not-basic");
            }
            output.push(input.charCodeAt(j2));
          }
          for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
            for (oldi = i2, w2 = 1, k2 = base; ; k2 += base) {
              if (index >= inputLength) {
                error("invalid-input");
              }
              digit = basicToDigit(input.charCodeAt(index++));
              if (digit >= base || digit > floor((maxInt - i2) / w2)) {
                error("overflow");
              }
              i2 += digit * w2;
              t3 = k2 <= bias ? tMin : k2 >= bias + tMax ? tMax : k2 - bias;
              if (digit < t3) {
                break;
              }
              baseMinusT = base - t3;
              if (w2 > floor(maxInt / baseMinusT)) {
                error("overflow");
              }
              w2 *= baseMinusT;
            }
            out = output.length + 1;
            bias = adapt(i2 - oldi, out, oldi == 0);
            if (floor(i2 / out) > maxInt - n3) {
              error("overflow");
            }
            n3 += floor(i2 / out);
            i2 %= out;
            output.splice(i2++, 0, n3);
          }
          return ucs2encode(output);
        }
        function encode(input) {
          var n3, delta, handledCPCount, basicLength, bias, j2, m2, q, k2, t3, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
          input = ucs2decode(input);
          inputLength = input.length;
          n3 = initialN;
          delta = 0;
          bias = initialBias;
          for (j2 = 0; j2 < inputLength; ++j2) {
            currentValue = input[j2];
            if (currentValue < 128) {
              output.push(stringFromCharCode(currentValue));
            }
          }
          handledCPCount = basicLength = output.length;
          if (basicLength) {
            output.push(delimiter);
          }
          while (handledCPCount < inputLength) {
            for (m2 = maxInt, j2 = 0; j2 < inputLength; ++j2) {
              currentValue = input[j2];
              if (currentValue >= n3 && currentValue < m2) {
                m2 = currentValue;
              }
            }
            handledCPCountPlusOne = handledCPCount + 1;
            if (m2 - n3 > floor((maxInt - delta) / handledCPCountPlusOne)) {
              error("overflow");
            }
            delta += (m2 - n3) * handledCPCountPlusOne;
            n3 = m2;
            for (j2 = 0; j2 < inputLength; ++j2) {
              currentValue = input[j2];
              if (currentValue < n3 && ++delta > maxInt) {
                error("overflow");
              }
              if (currentValue == n3) {
                for (q = delta, k2 = base; ; k2 += base) {
                  t3 = k2 <= bias ? tMin : k2 >= bias + tMax ? tMax : k2 - bias;
                  if (q < t3) {
                    break;
                  }
                  qMinusT = q - t3;
                  baseMinusT = base - t3;
                  output.push(
                    stringFromCharCode(digitToBasic(t3 + qMinusT % baseMinusT, 0))
                  );
                  q = floor(qMinusT / baseMinusT);
                }
                output.push(stringFromCharCode(digitToBasic(q, 0)));
                bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                delta = 0;
                ++handledCPCount;
              }
            }
            ++delta;
            ++n3;
          }
          return output.join("");
        }
        function toUnicode(input) {
          return mapDomain(input, function(string) {
            return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
          });
        }
        function toASCII(input) {
          return mapDomain(input, function(string) {
            return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
          });
        }
        punycode = {
          /**
           * A string representing the current Punycode.js version number.
           * @memberOf punycode
           * @type String
           */
          "version": "1.4.1",
          /**
           * An object of methods to convert from JavaScript's internal character
           * representation (UCS-2) to Unicode code points, and back.
           * @see <https://mathiasbynens.be/notes/javascript-encoding>
           * @memberOf punycode
           * @type Object
           */
          "ucs2": {
            "decode": ucs2decode,
            "encode": ucs2encode
          },
          "decode": decode,
          "encode": encode,
          "toASCII": toASCII,
          "toUnicode": toUnicode
        };
        if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
          define("punycode", function() {
            return punycode;
          });
        } else if (freeExports && freeModule) {
          if (module.exports == freeExports) {
            freeModule.exports = punycode;
          } else {
            for (key in punycode) {
              punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
            }
          }
        } else {
          root.punycode = punycode;
        }
      })(exports);
    }
  });

  // node_modules/es-errors/type.js
  var require_type = __commonJS({
    "node_modules/es-errors/type.js"(exports, module) {
      "use strict";
      module.exports = TypeError;
    }
  });

  // (disabled):node_modules/object-inspect/util.inspect
  var require_util = __commonJS({
    "(disabled):node_modules/object-inspect/util.inspect"() {
    }
  });

  // node_modules/object-inspect/index.js
  var require_object_inspect = __commonJS({
    "node_modules/object-inspect/index.js"(exports, module) {
      var hasMap = typeof Map === "function" && Map.prototype;
      var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, "size") : null;
      var mapSize2 = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === "function" ? mapSizeDescriptor.get : null;
      var mapForEach = hasMap && Map.prototype.forEach;
      var hasSet = typeof Set === "function" && Set.prototype;
      var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null;
      var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === "function" ? setSizeDescriptor.get : null;
      var setForEach = hasSet && Set.prototype.forEach;
      var hasWeakMap = typeof WeakMap === "function" && WeakMap.prototype;
      var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
      var hasWeakSet = typeof WeakSet === "function" && WeakSet.prototype;
      var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
      var hasWeakRef = typeof WeakRef === "function" && WeakRef.prototype;
      var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
      var booleanValueOf = Boolean.prototype.valueOf;
      var objectToString = Object.prototype.toString;
      var functionToString = Function.prototype.toString;
      var $match = String.prototype.match;
      var $slice = String.prototype.slice;
      var $replace = String.prototype.replace;
      var $toUpperCase = String.prototype.toUpperCase;
      var $toLowerCase = String.prototype.toLowerCase;
      var $test = RegExp.prototype.test;
      var $concat = Array.prototype.concat;
      var $join = Array.prototype.join;
      var $arrSlice = Array.prototype.slice;
      var $floor = Math.floor;
      var bigIntValueOf = typeof BigInt === "function" ? BigInt.prototype.valueOf : null;
      var gOPS = Object.getOwnPropertySymbols;
      var symToString = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol.prototype.toString : null;
      var hasShammedSymbols = typeof Symbol === "function" && typeof Symbol.iterator === "object";
      var toStringTag = typeof Symbol === "function" && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? "object" : "symbol") ? Symbol.toStringTag : null;
      var isEnumerable = Object.prototype.propertyIsEnumerable;
      var gPO = (typeof Reflect === "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) || ([].__proto__ === Array.prototype ? function(O) {
        return O.__proto__;
      } : null);
      function addNumericSeparator(num, str) {
        if (num === Infinity || num === -Infinity || num !== num || num && num > -1e3 && num < 1e3 || $test.call(/e/, str)) {
          return str;
        }
        var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
        if (typeof num === "number") {
          var int = num < 0 ? -$floor(-num) : $floor(num);
          if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, "$&_") + "." + $replace.call($replace.call(dec, /([0-9]{3})/g, "$&_"), /_$/, "");
          }
        }
        return $replace.call(str, sepRegex, "$&_");
      }
      var utilInspect = require_util();
      var inspectCustom = utilInspect.custom;
      var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;
      var quotes = {
        __proto__: null,
        "double": '"',
        single: "'"
      };
      var quoteREs = {
        __proto__: null,
        "double": /(["\\])/g,
        single: /(['\\])/g
      };
      module.exports = function inspect_(obj, options, depth, seen) {
        var opts = options || {};
        if (has(opts, "quoteStyle") && !has(quotes, opts.quoteStyle)) {
          throw new TypeError('option "quoteStyle" must be "single" or "double"');
        }
        if (has(opts, "maxStringLength") && (typeof opts.maxStringLength === "number" ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity : opts.maxStringLength !== null)) {
          throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
        }
        var customInspect = has(opts, "customInspect") ? opts.customInspect : true;
        if (typeof customInspect !== "boolean" && customInspect !== "symbol") {
          throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
        }
        if (has(opts, "indent") && opts.indent !== null && opts.indent !== "	" && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)) {
          throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
        }
        if (has(opts, "numericSeparator") && typeof opts.numericSeparator !== "boolean") {
          throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
        }
        var numericSeparator = opts.numericSeparator;
        if (typeof obj === "undefined") {
          return "undefined";
        }
        if (obj === null) {
          return "null";
        }
        if (typeof obj === "boolean") {
          return obj ? "true" : "false";
        }
        if (typeof obj === "string") {
          return inspectString(obj, opts);
        }
        if (typeof obj === "number") {
          if (obj === 0) {
            return Infinity / obj > 0 ? "0" : "-0";
          }
          var str = String(obj);
          return numericSeparator ? addNumericSeparator(obj, str) : str;
        }
        if (typeof obj === "bigint") {
          var bigIntStr = String(obj) + "n";
          return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
        }
        var maxDepth = typeof opts.depth === "undefined" ? 5 : opts.depth;
        if (typeof depth === "undefined") {
          depth = 0;
        }
        if (depth >= maxDepth && maxDepth > 0 && typeof obj === "object") {
          return isArray(obj) ? "[Array]" : "[Object]";
        }
        var indent = getIndent(opts, depth);
        if (typeof seen === "undefined") {
          seen = [];
        } else if (indexOf(seen, obj) >= 0) {
          return "[Circular]";
        }
        function inspect(value, from, noIndent) {
          if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
          }
          if (noIndent) {
            var newOpts = {
              depth: opts.depth
            };
            if (has(opts, "quoteStyle")) {
              newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
          }
          return inspect_(value, opts, depth + 1, seen);
        }
        if (typeof obj === "function" && !isRegExp(obj)) {
          var name = nameOf(obj);
          var keys2 = arrObjKeys(obj, inspect);
          return "[Function" + (name ? ": " + name : " (anonymous)") + "]" + (keys2.length > 0 ? " { " + $join.call(keys2, ", ") + " }" : "");
        }
        if (isSymbol(obj)) {
          var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, "$1") : symToString.call(obj);
          return typeof obj === "object" && !hasShammedSymbols ? markBoxed(symString) : symString;
        }
        if (isElement(obj)) {
          var s2 = "<" + $toLowerCase.call(String(obj.nodeName));
          var attrs = obj.attributes || [];
          for (var i2 = 0; i2 < attrs.length; i2++) {
            s2 += " " + attrs[i2].name + "=" + wrapQuotes(quote(attrs[i2].value), "double", opts);
          }
          s2 += ">";
          if (obj.childNodes && obj.childNodes.length) {
            s2 += "...";
          }
          s2 += "</" + $toLowerCase.call(String(obj.nodeName)) + ">";
          return s2;
        }
        if (isArray(obj)) {
          if (obj.length === 0) {
            return "[]";
          }
          var xs = arrObjKeys(obj, inspect);
          if (indent && !singleLineValues(xs)) {
            return "[" + indentedJoin(xs, indent) + "]";
          }
          return "[ " + $join.call(xs, ", ") + " ]";
        }
        if (isError(obj)) {
          var parts = arrObjKeys(obj, inspect);
          if (!("cause" in Error.prototype) && "cause" in obj && !isEnumerable.call(obj, "cause")) {
            return "{ [" + String(obj) + "] " + $join.call($concat.call("[cause]: " + inspect(obj.cause), parts), ", ") + " }";
          }
          if (parts.length === 0) {
            return "[" + String(obj) + "]";
          }
          return "{ [" + String(obj) + "] " + $join.call(parts, ", ") + " }";
        }
        if (typeof obj === "object" && customInspect) {
          if (inspectSymbol && typeof obj[inspectSymbol] === "function" && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
          } else if (customInspect !== "symbol" && typeof obj.inspect === "function") {
            return obj.inspect();
          }
        }
        if (isMap(obj)) {
          var mapParts = [];
          if (mapForEach) {
            mapForEach.call(obj, function(value, key) {
              mapParts.push(inspect(key, obj, true) + " => " + inspect(value, obj));
            });
          }
          return collectionOf("Map", mapSize2.call(obj), mapParts, indent);
        }
        if (isSet(obj)) {
          var setParts = [];
          if (setForEach) {
            setForEach.call(obj, function(value) {
              setParts.push(inspect(value, obj));
            });
          }
          return collectionOf("Set", setSize.call(obj), setParts, indent);
        }
        if (isWeakMap(obj)) {
          return weakCollectionOf("WeakMap");
        }
        if (isWeakSet(obj)) {
          return weakCollectionOf("WeakSet");
        }
        if (isWeakRef(obj)) {
          return weakCollectionOf("WeakRef");
        }
        if (isNumber(obj)) {
          return markBoxed(inspect(Number(obj)));
        }
        if (isBigInt(obj)) {
          return markBoxed(inspect(bigIntValueOf.call(obj)));
        }
        if (isBoolean(obj)) {
          return markBoxed(booleanValueOf.call(obj));
        }
        if (isString(obj)) {
          return markBoxed(inspect(String(obj)));
        }
        if (typeof window !== "undefined" && obj === window) {
          return "{ [object Window] }";
        }
        if (typeof globalThis !== "undefined" && obj === globalThis || typeof global !== "undefined" && obj === global) {
          return "{ [object globalThis] }";
        }
        if (!isDate(obj) && !isRegExp(obj)) {
          var ys = arrObjKeys(obj, inspect);
          var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
          var protoTag = obj instanceof Object ? "" : "null prototype";
          var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? "Object" : "";
          var constructorTag = isPlainObject || typeof obj.constructor !== "function" ? "" : obj.constructor.name ? obj.constructor.name + " " : "";
          var tag = constructorTag + (stringTag || protoTag ? "[" + $join.call($concat.call([], stringTag || [], protoTag || []), ": ") + "] " : "");
          if (ys.length === 0) {
            return tag + "{}";
          }
          if (indent) {
            return tag + "{" + indentedJoin(ys, indent) + "}";
          }
          return tag + "{ " + $join.call(ys, ", ") + " }";
        }
        return String(obj);
      };
      function wrapQuotes(s2, defaultStyle, opts) {
        var style = opts.quoteStyle || defaultStyle;
        var quoteChar = quotes[style];
        return quoteChar + s2 + quoteChar;
      }
      function quote(s2) {
        return $replace.call(String(s2), /"/g, "&quot;");
      }
      function canTrustToString(obj) {
        return !toStringTag || !(typeof obj === "object" && (toStringTag in obj || typeof obj[toStringTag] !== "undefined"));
      }
      function isArray(obj) {
        return toStr(obj) === "[object Array]" && canTrustToString(obj);
      }
      function isDate(obj) {
        return toStr(obj) === "[object Date]" && canTrustToString(obj);
      }
      function isRegExp(obj) {
        return toStr(obj) === "[object RegExp]" && canTrustToString(obj);
      }
      function isError(obj) {
        return toStr(obj) === "[object Error]" && canTrustToString(obj);
      }
      function isString(obj) {
        return toStr(obj) === "[object String]" && canTrustToString(obj);
      }
      function isNumber(obj) {
        return toStr(obj) === "[object Number]" && canTrustToString(obj);
      }
      function isBoolean(obj) {
        return toStr(obj) === "[object Boolean]" && canTrustToString(obj);
      }
      function isSymbol(obj) {
        if (hasShammedSymbols) {
          return obj && typeof obj === "object" && obj instanceof Symbol;
        }
        if (typeof obj === "symbol") {
          return true;
        }
        if (!obj || typeof obj !== "object" || !symToString) {
          return false;
        }
        try {
          symToString.call(obj);
          return true;
        } catch (e2) {
        }
        return false;
      }
      function isBigInt(obj) {
        if (!obj || typeof obj !== "object" || !bigIntValueOf) {
          return false;
        }
        try {
          bigIntValueOf.call(obj);
          return true;
        } catch (e2) {
        }
        return false;
      }
      var hasOwn = Object.prototype.hasOwnProperty || function(key) {
        return key in this;
      };
      function has(obj, key) {
        return hasOwn.call(obj, key);
      }
      function toStr(obj) {
        return objectToString.call(obj);
      }
      function nameOf(f2) {
        if (f2.name) {
          return f2.name;
        }
        var m2 = $match.call(functionToString.call(f2), /^function\s*([\w$]+)/);
        if (m2) {
          return m2[1];
        }
        return null;
      }
      function indexOf(xs, x2) {
        if (xs.indexOf) {
          return xs.indexOf(x2);
        }
        for (var i2 = 0, l2 = xs.length; i2 < l2; i2++) {
          if (xs[i2] === x2) {
            return i2;
          }
        }
        return -1;
      }
      function isMap(x2) {
        if (!mapSize2 || !x2 || typeof x2 !== "object") {
          return false;
        }
        try {
          mapSize2.call(x2);
          try {
            setSize.call(x2);
          } catch (s2) {
            return true;
          }
          return x2 instanceof Map;
        } catch (e2) {
        }
        return false;
      }
      function isWeakMap(x2) {
        if (!weakMapHas || !x2 || typeof x2 !== "object") {
          return false;
        }
        try {
          weakMapHas.call(x2, weakMapHas);
          try {
            weakSetHas.call(x2, weakSetHas);
          } catch (s2) {
            return true;
          }
          return x2 instanceof WeakMap;
        } catch (e2) {
        }
        return false;
      }
      function isWeakRef(x2) {
        if (!weakRefDeref || !x2 || typeof x2 !== "object") {
          return false;
        }
        try {
          weakRefDeref.call(x2);
          return true;
        } catch (e2) {
        }
        return false;
      }
      function isSet(x2) {
        if (!setSize || !x2 || typeof x2 !== "object") {
          return false;
        }
        try {
          setSize.call(x2);
          try {
            mapSize2.call(x2);
          } catch (m2) {
            return true;
          }
          return x2 instanceof Set;
        } catch (e2) {
        }
        return false;
      }
      function isWeakSet(x2) {
        if (!weakSetHas || !x2 || typeof x2 !== "object") {
          return false;
        }
        try {
          weakSetHas.call(x2, weakSetHas);
          try {
            weakMapHas.call(x2, weakMapHas);
          } catch (s2) {
            return true;
          }
          return x2 instanceof WeakSet;
        } catch (e2) {
        }
        return false;
      }
      function isElement(x2) {
        if (!x2 || typeof x2 !== "object") {
          return false;
        }
        if (typeof HTMLElement !== "undefined" && x2 instanceof HTMLElement) {
          return true;
        }
        return typeof x2.nodeName === "string" && typeof x2.getAttribute === "function";
      }
      function inspectString(str, opts) {
        if (str.length > opts.maxStringLength) {
          var remaining = str.length - opts.maxStringLength;
          var trailer = "... " + remaining + " more character" + (remaining > 1 ? "s" : "");
          return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
        }
        var quoteRE = quoteREs[opts.quoteStyle || "single"];
        quoteRE.lastIndex = 0;
        var s2 = $replace.call($replace.call(str, quoteRE, "\\$1"), /[\x00-\x1f]/g, lowbyte);
        return wrapQuotes(s2, "single", opts);
      }
      function lowbyte(c2) {
        var n3 = c2.charCodeAt(0);
        var x2 = {
          8: "b",
          9: "t",
          10: "n",
          12: "f",
          13: "r"
        }[n3];
        if (x2) {
          return "\\" + x2;
        }
        return "\\x" + (n3 < 16 ? "0" : "") + $toUpperCase.call(n3.toString(16));
      }
      function markBoxed(str) {
        return "Object(" + str + ")";
      }
      function weakCollectionOf(type) {
        return type + " { ? }";
      }
      function collectionOf(type, size, entries, indent) {
        var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ", ");
        return type + " (" + size + ") {" + joinedEntries + "}";
      }
      function singleLineValues(xs) {
        for (var i2 = 0; i2 < xs.length; i2++) {
          if (indexOf(xs[i2], "\n") >= 0) {
            return false;
          }
        }
        return true;
      }
      function getIndent(opts, depth) {
        var baseIndent;
        if (opts.indent === "	") {
          baseIndent = "	";
        } else if (typeof opts.indent === "number" && opts.indent > 0) {
          baseIndent = $join.call(Array(opts.indent + 1), " ");
        } else {
          return null;
        }
        return {
          base: baseIndent,
          prev: $join.call(Array(depth + 1), baseIndent)
        };
      }
      function indentedJoin(xs, indent) {
        if (xs.length === 0) {
          return "";
        }
        var lineJoiner = "\n" + indent.prev + indent.base;
        return lineJoiner + $join.call(xs, "," + lineJoiner) + "\n" + indent.prev;
      }
      function arrObjKeys(obj, inspect) {
        var isArr = isArray(obj);
        var xs = [];
        if (isArr) {
          xs.length = obj.length;
          for (var i2 = 0; i2 < obj.length; i2++) {
            xs[i2] = has(obj, i2) ? inspect(obj[i2], obj) : "";
          }
        }
        var syms = typeof gOPS === "function" ? gOPS(obj) : [];
        var symMap;
        if (hasShammedSymbols) {
          symMap = {};
          for (var k2 = 0; k2 < syms.length; k2++) {
            symMap["$" + syms[k2]] = syms[k2];
          }
        }
        for (var key in obj) {
          if (!has(obj, key)) {
            continue;
          }
          if (isArr && String(Number(key)) === key && key < obj.length) {
            continue;
          }
          if (hasShammedSymbols && symMap["$" + key] instanceof Symbol) {
            continue;
          } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ": " + inspect(obj[key], obj));
          } else {
            xs.push(key + ": " + inspect(obj[key], obj));
          }
        }
        if (typeof gOPS === "function") {
          for (var j2 = 0; j2 < syms.length; j2++) {
            if (isEnumerable.call(obj, syms[j2])) {
              xs.push("[" + inspect(syms[j2]) + "]: " + inspect(obj[syms[j2]], obj));
            }
          }
        }
        return xs;
      }
    }
  });

  // node_modules/side-channel-list/index.js
  var require_side_channel_list = __commonJS({
    "node_modules/side-channel-list/index.js"(exports, module) {
      "use strict";
      var inspect = require_object_inspect();
      var $TypeError = require_type();
      var listGetNode = function(list, key, isDelete) {
        var prev = list;
        var curr;
        for (; (curr = prev.next) != null; prev = curr) {
          if (curr.key === key) {
            prev.next = curr.next;
            if (!isDelete) {
              curr.next = /** @type {NonNullable<typeof list.next>} */
              list.next;
              list.next = curr;
            }
            return curr;
          }
        }
      };
      var listGet = function(objects, key) {
        if (!objects) {
          return void 0;
        }
        var node = listGetNode(objects, key);
        return node && node.value;
      };
      var listSet = function(objects, key, value) {
        var node = listGetNode(objects, key);
        if (node) {
          node.value = value;
        } else {
          objects.next = /** @type {import('./list.d.ts').ListNode<typeof value, typeof key>} */
          {
            // eslint-disable-line no-param-reassign, no-extra-parens
            key,
            next: objects.next,
            value
          };
        }
      };
      var listHas = function(objects, key) {
        if (!objects) {
          return false;
        }
        return !!listGetNode(objects, key);
      };
      var listDelete = function(objects, key) {
        if (objects) {
          return listGetNode(objects, key, true);
        }
      };
      module.exports = function getSideChannelList() {
        var $o;
        var channel = {
          assert: function(key) {
            if (!channel.has(key)) {
              throw new $TypeError("Side channel does not contain " + inspect(key));
            }
          },
          "delete": function(key) {
            var deletedNode = listDelete($o, key);
            if (deletedNode && $o && !$o.next) {
              $o = void 0;
            }
            return !!deletedNode;
          },
          get: function(key) {
            return listGet($o, key);
          },
          has: function(key) {
            return listHas($o, key);
          },
          set: function(key, value) {
            if (!$o) {
              $o = {
                next: void 0
              };
            }
            listSet(
              /** @type {NonNullable<typeof $o>} */
              $o,
              key,
              value
            );
          }
        };
        return channel;
      };
    }
  });

  // node_modules/es-object-atoms/index.js
  var require_es_object_atoms = __commonJS({
    "node_modules/es-object-atoms/index.js"(exports, module) {
      "use strict";
      module.exports = Object;
    }
  });

  // node_modules/es-errors/index.js
  var require_es_errors = __commonJS({
    "node_modules/es-errors/index.js"(exports, module) {
      "use strict";
      module.exports = Error;
    }
  });

  // node_modules/es-errors/eval.js
  var require_eval = __commonJS({
    "node_modules/es-errors/eval.js"(exports, module) {
      "use strict";
      module.exports = EvalError;
    }
  });

  // node_modules/es-errors/range.js
  var require_range = __commonJS({
    "node_modules/es-errors/range.js"(exports, module) {
      "use strict";
      module.exports = RangeError;
    }
  });

  // node_modules/es-errors/ref.js
  var require_ref = __commonJS({
    "node_modules/es-errors/ref.js"(exports, module) {
      "use strict";
      module.exports = ReferenceError;
    }
  });

  // node_modules/es-errors/syntax.js
  var require_syntax = __commonJS({
    "node_modules/es-errors/syntax.js"(exports, module) {
      "use strict";
      module.exports = SyntaxError;
    }
  });

  // node_modules/es-errors/uri.js
  var require_uri = __commonJS({
    "node_modules/es-errors/uri.js"(exports, module) {
      "use strict";
      module.exports = URIError;
    }
  });

  // node_modules/math-intrinsics/abs.js
  var require_abs = __commonJS({
    "node_modules/math-intrinsics/abs.js"(exports, module) {
      "use strict";
      module.exports = Math.abs;
    }
  });

  // node_modules/math-intrinsics/floor.js
  var require_floor = __commonJS({
    "node_modules/math-intrinsics/floor.js"(exports, module) {
      "use strict";
      module.exports = Math.floor;
    }
  });

  // node_modules/math-intrinsics/max.js
  var require_max = __commonJS({
    "node_modules/math-intrinsics/max.js"(exports, module) {
      "use strict";
      module.exports = Math.max;
    }
  });

  // node_modules/math-intrinsics/min.js
  var require_min = __commonJS({
    "node_modules/math-intrinsics/min.js"(exports, module) {
      "use strict";
      module.exports = Math.min;
    }
  });

  // node_modules/math-intrinsics/pow.js
  var require_pow = __commonJS({
    "node_modules/math-intrinsics/pow.js"(exports, module) {
      "use strict";
      module.exports = Math.pow;
    }
  });

  // node_modules/math-intrinsics/round.js
  var require_round = __commonJS({
    "node_modules/math-intrinsics/round.js"(exports, module) {
      "use strict";
      module.exports = Math.round;
    }
  });

  // node_modules/math-intrinsics/isNaN.js
  var require_isNaN = __commonJS({
    "node_modules/math-intrinsics/isNaN.js"(exports, module) {
      "use strict";
      module.exports = Number.isNaN || function isNaN2(a2) {
        return a2 !== a2;
      };
    }
  });

  // node_modules/math-intrinsics/sign.js
  var require_sign = __commonJS({
    "node_modules/math-intrinsics/sign.js"(exports, module) {
      "use strict";
      var $isNaN = require_isNaN();
      module.exports = function sign2(number) {
        if ($isNaN(number) || number === 0) {
          return number;
        }
        return number < 0 ? -1 : 1;
      };
    }
  });

  // node_modules/gopd/gOPD.js
  var require_gOPD = __commonJS({
    "node_modules/gopd/gOPD.js"(exports, module) {
      "use strict";
      module.exports = Object.getOwnPropertyDescriptor;
    }
  });

  // node_modules/gopd/index.js
  var require_gopd = __commonJS({
    "node_modules/gopd/index.js"(exports, module) {
      "use strict";
      var $gOPD = require_gOPD();
      if ($gOPD) {
        try {
          $gOPD([], "length");
        } catch (e2) {
          $gOPD = null;
        }
      }
      module.exports = $gOPD;
    }
  });

  // node_modules/es-define-property/index.js
  var require_es_define_property = __commonJS({
    "node_modules/es-define-property/index.js"(exports, module) {
      "use strict";
      var $defineProperty = Object.defineProperty || false;
      if ($defineProperty) {
        try {
          $defineProperty({}, "a", { value: 1 });
        } catch (e2) {
          $defineProperty = false;
        }
      }
      module.exports = $defineProperty;
    }
  });

  // node_modules/has-symbols/shams.js
  var require_shams = __commonJS({
    "node_modules/has-symbols/shams.js"(exports, module) {
      "use strict";
      module.exports = function hasSymbols() {
        if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
          return false;
        }
        if (typeof Symbol.iterator === "symbol") {
          return true;
        }
        var obj = {};
        var sym = /* @__PURE__ */ Symbol("test");
        var symObj = Object(sym);
        if (typeof sym === "string") {
          return false;
        }
        if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
          return false;
        }
        if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
          return false;
        }
        var symVal = 42;
        obj[sym] = symVal;
        for (var _ in obj) {
          return false;
        }
        if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
          return false;
        }
        if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
          return false;
        }
        var syms = Object.getOwnPropertySymbols(obj);
        if (syms.length !== 1 || syms[0] !== sym) {
          return false;
        }
        if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
          return false;
        }
        if (typeof Object.getOwnPropertyDescriptor === "function") {
          var descriptor = (
            /** @type {PropertyDescriptor} */
            Object.getOwnPropertyDescriptor(obj, sym)
          );
          if (descriptor.value !== symVal || descriptor.enumerable !== true) {
            return false;
          }
        }
        return true;
      };
    }
  });

  // node_modules/has-symbols/index.js
  var require_has_symbols = __commonJS({
    "node_modules/has-symbols/index.js"(exports, module) {
      "use strict";
      var origSymbol = typeof Symbol !== "undefined" && Symbol;
      var hasSymbolSham = require_shams();
      module.exports = function hasNativeSymbols() {
        if (typeof origSymbol !== "function") {
          return false;
        }
        if (typeof Symbol !== "function") {
          return false;
        }
        if (typeof origSymbol("foo") !== "symbol") {
          return false;
        }
        if (typeof /* @__PURE__ */ Symbol("bar") !== "symbol") {
          return false;
        }
        return hasSymbolSham();
      };
    }
  });

  // node_modules/get-proto/Reflect.getPrototypeOf.js
  var require_Reflect_getPrototypeOf = __commonJS({
    "node_modules/get-proto/Reflect.getPrototypeOf.js"(exports, module) {
      "use strict";
      module.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
    }
  });

  // node_modules/get-proto/Object.getPrototypeOf.js
  var require_Object_getPrototypeOf = __commonJS({
    "node_modules/get-proto/Object.getPrototypeOf.js"(exports, module) {
      "use strict";
      var $Object = require_es_object_atoms();
      module.exports = $Object.getPrototypeOf || null;
    }
  });

  // node_modules/function-bind/implementation.js
  var require_implementation = __commonJS({
    "node_modules/function-bind/implementation.js"(exports, module) {
      "use strict";
      var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
      var toStr = Object.prototype.toString;
      var max = Math.max;
      var funcType = "[object Function]";
      var concatty = function concatty2(a2, b2) {
        var arr = [];
        for (var i2 = 0; i2 < a2.length; i2 += 1) {
          arr[i2] = a2[i2];
        }
        for (var j2 = 0; j2 < b2.length; j2 += 1) {
          arr[j2 + a2.length] = b2[j2];
        }
        return arr;
      };
      var slicy = function slicy2(arrLike, offset) {
        var arr = [];
        for (var i2 = offset || 0, j2 = 0; i2 < arrLike.length; i2 += 1, j2 += 1) {
          arr[j2] = arrLike[i2];
        }
        return arr;
      };
      var joiny = function(arr, joiner) {
        var str = "";
        for (var i2 = 0; i2 < arr.length; i2 += 1) {
          str += arr[i2];
          if (i2 + 1 < arr.length) {
            str += joiner;
          }
        }
        return str;
      };
      module.exports = function bind(that) {
        var target = this;
        if (typeof target !== "function" || toStr.apply(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
        }
        var args = slicy(arguments, 1);
        var bound;
        var binder = function() {
          if (this instanceof bound) {
            var result = target.apply(
              this,
              concatty(args, arguments)
            );
            if (Object(result) === result) {
              return result;
            }
            return this;
          }
          return target.apply(
            that,
            concatty(args, arguments)
          );
        };
        var boundLength = max(0, target.length - args.length);
        var boundArgs = [];
        for (var i2 = 0; i2 < boundLength; i2++) {
          boundArgs[i2] = "$" + i2;
        }
        bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
        if (target.prototype) {
          var Empty = function Empty2() {
          };
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
        }
        return bound;
      };
    }
  });

  // node_modules/function-bind/index.js
  var require_function_bind = __commonJS({
    "node_modules/function-bind/index.js"(exports, module) {
      "use strict";
      var implementation = require_implementation();
      module.exports = Function.prototype.bind || implementation;
    }
  });

  // node_modules/call-bind-apply-helpers/functionCall.js
  var require_functionCall = __commonJS({
    "node_modules/call-bind-apply-helpers/functionCall.js"(exports, module) {
      "use strict";
      module.exports = Function.prototype.call;
    }
  });

  // node_modules/call-bind-apply-helpers/functionApply.js
  var require_functionApply = __commonJS({
    "node_modules/call-bind-apply-helpers/functionApply.js"(exports, module) {
      "use strict";
      module.exports = Function.prototype.apply;
    }
  });

  // node_modules/call-bind-apply-helpers/reflectApply.js
  var require_reflectApply = __commonJS({
    "node_modules/call-bind-apply-helpers/reflectApply.js"(exports, module) {
      "use strict";
      module.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
    }
  });

  // node_modules/call-bind-apply-helpers/actualApply.js
  var require_actualApply = __commonJS({
    "node_modules/call-bind-apply-helpers/actualApply.js"(exports, module) {
      "use strict";
      var bind = require_function_bind();
      var $apply = require_functionApply();
      var $call = require_functionCall();
      var $reflectApply = require_reflectApply();
      module.exports = $reflectApply || bind.call($call, $apply);
    }
  });

  // node_modules/call-bind-apply-helpers/index.js
  var require_call_bind_apply_helpers = __commonJS({
    "node_modules/call-bind-apply-helpers/index.js"(exports, module) {
      "use strict";
      var bind = require_function_bind();
      var $TypeError = require_type();
      var $call = require_functionCall();
      var $actualApply = require_actualApply();
      module.exports = function callBindBasic(args) {
        if (args.length < 1 || typeof args[0] !== "function") {
          throw new $TypeError("a function is required");
        }
        return $actualApply(bind, $call, args);
      };
    }
  });

  // node_modules/dunder-proto/get.js
  var require_get = __commonJS({
    "node_modules/dunder-proto/get.js"(exports, module) {
      "use strict";
      var callBind = require_call_bind_apply_helpers();
      var gOPD = require_gopd();
      var hasProtoAccessor;
      try {
        hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */
        [].__proto__ === Array.prototype;
      } catch (e2) {
        if (!e2 || typeof e2 !== "object" || !("code" in e2) || e2.code !== "ERR_PROTO_ACCESS") {
          throw e2;
        }
      }
      var desc = !!hasProtoAccessor && gOPD && gOPD(
        Object.prototype,
        /** @type {keyof typeof Object.prototype} */
        "__proto__"
      );
      var $Object = Object;
      var $getPrototypeOf = $Object.getPrototypeOf;
      module.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
        /** @type {import('./get')} */
        function getDunder(value) {
          return $getPrototypeOf(value == null ? value : $Object(value));
        }
      ) : false;
    }
  });

  // node_modules/get-proto/index.js
  var require_get_proto = __commonJS({
    "node_modules/get-proto/index.js"(exports, module) {
      "use strict";
      var reflectGetProto = require_Reflect_getPrototypeOf();
      var originalGetProto = require_Object_getPrototypeOf();
      var getDunderProto = require_get();
      module.exports = reflectGetProto ? function getProto(O) {
        return reflectGetProto(O);
      } : originalGetProto ? function getProto(O) {
        if (!O || typeof O !== "object" && typeof O !== "function") {
          throw new TypeError("getProto: not an object");
        }
        return originalGetProto(O);
      } : getDunderProto ? function getProto(O) {
        return getDunderProto(O);
      } : null;
    }
  });

  // node_modules/hasown/index.js
  var require_hasown = __commonJS({
    "node_modules/hasown/index.js"(exports, module) {
      "use strict";
      var call = Function.prototype.call;
      var $hasOwn = Object.prototype.hasOwnProperty;
      var bind = require_function_bind();
      module.exports = bind.call(call, $hasOwn);
    }
  });

  // node_modules/get-intrinsic/index.js
  var require_get_intrinsic = __commonJS({
    "node_modules/get-intrinsic/index.js"(exports, module) {
      "use strict";
      var undefined2;
      var $Object = require_es_object_atoms();
      var $Error = require_es_errors();
      var $EvalError = require_eval();
      var $RangeError = require_range();
      var $ReferenceError = require_ref();
      var $SyntaxError = require_syntax();
      var $TypeError = require_type();
      var $URIError = require_uri();
      var abs = require_abs();
      var floor = require_floor();
      var max = require_max();
      var min = require_min();
      var pow = require_pow();
      var round = require_round();
      var sign2 = require_sign();
      var $Function = Function;
      var getEvalledConstructor = function(expressionSyntax) {
        try {
          return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
        } catch (e2) {
        }
      };
      var $gOPD = require_gopd();
      var $defineProperty = require_es_define_property();
      var throwTypeError = function() {
        throw new $TypeError();
      };
      var ThrowTypeError = $gOPD ? (function() {
        try {
          arguments.callee;
          return throwTypeError;
        } catch (calleeThrows) {
          try {
            return $gOPD(arguments, "callee").get;
          } catch (gOPDthrows) {
            return throwTypeError;
          }
        }
      })() : throwTypeError;
      var hasSymbols = require_has_symbols()();
      var getProto = require_get_proto();
      var $ObjectGPO = require_Object_getPrototypeOf();
      var $ReflectGPO = require_Reflect_getPrototypeOf();
      var $apply = require_functionApply();
      var $call = require_functionCall();
      var needsEval = {};
      var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
      var INTRINSICS = {
        __proto__: null,
        "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
        "%Array%": Array,
        "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
        "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
        "%AsyncFromSyncIteratorPrototype%": undefined2,
        "%AsyncFunction%": needsEval,
        "%AsyncGenerator%": needsEval,
        "%AsyncGeneratorFunction%": needsEval,
        "%AsyncIteratorPrototype%": needsEval,
        "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
        "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
        "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
        "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
        "%Boolean%": Boolean,
        "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
        "%Date%": Date,
        "%decodeURI%": decodeURI,
        "%decodeURIComponent%": decodeURIComponent,
        "%encodeURI%": encodeURI,
        "%encodeURIComponent%": encodeURIComponent,
        "%Error%": $Error,
        "%eval%": eval,
        // eslint-disable-line no-eval
        "%EvalError%": $EvalError,
        "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
        "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
        "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
        "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
        "%Function%": $Function,
        "%GeneratorFunction%": needsEval,
        "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
        "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
        "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
        "%isFinite%": isFinite,
        "%isNaN%": isNaN,
        "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
        "%JSON%": typeof JSON === "object" ? JSON : undefined2,
        "%Map%": typeof Map === "undefined" ? undefined2 : Map,
        "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
        "%Math%": Math,
        "%Number%": Number,
        "%Object%": $Object,
        "%Object.getOwnPropertyDescriptor%": $gOPD,
        "%parseFloat%": parseFloat,
        "%parseInt%": parseInt,
        "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
        "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
        "%RangeError%": $RangeError,
        "%ReferenceError%": $ReferenceError,
        "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
        "%RegExp%": RegExp,
        "%Set%": typeof Set === "undefined" ? undefined2 : Set,
        "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
        "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
        "%String%": String,
        "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
        "%Symbol%": hasSymbols ? Symbol : undefined2,
        "%SyntaxError%": $SyntaxError,
        "%ThrowTypeError%": ThrowTypeError,
        "%TypedArray%": TypedArray,
        "%TypeError%": $TypeError,
        "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
        "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
        "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
        "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
        "%URIError%": $URIError,
        "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
        "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
        "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
        "%Function.prototype.call%": $call,
        "%Function.prototype.apply%": $apply,
        "%Object.defineProperty%": $defineProperty,
        "%Object.getPrototypeOf%": $ObjectGPO,
        "%Math.abs%": abs,
        "%Math.floor%": floor,
        "%Math.max%": max,
        "%Math.min%": min,
        "%Math.pow%": pow,
        "%Math.round%": round,
        "%Math.sign%": sign2,
        "%Reflect.getPrototypeOf%": $ReflectGPO
      };
      if (getProto) {
        try {
          null.error;
        } catch (e2) {
          errorProto = getProto(getProto(e2));
          INTRINSICS["%Error.prototype%"] = errorProto;
        }
      }
      var errorProto;
      var doEval = function doEval2(name) {
        var value;
        if (name === "%AsyncFunction%") {
          value = getEvalledConstructor("async function () {}");
        } else if (name === "%GeneratorFunction%") {
          value = getEvalledConstructor("function* () {}");
        } else if (name === "%AsyncGeneratorFunction%") {
          value = getEvalledConstructor("async function* () {}");
        } else if (name === "%AsyncGenerator%") {
          var fn = doEval2("%AsyncGeneratorFunction%");
          if (fn) {
            value = fn.prototype;
          }
        } else if (name === "%AsyncIteratorPrototype%") {
          var gen = doEval2("%AsyncGenerator%");
          if (gen && getProto) {
            value = getProto(gen.prototype);
          }
        }
        INTRINSICS[name] = value;
        return value;
      };
      var LEGACY_ALIASES = {
        __proto__: null,
        "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
        "%ArrayPrototype%": ["Array", "prototype"],
        "%ArrayProto_entries%": ["Array", "prototype", "entries"],
        "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
        "%ArrayProto_keys%": ["Array", "prototype", "keys"],
        "%ArrayProto_values%": ["Array", "prototype", "values"],
        "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
        "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
        "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
        "%BooleanPrototype%": ["Boolean", "prototype"],
        "%DataViewPrototype%": ["DataView", "prototype"],
        "%DatePrototype%": ["Date", "prototype"],
        "%ErrorPrototype%": ["Error", "prototype"],
        "%EvalErrorPrototype%": ["EvalError", "prototype"],
        "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
        "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
        "%FunctionPrototype%": ["Function", "prototype"],
        "%Generator%": ["GeneratorFunction", "prototype"],
        "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
        "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
        "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
        "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
        "%JSONParse%": ["JSON", "parse"],
        "%JSONStringify%": ["JSON", "stringify"],
        "%MapPrototype%": ["Map", "prototype"],
        "%NumberPrototype%": ["Number", "prototype"],
        "%ObjectPrototype%": ["Object", "prototype"],
        "%ObjProto_toString%": ["Object", "prototype", "toString"],
        "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
        "%PromisePrototype%": ["Promise", "prototype"],
        "%PromiseProto_then%": ["Promise", "prototype", "then"],
        "%Promise_all%": ["Promise", "all"],
        "%Promise_reject%": ["Promise", "reject"],
        "%Promise_resolve%": ["Promise", "resolve"],
        "%RangeErrorPrototype%": ["RangeError", "prototype"],
        "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
        "%RegExpPrototype%": ["RegExp", "prototype"],
        "%SetPrototype%": ["Set", "prototype"],
        "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
        "%StringPrototype%": ["String", "prototype"],
        "%SymbolPrototype%": ["Symbol", "prototype"],
        "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
        "%TypedArrayPrototype%": ["TypedArray", "prototype"],
        "%TypeErrorPrototype%": ["TypeError", "prototype"],
        "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
        "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
        "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
        "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
        "%URIErrorPrototype%": ["URIError", "prototype"],
        "%WeakMapPrototype%": ["WeakMap", "prototype"],
        "%WeakSetPrototype%": ["WeakSet", "prototype"]
      };
      var bind = require_function_bind();
      var hasOwn = require_hasown();
      var $concat = bind.call($call, Array.prototype.concat);
      var $spliceApply = bind.call($apply, Array.prototype.splice);
      var $replace = bind.call($call, String.prototype.replace);
      var $strSlice = bind.call($call, String.prototype.slice);
      var $exec = bind.call($call, RegExp.prototype.exec);
      var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
      var reEscapeChar = /\\(\\)?/g;
      var stringToPath = function stringToPath2(string) {
        var first = $strSlice(string, 0, 1);
        var last = $strSlice(string, -1);
        if (first === "%" && last !== "%") {
          throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
        } else if (last === "%" && first !== "%") {
          throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
        }
        var result = [];
        $replace(string, rePropName, function(match, number, quote, subString) {
          result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
        });
        return result;
      };
      var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
        var intrinsicName = name;
        var alias;
        if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
          alias = LEGACY_ALIASES[intrinsicName];
          intrinsicName = "%" + alias[0] + "%";
        }
        if (hasOwn(INTRINSICS, intrinsicName)) {
          var value = INTRINSICS[intrinsicName];
          if (value === needsEval) {
            value = doEval(intrinsicName);
          }
          if (typeof value === "undefined" && !allowMissing) {
            throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
          }
          return {
            alias,
            name: intrinsicName,
            value
          };
        }
        throw new $SyntaxError("intrinsic " + name + " does not exist!");
      };
      module.exports = function GetIntrinsic(name, allowMissing) {
        if (typeof name !== "string" || name.length === 0) {
          throw new $TypeError("intrinsic name must be a non-empty string");
        }
        if (arguments.length > 1 && typeof allowMissing !== "boolean") {
          throw new $TypeError('"allowMissing" argument must be a boolean');
        }
        if ($exec(/^%?[^%]*%?$/, name) === null) {
          throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
        }
        var parts = stringToPath(name);
        var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
        var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
        var intrinsicRealName = intrinsic.name;
        var value = intrinsic.value;
        var skipFurtherCaching = false;
        var alias = intrinsic.alias;
        if (alias) {
          intrinsicBaseName = alias[0];
          $spliceApply(parts, $concat([0, 1], alias));
        }
        for (var i2 = 1, isOwn = true; i2 < parts.length; i2 += 1) {
          var part = parts[i2];
          var first = $strSlice(part, 0, 1);
          var last = $strSlice(part, -1);
          if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
            throw new $SyntaxError("property names with quotes must have matching quotes");
          }
          if (part === "constructor" || !isOwn) {
            skipFurtherCaching = true;
          }
          intrinsicBaseName += "." + part;
          intrinsicRealName = "%" + intrinsicBaseName + "%";
          if (hasOwn(INTRINSICS, intrinsicRealName)) {
            value = INTRINSICS[intrinsicRealName];
          } else if (value != null) {
            if (!(part in value)) {
              if (!allowMissing) {
                throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
              }
              return void undefined2;
            }
            if ($gOPD && i2 + 1 >= parts.length) {
              var desc = $gOPD(value, part);
              isOwn = !!desc;
              if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
                value = desc.get;
              } else {
                value = value[part];
              }
            } else {
              isOwn = hasOwn(value, part);
              value = value[part];
            }
            if (isOwn && !skipFurtherCaching) {
              INTRINSICS[intrinsicRealName] = value;
            }
          }
        }
        return value;
      };
    }
  });

  // node_modules/call-bound/index.js
  var require_call_bound = __commonJS({
    "node_modules/call-bound/index.js"(exports, module) {
      "use strict";
      var GetIntrinsic = require_get_intrinsic();
      var callBindBasic = require_call_bind_apply_helpers();
      var $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
      module.exports = function callBoundIntrinsic(name, allowMissing) {
        var intrinsic = (
          /** @type {(this: unknown, ...args: unknown[]) => unknown} */
          GetIntrinsic(name, !!allowMissing)
        );
        if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
          return callBindBasic(
            /** @type {const} */
            [intrinsic]
          );
        }
        return intrinsic;
      };
    }
  });

  // node_modules/side-channel-map/index.js
  var require_side_channel_map = __commonJS({
    "node_modules/side-channel-map/index.js"(exports, module) {
      "use strict";
      var GetIntrinsic = require_get_intrinsic();
      var callBound = require_call_bound();
      var inspect = require_object_inspect();
      var $TypeError = require_type();
      var $Map = GetIntrinsic("%Map%", true);
      var $mapGet = callBound("Map.prototype.get", true);
      var $mapSet = callBound("Map.prototype.set", true);
      var $mapHas = callBound("Map.prototype.has", true);
      var $mapDelete = callBound("Map.prototype.delete", true);
      var $mapSize = callBound("Map.prototype.size", true);
      module.exports = !!$Map && /** @type {Exclude<import('.'), false>} */
      function getSideChannelMap() {
        var $m;
        var channel = {
          assert: function(key) {
            if (!channel.has(key)) {
              throw new $TypeError("Side channel does not contain " + inspect(key));
            }
          },
          "delete": function(key) {
            if ($m) {
              var result = $mapDelete($m, key);
              if ($mapSize($m) === 0) {
                $m = void 0;
              }
              return result;
            }
            return false;
          },
          get: function(key) {
            if ($m) {
              return $mapGet($m, key);
            }
          },
          has: function(key) {
            if ($m) {
              return $mapHas($m, key);
            }
            return false;
          },
          set: function(key, value) {
            if (!$m) {
              $m = new $Map();
            }
            $mapSet($m, key, value);
          }
        };
        return channel;
      };
    }
  });

  // node_modules/side-channel-weakmap/index.js
  var require_side_channel_weakmap = __commonJS({
    "node_modules/side-channel-weakmap/index.js"(exports, module) {
      "use strict";
      var GetIntrinsic = require_get_intrinsic();
      var callBound = require_call_bound();
      var inspect = require_object_inspect();
      var getSideChannelMap = require_side_channel_map();
      var $TypeError = require_type();
      var $WeakMap = GetIntrinsic("%WeakMap%", true);
      var $weakMapGet = callBound("WeakMap.prototype.get", true);
      var $weakMapSet = callBound("WeakMap.prototype.set", true);
      var $weakMapHas = callBound("WeakMap.prototype.has", true);
      var $weakMapDelete = callBound("WeakMap.prototype.delete", true);
      module.exports = $WeakMap ? (
        /** @type {Exclude<import('.'), false>} */
        function getSideChannelWeakMap() {
          var $wm;
          var $m;
          var channel = {
            assert: function(key) {
              if (!channel.has(key)) {
                throw new $TypeError("Side channel does not contain " + inspect(key));
              }
            },
            "delete": function(key) {
              if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
                if ($wm) {
                  return $weakMapDelete($wm, key);
                }
              } else if (getSideChannelMap) {
                if ($m) {
                  return $m["delete"](key);
                }
              }
              return false;
            },
            get: function(key) {
              if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
                if ($wm) {
                  return $weakMapGet($wm, key);
                }
              }
              return $m && $m.get(key);
            },
            has: function(key) {
              if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
                if ($wm) {
                  return $weakMapHas($wm, key);
                }
              }
              return !!$m && $m.has(key);
            },
            set: function(key, value) {
              if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
                if (!$wm) {
                  $wm = new $WeakMap();
                }
                $weakMapSet($wm, key, value);
              } else if (getSideChannelMap) {
                if (!$m) {
                  $m = getSideChannelMap();
                }
                $m.set(key, value);
              }
            }
          };
          return channel;
        }
      ) : getSideChannelMap;
    }
  });

  // node_modules/side-channel/index.js
  var require_side_channel = __commonJS({
    "node_modules/side-channel/index.js"(exports, module) {
      "use strict";
      var $TypeError = require_type();
      var inspect = require_object_inspect();
      var getSideChannelList = require_side_channel_list();
      var getSideChannelMap = require_side_channel_map();
      var getSideChannelWeakMap = require_side_channel_weakmap();
      var makeChannel = getSideChannelWeakMap || getSideChannelMap || getSideChannelList;
      module.exports = function getSideChannel() {
        var $channelData;
        var channel = {
          assert: function(key) {
            if (!channel.has(key)) {
              var keyDesc = key && Object(key) === key ? "the given object key" : inspect(key);
              throw new $TypeError("Side channel does not contain " + keyDesc);
            }
          },
          "delete": function(key) {
            return !!$channelData && $channelData["delete"](key);
          },
          get: function(key) {
            return $channelData && $channelData.get(key);
          },
          has: function(key) {
            return !!$channelData && $channelData.has(key);
          },
          set: function(key, value) {
            if (!$channelData) {
              $channelData = makeChannel();
            }
            $channelData.set(key, value);
          }
        };
        return channel;
      };
    }
  });

  // node_modules/qs/lib/formats.js
  var require_formats = __commonJS({
    "node_modules/qs/lib/formats.js"(exports, module) {
      "use strict";
      var replace = String.prototype.replace;
      var percentTwenties = /%20/g;
      var Format = {
        RFC1738: "RFC1738",
        RFC3986: "RFC3986"
      };
      module.exports = {
        "default": Format.RFC3986,
        formatters: {
          RFC1738: function(value) {
            return replace.call(value, percentTwenties, "+");
          },
          RFC3986: function(value) {
            return String(value);
          }
        },
        RFC1738: Format.RFC1738,
        RFC3986: Format.RFC3986
      };
    }
  });

  // node_modules/qs/lib/utils.js
  var require_utils = __commonJS({
    "node_modules/qs/lib/utils.js"(exports, module) {
      "use strict";
      var formats = require_formats();
      var getSideChannel = require_side_channel();
      var defineProperty = require_es_define_property();
      var has = Object.prototype.hasOwnProperty;
      var isArray = Array.isArray;
      var overflowChannel = getSideChannel();
      var markOverflow = function markOverflow2(obj, maxIndex) {
        overflowChannel.set(obj, maxIndex);
        return obj;
      };
      var isOverflow = function isOverflow2(obj) {
        return overflowChannel.has(obj);
      };
      var getMaxIndex = function getMaxIndex2(obj) {
        return overflowChannel.get(obj);
      };
      var setMaxIndex = function setMaxIndex2(obj, maxIndex) {
        overflowChannel.set(obj, maxIndex);
      };
      var hexTable = (function() {
        var array = [];
        for (var i2 = 0; i2 < 256; ++i2) {
          array[array.length] = "%" + ((i2 < 16 ? "0" : "") + i2.toString(16)).toUpperCase();
        }
        return array;
      })();
      var compactQueue = function compactQueue2(queue) {
        while (queue.length > 1) {
          var item = queue.pop();
          var obj = item.obj[item.prop];
          if (isArray(obj)) {
            var compacted = [];
            for (var j2 = 0; j2 < obj.length; ++j2) {
              if (typeof obj[j2] !== "undefined") {
                compacted[compacted.length] = obj[j2];
              }
            }
            item.obj[item.prop] = compacted;
          }
        }
      };
      var arrayToObject = function arrayToObject2(source, options) {
        var obj = options && options.plainObjects ? { __proto__: null } : {};
        for (var i2 = 0; i2 < source.length; ++i2) {
          if (typeof source[i2] !== "undefined") {
            obj[i2] = source[i2];
          }
        }
        return obj;
      };
      var setProperty = function setProperty2(obj, key, value) {
        if (key === "__proto__" && defineProperty) {
          defineProperty(obj, key, {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        } else {
          obj[key] = value;
        }
      };
      var merge = function merge2(target, source, options) {
        if (!source) {
          return target;
        }
        if (typeof source !== "object" && typeof source !== "function") {
          if (isArray(target)) {
            var nextIndex = target.length;
            if (options && typeof options.arrayLimit === "number" && nextIndex >= options.arrayLimit) {
              if (options.throwOnLimitExceeded) {
                throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
              }
              return markOverflow(arrayToObject(target.concat(source), options), nextIndex);
            }
            target[nextIndex] = source;
          } else if (target && typeof target === "object") {
            if (isOverflow(target)) {
              var newIndex = getMaxIndex(target) + 1;
              target[newIndex] = source;
              setMaxIndex(target, newIndex);
            } else if (options && options.strictMerge) {
              return [target, source];
            } else if (options && (options.plainObjects || options.allowPrototypes) || !has.call(Object.prototype, source)) {
              target[source] = true;
            }
          } else {
            return [target, source];
          }
          return target;
        }
        if (!target || typeof target !== "object") {
          if (isOverflow(source)) {
            var sourceKeys = Object.keys(source);
            var result = options && options.plainObjects ? { __proto__: null, 0: target } : { 0: target };
            for (var m2 = 0; m2 < sourceKeys.length; m2++) {
              var oldKey = parseInt(sourceKeys[m2], 10);
              result[oldKey + 1] = source[sourceKeys[m2]];
            }
            return markOverflow(result, getMaxIndex(source) + 1);
          }
          var combined = [target].concat(source);
          if (options && typeof options.arrayLimit === "number" && combined.length > options.arrayLimit) {
            if (options.throwOnLimitExceeded) {
              throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
            }
            return markOverflow(arrayToObject(combined, options), combined.length - 1);
          }
          return combined;
        }
        var mergeTarget = target;
        if (isArray(target) && !isArray(source)) {
          mergeTarget = arrayToObject(target, options);
        }
        if (isArray(target) && isArray(source)) {
          source.forEach(function(item, i2) {
            if (has.call(target, i2)) {
              var targetItem = target[i2];
              if (targetItem && typeof targetItem === "object" && item && typeof item === "object") {
                target[i2] = merge2(targetItem, item, options);
              } else {
                target[target.length] = item;
              }
            } else {
              target[i2] = item;
            }
          });
          if (options && typeof options.arrayLimit === "number" && target.length > options.arrayLimit) {
            if (options.throwOnLimitExceeded) {
              throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
            }
            return markOverflow(arrayToObject(target, options), target.length - 1);
          }
          return target;
        }
        return Object.keys(source).reduce(function(acc, key) {
          var value = source[key];
          if (has.call(acc, key)) {
            setProperty(acc, key, merge2(acc[key], value, options));
          } else {
            setProperty(acc, key, value);
          }
          if (isOverflow(source) && !isOverflow(acc)) {
            markOverflow(acc, getMaxIndex(source));
          }
          if (isOverflow(acc)) {
            var keyNum = parseInt(key, 10);
            if (String(keyNum) === key && keyNum >= 0 && keyNum > getMaxIndex(acc)) {
              setMaxIndex(acc, keyNum);
            }
          }
          return acc;
        }, mergeTarget);
      };
      var assign = function assignSingleSource(target, source) {
        return Object.keys(source).reduce(function(acc, key) {
          setProperty(acc, key, source[key]);
          return acc;
        }, target);
      };
      var decode = function(str, defaultDecoder, charset) {
        var strWithoutPlus = str.replace(/\+/g, " ");
        if (charset === "iso-8859-1") {
          return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
        }
        try {
          return decodeURIComponent(strWithoutPlus);
        } catch (e2) {
          return strWithoutPlus;
        }
      };
      var limit = 1024;
      var encode = function encode2(str, defaultEncoder, charset, kind, format2) {
        if (str.length === 0) {
          return str;
        }
        var string = str;
        if (typeof str === "symbol") {
          string = Symbol.prototype.toString.call(str);
        } else if (typeof str !== "string") {
          string = String(str);
        }
        if (charset === "iso-8859-1") {
          return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
            return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
          });
        }
        var out = "";
        for (var j2 = 0; j2 < string.length; j2 += limit) {
          var segment = string.length >= limit ? string.slice(j2, j2 + limit) : string;
          if (j2 + limit < string.length) {
            var last = segment.charCodeAt(segment.length - 1);
            if (last >= 55296 && last <= 56319) {
              segment = segment.slice(0, -1);
              j2 -= 1;
            }
          }
          var arr = [];
          for (var i2 = 0; i2 < segment.length; ++i2) {
            var c2 = segment.charCodeAt(i2);
            if (c2 === 45 || c2 === 46 || c2 === 95 || c2 === 126 || c2 >= 48 && c2 <= 57 || c2 >= 65 && c2 <= 90 || c2 >= 97 && c2 <= 122 || format2 === formats.RFC1738 && (c2 === 40 || c2 === 41)) {
              arr[arr.length] = segment.charAt(i2);
              continue;
            }
            if (c2 < 128) {
              arr[arr.length] = hexTable[c2];
              continue;
            }
            if (c2 < 2048) {
              arr[arr.length] = hexTable[192 | c2 >> 6] + hexTable[128 | c2 & 63];
              continue;
            }
            if (c2 < 55296 || c2 >= 57344) {
              arr[arr.length] = hexTable[224 | c2 >> 12] + hexTable[128 | c2 >> 6 & 63] + hexTable[128 | c2 & 63];
              continue;
            }
            i2 += 1;
            c2 = 65536 + ((c2 & 1023) << 10 | segment.charCodeAt(i2) & 1023);
            arr[arr.length] = hexTable[240 | c2 >> 18] + hexTable[128 | c2 >> 12 & 63] + hexTable[128 | c2 >> 6 & 63] + hexTable[128 | c2 & 63];
          }
          out += arr.join("");
        }
        return out;
      };
      var compact = function compact2(value) {
        var queue = [{ obj: { o: value }, prop: "o" }];
        var refs = getSideChannel();
        for (var i2 = 0; i2 < queue.length; ++i2) {
          var item = queue[i2];
          var obj = item.obj[item.prop];
          var keys2 = Object.keys(obj);
          for (var j2 = 0; j2 < keys2.length; ++j2) {
            var key = keys2[j2];
            var val = obj[key];
            if (typeof val === "object" && val !== null && !refs.has(val)) {
              queue[queue.length] = { obj, prop: key };
              refs.set(val, true);
            }
          }
        }
        compactQueue(queue);
        return value;
      };
      var isRegExp = function isRegExp2(obj) {
        return Object.prototype.toString.call(obj) === "[object RegExp]";
      };
      var isBuffer = function isBuffer2(obj) {
        if (!obj || typeof obj !== "object") {
          return false;
        }
        return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
      };
      var combine = function combine2(a2, b2, arrayLimit, plainObjects, throwOnLimitExceeded) {
        if (isOverflow(a2)) {
          if (throwOnLimitExceeded) {
            throw new RangeError("Array limit exceeded. Only " + arrayLimit + " element" + (arrayLimit === 1 ? "" : "s") + " allowed in an array.");
          }
          var newIndex = getMaxIndex(a2) + 1;
          a2[newIndex] = b2;
          setMaxIndex(a2, newIndex);
          return a2;
        }
        var result = [].concat(a2, b2);
        if (result.length > arrayLimit) {
          if (throwOnLimitExceeded) {
            throw new RangeError("Array limit exceeded. Only " + arrayLimit + " element" + (arrayLimit === 1 ? "" : "s") + " allowed in an array.");
          }
          return markOverflow(arrayToObject(result, { plainObjects }), result.length - 1);
        }
        return result;
      };
      var maybeMap = function maybeMap2(val, fn) {
        if (isArray(val)) {
          var mapped = [];
          for (var i2 = 0; i2 < val.length; i2 += 1) {
            mapped[mapped.length] = fn(val[i2]);
          }
          return mapped;
        }
        return fn(val);
      };
      module.exports = {
        arrayToObject,
        assign,
        combine,
        compact,
        decode,
        encode,
        isBuffer,
        isOverflow,
        isRegExp,
        markOverflow,
        maybeMap,
        merge
      };
    }
  });

  // node_modules/qs/lib/stringify.js
  var require_stringify = __commonJS({
    "node_modules/qs/lib/stringify.js"(exports, module) {
      "use strict";
      var getSideChannel = require_side_channel();
      var utils = require_utils();
      var formats = require_formats();
      var has = Object.prototype.hasOwnProperty;
      var arrayPrefixGenerators = {
        brackets: function brackets(prefix) {
          return prefix + "[]";
        },
        comma: "comma",
        indices: function indices2(prefix, key) {
          return prefix + "[" + key + "]";
        },
        repeat: function repeat(prefix) {
          return prefix;
        }
      };
      var isArray = Array.isArray;
      var push = Array.prototype.push;
      var pushToArray = function(arr, valueOrArray) {
        push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
      };
      var toISO = Date.prototype.toISOString;
      var defaultFormat = formats["default"];
      var defaults = {
        addQueryPrefix: false,
        allowDots: false,
        allowEmptyArrays: false,
        arrayFormat: "indices",
        charset: "utf-8",
        charsetSentinel: false,
        commaRoundTrip: false,
        delimiter: "&",
        encode: true,
        encodeDotInKeys: false,
        encoder: utils.encode,
        encodeValuesOnly: false,
        filter: void 0,
        format: defaultFormat,
        formatter: formats.formatters[defaultFormat],
        // deprecated
        indices: false,
        serializeDate: function serializeDate(date) {
          return toISO.call(date);
        },
        skipNulls: false,
        strictNullHandling: false
      };
      var isNonNullishPrimitive = function isNonNullishPrimitive2(v2) {
        return typeof v2 === "string" || typeof v2 === "number" || typeof v2 === "boolean" || typeof v2 === "symbol" || typeof v2 === "bigint";
      };
      var sentinel = {};
      var stringify = function stringify2(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder, filter, sort, allowDots, serializeDate, format2, formatter, encodeValuesOnly, charset, sideChannel) {
        var obj = object;
        var tmpSc = sideChannel;
        var step = 0;
        var findFlag = false;
        while ((tmpSc = tmpSc.get(sentinel)) !== void 0 && !findFlag) {
          var pos = tmpSc.get(object);
          step += 1;
          if (typeof pos !== "undefined") {
            if (pos === step) {
              throw new RangeError("Cyclic object value");
            } else {
              findFlag = true;
            }
          }
          if (typeof tmpSc.get(sentinel) === "undefined") {
            step = 0;
          }
        }
        if (typeof filter === "function") {
          obj = filter(prefix, obj);
        } else if (obj instanceof Date) {
          obj = serializeDate(obj);
        } else if (generateArrayPrefix === "comma" && isArray(obj)) {
          obj = utils.maybeMap(obj, function(value2) {
            if (value2 instanceof Date) {
              return serializeDate(value2);
            }
            return value2;
          });
        }
        if (obj === null) {
          if (strictNullHandling) {
            return formatter(encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, "key", format2) : prefix);
          }
          obj = "";
        }
        if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
          if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, "key", format2);
            return [formatter(keyValue) + "=" + formatter(encoder(obj, defaults.encoder, charset, "value", format2))];
          }
          return [formatter(prefix) + "=" + formatter(String(obj))];
        }
        var values = [];
        if (typeof obj === "undefined") {
          return values;
        }
        var objKeys;
        if (generateArrayPrefix === "comma" && isArray(obj)) {
          if (encodeValuesOnly && encoder) {
            obj = utils.maybeMap(obj, function(v2) {
              return v2 == null ? v2 : encoder(v2);
            });
          }
          objKeys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
        } else if (isArray(filter)) {
          objKeys = filter;
        } else {
          var keys2 = Object.keys(obj);
          objKeys = sort ? keys2.sort(sort) : keys2;
        }
        var encodedPrefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
        var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encodedPrefix + "[]" : encodedPrefix;
        if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
          return adjustedPrefix + "[]";
        }
        for (var j2 = 0; j2 < objKeys.length; ++j2) {
          var key = objKeys[j2];
          var value = typeof key === "object" && key && typeof key.value !== "undefined" ? key.value : obj[key];
          if (skipNulls && value === null) {
            continue;
          }
          var encodedKey = allowDots && encodeDotInKeys ? String(key).replace(/\./g, "%2E") : String(key);
          var keyPrefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjustedPrefix, encodedKey) : adjustedPrefix : adjustedPrefix + (allowDots ? "." + encodedKey : "[" + encodedKey + "]");
          sideChannel.set(object, step);
          var valueSideChannel = getSideChannel();
          valueSideChannel.set(sentinel, sideChannel);
          pushToArray(values, stringify2(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            allowEmptyArrays,
            strictNullHandling,
            skipNulls,
            encodeDotInKeys,
            generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format2,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
          ));
        }
        return values;
      };
      var normalizeStringifyOptions = function normalizeStringifyOptions2(opts) {
        if (!opts) {
          return defaults;
        }
        if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
          throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
        }
        if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
          throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
        }
        if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
          throw new TypeError("Encoder has to be a function.");
        }
        var charset = opts.charset || defaults.charset;
        if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
          throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
        }
        var format2 = formats["default"];
        if (typeof opts.format !== "undefined") {
          if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError("Unknown format option provided.");
          }
          format2 = opts.format;
        }
        var formatter = formats.formatters[format2];
        var filter = defaults.filter;
        if (typeof opts.filter === "function" || isArray(opts.filter)) {
          filter = opts.filter;
        }
        var arrayFormat;
        if (opts.arrayFormat in arrayPrefixGenerators) {
          arrayFormat = opts.arrayFormat;
        } else if ("indices" in opts) {
          arrayFormat = opts.indices ? "indices" : "repeat";
        } else {
          arrayFormat = defaults.arrayFormat;
        }
        if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
          throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
        }
        var allowDots = typeof opts.allowDots === "undefined" ? opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
        return {
          addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
          allowDots,
          allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
          arrayFormat,
          charset,
          charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
          commaRoundTrip: !!opts.commaRoundTrip,
          delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
          encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
          encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
          encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
          encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
          filter,
          format: format2,
          formatter,
          serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
          skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
          sort: typeof opts.sort === "function" ? opts.sort : null,
          strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
        };
      };
      module.exports = function(object, opts) {
        var obj = object;
        var options = normalizeStringifyOptions(opts);
        var objKeys;
        var filter;
        if (typeof options.filter === "function") {
          filter = options.filter;
          obj = filter("", obj);
        } else if (isArray(options.filter)) {
          filter = options.filter;
          objKeys = filter;
        }
        var keys2 = [];
        if (typeof obj !== "object" || obj === null) {
          return "";
        }
        var generateArrayPrefix = arrayPrefixGenerators[options.arrayFormat];
        var commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
        if (!objKeys) {
          objKeys = Object.keys(obj);
        }
        if (options.sort) {
          objKeys.sort(options.sort);
        }
        var sideChannel = getSideChannel();
        for (var i2 = 0; i2 < objKeys.length; ++i2) {
          var key = objKeys[i2];
          if (typeof key === "undefined" || key === null) {
            continue;
          }
          var value = obj[key];
          if (options.skipNulls && value === null) {
            continue;
          }
          pushToArray(keys2, stringify(
            value,
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.allowEmptyArrays,
            options.strictNullHandling,
            options.skipNulls,
            options.encodeDotInKeys,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
          ));
        }
        var joined = keys2.join(options.delimiter);
        var prefix = options.addQueryPrefix === true ? "?" : "";
        if (options.charsetSentinel) {
          if (options.charset === "iso-8859-1") {
            prefix += "utf8=%26%2310003%3B" + options.delimiter;
          } else {
            prefix += "utf8=%E2%9C%93" + options.delimiter;
          }
        }
        return joined.length > 0 ? prefix + joined : "";
      };
    }
  });

  // node_modules/qs/lib/parse.js
  var require_parse = __commonJS({
    "node_modules/qs/lib/parse.js"(exports, module) {
      "use strict";
      var utils = require_utils();
      var has = Object.prototype.hasOwnProperty;
      var isArray = Array.isArray;
      var defaults = {
        allowDots: false,
        allowEmptyArrays: false,
        allowPrototypes: false,
        allowSparse: false,
        arrayLimit: 20,
        charset: "utf-8",
        charsetSentinel: false,
        comma: false,
        decodeDotInKeys: false,
        decoder: utils.decode,
        delimiter: "&",
        depth: 5,
        duplicates: "combine",
        ignoreQueryPrefix: false,
        interpretNumericEntities: false,
        parameterLimit: 1e3,
        parseArrays: true,
        plainObjects: false,
        strictDepth: false,
        strictMerge: true,
        strictNullHandling: false,
        throwOnLimitExceeded: false
      };
      var interpretNumericEntities = function(str) {
        return str.replace(/&#(\d+);/g, function($0, numberStr) {
          return String.fromCharCode(parseInt(numberStr, 10));
        });
      };
      var parseArrayValue = function(val, options, currentArrayLength, isFlatArrayValue) {
        if (val && typeof val === "string" && options.comma && val.indexOf(",") > -1) {
          if (isFlatArrayValue && options.throwOnLimitExceeded) {
            var commaCount = 0;
            var commaIndex = val.indexOf(",");
            while (commaIndex > -1) {
              commaCount += 1;
              if (commaCount >= options.arrayLimit) {
                throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
              }
              commaIndex = val.indexOf(",", commaIndex + 1);
            }
          }
          return val.split(",");
        }
        if (options.throwOnLimitExceeded && currentArrayLength >= options.arrayLimit) {
          throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
        }
        return val;
      };
      var isoSentinel = "utf8=%26%2310003%3B";
      var charsetSentinel = "utf8=%E2%9C%93";
      var parseValues = function parseQueryStringValues(str, options) {
        var obj = { __proto__: null };
        var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, "") : str;
        cleanStr = cleanStr.replace(/%5B/gi, "[").replace(/%5D/gi, "]");
        var limit = options.parameterLimit === Infinity ? void 0 : options.parameterLimit;
        var parts = cleanStr.split(
          options.delimiter,
          options.throwOnLimitExceeded && typeof limit !== "undefined" ? limit + 1 : limit
        );
        if (options.throwOnLimitExceeded && typeof limit !== "undefined" && parts.length > limit) {
          throw new RangeError("Parameter limit exceeded. Only " + limit + " parameter" + (limit === 1 ? "" : "s") + " allowed.");
        }
        var skipIndex = -1;
        var i2;
        var charset = options.charset;
        if (options.charsetSentinel) {
          for (i2 = 0; i2 < parts.length; ++i2) {
            if (parts[i2].indexOf("utf8=") === 0) {
              if (parts[i2] === charsetSentinel) {
                charset = "utf-8";
              } else if (parts[i2] === isoSentinel) {
                charset = "iso-8859-1";
              }
              skipIndex = i2;
              i2 = parts.length;
            }
          }
        }
        for (i2 = 0; i2 < parts.length; ++i2) {
          if (i2 === skipIndex) {
            continue;
          }
          var part = parts[i2];
          var bracketEqualsPos = part.indexOf("]=");
          var pos = bracketEqualsPos === -1 ? part.indexOf("=") : bracketEqualsPos + 1;
          var key;
          var val;
          if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, "key");
            val = options.strictNullHandling ? null : "";
          } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, "key");
            if (key !== null) {
              val = utils.maybeMap(
                parseArrayValue(
                  part.slice(pos + 1),
                  options,
                  isArray(obj[key]) ? obj[key].length : 0,
                  part.indexOf("[]=") === -1
                ),
                function(encodedVal) {
                  return options.decoder(encodedVal, defaults.decoder, charset, "value");
                }
              );
            }
          }
          if (val && options.interpretNumericEntities && charset === "iso-8859-1") {
            val = interpretNumericEntities(String(val));
          }
          if (part.indexOf("[]=") > -1) {
            val = isArray(val) ? [val] : val;
          }
          if (options.comma && isArray(val) && val.length > options.arrayLimit) {
            val = utils.combine([], val, options.arrayLimit, options.plainObjects, options.throwOnLimitExceeded);
          }
          if (key !== null) {
            var existing = has.call(obj, key);
            if (existing && (options.duplicates === "combine" || part.indexOf("[]=") > -1)) {
              obj[key] = utils.combine(
                obj[key],
                val,
                options.arrayLimit,
                options.plainObjects,
                options.throwOnLimitExceeded
              );
            } else if (!existing || options.duplicates === "last") {
              obj[key] = val;
            }
          }
        }
        return obj;
      };
      var parseObject = function(chain, val, options, valuesParsed) {
        var currentArrayLength = 0;
        if (chain.length > 0 && chain[chain.length - 1] === "[]") {
          var parentKey = chain.slice(0, -1).join("");
          currentArrayLength = Array.isArray(val) && val[parentKey] ? val[parentKey].length : 0;
        }
        var leaf = valuesParsed ? val : parseArrayValue(val, options, currentArrayLength);
        for (var i2 = chain.length - 1; i2 >= 0; --i2) {
          var obj;
          var root = chain[i2];
          if (root === "[]" && options.parseArrays) {
            if (utils.isOverflow(leaf)) {
              obj = leaf;
            } else {
              obj = options.allowEmptyArrays && (leaf === "" || options.strictNullHandling && leaf === null) ? [] : utils.combine(
                [],
                leaf,
                options.arrayLimit,
                options.plainObjects,
                options.throwOnLimitExceeded
              );
            }
          } else {
            obj = options.plainObjects ? { __proto__: null } : {};
            var cleanRoot = root.charAt(0) === "[" && root.charAt(root.length - 1) === "]" ? root.slice(1, -1) : root;
            var decodedRoot = options.decodeDotInKeys ? cleanRoot.replace(/%2E/g, ".") : cleanRoot;
            var index = parseInt(decodedRoot, 10);
            var isValidArrayIndex = !isNaN(index) && root !== decodedRoot && String(index) === decodedRoot && index >= 0 && options.parseArrays;
            if (!options.parseArrays && decodedRoot === "") {
              obj = { 0: leaf };
            } else if (isValidArrayIndex && index < options.arrayLimit) {
              obj = [];
              obj[index] = leaf;
            } else if (isValidArrayIndex && options.throwOnLimitExceeded) {
              throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
            } else if (isValidArrayIndex) {
              obj[index] = leaf;
              utils.markOverflow(obj, index);
            } else if (decodedRoot !== "__proto__") {
              obj[decodedRoot] = leaf;
            }
          }
          leaf = obj;
        }
        return leaf;
      };
      var splitKeyIntoSegments = function splitKeyIntoSegments2(originalKey, options) {
        var key = options.allowDots ? originalKey.replace(/\.([^.[]+)/g, "[$1]") : originalKey;
        if (options.depth <= 0) {
          if (!options.plainObjects && has.call(Object.prototype, key)) {
            if (!options.allowPrototypes) {
              return;
            }
          }
          return [key];
        }
        var segments = [];
        var first = key.indexOf("[");
        var parent = first >= 0 ? key.slice(0, first) : key;
        if (parent) {
          if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
              return;
            }
          }
          segments[segments.length] = parent;
        }
        var n3 = key.length;
        var open = first;
        var collected = 0;
        while (open >= 0 && collected < options.depth) {
          var level = 1;
          var i2 = open + 1;
          var close = -1;
          while (i2 < n3 && close < 0) {
            var cu = key.charCodeAt(i2);
            if (cu === 91) {
              level += 1;
            } else if (cu === 93) {
              level -= 1;
              if (level === 0) {
                close = i2;
              }
            }
            i2 += 1;
          }
          if (close < 0) {
            segments[segments.length] = "[" + key.slice(open) + "]";
            return segments;
          }
          var seg = key.slice(open, close + 1);
          var content = seg.slice(1, -1);
          if (!options.plainObjects && has.call(Object.prototype, content) && !options.allowPrototypes) {
            return;
          }
          segments[segments.length] = seg;
          collected += 1;
          open = key.indexOf("[", close + 1);
        }
        if (open >= 0) {
          if (options.strictDepth === true) {
            throw new RangeError("Input depth exceeded depth option of " + options.depth + " and strictDepth is true");
          }
          segments[segments.length] = "[" + key.slice(open) + "]";
        }
        return segments;
      };
      var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
        if (!givenKey) {
          return;
        }
        var keys2 = splitKeyIntoSegments(givenKey, options);
        if (!keys2) {
          return;
        }
        return parseObject(keys2, val, options, valuesParsed);
      };
      var normalizeParseOptions = function normalizeParseOptions2(opts) {
        if (!opts) {
          return defaults;
        }
        if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
          throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
        }
        if (typeof opts.decodeDotInKeys !== "undefined" && typeof opts.decodeDotInKeys !== "boolean") {
          throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");
        }
        if (opts.decoder !== null && typeof opts.decoder !== "undefined" && typeof opts.decoder !== "function") {
          throw new TypeError("Decoder has to be a function.");
        }
        if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
          throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
        }
        if (typeof opts.throwOnLimitExceeded !== "undefined" && typeof opts.throwOnLimitExceeded !== "boolean") {
          throw new TypeError("`throwOnLimitExceeded` option must be a boolean");
        }
        var charset = typeof opts.charset === "undefined" ? defaults.charset : opts.charset;
        var duplicates = typeof opts.duplicates === "undefined" ? defaults.duplicates : opts.duplicates;
        if (duplicates !== "combine" && duplicates !== "first" && duplicates !== "last") {
          throw new TypeError("The duplicates option must be either combine, first, or last");
        }
        var allowDots = typeof opts.allowDots === "undefined" ? opts.decodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
        return {
          allowDots,
          allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
          allowPrototypes: typeof opts.allowPrototypes === "boolean" ? opts.allowPrototypes : defaults.allowPrototypes,
          allowSparse: typeof opts.allowSparse === "boolean" ? opts.allowSparse : defaults.allowSparse,
          arrayLimit: typeof opts.arrayLimit === "number" ? opts.arrayLimit : defaults.arrayLimit,
          charset,
          charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
          comma: typeof opts.comma === "boolean" ? opts.comma : defaults.comma,
          decodeDotInKeys: typeof opts.decodeDotInKeys === "boolean" ? opts.decodeDotInKeys : defaults.decodeDotInKeys,
          decoder: typeof opts.decoder === "function" ? opts.decoder : defaults.decoder,
          delimiter: typeof opts.delimiter === "string" || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
          // eslint-disable-next-line no-implicit-coercion, no-extra-parens
          depth: typeof opts.depth === "number" || opts.depth === false ? +opts.depth : defaults.depth,
          duplicates,
          ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
          interpretNumericEntities: typeof opts.interpretNumericEntities === "boolean" ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
          parameterLimit: typeof opts.parameterLimit === "number" ? opts.parameterLimit : defaults.parameterLimit,
          parseArrays: opts.parseArrays !== false,
          plainObjects: typeof opts.plainObjects === "boolean" ? opts.plainObjects : defaults.plainObjects,
          strictDepth: typeof opts.strictDepth === "boolean" ? !!opts.strictDepth : defaults.strictDepth,
          strictMerge: typeof opts.strictMerge === "boolean" ? !!opts.strictMerge : defaults.strictMerge,
          strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling,
          throwOnLimitExceeded: typeof opts.throwOnLimitExceeded === "boolean" ? opts.throwOnLimitExceeded : false
        };
      };
      module.exports = function(str, opts) {
        var options = normalizeParseOptions(opts);
        if (str === "" || str === null || typeof str === "undefined") {
          return options.plainObjects ? { __proto__: null } : {};
        }
        var tempObj = typeof str === "string" ? parseValues(str, options) : str;
        var obj = options.plainObjects ? { __proto__: null } : {};
        var keys2 = Object.keys(tempObj);
        for (var i2 = 0; i2 < keys2.length; ++i2) {
          var key = keys2[i2];
          var newObj = parseKeys(key, tempObj[key], options, typeof str === "string");
          obj = utils.merge(obj, newObj, options);
        }
        if (options.allowSparse === true) {
          return obj;
        }
        return utils.compact(obj);
      };
    }
  });

  // node_modules/qs/lib/index.js
  var require_lib = __commonJS({
    "node_modules/qs/lib/index.js"(exports, module) {
      "use strict";
      var stringify = require_stringify();
      var parse2 = require_parse();
      var formats = require_formats();
      module.exports = {
        formats,
        parse: parse2,
        stringify
      };
    }
  });

  // node_modules/url/url.js
  var require_url = __commonJS({
    "node_modules/url/url.js"(exports) {
      "use strict";
      var punycode = require_punycode();
      function Url() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
      }
      var protocolPattern = /^([a-z0-9.+-]+:)/i;
      var portPattern = /:[0-9]*$/;
      var simplePathPattern = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;
      var delims = [
        "<",
        ">",
        '"',
        "`",
        " ",
        "\r",
        "\n",
        "	"
      ];
      var unwise = [
        "{",
        "}",
        "|",
        "\\",
        "^",
        "`"
      ].concat(delims);
      var autoEscape = ["'"].concat(unwise);
      var nonHostChars = [
        "%",
        "/",
        "?",
        ";",
        "#"
      ].concat(autoEscape);
      var hostEndingChars = [
        "/",
        "?",
        "#"
      ];
      var hostnameMaxLen = 255;
      var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
      var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
      var unsafeProtocol = {
        javascript: true,
        "javascript:": true
      };
      var hostlessProtocol = {
        javascript: true,
        "javascript:": true
      };
      var slashedProtocol = {
        http: true,
        https: true,
        ftp: true,
        gopher: true,
        file: true,
        "http:": true,
        "https:": true,
        "ftp:": true,
        "gopher:": true,
        "file:": true
      };
      var querystring = require_lib();
      function urlParse(url2, parseQueryString, slashesDenoteHost) {
        if (url2 && typeof url2 === "object" && url2 instanceof Url) {
          return url2;
        }
        var u3 = new Url();
        u3.parse(url2, parseQueryString, slashesDenoteHost);
        return u3;
      }
      Url.prototype.parse = function(url2, parseQueryString, slashesDenoteHost) {
        if (typeof url2 !== "string") {
          throw new TypeError("Parameter 'url' must be a string, not " + typeof url2);
        }
        var queryIndex = url2.indexOf("?"), splitter = queryIndex !== -1 && queryIndex < url2.indexOf("#") ? "?" : "#", uSplit = url2.split(splitter), slashRegex = /\\/g;
        uSplit[0] = uSplit[0].replace(slashRegex, "/");
        url2 = uSplit.join(splitter);
        var rest = url2;
        rest = rest.trim();
        if (!slashesDenoteHost && url2.split("#").length === 1) {
          var simplePath = simplePathPattern.exec(rest);
          if (simplePath) {
            this.path = rest;
            this.href = rest;
            this.pathname = simplePath[1];
            if (simplePath[2]) {
              this.search = simplePath[2];
              if (parseQueryString) {
                this.query = querystring.parse(this.search.substr(1));
              } else {
                this.query = this.search.substr(1);
              }
            } else if (parseQueryString) {
              this.search = "";
              this.query = {};
            }
            return this;
          }
        }
        var proto = protocolPattern.exec(rest);
        if (proto) {
          proto = proto[0];
          var lowerProto = proto.toLowerCase();
          this.protocol = lowerProto;
          rest = rest.substr(proto.length);
        }
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@/]+@[^@/]+/)) {
          var slashes = rest.substr(0, 2) === "//";
          if (slashes && !(proto && hostlessProtocol[proto])) {
            rest = rest.substr(2);
            this.slashes = true;
          }
        }
        if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
          var hostEnd = -1;
          for (var i2 = 0; i2 < hostEndingChars.length; i2++) {
            var hec = rest.indexOf(hostEndingChars[i2]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
              hostEnd = hec;
            }
          }
          var auth, atSign;
          if (hostEnd === -1) {
            atSign = rest.lastIndexOf("@");
          } else {
            atSign = rest.lastIndexOf("@", hostEnd);
          }
          if (atSign !== -1) {
            auth = rest.slice(0, atSign);
            rest = rest.slice(atSign + 1);
            this.auth = decodeURIComponent(auth);
          }
          hostEnd = -1;
          for (var i2 = 0; i2 < nonHostChars.length; i2++) {
            var hec = rest.indexOf(nonHostChars[i2]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
              hostEnd = hec;
            }
          }
          if (hostEnd === -1) {
            hostEnd = rest.length;
          }
          this.host = rest.slice(0, hostEnd);
          rest = rest.slice(hostEnd);
          this.parseHost();
          this.hostname = this.hostname || "";
          var ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
          if (!ipv6Hostname) {
            var hostparts = this.hostname.split(/\./);
            for (var i2 = 0, l2 = hostparts.length; i2 < l2; i2++) {
              var part = hostparts[i2];
              if (!part) {
                continue;
              }
              if (!part.match(hostnamePartPattern)) {
                var newpart = "";
                for (var j2 = 0, k2 = part.length; j2 < k2; j2++) {
                  if (part.charCodeAt(j2) > 127) {
                    newpart += "x";
                  } else {
                    newpart += part[j2];
                  }
                }
                if (!newpart.match(hostnamePartPattern)) {
                  var validParts = hostparts.slice(0, i2);
                  var notHost = hostparts.slice(i2 + 1);
                  var bit = part.match(hostnamePartStart);
                  if (bit) {
                    validParts.push(bit[1]);
                    notHost.unshift(bit[2]);
                  }
                  if (notHost.length) {
                    rest = "/" + notHost.join(".") + rest;
                  }
                  this.hostname = validParts.join(".");
                  break;
                }
              }
            }
          }
          if (this.hostname.length > hostnameMaxLen) {
            this.hostname = "";
          } else {
            this.hostname = this.hostname.toLowerCase();
          }
          if (!ipv6Hostname) {
            this.hostname = punycode.toASCII(this.hostname);
          }
          var p3 = this.port ? ":" + this.port : "";
          var h2 = this.hostname || "";
          this.host = h2 + p3;
          this.href += this.host;
          if (ipv6Hostname) {
            this.hostname = this.hostname.substr(1, this.hostname.length - 2);
            if (rest[0] !== "/") {
              rest = "/" + rest;
            }
          }
        }
        if (!unsafeProtocol[lowerProto]) {
          for (var i2 = 0, l2 = autoEscape.length; i2 < l2; i2++) {
            var ae = autoEscape[i2];
            if (rest.indexOf(ae) === -1) {
              continue;
            }
            var esc = encodeURIComponent(ae);
            if (esc === ae) {
              esc = escape(ae);
            }
            rest = rest.split(ae).join(esc);
          }
        }
        var hash = rest.indexOf("#");
        if (hash !== -1) {
          this.hash = rest.substr(hash);
          rest = rest.slice(0, hash);
        }
        var qm = rest.indexOf("?");
        if (qm !== -1) {
          this.search = rest.substr(qm);
          this.query = rest.substr(qm + 1);
          if (parseQueryString) {
            this.query = querystring.parse(this.query);
          }
          rest = rest.slice(0, qm);
        } else if (parseQueryString) {
          this.search = "";
          this.query = {};
        }
        if (rest) {
          this.pathname = rest;
        }
        if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
          this.pathname = "/";
        }
        if (this.pathname || this.search) {
          var p3 = this.pathname || "";
          var s2 = this.search || "";
          this.path = p3 + s2;
        }
        this.href = this.format();
        return this;
      };
      function urlFormat(obj) {
        if (typeof obj === "string") {
          obj = urlParse(obj);
        }
        if (!(obj instanceof Url)) {
          return Url.prototype.format.call(obj);
        }
        return obj.format();
      }
      Url.prototype.format = function() {
        var auth = this.auth || "";
        if (auth) {
          auth = encodeURIComponent(auth);
          auth = auth.replace(/%3A/i, ":");
          auth += "@";
        }
        var protocol = this.protocol || "", pathname = this.pathname || "", hash = this.hash || "", host = false, query = "";
        if (this.host) {
          host = auth + this.host;
        } else if (this.hostname) {
          host = auth + (this.hostname.indexOf(":") === -1 ? this.hostname : "[" + this.hostname + "]");
          if (this.port) {
            host += ":" + this.port;
          }
        }
        if (this.query && typeof this.query === "object" && Object.keys(this.query).length) {
          query = querystring.stringify(this.query, {
            arrayFormat: "repeat",
            addQueryPrefix: false
          });
        }
        var search = this.search || query && "?" + query || "";
        if (protocol && protocol.substr(-1) !== ":") {
          protocol += ":";
        }
        if (this.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
          host = "//" + (host || "");
          if (pathname && pathname.charAt(0) !== "/") {
            pathname = "/" + pathname;
          }
        } else if (!host) {
          host = "";
        }
        if (hash && hash.charAt(0) !== "#") {
          hash = "#" + hash;
        }
        if (search && search.charAt(0) !== "?") {
          search = "?" + search;
        }
        pathname = pathname.replace(/[?#]/g, function(match) {
          return encodeURIComponent(match);
        });
        search = search.replace("#", "%23");
        return protocol + host + pathname + search + hash;
      };
      function urlResolve(source, relative) {
        return urlParse(source, false, true).resolve(relative);
      }
      Url.prototype.resolve = function(relative) {
        return this.resolveObject(urlParse(relative, false, true)).format();
      };
      function urlResolveObject(source, relative) {
        if (!source) {
          return relative;
        }
        return urlParse(source, false, true).resolveObject(relative);
      }
      Url.prototype.resolveObject = function(relative) {
        if (typeof relative === "string") {
          var rel = new Url();
          rel.parse(relative, false, true);
          relative = rel;
        }
        var result = new Url();
        var tkeys = Object.keys(this);
        for (var tk = 0; tk < tkeys.length; tk++) {
          var tkey = tkeys[tk];
          result[tkey] = this[tkey];
        }
        result.hash = relative.hash;
        if (relative.href === "") {
          result.href = result.format();
          return result;
        }
        if (relative.slashes && !relative.protocol) {
          var rkeys = Object.keys(relative);
          for (var rk = 0; rk < rkeys.length; rk++) {
            var rkey = rkeys[rk];
            if (rkey !== "protocol") {
              result[rkey] = relative[rkey];
            }
          }
          if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
            result.pathname = "/";
            result.path = result.pathname;
          }
          result.href = result.format();
          return result;
        }
        if (relative.protocol && relative.protocol !== result.protocol) {
          if (!slashedProtocol[relative.protocol]) {
            var keys2 = Object.keys(relative);
            for (var v2 = 0; v2 < keys2.length; v2++) {
              var k2 = keys2[v2];
              result[k2] = relative[k2];
            }
            result.href = result.format();
            return result;
          }
          result.protocol = relative.protocol;
          if (!relative.host && !hostlessProtocol[relative.protocol]) {
            var relPath = (relative.pathname || "").split("/");
            while (relPath.length && !(relative.host = relPath.shift())) {
            }
            if (!relative.host) {
              relative.host = "";
            }
            if (!relative.hostname) {
              relative.hostname = "";
            }
            if (relPath[0] !== "") {
              relPath.unshift("");
            }
            if (relPath.length < 2) {
              relPath.unshift("");
            }
            result.pathname = relPath.join("/");
          } else {
            result.pathname = relative.pathname;
          }
          result.search = relative.search;
          result.query = relative.query;
          result.host = relative.host || "";
          result.auth = relative.auth;
          result.hostname = relative.hostname || relative.host;
          result.port = relative.port;
          if (result.pathname || result.search) {
            var p3 = result.pathname || "";
            var s2 = result.search || "";
            result.path = p3 + s2;
          }
          result.slashes = result.slashes || relative.slashes;
          result.href = result.format();
          return result;
        }
        var isSourceAbs = result.pathname && result.pathname.charAt(0) === "/", isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === "/", mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname, removeAllDots = mustEndAbs, srcPath = result.pathname && result.pathname.split("/") || [], relPath = relative.pathname && relative.pathname.split("/") || [], psychotic = result.protocol && !slashedProtocol[result.protocol];
        if (psychotic) {
          result.hostname = "";
          result.port = null;
          if (result.host) {
            if (srcPath[0] === "") {
              srcPath[0] = result.host;
            } else {
              srcPath.unshift(result.host);
            }
          }
          result.host = "";
          if (relative.protocol) {
            relative.hostname = null;
            relative.port = null;
            if (relative.host) {
              if (relPath[0] === "") {
                relPath[0] = relative.host;
              } else {
                relPath.unshift(relative.host);
              }
            }
            relative.host = null;
          }
          mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "");
        }
        if (isRelAbs) {
          result.host = relative.host || relative.host === "" ? relative.host : result.host;
          result.hostname = relative.hostname || relative.hostname === "" ? relative.hostname : result.hostname;
          result.search = relative.search;
          result.query = relative.query;
          srcPath = relPath;
        } else if (relPath.length) {
          if (!srcPath) {
            srcPath = [];
          }
          srcPath.pop();
          srcPath = srcPath.concat(relPath);
          result.search = relative.search;
          result.query = relative.query;
        } else if (relative.search != null) {
          if (psychotic) {
            result.host = srcPath.shift();
            result.hostname = result.host;
            var authInHost = result.host && result.host.indexOf("@") > 0 ? result.host.split("@") : false;
            if (authInHost) {
              result.auth = authInHost.shift();
              result.hostname = authInHost.shift();
              result.host = result.hostname;
            }
          }
          result.search = relative.search;
          result.query = relative.query;
          if (result.pathname !== null || result.search !== null) {
            result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
          }
          result.href = result.format();
          return result;
        }
        if (!srcPath.length) {
          result.pathname = null;
          if (result.search) {
            result.path = "/" + result.search;
          } else {
            result.path = null;
          }
          result.href = result.format();
          return result;
        }
        var last = srcPath.slice(-1)[0];
        var hasTrailingSlash = (result.host || relative.host || srcPath.length > 1) && (last === "." || last === "..") || last === "";
        var up = 0;
        for (var i2 = srcPath.length; i2 >= 0; i2--) {
          last = srcPath[i2];
          if (last === ".") {
            srcPath.splice(i2, 1);
          } else if (last === "..") {
            srcPath.splice(i2, 1);
            up++;
          } else if (up) {
            srcPath.splice(i2, 1);
            up--;
          }
        }
        if (!mustEndAbs && !removeAllDots) {
          for (; up--; up) {
            srcPath.unshift("..");
          }
        }
        if (mustEndAbs && srcPath[0] !== "" && (!srcPath[0] || srcPath[0].charAt(0) !== "/")) {
          srcPath.unshift("");
        }
        if (hasTrailingSlash && srcPath.join("/").substr(-1) !== "/") {
          srcPath.push("");
        }
        var isAbsolute = srcPath[0] === "" || srcPath[0] && srcPath[0].charAt(0) === "/";
        if (psychotic) {
          result.hostname = isAbsolute ? "" : srcPath.length ? srcPath.shift() : "";
          result.host = result.hostname;
          var authInHost = result.host && result.host.indexOf("@") > 0 ? result.host.split("@") : false;
          if (authInHost) {
            result.auth = authInHost.shift();
            result.hostname = authInHost.shift();
            result.host = result.hostname;
          }
        }
        mustEndAbs = mustEndAbs || result.host && srcPath.length;
        if (mustEndAbs && !isAbsolute) {
          srcPath.unshift("");
        }
        if (srcPath.length > 0) {
          result.pathname = srcPath.join("/");
        } else {
          result.pathname = null;
          result.path = null;
        }
        if (result.pathname !== null || result.search !== null) {
          result.path = (result.pathname ? result.pathname : "") + (result.search ? result.search : "");
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
      };
      Url.prototype.parseHost = function() {
        var host = this.host;
        var port = portPattern.exec(host);
        if (port) {
          port = port[0];
          if (port !== ":") {
            this.port = port.substr(1);
          }
          host = host.substr(0, host.length - port.length);
        }
        if (host) {
          this.hostname = host;
        }
      };
      exports.parse = urlParse;
      exports.resolve = urlResolve;
      exports.resolveObject = urlResolveObject;
      exports.format = urlFormat;
      exports.Url = Url;
    }
  });

  // node_modules/gl-matrix/dist/esm/common.js
  var EPSILON = 1e-6;
  var DEG_TO_RAD = Math.PI / 180;
  var RAD_TO_DEG = 180 / Math.PI;

  // node_modules/gl-matrix/dist/esm/mat4.js
  var IDENTITY_4X4 = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  ]);
  var Mat4 = class _Mat4 extends Float32Array {
    /**
     * The number of bytes in a {@link Mat4}.
     */
    static BYTE_LENGTH = 16 * Float32Array.BYTES_PER_ELEMENT;
    /**
     * Create a {@link Mat4}.
     */
    constructor(...values) {
      switch (values.length) {
        case 16:
          super(values);
          break;
        case 2:
          super(values[0], values[1], 16);
          break;
        case 1:
          const v2 = values[0];
          if (typeof v2 === "number") {
            super([
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2,
              v2
            ]);
          } else {
            super(v2, 0, 16);
          }
          break;
        default:
          super(IDENTITY_4X4);
          break;
      }
    }
    //============
    // Attributes
    //============
    /**
     * A string representation of `this`
     * Equivalent to `Mat4.str(this);`
     */
    get str() {
      return _Mat4.str(this);
    }
    //===================
    // Instance methods
    //===================
    /**
     * Copy the values from another {@link Mat4} into `this`.
     *
     * @param a the source vector
     * @returns `this`
     */
    copy(a2) {
      this.set(a2);
      return this;
    }
    /**
     * Set `this` to the identity matrix
     * Equivalent to Mat4.identity(this)
     *
     * @returns `this`
     */
    identity() {
      this.set(IDENTITY_4X4);
      return this;
    }
    /**
     * Multiplies this {@link Mat4} against another one
     * Equivalent to `Mat4.multiply(this, this, b);`
     *
     * @param out - The receiving Matrix
     * @param a - The first operand
     * @param b - The second operand
     * @returns `this`
     */
    multiply(b2) {
      return _Mat4.multiply(this, this, b2);
    }
    /**
     * Alias for {@link Mat4.multiply}
     */
    mul(b2) {
      return this;
    }
    /**
     * Transpose this {@link Mat4}
     * Equivalent to `Mat4.transpose(this, this);`
     *
     * @returns `this`
     */
    transpose() {
      return _Mat4.transpose(this, this);
    }
    /**
     * Inverts this {@link Mat4}
     * Equivalent to `Mat4.invert(this, this);`
     *
     * @returns `this`
     */
    invert() {
      return _Mat4.invert(this, this);
    }
    /**
     * Translate this {@link Mat4} by the given vector
     * Equivalent to `Mat4.translate(this, this, v);`
     *
     * @param v - The {@link Vec3} to translate by
     * @returns `this`
     */
    translate(v2) {
      return _Mat4.translate(this, this, v2);
    }
    /**
     * Rotates this {@link Mat4} by the given angle around the given axis
     * Equivalent to `Mat4.rotate(this, this, rad, axis);`
     *
     * @param rad - the angle to rotate the matrix by
     * @param axis - the axis to rotate around
     * @returns `out`
     */
    rotate(rad, axis) {
      return _Mat4.rotate(this, this, rad, axis);
    }
    /**
     * Scales this {@link Mat4} by the dimensions in the given vec3 not using vectorization
     * Equivalent to `Mat4.scale(this, this, v);`
     *
     * @param v - The {@link Vec3} to scale the matrix by
     * @returns `this`
     */
    scale(v2) {
      return _Mat4.scale(this, this, v2);
    }
    /**
     * Rotates this {@link Mat4} by the given angle around the X axis
     * Equivalent to `Mat4.rotateX(this, this, rad);`
     *
     * @param rad - the angle to rotate the matrix by
     * @returns `this`
     */
    rotateX(rad) {
      return _Mat4.rotateX(this, this, rad);
    }
    /**
     * Rotates this {@link Mat4} by the given angle around the Y axis
     * Equivalent to `Mat4.rotateY(this, this, rad);`
     *
     * @param rad - the angle to rotate the matrix by
     * @returns `this`
     */
    rotateY(rad) {
      return _Mat4.rotateY(this, this, rad);
    }
    /**
     * Rotates this {@link Mat4} by the given angle around the Z axis
     * Equivalent to `Mat4.rotateZ(this, this, rad);`
     *
     * @param rad - the angle to rotate the matrix by
     * @returns `this`
     */
    rotateZ(rad) {
      return _Mat4.rotateZ(this, this, rad);
    }
    /**
     * Generates a perspective projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * Equivalent to `Mat4.perspectiveNO(this, fovy, aspect, near, far);`
     *
     * @param fovy - Vertical field of view in radians
     * @param aspect - Aspect ratio. typically viewport width/height
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum, can be null or Infinity
     * @returns `this`
     */
    perspectiveNO(fovy, aspect, near, far) {
      return _Mat4.perspectiveNO(this, fovy, aspect, near, far);
    }
    /**
     * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
     * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * Equivalent to `Mat4.perspectiveZO(this, fovy, aspect, near, far);`
     *
     * @param fovy - Vertical field of view in radians
     * @param aspect - Aspect ratio. typically viewport width/height
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum, can be null or Infinity
     * @returns `this`
     */
    perspectiveZO(fovy, aspect, near, far) {
      return _Mat4.perspectiveZO(this, fovy, aspect, near, far);
    }
    /**
     * Generates a orthogonal projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * Equivalent to `Mat4.orthoNO(this, left, right, bottom, top, near, far);`
     *
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum
     * @returns `this`
     */
    orthoNO(left, right, bottom, top, near, far) {
      return _Mat4.orthoNO(this, left, right, bottom, top, near, far);
    }
    /**
     * Generates a orthogonal projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
     * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
     * Equivalent to `Mat4.orthoZO(this, left, right, bottom, top, near, far);`
     *
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum
     * @returns `this`
     */
    orthoZO(left, right, bottom, top, near, far) {
      return _Mat4.orthoZO(this, left, right, bottom, top, near, far);
    }
    //================
    // Static methods
    //================
    /**
     * Creates a new, identity {@link Mat4}
     * @category Static
     *
     * @returns A new {@link Mat4}
     */
    static create() {
      return new _Mat4();
    }
    /**
     * Creates a new {@link Mat4} initialized with values from an existing matrix
     * @category Static
     *
     * @param a - Matrix to clone
     * @returns A new {@link Mat4}
     */
    static clone(a2) {
      return new _Mat4(a2);
    }
    /**
     * Copy the values from one {@link Mat4} to another
     * @category Static
     *
     * @param out - The receiving Matrix
     * @param a - Matrix to copy
     * @returns `out`
     */
    static copy(out, a2) {
      out[0] = a2[0];
      out[1] = a2[1];
      out[2] = a2[2];
      out[3] = a2[3];
      out[4] = a2[4];
      out[5] = a2[5];
      out[6] = a2[6];
      out[7] = a2[7];
      out[8] = a2[8];
      out[9] = a2[9];
      out[10] = a2[10];
      out[11] = a2[11];
      out[12] = a2[12];
      out[13] = a2[13];
      out[14] = a2[14];
      out[15] = a2[15];
      return out;
    }
    /**
     * Create a new mat4 with the given values
     * @category Static
     *
     * @param values - Matrix components
     * @returns A new {@link Mat4}
     */
    static fromValues(...values) {
      return new _Mat4(...values);
    }
    /**
     * Set the components of a mat4 to the given values
     * @category Static
     *
     * @param out - The receiving matrix
     * @param values - Matrix components
     * @returns `out`
     */
    static set(out, ...values) {
      out[0] = values[0];
      out[1] = values[1];
      out[2] = values[2];
      out[3] = values[3];
      out[4] = values[4];
      out[5] = values[5];
      out[6] = values[6];
      out[7] = values[7];
      out[8] = values[8];
      out[9] = values[9];
      out[10] = values[10];
      out[11] = values[11];
      out[12] = values[12];
      out[13] = values[13];
      out[14] = values[14];
      out[15] = values[15];
      return out;
    }
    /**
     * Set a {@link Mat4} to the identity matrix
     * @category Static
     *
     * @param out - The receiving Matrix
     * @returns `out`
     */
    static identity(out) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Transpose the values of a {@link Mat4}
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the source matrix
     * @returns `out`
     */
    static transpose(out, a2) {
      if (out === a2) {
        const a01 = a2[1], a02 = a2[2], a03 = a2[3];
        const a12 = a2[6], a13 = a2[7];
        const a23 = a2[11];
        out[1] = a2[4];
        out[2] = a2[8];
        out[3] = a2[12];
        out[4] = a01;
        out[6] = a2[9];
        out[7] = a2[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a2[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
      } else {
        out[0] = a2[0];
        out[1] = a2[4];
        out[2] = a2[8];
        out[3] = a2[12];
        out[4] = a2[1];
        out[5] = a2[5];
        out[6] = a2[9];
        out[7] = a2[13];
        out[8] = a2[2];
        out[9] = a2[6];
        out[10] = a2[10];
        out[11] = a2[14];
        out[12] = a2[3];
        out[13] = a2[7];
        out[14] = a2[11];
        out[15] = a2[15];
      }
      return out;
    }
    /**
     * Inverts a {@link Mat4}
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the source matrix
     * @returns `out` or `null` if the matrix is not invertable
     */
    static invert(out, a2) {
      const a00 = a2[0], a01 = a2[1], a02 = a2[2], a03 = a2[3];
      const a10 = a2[4], a11 = a2[5], a12 = a2[6], a13 = a2[7];
      const a20 = a2[8], a21 = a2[9], a22 = a2[10], a23 = a2[11];
      const a30 = a2[12], a31 = a2[13], a32 = a2[14], a33 = a2[15];
      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) {
        return null;
      }
      det = 1 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    }
    /**
     * Calculates the adjugate of a {@link Mat4}
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the source matrix
     * @returns `out`
     */
    static adjoint(out, a2) {
      const a00 = a2[0], a01 = a2[1], a02 = a2[2], a03 = a2[3];
      const a10 = a2[4], a11 = a2[5], a12 = a2[6], a13 = a2[7];
      const a20 = a2[8], a21 = a2[9], a22 = a2[10], a23 = a2[11];
      const a30 = a2[12], a31 = a2[13], a32 = a2[14], a33 = a2[15];
      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;
      out[0] = a11 * b11 - a12 * b10 + a13 * b09;
      out[1] = a02 * b10 - a01 * b11 - a03 * b09;
      out[2] = a31 * b05 - a32 * b04 + a33 * b03;
      out[3] = a22 * b04 - a21 * b05 - a23 * b03;
      out[4] = a12 * b08 - a10 * b11 - a13 * b07;
      out[5] = a00 * b11 - a02 * b08 + a03 * b07;
      out[6] = a32 * b02 - a30 * b05 - a33 * b01;
      out[7] = a20 * b05 - a22 * b02 + a23 * b01;
      out[8] = a10 * b10 - a11 * b08 + a13 * b06;
      out[9] = a01 * b08 - a00 * b10 - a03 * b06;
      out[10] = a30 * b04 - a31 * b02 + a33 * b00;
      out[11] = a21 * b02 - a20 * b04 - a23 * b00;
      out[12] = a11 * b07 - a10 * b09 - a12 * b06;
      out[13] = a00 * b09 - a01 * b07 + a02 * b06;
      out[14] = a31 * b01 - a30 * b03 - a32 * b00;
      out[15] = a20 * b03 - a21 * b01 + a22 * b00;
      return out;
    }
    /**
     * Calculates the determinant of a {@link Mat4}
     * @category Static
     *
     * @param a - the source matrix
     * @returns determinant of a
     */
    static determinant(a2) {
      const a00 = a2[0], a01 = a2[1], a02 = a2[2], a03 = a2[3];
      const a10 = a2[4], a11 = a2[5], a12 = a2[6], a13 = a2[7];
      const a20 = a2[8], a21 = a2[9], a22 = a2[10], a23 = a2[11];
      const a30 = a2[12], a31 = a2[13], a32 = a2[14], a33 = a2[15];
      const b0 = a00 * a11 - a01 * a10;
      const b1 = a00 * a12 - a02 * a10;
      const b2 = a01 * a12 - a02 * a11;
      const b3 = a20 * a31 - a21 * a30;
      const b4 = a20 * a32 - a22 * a30;
      const b5 = a21 * a32 - a22 * a31;
      const b6 = a00 * b5 - a01 * b4 + a02 * b3;
      const b7 = a10 * b5 - a11 * b4 + a12 * b3;
      const b8 = a20 * b2 - a21 * b1 + a22 * b0;
      const b9 = a30 * b2 - a31 * b1 + a32 * b0;
      return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
    }
    /**
     * Multiplies two {@link Mat4}s
     * @category Static
     *
     * @param out - The receiving Matrix
     * @param a - The first operand
     * @param b - The second operand
     * @returns `out`
     */
    static multiply(out, a2, b2) {
      const a00 = a2[0];
      const a01 = a2[1];
      const a02 = a2[2];
      const a03 = a2[3];
      const a10 = a2[4];
      const a11 = a2[5];
      const a12 = a2[6];
      const a13 = a2[7];
      const a20 = a2[8];
      const a21 = a2[9];
      const a22 = a2[10];
      const a23 = a2[11];
      const a30 = a2[12];
      const a31 = a2[13];
      const a32 = a2[14];
      const a33 = a2[15];
      let b0 = b2[0];
      let b1 = b2[1];
      let b22 = b2[2];
      let b3 = b2[3];
      out[0] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
      b0 = b2[4];
      b1 = b2[5];
      b22 = b2[6];
      b3 = b2[7];
      out[4] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
      b0 = b2[8];
      b1 = b2[9];
      b22 = b2[10];
      b3 = b2[11];
      out[8] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
      b0 = b2[12];
      b1 = b2[13];
      b22 = b2[14];
      b3 = b2[15];
      out[12] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
      return out;
    }
    /**
     * Alias for {@link Mat4.multiply}
     * @category Static
     */
    static mul(out, a2, b2) {
      return out;
    }
    /**
     * Translate a {@link Mat4} by the given vector
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to translate
     * @param v - vector to translate by
     * @returns `out`
     */
    static translate(out, a2, v2) {
      const x2 = v2[0];
      const y2 = v2[1];
      const z = v2[2];
      if (a2 === out) {
        out[12] = a2[0] * x2 + a2[4] * y2 + a2[8] * z + a2[12];
        out[13] = a2[1] * x2 + a2[5] * y2 + a2[9] * z + a2[13];
        out[14] = a2[2] * x2 + a2[6] * y2 + a2[10] * z + a2[14];
        out[15] = a2[3] * x2 + a2[7] * y2 + a2[11] * z + a2[15];
      } else {
        const a00 = a2[0];
        const a01 = a2[1];
        const a02 = a2[2];
        const a03 = a2[3];
        const a10 = a2[4];
        const a11 = a2[5];
        const a12 = a2[6];
        const a13 = a2[7];
        const a20 = a2[8];
        const a21 = a2[9];
        const a22 = a2[10];
        const a23 = a2[11];
        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;
        out[12] = a00 * x2 + a10 * y2 + a20 * z + a2[12];
        out[13] = a01 * x2 + a11 * y2 + a21 * z + a2[13];
        out[14] = a02 * x2 + a12 * y2 + a22 * z + a2[14];
        out[15] = a03 * x2 + a13 * y2 + a23 * z + a2[15];
      }
      return out;
    }
    /**
     * Scales the {@link Mat4} by the dimensions in the given {@link Vec3} not using vectorization
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to scale
     * @param v - the {@link Vec3} to scale the matrix by
     * @returns `out`
     **/
    static scale(out, a2, v2) {
      const x2 = v2[0];
      const y2 = v2[1];
      const z = v2[2];
      out[0] = a2[0] * x2;
      out[1] = a2[1] * x2;
      out[2] = a2[2] * x2;
      out[3] = a2[3] * x2;
      out[4] = a2[4] * y2;
      out[5] = a2[5] * y2;
      out[6] = a2[6] * y2;
      out[7] = a2[7] * y2;
      out[8] = a2[8] * z;
      out[9] = a2[9] * z;
      out[10] = a2[10] * z;
      out[11] = a2[11] * z;
      out[12] = a2[12];
      out[13] = a2[13];
      out[14] = a2[14];
      out[15] = a2[15];
      return out;
    }
    /**
     * Rotates a {@link Mat4} by the given angle around the given axis
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to rotate
     * @param rad - the angle to rotate the matrix by
     * @param axis - the axis to rotate around
     * @returns `out` or `null` if axis has a length of 0
     */
    static rotate(out, a2, rad, axis) {
      let x2 = axis[0];
      let y2 = axis[1];
      let z = axis[2];
      let len = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
      if (len < EPSILON) {
        return null;
      }
      len = 1 / len;
      x2 *= len;
      y2 *= len;
      z *= len;
      const s2 = Math.sin(rad);
      const c2 = Math.cos(rad);
      const t3 = 1 - c2;
      const a00 = a2[0];
      const a01 = a2[1];
      const a02 = a2[2];
      const a03 = a2[3];
      const a10 = a2[4];
      const a11 = a2[5];
      const a12 = a2[6];
      const a13 = a2[7];
      const a20 = a2[8];
      const a21 = a2[9];
      const a22 = a2[10];
      const a23 = a2[11];
      const b00 = x2 * x2 * t3 + c2;
      const b01 = y2 * x2 * t3 + z * s2;
      const b02 = z * x2 * t3 - y2 * s2;
      const b10 = x2 * y2 * t3 - z * s2;
      const b11 = y2 * y2 * t3 + c2;
      const b12 = z * y2 * t3 + x2 * s2;
      const b20 = x2 * z * t3 + y2 * s2;
      const b21 = y2 * z * t3 - x2 * s2;
      const b22 = z * z * t3 + c2;
      out[0] = a00 * b00 + a10 * b01 + a20 * b02;
      out[1] = a01 * b00 + a11 * b01 + a21 * b02;
      out[2] = a02 * b00 + a12 * b01 + a22 * b02;
      out[3] = a03 * b00 + a13 * b01 + a23 * b02;
      out[4] = a00 * b10 + a10 * b11 + a20 * b12;
      out[5] = a01 * b10 + a11 * b11 + a21 * b12;
      out[6] = a02 * b10 + a12 * b11 + a22 * b12;
      out[7] = a03 * b10 + a13 * b11 + a23 * b12;
      out[8] = a00 * b20 + a10 * b21 + a20 * b22;
      out[9] = a01 * b20 + a11 * b21 + a21 * b22;
      out[10] = a02 * b20 + a12 * b21 + a22 * b22;
      out[11] = a03 * b20 + a13 * b21 + a23 * b22;
      if (a2 !== out) {
        out[12] = a2[12];
        out[13] = a2[13];
        out[14] = a2[14];
        out[15] = a2[15];
      }
      return out;
    }
    /**
     * Rotates a matrix by the given angle around the X axis
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to rotate
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static rotateX(out, a2, rad) {
      let s2 = Math.sin(rad);
      let c2 = Math.cos(rad);
      let a10 = a2[4];
      let a11 = a2[5];
      let a12 = a2[6];
      let a13 = a2[7];
      let a20 = a2[8];
      let a21 = a2[9];
      let a22 = a2[10];
      let a23 = a2[11];
      if (a2 !== out) {
        out[0] = a2[0];
        out[1] = a2[1];
        out[2] = a2[2];
        out[3] = a2[3];
        out[12] = a2[12];
        out[13] = a2[13];
        out[14] = a2[14];
        out[15] = a2[15];
      }
      out[4] = a10 * c2 + a20 * s2;
      out[5] = a11 * c2 + a21 * s2;
      out[6] = a12 * c2 + a22 * s2;
      out[7] = a13 * c2 + a23 * s2;
      out[8] = a20 * c2 - a10 * s2;
      out[9] = a21 * c2 - a11 * s2;
      out[10] = a22 * c2 - a12 * s2;
      out[11] = a23 * c2 - a13 * s2;
      return out;
    }
    /**
     * Rotates a matrix by the given angle around the Y axis
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to rotate
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static rotateY(out, a2, rad) {
      let s2 = Math.sin(rad);
      let c2 = Math.cos(rad);
      let a00 = a2[0];
      let a01 = a2[1];
      let a02 = a2[2];
      let a03 = a2[3];
      let a20 = a2[8];
      let a21 = a2[9];
      let a22 = a2[10];
      let a23 = a2[11];
      if (a2 !== out) {
        out[4] = a2[4];
        out[5] = a2[5];
        out[6] = a2[6];
        out[7] = a2[7];
        out[12] = a2[12];
        out[13] = a2[13];
        out[14] = a2[14];
        out[15] = a2[15];
      }
      out[0] = a00 * c2 - a20 * s2;
      out[1] = a01 * c2 - a21 * s2;
      out[2] = a02 * c2 - a22 * s2;
      out[3] = a03 * c2 - a23 * s2;
      out[8] = a00 * s2 + a20 * c2;
      out[9] = a01 * s2 + a21 * c2;
      out[10] = a02 * s2 + a22 * c2;
      out[11] = a03 * s2 + a23 * c2;
      return out;
    }
    /**
     * Rotates a matrix by the given angle around the Z axis
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to rotate
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static rotateZ(out, a2, rad) {
      let s2 = Math.sin(rad);
      let c2 = Math.cos(rad);
      let a00 = a2[0];
      let a01 = a2[1];
      let a02 = a2[2];
      let a03 = a2[3];
      let a10 = a2[4];
      let a11 = a2[5];
      let a12 = a2[6];
      let a13 = a2[7];
      if (a2 !== out) {
        out[8] = a2[8];
        out[9] = a2[9];
        out[10] = a2[10];
        out[11] = a2[11];
        out[12] = a2[12];
        out[13] = a2[13];
        out[14] = a2[14];
        out[15] = a2[15];
      }
      out[0] = a00 * c2 + a10 * s2;
      out[1] = a01 * c2 + a11 * s2;
      out[2] = a02 * c2 + a12 * s2;
      out[3] = a03 * c2 + a13 * s2;
      out[4] = a10 * c2 - a00 * s2;
      out[5] = a11 * c2 - a01 * s2;
      out[6] = a12 * c2 - a02 * s2;
      out[7] = a13 * c2 - a03 * s2;
      return out;
    }
    /**
     * Creates a {@link Mat4} from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, dest, vec);
     * @category Static
     *
     * @param out - {@link Mat4} receiving operation result
     * @param v - Translation vector
     * @returns `out`
     */
    static fromTranslation(out, v2) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = v2[0];
      out[13] = v2[1];
      out[14] = v2[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a {@link Mat4} from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.scale(dest, dest, vec);
     * @category Static
     *
     * @param out - {@link Mat4} receiving operation result
     * @param v - Scaling vector
     * @returns `out`
     */
    static fromScaling(out, v2) {
      out[0] = v2[0];
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = v2[1];
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = v2[2];
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a {@link Mat4} from a given angle around a given axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotate(dest, dest, rad, axis);
     * @category Static
     *
     * @param out - {@link Mat4} receiving operation result
     * @param rad - the angle to rotate the matrix by
     * @param axis - the axis to rotate around
     * @returns `out` or `null` if `axis` has a length of 0
     */
    static fromRotation(out, rad, axis) {
      let x2 = axis[0];
      let y2 = axis[1];
      let z = axis[2];
      let len = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
      if (len < EPSILON) {
        return null;
      }
      len = 1 / len;
      x2 *= len;
      y2 *= len;
      z *= len;
      const s2 = Math.sin(rad);
      const c2 = Math.cos(rad);
      const t3 = 1 - c2;
      out[0] = x2 * x2 * t3 + c2;
      out[1] = y2 * x2 * t3 + z * s2;
      out[2] = z * x2 * t3 - y2 * s2;
      out[3] = 0;
      out[4] = x2 * y2 * t3 - z * s2;
      out[5] = y2 * y2 * t3 + c2;
      out[6] = z * y2 * t3 + x2 * s2;
      out[7] = 0;
      out[8] = x2 * z * t3 + y2 * s2;
      out[9] = y2 * z * t3 - x2 * s2;
      out[10] = z * z * t3 + c2;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the X axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateX(dest, dest, rad);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static fromXRotation(out, rad) {
      let s2 = Math.sin(rad);
      let c2 = Math.cos(rad);
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = c2;
      out[6] = s2;
      out[7] = 0;
      out[8] = 0;
      out[9] = -s2;
      out[10] = c2;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the Y axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateY(dest, dest, rad);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static fromYRotation(out, rad) {
      let s2 = Math.sin(rad);
      let c2 = Math.cos(rad);
      out[0] = c2;
      out[1] = 0;
      out[2] = -s2;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = s2;
      out[9] = 0;
      out[10] = c2;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the Z axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateZ(dest, dest, rad);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param rad - the angle to rotate the matrix by
     * @returns `out`
     */
    static fromZRotation(out, rad) {
      const s2 = Math.sin(rad);
      const c2 = Math.cos(rad);
      out[0] = c2;
      out[1] = s2;
      out[2] = 0;
      out[3] = 0;
      out[4] = -s2;
      out[5] = c2;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a quaternion rotation and vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param q - Rotation quaternion
     * @param v - Translation vector
     * @returns `out`
     */
    static fromRotationTranslation(out, q, v2) {
      const x2 = q[0];
      const y2 = q[1];
      const z = q[2];
      const w2 = q[3];
      const x22 = x2 + x2;
      const y22 = y2 + y2;
      const z2 = z + z;
      const xx = x2 * x22;
      const xy = x2 * y22;
      const xz = x2 * z2;
      const yy = y2 * y22;
      const yz = y2 * z2;
      const zz = z * z2;
      const wx = w2 * x22;
      const wy = w2 * y22;
      const wz = w2 * z2;
      out[0] = 1 - (yy + zz);
      out[1] = xy + wz;
      out[2] = xz - wy;
      out[3] = 0;
      out[4] = xy - wz;
      out[5] = 1 - (xx + zz);
      out[6] = yz + wx;
      out[7] = 0;
      out[8] = xz + wy;
      out[9] = yz - wx;
      out[10] = 1 - (xx + yy);
      out[11] = 0;
      out[12] = v2[0];
      out[13] = v2[1];
      out[14] = v2[2];
      out[15] = 1;
      return out;
    }
    /**
     * Sets a {@link Mat4} from a {@link Quat2}.
     * @category Static
     *
     * @param out - Matrix
     * @param a - Dual Quaternion
     * @returns `out`
     */
    static fromQuat2(out, a2) {
      const bx = -a2[0];
      const by = -a2[1];
      const bz = -a2[2];
      const bw = a2[3];
      const ax = a2[4];
      const ay = a2[5];
      const az = a2[6];
      const aw = a2[7];
      let magnitude = bx * bx + by * by + bz * bz + bw * bw;
      if (magnitude > 0) {
        tmpVec3[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
        tmpVec3[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
        tmpVec3[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
      } else {
        tmpVec3[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
        tmpVec3[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
        tmpVec3[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
      }
      _Mat4.fromRotationTranslation(out, a2, tmpVec3);
      return out;
    }
    /**
     * Calculates a {@link Mat4} normal matrix (transpose inverse) from a {@link Mat4}
     * @category Static
     *
     * @param out - Matrix receiving operation result
     * @param a - Mat4 to derive the normal matrix from
     * @returns `out` or `null` if the matrix is not invertable
     */
    static normalFromMat4(out, a2) {
      const a00 = a2[0];
      const a01 = a2[1];
      const a02 = a2[2];
      const a03 = a2[3];
      const a10 = a2[4];
      const a11 = a2[5];
      const a12 = a2[6];
      const a13 = a2[7];
      const a20 = a2[8];
      const a21 = a2[9];
      const a22 = a2[10];
      const a23 = a2[11];
      const a30 = a2[12];
      const a31 = a2[13];
      const a32 = a2[14];
      const a33 = a2[15];
      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) {
        return null;
      }
      det = 1 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[3] = 0;
      out[4] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[7] = 0;
      out[8] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[9] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Calculates a {@link Mat4} normal matrix (transpose inverse) from a {@link Mat4}
     * This version omits the calculation of the constant factor (1/determinant), so
     * any normals transformed with it will need to be renormalized.
     * From https://stackoverflow.com/a/27616419/25968
     * @category Static
     *
     * @param out - Matrix receiving operation result
     * @param a - Mat4 to derive the normal matrix from
     * @returns `out`
     */
    static normalFromMat4Fast(out, a2) {
      const ax = a2[0];
      const ay = a2[1];
      const az = a2[2];
      const bx = a2[4];
      const by = a2[5];
      const bz = a2[6];
      const cx = a2[8];
      const cy = a2[9];
      const cz = a2[10];
      out[0] = by * cz - cz * cy;
      out[1] = bz * cx - cx * cz;
      out[2] = bx * cy - cy * cx;
      out[3] = 0;
      out[4] = cy * az - cz * ay;
      out[5] = cz * ax - cx * az;
      out[6] = cx * ay - cy * ax;
      out[7] = 0;
      out[8] = ay * bz - az * by;
      out[9] = az * bx - ax * bz;
      out[10] = ax * by - ay * bx;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Returns the translation vector component of a transformation
     * matrix. If a matrix is built with fromRotationTranslation,
     * the returned vector will be the same as the translation vector
     * originally supplied.
     * @category Static
     *
     * @param  {vec3} out Vector to receive translation component
     * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */
    static getTranslation(out, mat) {
      out[0] = mat[12];
      out[1] = mat[13];
      out[2] = mat[14];
      return out;
    }
    /**
     * Returns the scaling factor component of a transformation
     * matrix. If a matrix is built with fromRotationTranslationScale
     * with a normalized Quaternion parameter, the returned vector will be
     * the same as the scaling vector
     * originally supplied.
     * @category Static
     *
     * @param  {vec3} out Vector to receive scaling factor component
     * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */
    static getScaling(out, mat) {
      const m11 = mat[0];
      const m12 = mat[1];
      const m13 = mat[2];
      const m21 = mat[4];
      const m22 = mat[5];
      const m23 = mat[6];
      const m31 = mat[8];
      const m32 = mat[9];
      const m33 = mat[10];
      out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
      out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
      out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
      return out;
    }
    /**
     * Returns a quaternion representing the rotational component
     * of a transformation matrix. If a matrix is built with
     * fromRotationTranslation, the returned quaternion will be the
     * same as the quaternion originally supplied.
     * @category Static
     *
     * @param out - Quaternion to receive the rotation component
     * @param mat - Matrix to be decomposed (input)
     * @return `out`
     */
    static getRotation(out, mat) {
      _Mat4.getScaling(tmpVec3, mat);
      const is1 = 1 / tmpVec3[0];
      const is2 = 1 / tmpVec3[1];
      const is3 = 1 / tmpVec3[2];
      const sm11 = mat[0] * is1;
      const sm12 = mat[1] * is2;
      const sm13 = mat[2] * is3;
      const sm21 = mat[4] * is1;
      const sm22 = mat[5] * is2;
      const sm23 = mat[6] * is3;
      const sm31 = mat[8] * is1;
      const sm32 = mat[9] * is2;
      const sm33 = mat[10] * is3;
      const trace = sm11 + sm22 + sm33;
      let S2 = 0;
      if (trace > 0) {
        S2 = Math.sqrt(trace + 1) * 2;
        out[3] = 0.25 * S2;
        out[0] = (sm23 - sm32) / S2;
        out[1] = (sm31 - sm13) / S2;
        out[2] = (sm12 - sm21) / S2;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S2 = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S2;
        out[0] = 0.25 * S2;
        out[1] = (sm12 + sm21) / S2;
        out[2] = (sm31 + sm13) / S2;
      } else if (sm22 > sm33) {
        S2 = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S2;
        out[0] = (sm12 + sm21) / S2;
        out[1] = 0.25 * S2;
        out[2] = (sm23 + sm32) / S2;
      } else {
        S2 = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S2;
        out[0] = (sm31 + sm13) / S2;
        out[1] = (sm23 + sm32) / S2;
        out[2] = 0.25 * S2;
      }
      return out;
    }
    /**
     * Decomposes a transformation matrix into its rotation, translation
     * and scale components. Returns only the rotation component
     * @category Static
     *
     * @param out_r - Quaternion to receive the rotation component
     * @param out_t - Vector to receive the translation vector
     * @param out_s - Vector to receive the scaling factor
     * @param mat - Matrix to be decomposed (input)
     * @returns `out_r`
     */
    static decompose(out_r, out_t, out_s, mat) {
      out_t[0] = mat[12];
      out_t[1] = mat[13];
      out_t[2] = mat[14];
      const m11 = mat[0];
      const m12 = mat[1];
      const m13 = mat[2];
      const m21 = mat[4];
      const m22 = mat[5];
      const m23 = mat[6];
      const m31 = mat[8];
      const m32 = mat[9];
      const m33 = mat[10];
      out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
      out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
      out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
      const is1 = 1 / out_s[0];
      const is2 = 1 / out_s[1];
      const is3 = 1 / out_s[2];
      const sm11 = m11 * is1;
      const sm12 = m12 * is2;
      const sm13 = m13 * is3;
      const sm21 = m21 * is1;
      const sm22 = m22 * is2;
      const sm23 = m23 * is3;
      const sm31 = m31 * is1;
      const sm32 = m32 * is2;
      const sm33 = m33 * is3;
      const trace = sm11 + sm22 + sm33;
      let S2 = 0;
      if (trace > 0) {
        S2 = Math.sqrt(trace + 1) * 2;
        out_r[3] = 0.25 * S2;
        out_r[0] = (sm23 - sm32) / S2;
        out_r[1] = (sm31 - sm13) / S2;
        out_r[2] = (sm12 - sm21) / S2;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S2 = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
        out_r[3] = (sm23 - sm32) / S2;
        out_r[0] = 0.25 * S2;
        out_r[1] = (sm12 + sm21) / S2;
        out_r[2] = (sm31 + sm13) / S2;
      } else if (sm22 > sm33) {
        S2 = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
        out_r[3] = (sm31 - sm13) / S2;
        out_r[0] = (sm12 + sm21) / S2;
        out_r[1] = 0.25 * S2;
        out_r[2] = (sm23 + sm32) / S2;
      } else {
        S2 = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
        out_r[3] = (sm12 - sm21) / S2;
        out_r[0] = (sm31 + sm13) / S2;
        out_r[1] = (sm23 + sm32) / S2;
        out_r[2] = 0.25 * S2;
      }
      return out_r;
    }
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param q - Rotation quaternion
     * @param v - Translation vector
     * @param s - Scaling vector
     * @returns `out`
     */
    static fromRotationTranslationScale(out, q, v2, s2) {
      const x2 = q[0];
      const y2 = q[1];
      const z = q[2];
      const w2 = q[3];
      const x22 = x2 + x2;
      const y22 = y2 + y2;
      const z2 = z + z;
      const xx = x2 * x22;
      const xy = x2 * y22;
      const xz = x2 * z2;
      const yy = y2 * y22;
      const yz = y2 * z2;
      const zz = z * z2;
      const wx = w2 * x22;
      const wy = w2 * y22;
      const wz = w2 * z2;
      const sx = s2[0];
      const sy = s2[1];
      const sz = s2[2];
      out[0] = (1 - (yy + zz)) * sx;
      out[1] = (xy + wz) * sx;
      out[2] = (xz - wy) * sx;
      out[3] = 0;
      out[4] = (xy - wz) * sy;
      out[5] = (1 - (xx + zz)) * sy;
      out[6] = (yz + wx) * sy;
      out[7] = 0;
      out[8] = (xz + wy) * sz;
      out[9] = (yz - wx) * sz;
      out[10] = (1 - (xx + yy)) * sz;
      out[11] = 0;
      out[12] = v2[0];
      out[13] = v2[1];
      out[14] = v2[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     mat4.translate(dest, origin);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale)
     *     mat4.translate(dest, negativeOrigin);
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param q - Rotation quaternion
     * @param v - Translation vector
     * @param s - Scaling vector
     * @param o - The origin vector around which to scale and rotate
     * @returns `out`
     */
    static fromRotationTranslationScaleOrigin(out, q, v2, s2, o2) {
      const x2 = q[0];
      const y2 = q[1];
      const z = q[2];
      const w2 = q[3];
      const x22 = x2 + x2;
      const y22 = y2 + y2;
      const z2 = z + z;
      const xx = x2 * x22;
      const xy = x2 * y22;
      const xz = x2 * z2;
      const yy = y2 * y22;
      const yz = y2 * z2;
      const zz = z * z2;
      const wx = w2 * x22;
      const wy = w2 * y22;
      const wz = w2 * z2;
      const sx = s2[0];
      const sy = s2[1];
      const sz = s2[2];
      const ox = o2[0];
      const oy = o2[1];
      const oz = o2[2];
      const out0 = (1 - (yy + zz)) * sx;
      const out1 = (xy + wz) * sx;
      const out2 = (xz - wy) * sx;
      const out4 = (xy - wz) * sy;
      const out5 = (1 - (xx + zz)) * sy;
      const out6 = (yz + wx) * sy;
      const out8 = (xz + wy) * sz;
      const out9 = (yz - wx) * sz;
      const out10 = (1 - (xx + yy)) * sz;
      out[0] = out0;
      out[1] = out1;
      out[2] = out2;
      out[3] = 0;
      out[4] = out4;
      out[5] = out5;
      out[6] = out6;
      out[7] = 0;
      out[8] = out8;
      out[9] = out9;
      out[10] = out10;
      out[11] = 0;
      out[12] = v2[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
      out[13] = v2[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
      out[14] = v2[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
      out[15] = 1;
      return out;
    }
    /**
     * Calculates a 4x4 matrix from the given quaternion
     * @category Static
     *
     * @param out - mat4 receiving operation result
     * @param q - Quaternion to create matrix from
     * @returns `out`
     */
    static fromQuat(out, q) {
      const x2 = q[0];
      const y2 = q[1];
      const z = q[2];
      const w2 = q[3];
      const x22 = x2 + x2;
      const y22 = y2 + y2;
      const z2 = z + z;
      const xx = x2 * x22;
      const yx = y2 * x22;
      const yy = y2 * y22;
      const zx = z * x22;
      const zy = z * y22;
      const zz = z * z2;
      const wx = w2 * x22;
      const wy = w2 * y22;
      const wz = w2 * z2;
      out[0] = 1 - yy - zz;
      out[1] = yx + wz;
      out[2] = zx - wy;
      out[3] = 0;
      out[4] = yx - wz;
      out[5] = 1 - xx - zz;
      out[6] = zy + wx;
      out[7] = 0;
      out[8] = zx + wy;
      out[9] = zy - wx;
      out[10] = 1 - xx - yy;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Generates a frustum matrix with the given bounds
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far -  Far bound of the frustum, can be null or Infinity
     * @returns `out`
     */
    static frustumNO(out, left, right, bottom, top, near, far = Infinity) {
      const rl = 1 / (right - left);
      const tb = 1 / (top - bottom);
      out[0] = near * 2 * rl;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = near * 2 * tb;
      out[6] = 0;
      out[7] = 0;
      out[8] = (right + left) * rl;
      out[9] = (top + bottom) * tb;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }
      return out;
    }
    /**
     * Alias for {@link Mat4.frustumNO}
     * @category Static
     * @deprecated Use {@link Mat4.frustumNO} or {@link Mat4.frustumZO} explicitly
     */
    static frustum(out, left, right, bottom, top, near, far = Infinity) {
      return out;
    }
    /**
     * Generates a frustum matrix with the given bounds
     * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
     * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum, can be null or Infinity
     * @returns `out`
     */
    static frustumZO(out, left, right, bottom, top, near, far = Infinity) {
      const rl = 1 / (right - left);
      const tb = 1 / (top - bottom);
      out[0] = near * 2 * rl;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = near * 2 * tb;
      out[6] = 0;
      out[7] = 0;
      out[8] = (right + left) * rl;
      out[9] = (top + bottom) * tb;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = far * nf;
        out[14] = far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -near;
      }
      return out;
    }
    /**
     * Generates a perspective projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param fovy - Vertical field of view in radians
     * @param aspect - Aspect ratio. typically viewport width/height
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum, can be null or Infinity
     * @returns `out`
     */
    static perspectiveNO(out, fovy, aspect, near, far = Infinity) {
      const f2 = 1 / Math.tan(fovy / 2);
      out[0] = f2 / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f2;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }
      return out;
    }
    /**
     * Alias for {@link Mat4.perspectiveNO}
     * @category Static
     * @deprecated Use {@link Mat4.perspectiveNO} or {@link Mat4.perspectiveZO} explicitly
     */
    static perspective(out, fovy, aspect, near, far = Infinity) {
      return out;
    }
    /**
     * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
     * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param fovy - Vertical field of view in radians
     * @param aspect - Aspect ratio. typically viewport width/height
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum, can be null or Infinity
     * @returns `out`
     */
    static perspectiveZO(out, fovy, aspect, near, far = Infinity) {
      const f2 = 1 / Math.tan(fovy / 2);
      out[0] = f2 / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f2;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;
      if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = far * nf;
        out[14] = far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -near;
      }
      return out;
    }
    /**
     * Generates a perspective projection matrix with the given field of view.
     * This is primarily useful for generating projection matrices to be used
     * with the still experiemental WebVR API.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param fov - Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum
     * @returns `out`
     * @deprecated
     */
    static perspectiveFromFieldOfView(out, fov, near, far) {
      const upTan = Math.tan(fov.upDegrees * Math.PI / 180);
      const downTan = Math.tan(fov.downDegrees * Math.PI / 180);
      const leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
      const rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
      const xScale = 2 / (leftTan + rightTan);
      const yScale = 2 / (upTan + downTan);
      out[0] = xScale;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = yScale;
      out[6] = 0;
      out[7] = 0;
      out[8] = -((leftTan - rightTan) * xScale * 0.5);
      out[9] = (upTan - downTan) * yScale * 0.5;
      out[10] = far / (near - far);
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[14] = far * near / (near - far);
      out[15] = 0;
      return out;
    }
    /**
     * Generates a orthogonal projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum
     * @returns `out`
     */
    static orthoNO(out, left, right, bottom, top, near, far) {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      out[0] = -2 * lr;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = -2 * bt;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 2 * nf;
      out[11] = 0;
      out[12] = (left + right) * lr;
      out[13] = (top + bottom) * bt;
      out[14] = (far + near) * nf;
      out[15] = 1;
      return out;
    }
    /**
     * Alias for {@link Mat4.orthoNO}
     * @category Static
     * @deprecated Use {@link Mat4.orthoNO} or {@link Mat4.orthoZO} explicitly
     */
    static ortho(out, left, right, bottom, top, near, far) {
      return out;
    }
    /**
     * Generates a orthogonal projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
     * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param left - Left bound of the frustum
     * @param right - Right bound of the frustum
     * @param bottom - Bottom bound of the frustum
     * @param top - Top bound of the frustum
     * @param near - Near bound of the frustum
     * @param far - Far bound of the frustum
     * @returns `out`
     */
    static orthoZO(out, left, right, bottom, top, near, far) {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      out[0] = -2 * lr;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = -2 * bt;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = nf;
      out[11] = 0;
      out[12] = (left + right) * lr;
      out[13] = (top + bottom) * bt;
      out[14] = near * nf;
      out[15] = 1;
      return out;
    }
    /**
     * Generates a look-at matrix with the given eye position, focal point, and up axis.
     * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param eye - Position of the viewer
     * @param center - Point the viewer is looking at
     * @param up - vec3 pointing up
     * @returns `out`
     */
    static lookAt(out, eye, center, up) {
      const eyex = eye[0];
      const eyey = eye[1];
      const eyez = eye[2];
      const upx = up[0];
      const upy = up[1];
      const upz = up[2];
      const centerx = center[0];
      const centery = center[1];
      const centerz = center[2];
      if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
        return _Mat4.identity(out);
      }
      let z0 = eyex - centerx;
      let z1 = eyey - centery;
      let z2 = eyez - centerz;
      let len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
      z0 *= len;
      z1 *= len;
      z2 *= len;
      let x0 = upy * z2 - upz * z1;
      let x1 = upz * z0 - upx * z2;
      let x2 = upx * z1 - upy * z0;
      len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
      if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
      } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
      }
      let y0 = z1 * x2 - z2 * x1;
      let y1 = z2 * x0 - z0 * x2;
      let y2 = z0 * x1 - z1 * x0;
      len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
      if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
      } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
      }
      out[0] = x0;
      out[1] = y0;
      out[2] = z0;
      out[3] = 0;
      out[4] = x1;
      out[5] = y1;
      out[6] = z1;
      out[7] = 0;
      out[8] = x2;
      out[9] = y2;
      out[10] = z2;
      out[11] = 0;
      out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
      out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
      out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
      out[15] = 1;
      return out;
    }
    /**
     * Generates a matrix that makes something look at something else.
     * @category Static
     *
     * @param out - mat4 frustum matrix will be written into
     * @param eye - Position of the viewer
     * @param target - Point the viewer is looking at
     * @param up - vec3 pointing up
     * @returns `out`
     */
    static targetTo(out, eye, target, up) {
      const eyex = eye[0];
      const eyey = eye[1];
      const eyez = eye[2];
      const upx = up[0];
      const upy = up[1];
      const upz = up[2];
      let z0 = eyex - target[0];
      let z1 = eyey - target[1];
      let z2 = eyez - target[2];
      let len = z0 * z0 + z1 * z1 + z2 * z2;
      if (len > 0) {
        len = 1 / Math.sqrt(len);
        z0 *= len;
        z1 *= len;
        z2 *= len;
      }
      let x0 = upy * z2 - upz * z1;
      let x1 = upz * z0 - upx * z2;
      let x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;
      if (len > 0) {
        len = 1 / Math.sqrt(len);
        x0 *= len;
        x1 *= len;
        x2 *= len;
      }
      out[0] = x0;
      out[1] = x1;
      out[2] = x2;
      out[3] = 0;
      out[4] = z1 * x2 - z2 * x1;
      out[5] = z2 * x0 - z0 * x2;
      out[6] = z0 * x1 - z1 * x0;
      out[7] = 0;
      out[8] = z0;
      out[9] = z1;
      out[10] = z2;
      out[11] = 0;
      out[12] = eyex;
      out[13] = eyey;
      out[14] = eyez;
      out[15] = 1;
      return out;
    }
    /**
     * Returns Frobenius norm of a {@link Mat4}
     * @category Static
     *
     * @param a - the matrix to calculate Frobenius norm of
     * @returns Frobenius norm
     */
    static frob(a2) {
      return Math.sqrt(a2[0] * a2[0] + a2[1] * a2[1] + a2[2] * a2[2] + a2[3] * a2[3] + a2[4] * a2[4] + a2[5] * a2[5] + a2[6] * a2[6] + a2[7] * a2[7] + a2[8] * a2[8] + a2[9] * a2[9] + a2[10] * a2[10] + a2[11] * a2[11] + a2[12] * a2[12] + a2[13] * a2[13] + a2[14] * a2[14] + a2[15] * a2[15]);
    }
    /**
     * Adds two {@link Mat4}'s
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the first operand
     * @param b - the second operand
     * @returns `out`
     */
    static add(out, a2, b2) {
      out[0] = a2[0] + b2[0];
      out[1] = a2[1] + b2[1];
      out[2] = a2[2] + b2[2];
      out[3] = a2[3] + b2[3];
      out[4] = a2[4] + b2[4];
      out[5] = a2[5] + b2[5];
      out[6] = a2[6] + b2[6];
      out[7] = a2[7] + b2[7];
      out[8] = a2[8] + b2[8];
      out[9] = a2[9] + b2[9];
      out[10] = a2[10] + b2[10];
      out[11] = a2[11] + b2[11];
      out[12] = a2[12] + b2[12];
      out[13] = a2[13] + b2[13];
      out[14] = a2[14] + b2[14];
      out[15] = a2[15] + b2[15];
      return out;
    }
    /**
     * Subtracts matrix b from matrix a
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the first operand
     * @param b - the second operand
     * @returns `out`
     */
    static subtract(out, a2, b2) {
      out[0] = a2[0] - b2[0];
      out[1] = a2[1] - b2[1];
      out[2] = a2[2] - b2[2];
      out[3] = a2[3] - b2[3];
      out[4] = a2[4] - b2[4];
      out[5] = a2[5] - b2[5];
      out[6] = a2[6] - b2[6];
      out[7] = a2[7] - b2[7];
      out[8] = a2[8] - b2[8];
      out[9] = a2[9] - b2[9];
      out[10] = a2[10] - b2[10];
      out[11] = a2[11] - b2[11];
      out[12] = a2[12] - b2[12];
      out[13] = a2[13] - b2[13];
      out[14] = a2[14] - b2[14];
      out[15] = a2[15] - b2[15];
      return out;
    }
    /**
     * Alias for {@link Mat4.subtract}
     * @category Static
     */
    static sub(out, a2, b2) {
      return out;
    }
    /**
     * Multiply each element of the matrix by a scalar.
     * @category Static
     *
     * @param out - the receiving matrix
     * @param a - the matrix to scale
     * @param b - amount to scale the matrix's elements by
     * @returns `out`
     */
    static multiplyScalar(out, a2, b2) {
      out[0] = a2[0] * b2;
      out[1] = a2[1] * b2;
      out[2] = a2[2] * b2;
      out[3] = a2[3] * b2;
      out[4] = a2[4] * b2;
      out[5] = a2[5] * b2;
      out[6] = a2[6] * b2;
      out[7] = a2[7] * b2;
      out[8] = a2[8] * b2;
      out[9] = a2[9] * b2;
      out[10] = a2[10] * b2;
      out[11] = a2[11] * b2;
      out[12] = a2[12] * b2;
      out[13] = a2[13] * b2;
      out[14] = a2[14] * b2;
      out[15] = a2[15] * b2;
      return out;
    }
    /**
     * Adds two mat4's after multiplying each element of the second operand by a scalar value.
     * @category Static
     *
     * @param out - the receiving vector
     * @param a - the first operand
     * @param b - the second operand
     * @param scale - the amount to scale b's elements by before adding
     * @returns `out`
     */
    static multiplyScalarAndAdd(out, a2, b2, scale) {
      out[0] = a2[0] + b2[0] * scale;
      out[1] = a2[1] + b2[1] * scale;
      out[2] = a2[2] + b2[2] * scale;
      out[3] = a2[3] + b2[3] * scale;
      out[4] = a2[4] + b2[4] * scale;
      out[5] = a2[5] + b2[5] * scale;
      out[6] = a2[6] + b2[6] * scale;
      out[7] = a2[7] + b2[7] * scale;
      out[8] = a2[8] + b2[8] * scale;
      out[9] = a2[9] + b2[9] * scale;
      out[10] = a2[10] + b2[10] * scale;
      out[11] = a2[11] + b2[11] * scale;
      out[12] = a2[12] + b2[12] * scale;
      out[13] = a2[13] + b2[13] * scale;
      out[14] = a2[14] + b2[14] * scale;
      out[15] = a2[15] + b2[15] * scale;
      return out;
    }
    /**
     * Returns whether or not two {@link Mat4}s have exactly the same elements in the same position (when compared with ===)
     * @category Static
     *
     * @param a - The first matrix.
     * @param b - The second matrix.
     * @returns True if the matrices are equal, false otherwise.
     */
    static exactEquals(a2, b2) {
      return a2[0] === b2[0] && a2[1] === b2[1] && a2[2] === b2[2] && a2[3] === b2[3] && a2[4] === b2[4] && a2[5] === b2[5] && a2[6] === b2[6] && a2[7] === b2[7] && a2[8] === b2[8] && a2[9] === b2[9] && a2[10] === b2[10] && a2[11] === b2[11] && a2[12] === b2[12] && a2[13] === b2[13] && a2[14] === b2[14] && a2[15] === b2[15];
    }
    /**
     * Returns whether or not two {@link Mat4}s have approximately the same elements in the same position.
     * @category Static
     *
     * @param a - The first matrix.
     * @param b - The second matrix.
     * @returns True if the matrices are equal, false otherwise.
     */
    static equals(a2, b2) {
      const a0 = a2[0];
      const a1 = a2[1];
      const a22 = a2[2];
      const a3 = a2[3];
      const a4 = a2[4];
      const a5 = a2[5];
      const a6 = a2[6];
      const a7 = a2[7];
      const a8 = a2[8];
      const a9 = a2[9];
      const a10 = a2[10];
      const a11 = a2[11];
      const a12 = a2[12];
      const a13 = a2[13];
      const a14 = a2[14];
      const a15 = a2[15];
      const b0 = b2[0];
      const b1 = b2[1];
      const b22 = b2[2];
      const b3 = b2[3];
      const b4 = b2[4];
      const b5 = b2[5];
      const b6 = b2[6];
      const b7 = b2[7];
      const b8 = b2[8];
      const b9 = b2[9];
      const b10 = b2[10];
      const b11 = b2[11];
      const b12 = b2[12];
      const b13 = b2[13];
      const b14 = b2[14];
      const b15 = b2[15];
      return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a22 - b22) <= EPSILON * Math.max(1, Math.abs(a22), Math.abs(b22)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
    }
    /**
     * Returns a string representation of a {@link Mat4}
     * @category Static
     *
     * @param a - matrix to represent as a string
     * @returns string representation of the matrix
     */
    static str(a2) {
      return `Mat4(${a2.join(", ")})`;
    }
  };
  var tmpVec3 = new Float32Array(3);
  Mat4.prototype.mul = Mat4.prototype.multiply;
  Mat4.sub = Mat4.subtract;
  Mat4.mul = Mat4.multiply;
  Mat4.frustum = Mat4.frustumNO;
  Mat4.perspective = Mat4.perspectiveNO;
  Mat4.ortho = Mat4.orthoNO;

  // node_modules/@pixi/constants/lib/index.mjs
  var ENV = /* @__PURE__ */ ((ENV2) => (ENV2[ENV2.WEBGL_LEGACY = 0] = "WEBGL_LEGACY", ENV2[ENV2.WEBGL = 1] = "WEBGL", ENV2[ENV2.WEBGL2 = 2] = "WEBGL2", ENV2))(ENV || {});
  var RENDERER_TYPE = /* @__PURE__ */ ((RENDERER_TYPE2) => (RENDERER_TYPE2[RENDERER_TYPE2.UNKNOWN = 0] = "UNKNOWN", RENDERER_TYPE2[RENDERER_TYPE2.WEBGL = 1] = "WEBGL", RENDERER_TYPE2[RENDERER_TYPE2.CANVAS = 2] = "CANVAS", RENDERER_TYPE2))(RENDERER_TYPE || {});
  var BUFFER_BITS = /* @__PURE__ */ ((BUFFER_BITS2) => (BUFFER_BITS2[BUFFER_BITS2.COLOR = 16384] = "COLOR", BUFFER_BITS2[BUFFER_BITS2.DEPTH = 256] = "DEPTH", BUFFER_BITS2[BUFFER_BITS2.STENCIL = 1024] = "STENCIL", BUFFER_BITS2))(BUFFER_BITS || {});
  var BLEND_MODES = /* @__PURE__ */ ((BLEND_MODES2) => (BLEND_MODES2[BLEND_MODES2.NORMAL = 0] = "NORMAL", BLEND_MODES2[BLEND_MODES2.ADD = 1] = "ADD", BLEND_MODES2[BLEND_MODES2.MULTIPLY = 2] = "MULTIPLY", BLEND_MODES2[BLEND_MODES2.SCREEN = 3] = "SCREEN", BLEND_MODES2[BLEND_MODES2.OVERLAY = 4] = "OVERLAY", BLEND_MODES2[BLEND_MODES2.DARKEN = 5] = "DARKEN", BLEND_MODES2[BLEND_MODES2.LIGHTEN = 6] = "LIGHTEN", BLEND_MODES2[BLEND_MODES2.COLOR_DODGE = 7] = "COLOR_DODGE", BLEND_MODES2[BLEND_MODES2.COLOR_BURN = 8] = "COLOR_BURN", BLEND_MODES2[BLEND_MODES2.HARD_LIGHT = 9] = "HARD_LIGHT", BLEND_MODES2[BLEND_MODES2.SOFT_LIGHT = 10] = "SOFT_LIGHT", BLEND_MODES2[BLEND_MODES2.DIFFERENCE = 11] = "DIFFERENCE", BLEND_MODES2[BLEND_MODES2.EXCLUSION = 12] = "EXCLUSION", BLEND_MODES2[BLEND_MODES2.HUE = 13] = "HUE", BLEND_MODES2[BLEND_MODES2.SATURATION = 14] = "SATURATION", BLEND_MODES2[BLEND_MODES2.COLOR = 15] = "COLOR", BLEND_MODES2[BLEND_MODES2.LUMINOSITY = 16] = "LUMINOSITY", BLEND_MODES2[BLEND_MODES2.NORMAL_NPM = 17] = "NORMAL_NPM", BLEND_MODES2[BLEND_MODES2.ADD_NPM = 18] = "ADD_NPM", BLEND_MODES2[BLEND_MODES2.SCREEN_NPM = 19] = "SCREEN_NPM", BLEND_MODES2[BLEND_MODES2.NONE = 20] = "NONE", BLEND_MODES2[BLEND_MODES2.SRC_OVER = 0] = "SRC_OVER", BLEND_MODES2[BLEND_MODES2.SRC_IN = 21] = "SRC_IN", BLEND_MODES2[BLEND_MODES2.SRC_OUT = 22] = "SRC_OUT", BLEND_MODES2[BLEND_MODES2.SRC_ATOP = 23] = "SRC_ATOP", BLEND_MODES2[BLEND_MODES2.DST_OVER = 24] = "DST_OVER", BLEND_MODES2[BLEND_MODES2.DST_IN = 25] = "DST_IN", BLEND_MODES2[BLEND_MODES2.DST_OUT = 26] = "DST_OUT", BLEND_MODES2[BLEND_MODES2.DST_ATOP = 27] = "DST_ATOP", BLEND_MODES2[BLEND_MODES2.ERASE = 26] = "ERASE", BLEND_MODES2[BLEND_MODES2.SUBTRACT = 28] = "SUBTRACT", BLEND_MODES2[BLEND_MODES2.XOR = 29] = "XOR", BLEND_MODES2))(BLEND_MODES || {});
  var DRAW_MODES = /* @__PURE__ */ ((DRAW_MODES2) => (DRAW_MODES2[DRAW_MODES2.POINTS = 0] = "POINTS", DRAW_MODES2[DRAW_MODES2.LINES = 1] = "LINES", DRAW_MODES2[DRAW_MODES2.LINE_LOOP = 2] = "LINE_LOOP", DRAW_MODES2[DRAW_MODES2.LINE_STRIP = 3] = "LINE_STRIP", DRAW_MODES2[DRAW_MODES2.TRIANGLES = 4] = "TRIANGLES", DRAW_MODES2[DRAW_MODES2.TRIANGLE_STRIP = 5] = "TRIANGLE_STRIP", DRAW_MODES2[DRAW_MODES2.TRIANGLE_FAN = 6] = "TRIANGLE_FAN", DRAW_MODES2))(DRAW_MODES || {});
  var FORMATS = /* @__PURE__ */ ((FORMATS2) => (FORMATS2[FORMATS2.RGBA = 6408] = "RGBA", FORMATS2[FORMATS2.RGB = 6407] = "RGB", FORMATS2[FORMATS2.RG = 33319] = "RG", FORMATS2[FORMATS2.RED = 6403] = "RED", FORMATS2[FORMATS2.RGBA_INTEGER = 36249] = "RGBA_INTEGER", FORMATS2[FORMATS2.RGB_INTEGER = 36248] = "RGB_INTEGER", FORMATS2[FORMATS2.RG_INTEGER = 33320] = "RG_INTEGER", FORMATS2[FORMATS2.RED_INTEGER = 36244] = "RED_INTEGER", FORMATS2[FORMATS2.ALPHA = 6406] = "ALPHA", FORMATS2[FORMATS2.LUMINANCE = 6409] = "LUMINANCE", FORMATS2[FORMATS2.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", FORMATS2[FORMATS2.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", FORMATS2[FORMATS2.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", FORMATS2))(FORMATS || {});
  var TARGETS = /* @__PURE__ */ ((TARGETS2) => (TARGETS2[TARGETS2.TEXTURE_2D = 3553] = "TEXTURE_2D", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", TARGETS2[TARGETS2.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", TARGETS2[TARGETS2.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", TARGETS2))(TARGETS || {});
  var TYPES = /* @__PURE__ */ ((TYPES2) => (TYPES2[TYPES2.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", TYPES2[TYPES2.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", TYPES2[TYPES2.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", TYPES2[TYPES2.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", TYPES2[TYPES2.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", TYPES2[TYPES2.UNSIGNED_INT = 5125] = "UNSIGNED_INT", TYPES2[TYPES2.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", TYPES2[TYPES2.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", TYPES2[TYPES2.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", TYPES2[TYPES2.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", TYPES2[TYPES2.BYTE = 5120] = "BYTE", TYPES2[TYPES2.SHORT = 5122] = "SHORT", TYPES2[TYPES2.INT = 5124] = "INT", TYPES2[TYPES2.FLOAT = 5126] = "FLOAT", TYPES2[TYPES2.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", TYPES2[TYPES2.HALF_FLOAT = 36193] = "HALF_FLOAT", TYPES2))(TYPES || {});
  var SAMPLER_TYPES = /* @__PURE__ */ ((SAMPLER_TYPES2) => (SAMPLER_TYPES2[SAMPLER_TYPES2.FLOAT = 0] = "FLOAT", SAMPLER_TYPES2[SAMPLER_TYPES2.INT = 1] = "INT", SAMPLER_TYPES2[SAMPLER_TYPES2.UINT = 2] = "UINT", SAMPLER_TYPES2))(SAMPLER_TYPES || {});
  var SCALE_MODES = /* @__PURE__ */ ((SCALE_MODES2) => (SCALE_MODES2[SCALE_MODES2.NEAREST = 0] = "NEAREST", SCALE_MODES2[SCALE_MODES2.LINEAR = 1] = "LINEAR", SCALE_MODES2))(SCALE_MODES || {});
  var WRAP_MODES = /* @__PURE__ */ ((WRAP_MODES2) => (WRAP_MODES2[WRAP_MODES2.CLAMP = 33071] = "CLAMP", WRAP_MODES2[WRAP_MODES2.REPEAT = 10497] = "REPEAT", WRAP_MODES2[WRAP_MODES2.MIRRORED_REPEAT = 33648] = "MIRRORED_REPEAT", WRAP_MODES2))(WRAP_MODES || {});
  var MIPMAP_MODES = /* @__PURE__ */ ((MIPMAP_MODES2) => (MIPMAP_MODES2[MIPMAP_MODES2.OFF = 0] = "OFF", MIPMAP_MODES2[MIPMAP_MODES2.POW2 = 1] = "POW2", MIPMAP_MODES2[MIPMAP_MODES2.ON = 2] = "ON", MIPMAP_MODES2[MIPMAP_MODES2.ON_MANUAL = 3] = "ON_MANUAL", MIPMAP_MODES2))(MIPMAP_MODES || {});
  var ALPHA_MODES = /* @__PURE__ */ ((ALPHA_MODES2) => (ALPHA_MODES2[ALPHA_MODES2.NPM = 0] = "NPM", ALPHA_MODES2[ALPHA_MODES2.UNPACK = 1] = "UNPACK", ALPHA_MODES2[ALPHA_MODES2.PMA = 2] = "PMA", ALPHA_MODES2[ALPHA_MODES2.NO_PREMULTIPLIED_ALPHA = 0] = "NO_PREMULTIPLIED_ALPHA", ALPHA_MODES2[ALPHA_MODES2.PREMULTIPLY_ON_UPLOAD = 1] = "PREMULTIPLY_ON_UPLOAD", ALPHA_MODES2[ALPHA_MODES2.PREMULTIPLIED_ALPHA = 2] = "PREMULTIPLIED_ALPHA", ALPHA_MODES2))(ALPHA_MODES || {});
  var CLEAR_MODES = /* @__PURE__ */ ((CLEAR_MODES2) => (CLEAR_MODES2[CLEAR_MODES2.NO = 0] = "NO", CLEAR_MODES2[CLEAR_MODES2.YES = 1] = "YES", CLEAR_MODES2[CLEAR_MODES2.AUTO = 2] = "AUTO", CLEAR_MODES2[CLEAR_MODES2.BLEND = 0] = "BLEND", CLEAR_MODES2[CLEAR_MODES2.CLEAR = 1] = "CLEAR", CLEAR_MODES2[CLEAR_MODES2.BLIT = 2] = "BLIT", CLEAR_MODES2))(CLEAR_MODES || {});
  var GC_MODES = /* @__PURE__ */ ((GC_MODES2) => (GC_MODES2[GC_MODES2.AUTO = 0] = "AUTO", GC_MODES2[GC_MODES2.MANUAL = 1] = "MANUAL", GC_MODES2))(GC_MODES || {});
  var PRECISION = /* @__PURE__ */ ((PRECISION2) => (PRECISION2.LOW = "lowp", PRECISION2.MEDIUM = "mediump", PRECISION2.HIGH = "highp", PRECISION2))(PRECISION || {});
  var MASK_TYPES = /* @__PURE__ */ ((MASK_TYPES2) => (MASK_TYPES2[MASK_TYPES2.NONE = 0] = "NONE", MASK_TYPES2[MASK_TYPES2.SCISSOR = 1] = "SCISSOR", MASK_TYPES2[MASK_TYPES2.STENCIL = 2] = "STENCIL", MASK_TYPES2[MASK_TYPES2.SPRITE = 3] = "SPRITE", MASK_TYPES2[MASK_TYPES2.COLOR = 4] = "COLOR", MASK_TYPES2))(MASK_TYPES || {});
  var MSAA_QUALITY = /* @__PURE__ */ ((MSAA_QUALITY2) => (MSAA_QUALITY2[MSAA_QUALITY2.NONE = 0] = "NONE", MSAA_QUALITY2[MSAA_QUALITY2.LOW = 2] = "LOW", MSAA_QUALITY2[MSAA_QUALITY2.MEDIUM = 4] = "MEDIUM", MSAA_QUALITY2[MSAA_QUALITY2.HIGH = 8] = "HIGH", MSAA_QUALITY2))(MSAA_QUALITY || {});
  var BUFFER_TYPE = /* @__PURE__ */ ((BUFFER_TYPE2) => (BUFFER_TYPE2[BUFFER_TYPE2.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", BUFFER_TYPE2[BUFFER_TYPE2.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", BUFFER_TYPE2[BUFFER_TYPE2.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", BUFFER_TYPE2))(BUFFER_TYPE || {});

  // node_modules/@pixi/settings/lib/adapter.mjs
  var BrowserAdapter = {
    /**
     * Creates a canvas element of the given size.
     * This canvas is created using the browser's native canvas element.
     * @param width - width of the canvas
     * @param height - height of the canvas
     */
    createCanvas: (width, height) => {
      const canvas = document.createElement("canvas");
      return canvas.width = width, canvas.height = height, canvas;
    },
    getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
    getWebGLRenderingContext: () => WebGLRenderingContext,
    getNavigator: () => navigator,
    getBaseUrl: () => document.baseURI ?? window.location.href,
    getFontFaceSet: () => document.fonts,
    fetch: (url2, options) => fetch(url2, options),
    parseXML: (xml) => new DOMParser().parseFromString(xml, "text/xml")
  };

  // node_modules/@pixi/settings/lib/settings.mjs
  var settings = {
    /**
     * This adapter is used to call methods that are platform dependent.
     * For example `document.createElement` only runs on the web but fails in node environments.
     * This allows us to support more platforms by abstracting away specific implementations per platform.
     *
     * By default the adapter is set to work in the browser. However you can create your own
     * by implementing the `IAdapter` interface. See `IAdapter` for more information.
     * @name ADAPTER
     * @memberof PIXI.settings
     * @type {PIXI.IAdapter}
     * @default PIXI.BrowserAdapter
     */
    ADAPTER: BrowserAdapter,
    /**
     * Default resolution / device pixel ratio of the renderer.
     * @static
     * @name RESOLUTION
     * @memberof PIXI.settings
     * @type {number}
     * @default 1
     */
    RESOLUTION: 1,
    /**
     * Enables bitmap creation before image load. This feature is experimental.
     * @static
     * @name CREATE_IMAGE_BITMAP
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    CREATE_IMAGE_BITMAP: false,
    /**
     * If true PixiJS will Math.floor() x/y values when rendering, stopping pixel interpolation.
     * Advantages can include sharper image quality (like text) and faster rendering on canvas.
     * The main disadvantage is movement of objects may appear less smooth.
     * @static
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    ROUND_PIXELS: false
  };

  // node_modules/ismobilejs/esm/isMobile.js
  var appleIphone = /iPhone/i;
  var appleIpod = /iPod/i;
  var appleTablet = /iPad/i;
  var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
  var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
  var androidTablet = /Android/i;
  var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
  var amazonTablet = /Silk/i;
  var windowsPhone = /Windows Phone/i;
  var windowsTablet = /\bWindows(?:.+)ARM\b/i;
  var otherBlackBerry = /BlackBerry/i;
  var otherBlackBerry10 = /BB10/i;
  var otherOpera = /Opera Mini/i;
  var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
  var otherFirefox = /Mobile(?:.+)Firefox\b/i;
  var isAppleTabletOnIos13 = function(navigator2) {
    return typeof navigator2 !== "undefined" && navigator2.platform === "MacIntel" && typeof navigator2.maxTouchPoints === "number" && navigator2.maxTouchPoints > 1 && typeof MSStream === "undefined";
  };
  function createMatch(userAgent) {
    return function(regex) {
      return regex.test(userAgent);
    };
  }
  function isMobile(param) {
    var nav = {
      userAgent: "",
      platform: "",
      maxTouchPoints: 0
    };
    if (!param && typeof navigator !== "undefined") {
      nav = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints || 0
      };
    } else if (typeof param === "string") {
      nav.userAgent = param;
    } else if (param && param.userAgent) {
      nav = {
        userAgent: param.userAgent,
        platform: param.platform,
        maxTouchPoints: param.maxTouchPoints || 0
      };
    }
    var userAgent = nav.userAgent;
    var tmp = userAgent.split("[FBAN");
    if (typeof tmp[1] !== "undefined") {
      userAgent = tmp[0];
    }
    tmp = userAgent.split("Twitter");
    if (typeof tmp[1] !== "undefined") {
      userAgent = tmp[0];
    }
    var match = createMatch(userAgent);
    var result = {
      apple: {
        phone: match(appleIphone) && !match(windowsPhone),
        ipod: match(appleIpod),
        tablet: !match(appleIphone) && (match(appleTablet) || isAppleTabletOnIos13(nav)) && !match(windowsPhone),
        universal: match(appleUniversal),
        device: (match(appleIphone) || match(appleIpod) || match(appleTablet) || match(appleUniversal) || isAppleTabletOnIos13(nav)) && !match(windowsPhone)
      },
      amazon: {
        phone: match(amazonPhone),
        tablet: !match(amazonPhone) && match(amazonTablet),
        device: match(amazonPhone) || match(amazonTablet)
      },
      android: {
        phone: !match(windowsPhone) && match(amazonPhone) || !match(windowsPhone) && match(androidPhone),
        tablet: !match(windowsPhone) && !match(amazonPhone) && !match(androidPhone) && (match(amazonTablet) || match(androidTablet)),
        device: !match(windowsPhone) && (match(amazonPhone) || match(amazonTablet) || match(androidPhone) || match(androidTablet)) || match(/\bokhttp\b/i)
      },
      windows: {
        phone: match(windowsPhone),
        tablet: match(windowsTablet),
        device: match(windowsPhone) || match(windowsTablet)
      },
      other: {
        blackberry: match(otherBlackBerry),
        blackberry10: match(otherBlackBerry10),
        opera: match(otherOpera),
        firefox: match(otherFirefox),
        chrome: match(otherChrome),
        device: match(otherBlackBerry) || match(otherBlackBerry10) || match(otherOpera) || match(otherFirefox) || match(otherChrome)
      },
      any: false,
      phone: false,
      tablet: false
    };
    result.any = result.apple.device || result.android.device || result.windows.device || result.other.device;
    result.phone = result.apple.phone || result.android.phone || result.windows.phone;
    result.tablet = result.apple.tablet || result.android.tablet || result.windows.tablet;
    return result;
  }

  // node_modules/@pixi/settings/lib/utils/isMobile.mjs
  var isMobileCall = isMobile.default ?? isMobile;
  var isMobile2 = isMobileCall(globalThis.navigator);

  // node_modules/@pixi/utils/lib/index.mjs
  var lib_exports = {};
  __export(lib_exports, {
    BaseTextureCache: () => BaseTextureCache,
    BoundingBox: () => BoundingBox,
    CanvasRenderTarget: () => CanvasRenderTarget,
    DATA_URI: () => DATA_URI,
    EventEmitter: () => import_eventemitter3.default,
    ProgramCache: () => ProgramCache,
    TextureCache: () => TextureCache,
    clearTextureCache: () => clearTextureCache,
    correctBlendMode: () => correctBlendMode,
    createIndicesForQuads: () => createIndicesForQuads,
    decomposeDataUri: () => decomposeDataUri,
    deprecation: () => deprecation,
    destroyTextureCache: () => destroyTextureCache,
    detectVideoAlphaMode: () => detectVideoAlphaMode,
    determineCrossOrigin: () => determineCrossOrigin,
    earcut: () => import_earcut.default,
    getBufferType: () => getBufferType,
    getCanvasBoundingBox: () => getCanvasBoundingBox,
    getResolutionOfUrl: () => getResolutionOfUrl,
    hex2rgb: () => hex2rgb,
    hex2string: () => hex2string,
    interleaveTypedArrays: () => interleaveTypedArrays,
    isMobile: () => isMobile2,
    isPow2: () => isPow2,
    isWebGLSupported: () => isWebGLSupported,
    log2: () => log2,
    nextPow2: () => nextPow2,
    path: () => path,
    premultiplyBlendMode: () => premultiplyBlendMode,
    premultiplyRgba: () => premultiplyRgba,
    premultiplyTint: () => premultiplyTint,
    premultiplyTintToRgba: () => premultiplyTintToRgba,
    removeItems: () => removeItems,
    rgb2hex: () => rgb2hex,
    sayHello: () => sayHello,
    sign: () => sign,
    skipHello: () => skipHello,
    string2hex: () => string2hex,
    trimCanvas: () => trimCanvas,
    uid: () => uid,
    url: () => url
  });

  // node_modules/@pixi/utils/lib/settings.mjs
  settings.RETINA_PREFIX = /@([0-9\.]+)x/;
  settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

  // node_modules/@pixi/utils/lib/index.mjs
  var import_eventemitter3 = __toESM(require_eventemitter3(), 1);
  var import_earcut = __toESM(require_earcut(), 1);

  // node_modules/@pixi/utils/lib/url.mjs
  var import_url = __toESM(require_url(), 1);

  // node_modules/@pixi/utils/lib/logging/deprecation.mjs
  var warnings = {};
  function deprecation(version, message, ignoreDepth = 3) {
    if (warnings[message])
      return;
    let stack = new Error().stack;
    typeof stack > "u" ? console.warn("PixiJS Deprecation Warning: ", `${message}
Deprecated since v${version}`) : (stack = stack.split(`
`).splice(ignoreDepth).join(`
`), console.groupCollapsed ? (console.groupCollapsed(
      "%cPixiJS Deprecation Warning: %c%s",
      "color:#614108;background:#fffbe6",
      "font-weight:normal;color:#614108;background:#fffbe6",
      `${message}
Deprecated since v${version}`
    ), console.warn(stack), console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", `${message}
Deprecated since v${version}`), console.warn(stack))), warnings[message] = true;
  }

  // node_modules/@pixi/utils/lib/url.mjs
  var url = {
    /**
     * @deprecated since 7.3.0
     */
    get parse() {
      return deprecation("7.3.0", "utils.url.parse is deprecated, use native URL API instead."), import_url.parse;
    },
    /**
     * @deprecated since 7.3.0
     */
    get format() {
      return deprecation("7.3.0", "utils.url.format is deprecated, use native URL API instead."), import_url.format;
    },
    /**
     * @deprecated since 7.3.0
     */
    get resolve() {
      return deprecation("7.3.0", "utils.url.resolve is deprecated, use native URL API instead."), import_url.resolve;
    }
  };

  // node_modules/@pixi/utils/lib/path.mjs
  function assertPath(path2) {
    if (typeof path2 != "string")
      throw new TypeError(`Path must be a string. Received ${JSON.stringify(path2)}`);
  }
  function removeUrlParams(url2) {
    return url2.split("?")[0].split("#")[0];
  }
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
  }
  function normalizeStringPosix(path2, allowAboveRoot) {
    let res = "", lastSegmentLength = 0, lastSlash = -1, dots = 0, code = -1;
    for (let i2 = 0; i2 <= path2.length; ++i2) {
      if (i2 < path2.length)
        code = path2.charCodeAt(i2);
      else {
        if (code === 47)
          break;
        code = 47;
      }
      if (code === 47) {
        if (!(lastSlash === i2 - 1 || dots === 1))
          if (lastSlash !== i2 - 1 && dots === 2) {
            if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
              if (res.length > 2) {
                const lastSlashIndex = res.lastIndexOf("/");
                if (lastSlashIndex !== res.length - 1) {
                  lastSlashIndex === -1 ? (res = "", lastSegmentLength = 0) : (res = res.slice(0, lastSlashIndex), lastSegmentLength = res.length - 1 - res.lastIndexOf("/")), lastSlash = i2, dots = 0;
                  continue;
                }
              } else if (res.length === 2 || res.length === 1) {
                res = "", lastSegmentLength = 0, lastSlash = i2, dots = 0;
                continue;
              }
            }
            allowAboveRoot && (res.length > 0 ? res += "/.." : res = "..", lastSegmentLength = 2);
          } else
            res.length > 0 ? res += `/${path2.slice(lastSlash + 1, i2)}` : res = path2.slice(lastSlash + 1, i2), lastSegmentLength = i2 - lastSlash - 1;
        lastSlash = i2, dots = 0;
      } else
        code === 46 && dots !== -1 ? ++dots : dots = -1;
    }
    return res;
  }
  var path = {
    /**
     * Converts a path to posix format.
     * @param path - The path to convert to posix
     */
    toPosix(path2) {
      return replaceAll(path2, "\\", "/");
    },
    /**
     * Checks if the path is a URL e.g. http://, https://
     * @param path - The path to check
     */
    isUrl(path2) {
      return /^https?:/.test(this.toPosix(path2));
    },
    /**
     * Checks if the path is a data URL
     * @param path - The path to check
     */
    isDataUrl(path2) {
      return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(path2);
    },
    /**
     * Checks if the path is a blob URL
     * @param path - The path to check
     */
    isBlobUrl(path2) {
      return path2.startsWith("blob:");
    },
    /**
     * Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
     * This will return true for windows file paths
     * @param path - The path to check
     */
    hasProtocol(path2) {
      return /^[^/:]+:/.test(this.toPosix(path2));
    },
    /**
     * Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
     * @param path - The path to get the protocol from
     */
    getProtocol(path2) {
      assertPath(path2), path2 = this.toPosix(path2);
      const matchFile = /^file:\/\/\//.exec(path2);
      if (matchFile)
        return matchFile[0];
      const matchProtocol = /^[^/:]+:\/{0,2}/.exec(path2);
      return matchProtocol ? matchProtocol[0] : "";
    },
    /**
     * Converts URL to an absolute path.
     * When loading from a Web Worker, we must use absolute paths.
     * If the URL is already absolute we return it as is
     * If it's not, we convert it
     * @param url - The URL to test
     * @param customBaseUrl - The base URL to use
     * @param customRootUrl - The root URL to use
     */
    toAbsolute(url2, customBaseUrl, customRootUrl) {
      if (assertPath(url2), this.isDataUrl(url2) || this.isBlobUrl(url2))
        return url2;
      const baseUrl = removeUrlParams(this.toPosix(customBaseUrl ?? settings.ADAPTER.getBaseUrl())), rootUrl = removeUrlParams(this.toPosix(customRootUrl ?? this.rootname(baseUrl)));
      return url2 = this.toPosix(url2), url2.startsWith("/") ? path.join(rootUrl, url2.slice(1)) : this.isAbsolute(url2) ? url2 : this.join(baseUrl, url2);
    },
    /**
     * Normalizes the given path, resolving '..' and '.' segments
     * @param path - The path to normalize
     */
    normalize(path2) {
      if (assertPath(path2), path2.length === 0)
        return ".";
      if (this.isDataUrl(path2) || this.isBlobUrl(path2))
        return path2;
      path2 = this.toPosix(path2);
      let protocol = "";
      const isAbsolute = path2.startsWith("/");
      this.hasProtocol(path2) && (protocol = this.rootname(path2), path2 = path2.slice(protocol.length));
      const trailingSeparator = path2.endsWith("/");
      return path2 = normalizeStringPosix(path2, false), path2.length > 0 && trailingSeparator && (path2 += "/"), isAbsolute ? `/${path2}` : protocol + path2;
    },
    /**
     * Determines if path is an absolute path.
     * Absolute paths can be urls, data urls, or paths on disk
     * @param path - The path to test
     */
    isAbsolute(path2) {
      return assertPath(path2), path2 = this.toPosix(path2), this.hasProtocol(path2) ? true : path2.startsWith("/");
    },
    /**
     * Joins all given path segments together using the platform-specific separator as a delimiter,
     * then normalizes the resulting path
     * @param segments - The segments of the path to join
     */
    join(...segments) {
      if (segments.length === 0)
        return ".";
      let joined;
      for (let i2 = 0; i2 < segments.length; ++i2) {
        const arg = segments[i2];
        if (assertPath(arg), arg.length > 0)
          if (joined === void 0)
            joined = arg;
          else {
            const prevArg = segments[i2 - 1] ?? "";
            this.joinExtensions.includes(this.extname(prevArg).toLowerCase()) ? joined += `/../${arg}` : joined += `/${arg}`;
          }
      }
      return joined === void 0 ? "." : this.normalize(joined);
    },
    /**
     * Returns the directory name of a path
     * @param path - The path to parse
     */
    dirname(path2) {
      if (assertPath(path2), path2.length === 0)
        return ".";
      path2 = this.toPosix(path2);
      let code = path2.charCodeAt(0);
      const hasRoot = code === 47;
      let end = -1, matchedSlash = true;
      const proto = this.getProtocol(path2), origpath = path2;
      path2 = path2.slice(proto.length);
      for (let i2 = path2.length - 1; i2 >= 1; --i2)
        if (code = path2.charCodeAt(i2), code === 47) {
          if (!matchedSlash) {
            end = i2;
            break;
          }
        } else
          matchedSlash = false;
      return end === -1 ? hasRoot ? "/" : this.isUrl(origpath) ? proto + path2 : proto : hasRoot && end === 1 ? "//" : proto + path2.slice(0, end);
    },
    /**
     * Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
     * @param path - The path to parse
     */
    rootname(path2) {
      assertPath(path2), path2 = this.toPosix(path2);
      let root = "";
      if (path2.startsWith("/") ? root = "/" : root = this.getProtocol(path2), this.isUrl(path2)) {
        const index = path2.indexOf("/", root.length);
        index !== -1 ? root = path2.slice(0, index) : root = path2, root.endsWith("/") || (root += "/");
      }
      return root;
    },
    /**
     * Returns the last portion of a path
     * @param path - The path to test
     * @param ext - Optional extension to remove
     */
    basename(path2, ext) {
      assertPath(path2), ext && assertPath(ext), path2 = removeUrlParams(this.toPosix(path2));
      let start = 0, end = -1, matchedSlash = true, i2;
      if (ext !== void 0 && ext.length > 0 && ext.length <= path2.length) {
        if (ext.length === path2.length && ext === path2)
          return "";
        let extIdx = ext.length - 1, firstNonSlashEnd = -1;
        for (i2 = path2.length - 1; i2 >= 0; --i2) {
          const code = path2.charCodeAt(i2);
          if (code === 47) {
            if (!matchedSlash) {
              start = i2 + 1;
              break;
            }
          } else
            firstNonSlashEnd === -1 && (matchedSlash = false, firstNonSlashEnd = i2 + 1), extIdx >= 0 && (code === ext.charCodeAt(extIdx) ? --extIdx === -1 && (end = i2) : (extIdx = -1, end = firstNonSlashEnd));
        }
        return start === end ? end = firstNonSlashEnd : end === -1 && (end = path2.length), path2.slice(start, end);
      }
      for (i2 = path2.length - 1; i2 >= 0; --i2)
        if (path2.charCodeAt(i2) === 47) {
          if (!matchedSlash) {
            start = i2 + 1;
            break;
          }
        } else
          end === -1 && (matchedSlash = false, end = i2 + 1);
      return end === -1 ? "" : path2.slice(start, end);
    },
    /**
     * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
     * portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
     * the first character of the basename of path, an empty string is returned.
     * @param path - The path to parse
     */
    extname(path2) {
      assertPath(path2), path2 = removeUrlParams(this.toPosix(path2));
      let startDot = -1, startPart = 0, end = -1, matchedSlash = true, preDotState = 0;
      for (let i2 = path2.length - 1; i2 >= 0; --i2) {
        const code = path2.charCodeAt(i2);
        if (code === 47) {
          if (!matchedSlash) {
            startPart = i2 + 1;
            break;
          }
          continue;
        }
        end === -1 && (matchedSlash = false, end = i2 + 1), code === 46 ? startDot === -1 ? startDot = i2 : preDotState !== 1 && (preDotState = 1) : startDot !== -1 && (preDotState = -1);
      }
      return startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1 ? "" : path2.slice(startDot, end);
    },
    /**
     * Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
     * @param path - The path to parse
     */
    parse(path2) {
      assertPath(path2);
      const ret = { root: "", dir: "", base: "", ext: "", name: "" };
      if (path2.length === 0)
        return ret;
      path2 = removeUrlParams(this.toPosix(path2));
      let code = path2.charCodeAt(0);
      const isAbsolute = this.isAbsolute(path2);
      let start;
      const protocol = "";
      ret.root = this.rootname(path2), isAbsolute || this.hasProtocol(path2) ? start = 1 : start = 0;
      let startDot = -1, startPart = 0, end = -1, matchedSlash = true, i2 = path2.length - 1, preDotState = 0;
      for (; i2 >= start; --i2) {
        if (code = path2.charCodeAt(i2), code === 47) {
          if (!matchedSlash) {
            startPart = i2 + 1;
            break;
          }
          continue;
        }
        end === -1 && (matchedSlash = false, end = i2 + 1), code === 46 ? startDot === -1 ? startDot = i2 : preDotState !== 1 && (preDotState = 1) : startDot !== -1 && (preDotState = -1);
      }
      return startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1 ? end !== -1 && (startPart === 0 && isAbsolute ? ret.base = ret.name = path2.slice(1, end) : ret.base = ret.name = path2.slice(startPart, end)) : (startPart === 0 && isAbsolute ? (ret.name = path2.slice(1, startDot), ret.base = path2.slice(1, end)) : (ret.name = path2.slice(startPart, startDot), ret.base = path2.slice(startPart, end)), ret.ext = path2.slice(startDot, end)), ret.dir = this.dirname(path2), protocol && (ret.dir = protocol + ret.dir), ret;
    },
    sep: "/",
    delimiter: ":",
    joinExtensions: [".html"]
  };

  // node_modules/@pixi/utils/lib/browser/detectVideoAlphaMode.mjs
  var promise;
  async function detectVideoAlphaMode() {
    return promise ?? (promise = (async () => {
      const gl = document.createElement("canvas").getContext("webgl");
      if (!gl)
        return ALPHA_MODES.UNPACK;
      const video = await new Promise((resolve2) => {
        const video2 = document.createElement("video");
        video2.onloadeddata = () => resolve2(video2), video2.onerror = () => resolve2(null), video2.autoplay = false, video2.crossOrigin = "anonymous", video2.preload = "auto", video2.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=", video2.load();
      });
      if (!video)
        return ALPHA_MODES.UNPACK;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer), gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      ), gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false), gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      const pixel = new Uint8Array(4);
      return gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel), gl.deleteFramebuffer(framebuffer), gl.deleteTexture(texture), gl.getExtension("WEBGL_lose_context")?.loseContext(), pixel[0] <= pixel[3] ? ALPHA_MODES.PMA : ALPHA_MODES.UNPACK;
    })()), promise;
  }

  // node_modules/@pixi/utils/lib/browser/hello.mjs
  function skipHello() {
    deprecation("7.0.0", "skipHello is deprecated, please use settings.RENDER_OPTIONS.hello");
  }
  function sayHello() {
    deprecation("7.0.0", `sayHello is deprecated, please use Renderer's "hello" option`);
  }

  // node_modules/@pixi/utils/lib/browser/isWebGLSupported.mjs
  var supported;
  function isWebGLSupported() {
    return typeof supported > "u" && (supported = (function() {
      const contextOptions = {
        stencil: true,
        failIfMajorPerformanceCaveat: settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT
      };
      try {
        if (!settings.ADAPTER.getWebGLRenderingContext())
          return false;
        const canvas = settings.ADAPTER.createCanvas();
        let gl = canvas.getContext("webgl", contextOptions) || canvas.getContext("experimental-webgl", contextOptions);
        const success = !!gl?.getContextAttributes()?.stencil;
        if (gl) {
          const loseContext = gl.getExtension("WEBGL_lose_context");
          loseContext && loseContext.loseContext();
        }
        return gl = null, success;
      } catch {
        return false;
      }
    })()), supported;
  }

  // node_modules/@pixi/colord/index.mjs
  var r = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) };
  var t = function(r2) {
    return "string" == typeof r2 ? r2.length > 0 : "number" == typeof r2;
  };
  var n = function(r2, t3, n3) {
    return void 0 === t3 && (t3 = 0), void 0 === n3 && (n3 = Math.pow(10, t3)), Math.round(n3 * r2) / n3 + 0;
  };
  var e = function(r2, t3, n3) {
    return void 0 === t3 && (t3 = 0), void 0 === n3 && (n3 = 1), r2 > n3 ? n3 : r2 > t3 ? r2 : t3;
  };
  var u = function(r2) {
    return (r2 = isFinite(r2) ? r2 % 360 : 0) > 0 ? r2 : r2 + 360;
  };
  var a = function(r2) {
    return { r: e(r2.r, 0, 255), g: e(r2.g, 0, 255), b: e(r2.b, 0, 255), a: e(r2.a) };
  };
  var o = function(r2) {
    return { r: n(r2.r), g: n(r2.g), b: n(r2.b), a: n(r2.a, 3) };
  };
  var i = /^#([0-9a-f]{3,8})$/i;
  var s = function(r2) {
    var t3 = r2.toString(16);
    return t3.length < 2 ? "0" + t3 : t3;
  };
  var h = function(r2) {
    var t3 = r2.r, n3 = r2.g, e2 = r2.b, u3 = r2.a, a2 = Math.max(t3, n3, e2), o2 = a2 - Math.min(t3, n3, e2), i2 = o2 ? a2 === t3 ? (n3 - e2) / o2 : a2 === n3 ? 2 + (e2 - t3) / o2 : 4 + (t3 - n3) / o2 : 0;
    return { h: 60 * (i2 < 0 ? i2 + 6 : i2), s: a2 ? o2 / a2 * 100 : 0, v: a2 / 255 * 100, a: u3 };
  };
  var b = function(r2) {
    var t3 = r2.h, n3 = r2.s, e2 = r2.v, u3 = r2.a;
    t3 = t3 / 360 * 6, n3 /= 100, e2 /= 100;
    var a2 = Math.floor(t3), o2 = e2 * (1 - n3), i2 = e2 * (1 - (t3 - a2) * n3), s2 = e2 * (1 - (1 - t3 + a2) * n3), h2 = a2 % 6;
    return { r: 255 * [e2, i2, o2, o2, s2, e2][h2], g: 255 * [s2, e2, e2, i2, o2, o2][h2], b: 255 * [o2, o2, s2, e2, e2, i2][h2], a: u3 };
  };
  var g = function(r2) {
    return { h: u(r2.h), s: e(r2.s, 0, 100), l: e(r2.l, 0, 100), a: e(r2.a) };
  };
  var d = function(r2) {
    return { h: n(r2.h), s: n(r2.s), l: n(r2.l), a: n(r2.a, 3) };
  };
  var f = function(r2) {
    return b((n3 = (t3 = r2).s, { h: t3.h, s: (n3 *= ((e2 = t3.l) < 50 ? e2 : 100 - e2) / 100) > 0 ? 2 * n3 / (e2 + n3) * 100 : 0, v: e2 + n3, a: t3.a }));
    var t3, n3, e2;
  };
  var c = function(r2) {
    return { h: (t3 = h(r2)).h, s: (u3 = (200 - (n3 = t3.s)) * (e2 = t3.v) / 100) > 0 && u3 < 200 ? n3 * e2 / 100 / (u3 <= 100 ? u3 : 200 - u3) * 100 : 0, l: u3 / 2, a: t3.a };
    var t3, n3, e2, u3;
  };
  var l = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
  var p = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
  var v = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
  var m = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
  var y = { string: [[function(r2) {
    var t3 = i.exec(r2);
    return t3 ? (r2 = t3[1]).length <= 4 ? { r: parseInt(r2[0] + r2[0], 16), g: parseInt(r2[1] + r2[1], 16), b: parseInt(r2[2] + r2[2], 16), a: 4 === r2.length ? n(parseInt(r2[3] + r2[3], 16) / 255, 2) : 1 } : 6 === r2.length || 8 === r2.length ? { r: parseInt(r2.substr(0, 2), 16), g: parseInt(r2.substr(2, 2), 16), b: parseInt(r2.substr(4, 2), 16), a: 8 === r2.length ? n(parseInt(r2.substr(6, 2), 16) / 255, 2) : 1 } : null : null;
  }, "hex"], [function(r2) {
    var t3 = v.exec(r2) || m.exec(r2);
    return t3 ? t3[2] !== t3[4] || t3[4] !== t3[6] ? null : a({ r: Number(t3[1]) / (t3[2] ? 100 / 255 : 1), g: Number(t3[3]) / (t3[4] ? 100 / 255 : 1), b: Number(t3[5]) / (t3[6] ? 100 / 255 : 1), a: void 0 === t3[7] ? 1 : Number(t3[7]) / (t3[8] ? 100 : 1) }) : null;
  }, "rgb"], [function(t3) {
    var n3 = l.exec(t3) || p.exec(t3);
    if (!n3) return null;
    var e2, u3, a2 = g({ h: (e2 = n3[1], u3 = n3[2], void 0 === u3 && (u3 = "deg"), Number(e2) * (r[u3] || 1)), s: Number(n3[3]), l: Number(n3[4]), a: void 0 === n3[5] ? 1 : Number(n3[5]) / (n3[6] ? 100 : 1) });
    return f(a2);
  }, "hsl"]], object: [[function(r2) {
    var n3 = r2.r, e2 = r2.g, u3 = r2.b, o2 = r2.a, i2 = void 0 === o2 ? 1 : o2;
    return t(n3) && t(e2) && t(u3) ? a({ r: Number(n3), g: Number(e2), b: Number(u3), a: Number(i2) }) : null;
  }, "rgb"], [function(r2) {
    var n3 = r2.h, e2 = r2.s, u3 = r2.l, a2 = r2.a, o2 = void 0 === a2 ? 1 : a2;
    if (!t(n3) || !t(e2) || !t(u3)) return null;
    var i2 = g({ h: Number(n3), s: Number(e2), l: Number(u3), a: Number(o2) });
    return f(i2);
  }, "hsl"], [function(r2) {
    var n3 = r2.h, a2 = r2.s, o2 = r2.v, i2 = r2.a, s2 = void 0 === i2 ? 1 : i2;
    if (!t(n3) || !t(a2) || !t(o2)) return null;
    var h2 = (function(r3) {
      return { h: u(r3.h), s: e(r3.s, 0, 100), v: e(r3.v, 0, 100), a: e(r3.a) };
    })({ h: Number(n3), s: Number(a2), v: Number(o2), a: Number(s2) });
    return b(h2);
  }, "hsv"]] };
  var N = function(r2, t3) {
    for (var n3 = 0; n3 < t3.length; n3++) {
      var e2 = t3[n3][0](r2);
      if (e2) return [e2, t3[n3][1]];
    }
    return [null, void 0];
  };
  var x = function(r2) {
    return "string" == typeof r2 ? N(r2.trim(), y.string) : "object" == typeof r2 && null !== r2 ? N(r2, y.object) : [null, void 0];
  };
  var M = function(r2, t3) {
    var n3 = c(r2);
    return { h: n3.h, s: e(n3.s + 100 * t3, 0, 100), l: n3.l, a: n3.a };
  };
  var H = function(r2) {
    return (299 * r2.r + 587 * r2.g + 114 * r2.b) / 1e3 / 255;
  };
  var $ = function(r2, t3) {
    var n3 = c(r2);
    return { h: n3.h, s: n3.s, l: e(n3.l + 100 * t3, 0, 100), a: n3.a };
  };
  var j = (function() {
    function r2(r3) {
      this.parsed = x(r3)[0], this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
    }
    return r2.prototype.isValid = function() {
      return null !== this.parsed;
    }, r2.prototype.brightness = function() {
      return n(H(this.rgba), 2);
    }, r2.prototype.isDark = function() {
      return H(this.rgba) < 0.5;
    }, r2.prototype.isLight = function() {
      return H(this.rgba) >= 0.5;
    }, r2.prototype.toHex = function() {
      return r3 = o(this.rgba), t3 = r3.r, e2 = r3.g, u3 = r3.b, i2 = (a2 = r3.a) < 1 ? s(n(255 * a2)) : "", "#" + s(t3) + s(e2) + s(u3) + i2;
      var r3, t3, e2, u3, a2, i2;
    }, r2.prototype.toRgb = function() {
      return o(this.rgba);
    }, r2.prototype.toRgbString = function() {
      return r3 = o(this.rgba), t3 = r3.r, n3 = r3.g, e2 = r3.b, (u3 = r3.a) < 1 ? "rgba(" + t3 + ", " + n3 + ", " + e2 + ", " + u3 + ")" : "rgb(" + t3 + ", " + n3 + ", " + e2 + ")";
      var r3, t3, n3, e2, u3;
    }, r2.prototype.toHsl = function() {
      return d(c(this.rgba));
    }, r2.prototype.toHslString = function() {
      return r3 = d(c(this.rgba)), t3 = r3.h, n3 = r3.s, e2 = r3.l, (u3 = r3.a) < 1 ? "hsla(" + t3 + ", " + n3 + "%, " + e2 + "%, " + u3 + ")" : "hsl(" + t3 + ", " + n3 + "%, " + e2 + "%)";
      var r3, t3, n3, e2, u3;
    }, r2.prototype.toHsv = function() {
      return r3 = h(this.rgba), { h: n(r3.h), s: n(r3.s), v: n(r3.v), a: n(r3.a, 3) };
      var r3;
    }, r2.prototype.invert = function() {
      return w({ r: 255 - (r3 = this.rgba).r, g: 255 - r3.g, b: 255 - r3.b, a: r3.a });
      var r3;
    }, r2.prototype.saturate = function(r3) {
      return void 0 === r3 && (r3 = 0.1), w(M(this.rgba, r3));
    }, r2.prototype.desaturate = function(r3) {
      return void 0 === r3 && (r3 = 0.1), w(M(this.rgba, -r3));
    }, r2.prototype.grayscale = function() {
      return w(M(this.rgba, -1));
    }, r2.prototype.lighten = function(r3) {
      return void 0 === r3 && (r3 = 0.1), w($(this.rgba, r3));
    }, r2.prototype.darken = function(r3) {
      return void 0 === r3 && (r3 = 0.1), w($(this.rgba, -r3));
    }, r2.prototype.rotate = function(r3) {
      return void 0 === r3 && (r3 = 15), this.hue(this.hue() + r3);
    }, r2.prototype.alpha = function(r3) {
      return "number" == typeof r3 ? w({ r: (t3 = this.rgba).r, g: t3.g, b: t3.b, a: r3 }) : n(this.rgba.a, 3);
      var t3;
    }, r2.prototype.hue = function(r3) {
      var t3 = c(this.rgba);
      return "number" == typeof r3 ? w({ h: r3, s: t3.s, l: t3.l, a: t3.a }) : n(t3.h);
    }, r2.prototype.isEqual = function(r3) {
      return this.toHex() === w(r3).toHex();
    }, r2;
  })();
  var w = function(r2) {
    return r2 instanceof j ? r2 : new j(r2);
  };
  var S = [];
  var k = function(r2) {
    r2.forEach(function(r3) {
      S.indexOf(r3) < 0 && (r3(j, y), S.push(r3));
    });
  };

  // node_modules/@pixi/colord/plugins/names.mjs
  function names_default(e2, f2) {
    var a2 = { white: "#ffffff", bisque: "#ffe4c4", blue: "#0000ff", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", antiquewhite: "#faebd7", aqua: "#00ffff", azure: "#f0ffff", whitesmoke: "#f5f5f5", papayawhip: "#ffefd5", plum: "#dda0dd", blanchedalmond: "#ffebcd", black: "#000000", gold: "#ffd700", goldenrod: "#daa520", gainsboro: "#dcdcdc", cornsilk: "#fff8dc", cornflowerblue: "#6495ed", burlywood: "#deb887", aquamarine: "#7fffd4", beige: "#f5f5dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkkhaki: "#bdb76b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", peachpuff: "#ffdab9", darkmagenta: "#8b008b", darkred: "#8b0000", darkorchid: "#9932cc", darkorange: "#ff8c00", darkslateblue: "#483d8b", gray: "#808080", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", deeppink: "#ff1493", deepskyblue: "#00bfff", wheat: "#f5deb3", firebrick: "#b22222", floralwhite: "#fffaf0", ghostwhite: "#f8f8ff", darkviolet: "#9400d3", magenta: "#ff00ff", green: "#008000", dodgerblue: "#1e90ff", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", blueviolet: "#8a2be2", forestgreen: "#228b22", lawngreen: "#7cfc00", indianred: "#cd5c5c", indigo: "#4b0082", fuchsia: "#ff00ff", brown: "#a52a2a", maroon: "#800000", mediumblue: "#0000cd", lightcoral: "#f08080", darkturquoise: "#00ced1", lightcyan: "#e0ffff", ivory: "#fffff0", lightyellow: "#ffffe0", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", linen: "#faf0e6", mediumaquamarine: "#66cdaa", lemonchiffon: "#fffacd", lime: "#00ff00", khaki: "#f0e68c", mediumseagreen: "#3cb371", limegreen: "#32cd32", mediumspringgreen: "#00fa9a", lightskyblue: "#87cefa", lightblue: "#add8e6", midnightblue: "#191970", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", mintcream: "#f5fffa", lightslategray: "#778899", lightslategrey: "#778899", navajowhite: "#ffdead", navy: "#000080", mediumvioletred: "#c71585", powderblue: "#b0e0e6", palegoldenrod: "#eee8aa", oldlace: "#fdf5e6", paleturquoise: "#afeeee", mediumturquoise: "#48d1cc", mediumorchid: "#ba55d3", rebeccapurple: "#663399", lightsteelblue: "#b0c4de", mediumslateblue: "#7b68ee", thistle: "#d8bfd8", tan: "#d2b48c", orchid: "#da70d6", mediumpurple: "#9370db", purple: "#800080", pink: "#ffc0cb", skyblue: "#87ceeb", springgreen: "#00ff7f", palegreen: "#98fb98", red: "#ff0000", yellow: "#ffff00", slateblue: "#6a5acd", lavenderblush: "#fff0f5", peru: "#cd853f", palevioletred: "#db7093", violet: "#ee82ee", teal: "#008080", slategray: "#708090", slategrey: "#708090", aliceblue: "#f0f8ff", darkseagreen: "#8fbc8f", darkolivegreen: "#556b2f", greenyellow: "#adff2f", seagreen: "#2e8b57", seashell: "#fff5ee", tomato: "#ff6347", silver: "#c0c0c0", sienna: "#a0522d", lavender: "#e6e6fa", lightgreen: "#90ee90", orange: "#ffa500", orangered: "#ff4500", steelblue: "#4682b4", royalblue: "#4169e1", turquoise: "#40e0d0", yellowgreen: "#9acd32", salmon: "#fa8072", saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", darksalmon: "#e9967a", lightgoldenrodyellow: "#fafad2", snow: "#fffafa", lightgrey: "#d3d3d3", lightgray: "#d3d3d3", dimgray: "#696969", dimgrey: "#696969", olivedrab: "#6b8e23", olive: "#808000" }, r2 = {};
    for (var d3 in a2) r2[a2[d3]] = d3;
    var l2 = {};
    e2.prototype.toName = function(f3) {
      if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
      var d4, i2, n3 = r2[this.toHex()];
      if (n3) return n3;
      if (null == f3 ? void 0 : f3.closest) {
        var o2 = this.toRgb(), t3 = 1 / 0, b2 = "black";
        if (!l2.length) for (var c2 in a2) l2[c2] = new e2(a2[c2]).toRgb();
        for (var g2 in a2) {
          var u3 = (d4 = o2, i2 = l2[g2], Math.pow(d4.r - i2.r, 2) + Math.pow(d4.g - i2.g, 2) + Math.pow(d4.b - i2.b, 2));
          u3 < t3 && (t3 = u3, b2 = g2);
        }
        return b2;
      }
    };
    f2.string.push([function(f3) {
      var r3 = f3.toLowerCase(), d4 = "transparent" === r3 ? "#0000" : a2[r3];
      return d4 ? new e2(d4).toRgb() : null;
    }, "name"]);
  }

  // node_modules/@pixi/color/lib/Color.mjs
  k([names_default]);
  var _Color = class _Color2 {
    /**
     * @param {PIXI.ColorSource} value - Optional value to use, if not provided, white is used.
     */
    constructor(value = 16777215) {
      this._value = null, this._components = new Float32Array(4), this._components.fill(1), this._int = 16777215, this.value = value;
    }
    /** Get red component (0 - 1) */
    get red() {
      return this._components[0];
    }
    /** Get green component (0 - 1) */
    get green() {
      return this._components[1];
    }
    /** Get blue component (0 - 1) */
    get blue() {
      return this._components[2];
    }
    /** Get alpha component (0 - 1) */
    get alpha() {
      return this._components[3];
    }
    /**
     * Set the value, suitable for chaining
     * @param value
     * @see PIXI.Color.value
     */
    setValue(value) {
      return this.value = value, this;
    }
    /**
     * The current color source.
     *
     * When setting:
     * - Setting to an instance of `Color` will copy its color source and components.
     * - Otherwise, `Color` will try to normalize the color source and set the components.
     *   If the color source is invalid, an `Error` will be thrown and the `Color` will left unchanged.
     *
     * Note: The `null` in the setter's parameter type is added to match the TypeScript rule: return type of getter
     * must be assignable to its setter's parameter type. Setting `value` to `null` will throw an `Error`.
     *
     * When getting:
     * - A return value of `null` means the previous value was overridden (e.g., {@link PIXI.Color.multiply multiply},
     *   {@link PIXI.Color.premultiply premultiply} or {@link PIXI.Color.round round}).
     * - Otherwise, the color source used when setting is returned.
     * @type {PIXI.ColorSource}
     */
    set value(value) {
      if (value instanceof _Color2)
        this._value = this.cloneSource(value._value), this._int = value._int, this._components.set(value._components);
      else {
        if (value === null)
          throw new Error("Cannot set PIXI.Color#value to null");
        (this._value === null || !this.isSourceEqual(this._value, value)) && (this.normalize(value), this._value = this.cloneSource(value));
      }
    }
    get value() {
      return this._value;
    }
    /**
     * Copy a color source internally.
     * @param value - Color source
     */
    cloneSource(value) {
      return typeof value == "string" || typeof value == "number" || value instanceof Number || value === null ? value : Array.isArray(value) || ArrayBuffer.isView(value) ? value.slice(0) : typeof value == "object" && value !== null ? { ...value } : value;
    }
    /**
     * Equality check for color sources.
     * @param value1 - First color source
     * @param value2 - Second color source
     * @returns `true` if the color sources are equal, `false` otherwise.
     */
    isSourceEqual(value1, value2) {
      const type1 = typeof value1;
      if (type1 !== typeof value2)
        return false;
      if (type1 === "number" || type1 === "string" || value1 instanceof Number)
        return value1 === value2;
      if (Array.isArray(value1) && Array.isArray(value2) || ArrayBuffer.isView(value1) && ArrayBuffer.isView(value2))
        return value1.length !== value2.length ? false : value1.every((v2, i2) => v2 === value2[i2]);
      if (value1 !== null && value2 !== null) {
        const keys1 = Object.keys(value1), keys2 = Object.keys(value2);
        return keys1.length !== keys2.length ? false : keys1.every((key) => value1[key] === value2[key]);
      }
      return value1 === value2;
    }
    /**
     * Convert to a RGBA color object.
     * @example
     * import { Color } from 'pixi.js';
     * new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1, a: 1 }
     */
    toRgba() {
      const [r2, g2, b2, a2] = this._components;
      return { r: r2, g: g2, b: b2, a: a2 };
    }
    /**
     * Convert to a RGB color object.
     * @example
     * import { Color } from 'pixi.js';
     * new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1 }
     */
    toRgb() {
      const [r2, g2, b2] = this._components;
      return { r: r2, g: g2, b: b2 };
    }
    /** Convert to a CSS-style rgba string: `rgba(255,255,255,1.0)`. */
    toRgbaString() {
      const [r2, g2, b2] = this.toUint8RgbArray();
      return `rgba(${r2},${g2},${b2},${this.alpha})`;
    }
    toUint8RgbArray(out) {
      const [r2, g2, b2] = this._components;
      return out = out ?? [], out[0] = Math.round(r2 * 255), out[1] = Math.round(g2 * 255), out[2] = Math.round(b2 * 255), out;
    }
    toRgbArray(out) {
      out = out ?? [];
      const [r2, g2, b2] = this._components;
      return out[0] = r2, out[1] = g2, out[2] = b2, out;
    }
    /**
     * Convert to a hexadecimal number.
     * @example
     * import { Color } from 'pixi.js';
     * new Color('white').toNumber(); // returns 16777215
     */
    toNumber() {
      return this._int;
    }
    /**
     * Convert to a hexadecimal number in little endian format (e.g., BBGGRR).
     * @example
     * import { Color } from 'pixi.js';
     * new Color(0xffcc99).toLittleEndianNumber(); // returns 0x99ccff
     * @returns {number} - The color as a number in little endian format.
     */
    toLittleEndianNumber() {
      const value = this._int;
      return (value >> 16) + (value & 65280) + ((value & 255) << 16);
    }
    /**
     * Multiply with another color. This action is destructive, and will
     * override the previous `value` property to be `null`.
     * @param {PIXI.ColorSource} value - The color to multiply by.
     */
    multiply(value) {
      const [r2, g2, b2, a2] = _Color2.temp.setValue(value)._components;
      return this._components[0] *= r2, this._components[1] *= g2, this._components[2] *= b2, this._components[3] *= a2, this.refreshInt(), this._value = null, this;
    }
    /**
     * Converts color to a premultiplied alpha format. This action is destructive, and will
     * override the previous `value` property to be `null`.
     * @param alpha - The alpha to multiply by.
     * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels.
     * @returns {PIXI.Color} - Itself.
     */
    premultiply(alpha, applyToRGB = true) {
      return applyToRGB && (this._components[0] *= alpha, this._components[1] *= alpha, this._components[2] *= alpha), this._components[3] = alpha, this.refreshInt(), this._value = null, this;
    }
    /**
     * Premultiplies alpha with current color.
     * @param {number} alpha - The alpha to multiply by.
     * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels.
     * @returns {number} tint multiplied by alpha
     */
    toPremultiplied(alpha, applyToRGB = true) {
      if (alpha === 1)
        return (255 << 24) + this._int;
      if (alpha === 0)
        return applyToRGB ? 0 : this._int;
      let r2 = this._int >> 16 & 255, g2 = this._int >> 8 & 255, b2 = this._int & 255;
      return applyToRGB && (r2 = r2 * alpha + 0.5 | 0, g2 = g2 * alpha + 0.5 | 0, b2 = b2 * alpha + 0.5 | 0), (alpha * 255 << 24) + (r2 << 16) + (g2 << 8) + b2;
    }
    /**
     * Convert to a hexidecimal string.
     * @example
     * import { Color } from 'pixi.js';
     * new Color('white').toHex(); // returns "#ffffff"
     */
    toHex() {
      const hexString = this._int.toString(16);
      return `#${"000000".substring(0, 6 - hexString.length) + hexString}`;
    }
    /**
     * Convert to a hexidecimal string with alpha.
     * @example
     * import { Color } from 'pixi.js';
     * new Color('white').toHexa(); // returns "#ffffffff"
     */
    toHexa() {
      const alphaString = Math.round(this._components[3] * 255).toString(16);
      return this.toHex() + "00".substring(0, 2 - alphaString.length) + alphaString;
    }
    /**
     * Set alpha, suitable for chaining.
     * @param alpha
     */
    setAlpha(alpha) {
      return this._components[3] = this._clamp(alpha), this;
    }
    /**
     * Rounds the specified color according to the step. This action is destructive, and will
     * override the previous `value` property to be `null`. The alpha component is not rounded.
     * @param steps - Number of steps which will be used as a cap when rounding colors
     * @deprecated since 7.3.0
     */
    round(steps) {
      const [r2, g2, b2] = this._components;
      return this._components[0] = Math.round(r2 * steps) / steps, this._components[1] = Math.round(g2 * steps) / steps, this._components[2] = Math.round(b2 * steps) / steps, this.refreshInt(), this._value = null, this;
    }
    toArray(out) {
      out = out ?? [];
      const [r2, g2, b2, a2] = this._components;
      return out[0] = r2, out[1] = g2, out[2] = b2, out[3] = a2, out;
    }
    /**
     * Normalize the input value into rgba
     * @param value - Input value
     */
    normalize(value) {
      let r2, g2, b2, a2;
      if ((typeof value == "number" || value instanceof Number) && value >= 0 && value <= 16777215) {
        const int = value;
        r2 = (int >> 16 & 255) / 255, g2 = (int >> 8 & 255) / 255, b2 = (int & 255) / 255, a2 = 1;
      } else if ((Array.isArray(value) || value instanceof Float32Array) && value.length >= 3 && value.length <= 4)
        value = this._clamp(value), [r2, g2, b2, a2 = 1] = value;
      else if ((value instanceof Uint8Array || value instanceof Uint8ClampedArray) && value.length >= 3 && value.length <= 4)
        value = this._clamp(value, 0, 255), [r2, g2, b2, a2 = 255] = value, r2 /= 255, g2 /= 255, b2 /= 255, a2 /= 255;
      else if (typeof value == "string" || typeof value == "object") {
        if (typeof value == "string") {
          const match = _Color2.HEX_PATTERN.exec(value);
          match && (value = `#${match[2]}`);
        }
        const color = w(value);
        color.isValid() && ({ r: r2, g: g2, b: b2, a: a2 } = color.rgba, r2 /= 255, g2 /= 255, b2 /= 255);
      }
      if (r2 !== void 0)
        this._components[0] = r2, this._components[1] = g2, this._components[2] = b2, this._components[3] = a2, this.refreshInt();
      else
        throw new Error(`Unable to convert color ${value}`);
    }
    /** Refresh the internal color rgb number */
    refreshInt() {
      this._clamp(this._components);
      const [r2, g2, b2] = this._components;
      this._int = (r2 * 255 << 16) + (g2 * 255 << 8) + (b2 * 255 | 0);
    }
    /**
     * Clamps values to a range. Will override original values
     * @param value - Value(s) to clamp
     * @param min - Minimum value
     * @param max - Maximum value
     */
    _clamp(value, min = 0, max = 1) {
      return typeof value == "number" ? Math.min(Math.max(value, min), max) : (value.forEach((v2, i2) => {
        value[i2] = Math.min(Math.max(v2, min), max);
      }), value);
    }
  };
  _Color.shared = new _Color(), /**
  * Temporary Color object for static uses internally.
  * As to not conflict with Color.shared.
  * @ignore
  */
  _Color.temp = new _Color(), /** Pattern for hex strings */
  _Color.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
  var Color = _Color;

  // node_modules/@pixi/utils/lib/color/hex.mjs
  function hex2rgb(hex, out = []) {
    return deprecation("7.2.0", "utils.hex2rgb is deprecated, use Color#toRgbArray instead"), Color.shared.setValue(hex).toRgbArray(out);
  }
  function hex2string(hex) {
    return deprecation("7.2.0", "utils.hex2string is deprecated, use Color#toHex instead"), Color.shared.setValue(hex).toHex();
  }
  function string2hex(string) {
    return deprecation("7.2.0", "utils.string2hex is deprecated, use Color#toNumber instead"), Color.shared.setValue(string).toNumber();
  }
  function rgb2hex(rgb) {
    return deprecation("7.2.0", "utils.rgb2hex is deprecated, use Color#toNumber instead"), Color.shared.setValue(rgb).toNumber();
  }

  // node_modules/@pixi/utils/lib/color/premultiply.mjs
  function mapPremultipliedBlendModes() {
    const pm = [], npm = [];
    for (let i2 = 0; i2 < 32; i2++)
      pm[i2] = i2, npm[i2] = i2;
    pm[BLEND_MODES.NORMAL_NPM] = BLEND_MODES.NORMAL, pm[BLEND_MODES.ADD_NPM] = BLEND_MODES.ADD, pm[BLEND_MODES.SCREEN_NPM] = BLEND_MODES.SCREEN, npm[BLEND_MODES.NORMAL] = BLEND_MODES.NORMAL_NPM, npm[BLEND_MODES.ADD] = BLEND_MODES.ADD_NPM, npm[BLEND_MODES.SCREEN] = BLEND_MODES.SCREEN_NPM;
    const array = [];
    return array.push(npm), array.push(pm), array;
  }
  var premultiplyBlendMode = mapPremultipliedBlendModes();
  function correctBlendMode(blendMode, premultiplied) {
    return premultiplyBlendMode[premultiplied ? 1 : 0][blendMode];
  }
  function premultiplyRgba(rgb, alpha, out, premultiply = true) {
    return deprecation("7.2.0", "utils.premultiplyRgba has moved to Color.premultiply"), Color.shared.setValue(rgb).premultiply(alpha, premultiply).toArray(out ?? new Float32Array(4));
  }
  function premultiplyTint(tint, alpha) {
    return deprecation("7.2.0", "utils.premultiplyTint has moved to Color.toPremultiplied"), Color.shared.setValue(tint).toPremultiplied(alpha);
  }
  function premultiplyTintToRgba(tint, alpha, out, premultiply = true) {
    return deprecation("7.2.0", "utils.premultiplyTintToRgba has moved to Color.premultiply"), Color.shared.setValue(tint).premultiply(alpha, premultiply).toArray(out ?? new Float32Array(4));
  }

  // node_modules/@pixi/utils/lib/const.mjs
  var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;

  // node_modules/@pixi/utils/lib/data/createIndicesForQuads.mjs
  function createIndicesForQuads(size, outBuffer = null) {
    const totalIndices = size * 6;
    if (outBuffer = outBuffer || new Uint16Array(totalIndices), outBuffer.length !== totalIndices)
      throw new Error(`Out buffer length is incorrect, got ${outBuffer.length} and expected ${totalIndices}`);
    for (let i2 = 0, j2 = 0; i2 < totalIndices; i2 += 6, j2 += 4)
      outBuffer[i2 + 0] = j2 + 0, outBuffer[i2 + 1] = j2 + 1, outBuffer[i2 + 2] = j2 + 2, outBuffer[i2 + 3] = j2 + 0, outBuffer[i2 + 4] = j2 + 2, outBuffer[i2 + 5] = j2 + 3;
    return outBuffer;
  }

  // node_modules/@pixi/utils/lib/data/getBufferType.mjs
  function getBufferType(array) {
    if (array.BYTES_PER_ELEMENT === 4)
      return array instanceof Float32Array ? "Float32Array" : array instanceof Uint32Array ? "Uint32Array" : "Int32Array";
    if (array.BYTES_PER_ELEMENT === 2) {
      if (array instanceof Uint16Array)
        return "Uint16Array";
    } else if (array.BYTES_PER_ELEMENT === 1 && array instanceof Uint8Array)
      return "Uint8Array";
    return null;
  }

  // node_modules/@pixi/utils/lib/data/interleaveTypedArrays.mjs
  var map = { Float32Array, Uint32Array, Int32Array, Uint8Array };
  function interleaveTypedArrays(arrays, sizes) {
    let outSize = 0, stride = 0;
    const views = {};
    for (let i2 = 0; i2 < arrays.length; i2++)
      stride += sizes[i2], outSize += arrays[i2].length;
    const buffer = new ArrayBuffer(outSize * 4);
    let out = null, littleOffset = 0;
    for (let i2 = 0; i2 < arrays.length; i2++) {
      const size = sizes[i2], array = arrays[i2], type = getBufferType(array);
      views[type] || (views[type] = new map[type](buffer)), out = views[type];
      for (let j2 = 0; j2 < array.length; j2++) {
        const indexStart = (j2 / size | 0) * stride + littleOffset, index = j2 % size;
        out[indexStart + index] = array[j2];
      }
      littleOffset += size;
    }
    return new Float32Array(buffer);
  }

  // node_modules/@pixi/utils/lib/data/pow2.mjs
  function nextPow2(v2) {
    return v2 += v2 === 0 ? 1 : 0, --v2, v2 |= v2 >>> 1, v2 |= v2 >>> 2, v2 |= v2 >>> 4, v2 |= v2 >>> 8, v2 |= v2 >>> 16, v2 + 1;
  }
  function isPow2(v2) {
    return !(v2 & v2 - 1) && !!v2;
  }
  function log2(v2) {
    let r2 = (v2 > 65535 ? 1 : 0) << 4;
    v2 >>>= r2;
    let shift = (v2 > 255 ? 1 : 0) << 3;
    return v2 >>>= shift, r2 |= shift, shift = (v2 > 15 ? 1 : 0) << 2, v2 >>>= shift, r2 |= shift, shift = (v2 > 3 ? 1 : 0) << 1, v2 >>>= shift, r2 |= shift, r2 | v2 >> 1;
  }

  // node_modules/@pixi/utils/lib/data/removeItems.mjs
  function removeItems(arr, startIdx, removeCount) {
    const length = arr.length;
    let i2;
    if (startIdx >= length || removeCount === 0)
      return;
    removeCount = startIdx + removeCount > length ? length - startIdx : removeCount;
    const len = length - removeCount;
    for (i2 = startIdx; i2 < len; ++i2)
      arr[i2] = arr[i2 + removeCount];
    arr.length = len;
  }

  // node_modules/@pixi/utils/lib/data/sign.mjs
  function sign(n3) {
    return n3 === 0 ? 0 : n3 < 0 ? -1 : 1;
  }

  // node_modules/@pixi/utils/lib/data/uid.mjs
  var nextUid = 0;
  function uid() {
    return ++nextUid;
  }

  // node_modules/@pixi/utils/lib/media/BoundingBox.mjs
  var _BoundingBox = class {
    /**
     * @param left - The left coordinate value of the bounding box.
     * @param top - The top coordinate value of the bounding box.
     * @param right - The right coordinate value of the bounding box.
     * @param bottom - The bottom coordinate value of the bounding box.
     */
    constructor(left, top, right, bottom) {
      this.left = left, this.top = top, this.right = right, this.bottom = bottom;
    }
    /** The width of the bounding box. */
    get width() {
      return this.right - this.left;
    }
    /** The height of the bounding box. */
    get height() {
      return this.bottom - this.top;
    }
    /** Determines whether the BoundingBox is empty. */
    isEmpty() {
      return this.left === this.right || this.top === this.bottom;
    }
  };
  _BoundingBox.EMPTY = new _BoundingBox(0, 0, 0, 0);
  var BoundingBox = _BoundingBox;

  // node_modules/@pixi/utils/lib/media/caches.mjs
  var ProgramCache = {};
  var TextureCache = /* @__PURE__ */ Object.create(null);
  var BaseTextureCache = /* @__PURE__ */ Object.create(null);
  function destroyTextureCache() {
    let key;
    for (key in TextureCache)
      TextureCache[key].destroy();
    for (key in BaseTextureCache)
      BaseTextureCache[key].destroy();
  }
  function clearTextureCache() {
    let key;
    for (key in TextureCache)
      delete TextureCache[key];
    for (key in BaseTextureCache)
      delete BaseTextureCache[key];
  }

  // node_modules/@pixi/utils/lib/media/CanvasRenderTarget.mjs
  var CanvasRenderTarget = class {
    /**
     * @param width - the width for the newly created canvas
     * @param height - the height for the newly created canvas
     * @param {number} [resolution=PIXI.settings.RESOLUTION] - The resolution / device pixel ratio of the canvas
     */
    constructor(width, height, resolution) {
      this._canvas = settings.ADAPTER.createCanvas(), this._context = this._canvas.getContext("2d"), this.resolution = resolution || settings.RESOLUTION, this.resize(width, height);
    }
    /**
     * Clears the canvas that was created by the CanvasRenderTarget class.
     * @private
     */
    clear() {
      this._checkDestroyed(), this._context.setTransform(1, 0, 0, 1, 0, 0), this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
    /**
     * Resizes the canvas to the specified width and height.
     * @param desiredWidth - the desired width of the canvas
     * @param desiredHeight - the desired height of the canvas
     */
    resize(desiredWidth, desiredHeight) {
      this._checkDestroyed(), this._canvas.width = Math.round(desiredWidth * this.resolution), this._canvas.height = Math.round(desiredHeight * this.resolution);
    }
    /** Destroys this canvas. */
    destroy() {
      this._context = null, this._canvas = null;
    }
    /**
     * The width of the canvas buffer in pixels.
     * @member {number}
     */
    get width() {
      return this._checkDestroyed(), this._canvas.width;
    }
    set width(val) {
      this._checkDestroyed(), this._canvas.width = Math.round(val);
    }
    /**
     * The height of the canvas buffer in pixels.
     * @member {number}
     */
    get height() {
      return this._checkDestroyed(), this._canvas.height;
    }
    set height(val) {
      this._checkDestroyed(), this._canvas.height = Math.round(val);
    }
    /** The Canvas object that belongs to this CanvasRenderTarget. */
    get canvas() {
      return this._checkDestroyed(), this._canvas;
    }
    /** A CanvasRenderingContext2D object representing a two-dimensional rendering context. */
    get context() {
      return this._checkDestroyed(), this._context;
    }
    _checkDestroyed() {
      if (this._canvas === null)
        throw new TypeError("The CanvasRenderTarget has already been destroyed");
    }
  };

  // node_modules/@pixi/utils/lib/media/getCanvasBoundingBox.mjs
  function checkRow(data, width, y2) {
    for (let x2 = 0, index = 4 * y2 * width; x2 < width; ++x2, index += 4)
      if (data[index + 3] !== 0)
        return false;
    return true;
  }
  function checkColumn(data, width, x2, top, bottom) {
    const stride = 4 * width;
    for (let y2 = top, index = top * stride + 4 * x2; y2 <= bottom; ++y2, index += stride)
      if (data[index + 3] !== 0)
        return false;
    return true;
  }
  function getCanvasBoundingBox(canvas) {
    const { width, height } = canvas, context2 = canvas.getContext("2d", {
      willReadFrequently: true
    });
    if (context2 === null)
      throw new TypeError("Failed to get canvas 2D context");
    const data = context2.getImageData(0, 0, width, height).data;
    let left = 0, top = 0, right = width - 1, bottom = height - 1;
    for (; top < height && checkRow(data, width, top); )
      ++top;
    if (top === height)
      return BoundingBox.EMPTY;
    for (; checkRow(data, width, bottom); )
      --bottom;
    for (; checkColumn(data, width, left, top, bottom); )
      ++left;
    for (; checkColumn(data, width, right, top, bottom); )
      --right;
    return ++right, ++bottom, new BoundingBox(left, top, right, bottom);
  }

  // node_modules/@pixi/utils/lib/media/trimCanvas.mjs
  function trimCanvas(canvas) {
    const boundingBox = getCanvasBoundingBox(canvas), { width, height } = boundingBox;
    let data = null;
    if (!boundingBox.isEmpty()) {
      const context2 = canvas.getContext("2d");
      if (context2 === null)
        throw new TypeError("Failed to get canvas 2D context");
      data = context2.getImageData(
        boundingBox.left,
        boundingBox.top,
        width,
        height
      );
    }
    return { width, height, data };
  }

  // node_modules/@pixi/utils/lib/network/decomposeDataUri.mjs
  function decomposeDataUri(dataUri) {
    const dataUriMatch = DATA_URI.exec(dataUri);
    if (dataUriMatch)
      return {
        mediaType: dataUriMatch[1] ? dataUriMatch[1].toLowerCase() : void 0,
        subType: dataUriMatch[2] ? dataUriMatch[2].toLowerCase() : void 0,
        charset: dataUriMatch[3] ? dataUriMatch[3].toLowerCase() : void 0,
        encoding: dataUriMatch[4] ? dataUriMatch[4].toLowerCase() : void 0,
        data: dataUriMatch[5]
      };
  }

  // node_modules/@pixi/utils/lib/network/determineCrossOrigin.mjs
  function determineCrossOrigin(url2, loc = globalThis.location) {
    if (url2.startsWith("data:"))
      return "";
    loc = loc || globalThis.location;
    const parsedUrl = new URL(url2, document.baseURI);
    return parsedUrl.hostname !== loc.hostname || parsedUrl.port !== loc.port || parsedUrl.protocol !== loc.protocol ? "anonymous" : "";
  }

  // node_modules/@pixi/utils/lib/network/getResolutionOfUrl.mjs
  function getResolutionOfUrl(url2, defaultValue2 = 1) {
    const resolution = settings.RETINA_PREFIX?.exec(url2);
    return resolution ? parseFloat(resolution[1]) : defaultValue2;
  }

  // node_modules/@pixi/extensions/lib/index.mjs
  var ExtensionType = /* @__PURE__ */ ((ExtensionType2) => (ExtensionType2.Renderer = "renderer", ExtensionType2.Application = "application", ExtensionType2.RendererSystem = "renderer-webgl-system", ExtensionType2.RendererPlugin = "renderer-webgl-plugin", ExtensionType2.CanvasRendererSystem = "renderer-canvas-system", ExtensionType2.CanvasRendererPlugin = "renderer-canvas-plugin", ExtensionType2.Asset = "asset", ExtensionType2.LoadParser = "load-parser", ExtensionType2.ResolveParser = "resolve-parser", ExtensionType2.CacheParser = "cache-parser", ExtensionType2.DetectionParser = "detection-parser", ExtensionType2))(ExtensionType || {});
  var normalizeExtension = (ext) => {
    if (typeof ext == "function" || typeof ext == "object" && ext.extension) {
      if (!ext.extension)
        throw new Error("Extension class must have an extension object");
      ext = { ...typeof ext.extension != "object" ? { type: ext.extension } : ext.extension, ref: ext };
    }
    if (typeof ext == "object")
      ext = { ...ext };
    else
      throw new Error("Invalid extension type");
    return typeof ext.type == "string" && (ext.type = [ext.type]), ext;
  };
  var normalizePriority = (ext, defaultPriority) => normalizeExtension(ext).priority ?? defaultPriority;
  var extensions = {
    /** @ignore */
    _addHandlers: {},
    /** @ignore */
    _removeHandlers: {},
    /** @ignore */
    _queue: {},
    /**
     * Remove extensions from PixiJS.
     * @param extensions - Extensions to be removed.
     * @returns {PIXI.extensions} For chaining.
     */
    remove(...extensions2) {
      return extensions2.map(normalizeExtension).forEach((ext) => {
        ext.type.forEach((type) => this._removeHandlers[type]?.(ext));
      }), this;
    },
    /**
     * Register new extensions with PixiJS.
     * @param extensions - The spread of extensions to add to PixiJS.
     * @returns {PIXI.extensions} For chaining.
     */
    add(...extensions2) {
      return extensions2.map(normalizeExtension).forEach((ext) => {
        ext.type.forEach((type) => {
          const handlers = this._addHandlers, queue = this._queue;
          handlers[type] ? handlers[type]?.(ext) : (queue[type] = queue[type] || [], queue[type]?.push(ext));
        });
      }), this;
    },
    /**
     * Internal method to handle extensions by name.
     * @param type - The extension type.
     * @param onAdd  - Function for handling when extensions are added/registered passes {@link PIXI.ExtensionFormat}.
     * @param onRemove  - Function for handling when extensions are removed/unregistered passes {@link PIXI.ExtensionFormat}.
     * @returns {PIXI.extensions} For chaining.
     */
    handle(type, onAdd, onRemove) {
      const addHandlers = this._addHandlers, removeHandlers = this._removeHandlers;
      if (addHandlers[type] || removeHandlers[type])
        throw new Error(`Extension type ${type} already has a handler`);
      addHandlers[type] = onAdd, removeHandlers[type] = onRemove;
      const queue = this._queue;
      return queue[type] && (queue[type]?.forEach((ext) => onAdd(ext)), delete queue[type]), this;
    },
    /**
     * Handle a type, but using a map by `name` property.
     * @param type - Type of extension to handle.
     * @param map - The object map of named extensions.
     * @returns {PIXI.extensions} For chaining.
     */
    handleByMap(type, map4) {
      return this.handle(
        type,
        (extension) => {
          extension.name && (map4[extension.name] = extension.ref);
        },
        (extension) => {
          extension.name && delete map4[extension.name];
        }
      );
    },
    /**
     * Handle a type, but using a list of extensions.
     * @param type - Type of extension to handle.
     * @param list - The list of extensions.
     * @param defaultPriority - The default priority to use if none is specified.
     * @returns {PIXI.extensions} For chaining.
     */
    handleByList(type, list, defaultPriority = -1) {
      return this.handle(
        type,
        (extension) => {
          list.includes(extension.ref) || (list.push(extension.ref), list.sort((a2, b2) => normalizePriority(b2, defaultPriority) - normalizePriority(a2, defaultPriority)));
        },
        (extension) => {
          const index = list.indexOf(extension.ref);
          index !== -1 && list.splice(index, 1);
        }
      );
    }
  };

  // node_modules/@pixi/core/lib/geometry/ViewableBuffer.mjs
  var ViewableBuffer = class {
    constructor(sizeOrBuffer) {
      typeof sizeOrBuffer == "number" ? this.rawBinaryData = new ArrayBuffer(sizeOrBuffer) : sizeOrBuffer instanceof Uint8Array ? this.rawBinaryData = sizeOrBuffer.buffer : this.rawBinaryData = sizeOrBuffer, this.uint32View = new Uint32Array(this.rawBinaryData), this.float32View = new Float32Array(this.rawBinaryData);
    }
    /** View on the raw binary data as a `Int8Array`. */
    get int8View() {
      return this._int8View || (this._int8View = new Int8Array(this.rawBinaryData)), this._int8View;
    }
    /** View on the raw binary data as a `Uint8Array`. */
    get uint8View() {
      return this._uint8View || (this._uint8View = new Uint8Array(this.rawBinaryData)), this._uint8View;
    }
    /**  View on the raw binary data as a `Int16Array`. */
    get int16View() {
      return this._int16View || (this._int16View = new Int16Array(this.rawBinaryData)), this._int16View;
    }
    /** View on the raw binary data as a `Uint16Array`. */
    get uint16View() {
      return this._uint16View || (this._uint16View = new Uint16Array(this.rawBinaryData)), this._uint16View;
    }
    /** View on the raw binary data as a `Int32Array`. */
    get int32View() {
      return this._int32View || (this._int32View = new Int32Array(this.rawBinaryData)), this._int32View;
    }
    /**
     * Returns the view of the given type.
     * @param type - One of `int8`, `uint8`, `int16`,
     *    `uint16`, `int32`, `uint32`, and `float32`.
     * @returns - typed array of given type
     */
    view(type) {
      return this[`${type}View`];
    }
    /** Destroys all buffer references. Do not use after calling this. */
    destroy() {
      this.rawBinaryData = null, this._int8View = null, this._uint8View = null, this._int16View = null, this._uint16View = null, this._int32View = null, this.uint32View = null, this.float32View = null;
    }
    static sizeOf(type) {
      switch (type) {
        case "int8":
        case "uint8":
          return 1;
        case "int16":
        case "uint16":
          return 2;
        case "int32":
        case "uint32":
        case "float32":
          return 4;
        default:
          throw new Error(`${type} isn't a valid view type`);
      }
    }
  };

  // node_modules/@pixi/core/lib/shader/utils/checkMaxIfStatementsInShader.mjs
  var fragTemplate = [
    "precision mediump float;",
    "void main(void){",
    "float test = 0.1;",
    "%forloop%",
    "gl_FragColor = vec4(0.0);",
    "}"
  ].join(`
`);
  function generateIfTestSrc(maxIfs) {
    let src = "";
    for (let i2 = 0; i2 < maxIfs; ++i2)
      i2 > 0 && (src += `
else `), i2 < maxIfs - 1 && (src += `if(test == ${i2}.0){}`);
    return src;
  }
  function checkMaxIfStatementsInShader(maxIfs, gl) {
    if (maxIfs === 0)
      throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    for (; ; ) {
      const fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
      if (gl.shaderSource(shader, fragmentSrc), gl.compileShader(shader), !gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        maxIfs = maxIfs / 2 | 0;
      else
        break;
    }
    return maxIfs;
  }

  // node_modules/@pixi/core/lib/state/State.mjs
  var BLEND = 0;
  var OFFSET = 1;
  var CULLING = 2;
  var DEPTH_TEST = 3;
  var WINDING = 4;
  var DEPTH_MASK = 5;
  var State = class _State {
    constructor() {
      this.data = 0, this.blendMode = BLEND_MODES.NORMAL, this.polygonOffset = 0, this.blend = true, this.depthMask = true;
    }
    /**
     * Activates blending of the computed fragment color values.
     * @default true
     */
    get blend() {
      return !!(this.data & 1 << BLEND);
    }
    set blend(value) {
      !!(this.data & 1 << BLEND) !== value && (this.data ^= 1 << BLEND);
    }
    /**
     * Activates adding an offset to depth values of polygon's fragments
     * @default false
     */
    get offsets() {
      return !!(this.data & 1 << OFFSET);
    }
    set offsets(value) {
      !!(this.data & 1 << OFFSET) !== value && (this.data ^= 1 << OFFSET);
    }
    /**
     * Activates culling of polygons.
     * @default false
     */
    get culling() {
      return !!(this.data & 1 << CULLING);
    }
    set culling(value) {
      !!(this.data & 1 << CULLING) !== value && (this.data ^= 1 << CULLING);
    }
    /**
     * Activates depth comparisons and updates to the depth buffer.
     * @default false
     */
    get depthTest() {
      return !!(this.data & 1 << DEPTH_TEST);
    }
    set depthTest(value) {
      !!(this.data & 1 << DEPTH_TEST) !== value && (this.data ^= 1 << DEPTH_TEST);
    }
    /**
     * Enables or disables writing to the depth buffer.
     * @default true
     */
    get depthMask() {
      return !!(this.data & 1 << DEPTH_MASK);
    }
    set depthMask(value) {
      !!(this.data & 1 << DEPTH_MASK) !== value && (this.data ^= 1 << DEPTH_MASK);
    }
    /**
     * Specifies whether or not front or back-facing polygons can be culled.
     * @default false
     */
    get clockwiseFrontFace() {
      return !!(this.data & 1 << WINDING);
    }
    set clockwiseFrontFace(value) {
      !!(this.data & 1 << WINDING) !== value && (this.data ^= 1 << WINDING);
    }
    /**
     * The blend mode to be applied when this state is set. Apply a value of `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
     * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
     * @default PIXI.BLEND_MODES.NORMAL
     */
    get blendMode() {
      return this._blendMode;
    }
    set blendMode(value) {
      this.blend = value !== BLEND_MODES.NONE, this._blendMode = value;
    }
    /**
     * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
     * @default 0
     */
    get polygonOffset() {
      return this._polygonOffset;
    }
    set polygonOffset(value) {
      this.offsets = !!value, this._polygonOffset = value;
    }
    static for2d() {
      const state = new _State();
      return state.depthTest = false, state.blend = true, state;
    }
  };
  State.prototype.toString = function() {
    return `[@pixi/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
  };

  // node_modules/@pixi/core/lib/textures/resources/autoDetectResource.mjs
  var INSTALLED = [];
  function autoDetectResource(source, options) {
    if (!source)
      return null;
    let extension = "";
    if (typeof source == "string") {
      const result = /\.(\w{3,4})(?:$|\?|#)/i.exec(source);
      result && (extension = result[1].toLowerCase());
    }
    for (let i2 = INSTALLED.length - 1; i2 >= 0; --i2) {
      const ResourcePlugin = INSTALLED[i2];
      if (ResourcePlugin.test && ResourcePlugin.test(source, extension))
        return new ResourcePlugin(source, options);
    }
    throw new Error("Unrecognized source type to auto-detect Resource");
  }

  // node_modules/@pixi/runner/lib/Runner.mjs
  var Runner = class {
    /**
     * @param {string} name - The function name that will be executed on the listeners added to this Runner.
     */
    constructor(name) {
      this.items = [], this._name = name, this._aliasCount = 0;
    }
    /* eslint-disable jsdoc/require-param, jsdoc/check-param-names */
    /**
     * Dispatch/Broadcast Runner to all listeners added to the queue.
     * @param {...any} params - (optional) parameters to pass to each listener
     */
    /*  eslint-enable jsdoc/require-param, jsdoc/check-param-names */
    emit(a0, a1, a2, a3, a4, a5, a6, a7) {
      if (arguments.length > 8)
        throw new Error("max arguments reached");
      const { name, items } = this;
      this._aliasCount++;
      for (let i2 = 0, len = items.length; i2 < len; i2++)
        items[i2][name](a0, a1, a2, a3, a4, a5, a6, a7);
      return items === this.items && this._aliasCount--, this;
    }
    ensureNonAliasedItems() {
      this._aliasCount > 0 && this.items.length > 1 && (this._aliasCount = 0, this.items = this.items.slice(0));
    }
    /**
     * Add a listener to the Runner
     *
     * Runners do not need to have scope or functions passed to them.
     * All that is required is to pass the listening object and ensure that it has contains a function that has the same name
     * as the name provided to the Runner when it was created.
     *
     * E.g. A listener passed to this Runner will require a 'complete' function.
     *
     * ```js
     * import { Runner } from '@pixi/runner';
     *
     * const complete = new Runner('complete');
     * ```
     *
     * The scope used will be the object itself.
     * @param {any} item - The object that will be listening.
     */
    add(item) {
      return item[this._name] && (this.ensureNonAliasedItems(), this.remove(item), this.items.push(item)), this;
    }
    /**
     * Remove a single listener from the dispatch queue.
     * @param {any} item - The listener that you would like to remove.
     */
    remove(item) {
      const index = this.items.indexOf(item);
      return index !== -1 && (this.ensureNonAliasedItems(), this.items.splice(index, 1)), this;
    }
    /**
     * Check to see if the listener is already in the Runner
     * @param {any} item - The listener that you would like to check.
     */
    contains(item) {
      return this.items.includes(item);
    }
    /** Remove all listeners from the Runner */
    removeAll() {
      return this.ensureNonAliasedItems(), this.items.length = 0, this;
    }
    /** Remove all references, don't use after this. */
    destroy() {
      this.removeAll(), this.items.length = 0, this._name = "";
    }
    /**
     * `true` if there are no this Runner contains no listeners
     * @readonly
     */
    get empty() {
      return this.items.length === 0;
    }
    /**
     * The name of the runner.
     * @type {string}
     */
    get name() {
      return this._name;
    }
  };
  Object.defineProperties(Runner.prototype, {
    /**
     * Alias for `emit`
     * @memberof PIXI.Runner#
     * @method dispatch
     * @see PIXI.Runner#emit
     */
    dispatch: { value: Runner.prototype.emit },
    /**
     * Alias for `emit`
     * @memberof PIXI.Runner#
     * @method run
     * @see PIXI.Runner#emit
     */
    run: { value: Runner.prototype.emit }
  });

  // node_modules/@pixi/core/lib/textures/resources/Resource.mjs
  var Resource = class {
    /**
     * @param width - Width of the resource
     * @param height - Height of the resource
     */
    constructor(width = 0, height = 0) {
      this._width = width, this._height = height, this.destroyed = false, this.internal = false, this.onResize = new Runner("setRealSize"), this.onUpdate = new Runner("update"), this.onError = new Runner("onError");
    }
    /**
     * Bind to a parent BaseTexture
     * @param baseTexture - Parent texture
     */
    bind(baseTexture) {
      this.onResize.add(baseTexture), this.onUpdate.add(baseTexture), this.onError.add(baseTexture), (this._width || this._height) && this.onResize.emit(this._width, this._height);
    }
    /**
     * Unbind to a parent BaseTexture
     * @param baseTexture - Parent texture
     */
    unbind(baseTexture) {
      this.onResize.remove(baseTexture), this.onUpdate.remove(baseTexture), this.onError.remove(baseTexture);
    }
    /**
     * Trigger a resize event
     * @param width - X dimension
     * @param height - Y dimension
     */
    resize(width, height) {
      (width !== this._width || height !== this._height) && (this._width = width, this._height = height, this.onResize.emit(width, height));
    }
    /**
     * Has been validated
     * @readonly
     */
    get valid() {
      return !!this._width && !!this._height;
    }
    /** Has been updated trigger event. */
    update() {
      this.destroyed || this.onUpdate.emit();
    }
    /**
     * This can be overridden to start preloading a resource
     * or do any other prepare step.
     * @protected
     * @returns Handle the validate event
     */
    load() {
      return Promise.resolve(this);
    }
    /**
     * The width of the resource.
     * @readonly
     */
    get width() {
      return this._width;
    }
    /**
     * The height of the resource.
     * @readonly
     */
    get height() {
      return this._height;
    }
    /**
     * Set the style, optional to override
     * @param _renderer - yeah, renderer!
     * @param _baseTexture - the texture
     * @param _glTexture - texture instance for this webgl context
     * @returns - `true` is success
     */
    style(_renderer, _baseTexture, _glTexture) {
      return false;
    }
    /** Clean up anything, this happens when destroying is ready. */
    dispose() {
    }
    /**
     * Call when destroying resource, unbind any BaseTexture object
     * before calling this method, as reference counts are maintained
     * internally.
     */
    destroy() {
      this.destroyed || (this.destroyed = true, this.dispose(), this.onError.removeAll(), this.onError = null, this.onResize.removeAll(), this.onResize = null, this.onUpdate.removeAll(), this.onUpdate = null);
    }
    /**
     * Abstract, used to auto-detect resource type.
     * @param {*} _source - The source object
     * @param {string} _extension - The extension of source, if set
     */
    static test(_source, _extension) {
      return false;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/BufferResource.mjs
  var BufferResource = class extends Resource {
    /**
     * @param source - Source buffer
     * @param options - Options
     * @param {number} options.width - Width of the texture
     * @param {number} options.height - Height of the texture
     * @param {1|2|4|8} [options.unpackAlignment=4] - The alignment of the pixel rows.
     */
    constructor(source, options) {
      const { width, height } = options || {};
      if (!width || !height)
        throw new Error("BufferResource width or height invalid");
      super(width, height), this.data = source, this.unpackAlignment = options.unpackAlignment ?? 4;
    }
    /**
     * Upload the texture to the GPU.
     * @param renderer - Upload to the renderer
     * @param baseTexture - Reference to parent texture
     * @param glTexture - glTexture
     * @returns - true is success
     */
    upload(renderer, baseTexture, glTexture) {
      const gl = renderer.gl;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, this.unpackAlignment), gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === ALPHA_MODES.UNPACK);
      const width = baseTexture.realWidth, height = baseTexture.realHeight;
      return glTexture.width === width && glTexture.height === height ? gl.texSubImage2D(
        baseTexture.target,
        0,
        0,
        0,
        width,
        height,
        baseTexture.format,
        glTexture.type,
        this.data
      ) : (glTexture.width = width, glTexture.height = height, gl.texImage2D(
        baseTexture.target,
        0,
        glTexture.internalFormat,
        width,
        height,
        0,
        baseTexture.format,
        glTexture.type,
        this.data
      )), true;
    }
    /** Destroy and don't use after this. */
    dispose() {
      this.data = null;
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if buffer source
     */
    static test(source) {
      return source === null || source instanceof Int8Array || source instanceof Uint8Array || source instanceof Uint8ClampedArray || source instanceof Int16Array || source instanceof Uint16Array || source instanceof Int32Array || source instanceof Uint32Array || source instanceof Float32Array;
    }
  };

  // node_modules/@pixi/core/lib/textures/BaseTexture.mjs
  var defaultBufferOptions = {
    scaleMode: SCALE_MODES.NEAREST,
    alphaMode: ALPHA_MODES.NPM
  };
  var _BaseTexture = class _BaseTexture2 extends import_eventemitter3.default {
    /**
     * @param {PIXI.Resource|PIXI.ImageSource|string} [resource=null] -
     *        The current resource to use, for things that aren't Resource objects, will be converted
     *        into a Resource.
     * @param options - Collection of options, default options inherited from {@link PIXI.BaseTexture.defaultOptions}.
     * @param {PIXI.MIPMAP_MODES} [options.mipmap] - If mipmapping is enabled for texture
     * @param {number} [options.anisotropicLevel] - Anisotropic filtering level of texture
     * @param {PIXI.WRAP_MODES} [options.wrapMode] - Wrap mode for textures
     * @param {PIXI.SCALE_MODES} [options.scaleMode] - Default scale mode, linear, nearest
     * @param {PIXI.FORMATS} [options.format] - GL format type
     * @param {PIXI.TYPES} [options.type] - GL data type
     * @param {PIXI.TARGETS} [options.target] - GL texture target
     * @param {PIXI.ALPHA_MODES} [options.alphaMode] - Pre multiply the image alpha
     * @param {number} [options.width=0] - Width of the texture
     * @param {number} [options.height=0] - Height of the texture
     * @param {number} [options.resolution=PIXI.settings.RESOLUTION] - Resolution of the base texture
     * @param {object} [options.resourceOptions] - Optional resource options,
     *        see {@link PIXI.autoDetectResource autoDetectResource}
     */
    constructor(resource = null, options = null) {
      super(), options = Object.assign({}, _BaseTexture2.defaultOptions, options);
      const {
        alphaMode,
        mipmap,
        anisotropicLevel,
        scaleMode,
        width,
        height,
        wrapMode,
        format: format2,
        type,
        target,
        resolution,
        resourceOptions
      } = options;
      resource && !(resource instanceof Resource) && (resource = autoDetectResource(resource, resourceOptions), resource.internal = true), this.resolution = resolution || settings.RESOLUTION, this.width = Math.round((width || 0) * this.resolution) / this.resolution, this.height = Math.round((height || 0) * this.resolution) / this.resolution, this._mipmap = mipmap, this.anisotropicLevel = anisotropicLevel, this._wrapMode = wrapMode, this._scaleMode = scaleMode, this.format = format2, this.type = type, this.target = target, this.alphaMode = alphaMode, this.uid = uid(), this.touched = 0, this.isPowerOfTwo = false, this._refreshPOT(), this._glTextures = {}, this.dirtyId = 0, this.dirtyStyleId = 0, this.cacheId = null, this.valid = width > 0 && height > 0, this.textureCacheIds = [], this.destroyed = false, this.resource = null, this._batchEnabled = 0, this._batchLocation = 0, this.parentTextureArray = null, this.setResource(resource);
    }
    /**
     * Pixel width of the source of this texture
     * @readonly
     */
    get realWidth() {
      return Math.round(this.width * this.resolution);
    }
    /**
     * Pixel height of the source of this texture
     * @readonly
     */
    get realHeight() {
      return Math.round(this.height * this.resolution);
    }
    /**
     * Mipmap mode of the texture, affects downscaled images
     * @default PIXI.MIPMAP_MODES.POW2
     */
    get mipmap() {
      return this._mipmap;
    }
    set mipmap(value) {
      this._mipmap !== value && (this._mipmap = value, this.dirtyStyleId++);
    }
    /**
     * The scale mode to apply when scaling this texture
     * @default PIXI.SCALE_MODES.LINEAR
     */
    get scaleMode() {
      return this._scaleMode;
    }
    set scaleMode(value) {
      this._scaleMode !== value && (this._scaleMode = value, this.dirtyStyleId++);
    }
    /**
     * How the texture wraps
     * @default PIXI.WRAP_MODES.CLAMP
     */
    get wrapMode() {
      return this._wrapMode;
    }
    set wrapMode(value) {
      this._wrapMode !== value && (this._wrapMode = value, this.dirtyStyleId++);
    }
    /**
     * Changes style options of BaseTexture
     * @param scaleMode - Pixi scalemode
     * @param mipmap - enable mipmaps
     * @returns - this
     */
    setStyle(scaleMode, mipmap) {
      let dirty;
      return scaleMode !== void 0 && scaleMode !== this.scaleMode && (this.scaleMode = scaleMode, dirty = true), mipmap !== void 0 && mipmap !== this.mipmap && (this.mipmap = mipmap, dirty = true), dirty && this.dirtyStyleId++, this;
    }
    /**
     * Changes w/h/resolution. Texture becomes valid if width and height are greater than zero.
     * @param desiredWidth - Desired visual width
     * @param desiredHeight - Desired visual height
     * @param resolution - Optionally set resolution
     * @returns - this
     */
    setSize(desiredWidth, desiredHeight, resolution) {
      return resolution = resolution || this.resolution, this.setRealSize(desiredWidth * resolution, desiredHeight * resolution, resolution);
    }
    /**
     * Sets real size of baseTexture, preserves current resolution.
     * @param realWidth - Full rendered width
     * @param realHeight - Full rendered height
     * @param resolution - Optionally set resolution
     * @returns - this
     */
    setRealSize(realWidth, realHeight, resolution) {
      return this.resolution = resolution || this.resolution, this.width = Math.round(realWidth) / this.resolution, this.height = Math.round(realHeight) / this.resolution, this._refreshPOT(), this.update(), this;
    }
    /**
     * Refresh check for isPowerOfTwo texture based on size
     * @private
     */
    _refreshPOT() {
      this.isPowerOfTwo = isPow2(this.realWidth) && isPow2(this.realHeight);
    }
    /**
     * Changes resolution
     * @param resolution - res
     * @returns - this
     */
    setResolution(resolution) {
      const oldResolution = this.resolution;
      return oldResolution === resolution ? this : (this.resolution = resolution, this.valid && (this.width = Math.round(this.width * oldResolution) / resolution, this.height = Math.round(this.height * oldResolution) / resolution, this.emit("update", this)), this._refreshPOT(), this);
    }
    /**
     * Sets the resource if it wasn't set. Throws error if resource already present
     * @param resource - that is managing this BaseTexture
     * @returns - this
     */
    setResource(resource) {
      if (this.resource === resource)
        return this;
      if (this.resource)
        throw new Error("Resource can be set only once");
      return resource.bind(this), this.resource = resource, this;
    }
    /** Invalidates the object. Texture becomes valid if width and height are greater than zero. */
    update() {
      this.valid ? (this.dirtyId++, this.dirtyStyleId++, this.emit("update", this)) : this.width > 0 && this.height > 0 && (this.valid = true, this.emit("loaded", this), this.emit("update", this));
    }
    /**
     * Handle errors with resources.
     * @private
     * @param event - Error event emitted.
     */
    onError(event) {
      this.emit("error", this, event);
    }
    /**
     * Destroys this base texture.
     * The method stops if resource doesn't want this texture to be destroyed.
     * Removes texture from all caches.
     * @fires PIXI.BaseTexture#destroyed
     */
    destroy() {
      this.resource && (this.resource.unbind(this), this.resource.internal && this.resource.destroy(), this.resource = null), this.cacheId && (delete BaseTextureCache[this.cacheId], delete TextureCache[this.cacheId], this.cacheId = null), this.valid = false, this.dispose(), _BaseTexture2.removeFromCache(this), this.textureCacheIds = null, this.destroyed = true, this.emit("destroyed", this), this.removeAllListeners();
    }
    /**
     * Frees the texture from WebGL memory without destroying this texture object.
     * This means you can still use the texture later which will upload it to GPU
     * memory again.
     * @fires PIXI.BaseTexture#dispose
     */
    dispose() {
      this.emit("dispose", this);
    }
    /** Utility function for BaseTexture|Texture cast. */
    castToBaseTexture() {
      return this;
    }
    /**
     * Helper function that creates a base texture based on the source you provide.
     * The source can be - image url, image element, canvas element. If the
     * source is an image url or an image element and not in the base texture
     * cache, it will be created and loaded.
     * @static
     * @param {PIXI.ImageSource|string|string[]} source - The
     *        source to create base texture from.
     * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
     * @param {string} [options.pixiIdPrefix=pixiid] - If a source has no id, this is the prefix of the generated id
     * @param {boolean} [strict] - Enforce strict-mode, see {@link PIXI.settings.STRICT_TEXTURE_CACHE}.
     * @returns {PIXI.BaseTexture} The new base texture.
     */
    static from(source, options, strict = settings.STRICT_TEXTURE_CACHE) {
      const isFrame = typeof source == "string";
      let cacheId = null;
      if (isFrame)
        cacheId = source;
      else {
        if (!source._pixiId) {
          const prefix = options?.pixiIdPrefix || "pixiid";
          source._pixiId = `${prefix}_${uid()}`;
        }
        cacheId = source._pixiId;
      }
      let baseTexture = BaseTextureCache[cacheId];
      if (isFrame && strict && !baseTexture)
        throw new Error(`The cacheId "${cacheId}" does not exist in BaseTextureCache.`);
      return baseTexture || (baseTexture = new _BaseTexture2(source, options), baseTexture.cacheId = cacheId, _BaseTexture2.addToCache(baseTexture, cacheId)), baseTexture;
    }
    /**
     * Create a new Texture with a BufferResource from a typed array.
     * @param buffer - The optional array to use. If no data is provided, a new Float32Array is created.
     * @param width - Width of the resource
     * @param height - Height of the resource
     * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
     *        Default properties are different from the constructor's defaults.
     * @param {PIXI.FORMATS} [options.format] - The format is not given, the type is inferred from the
     *        type of the buffer: `RGBA` if Float32Array, Int8Array, Uint8Array, or Uint8ClampedArray,
     *        otherwise `RGBA_INTEGER`.
     * @param {PIXI.TYPES} [options.type] - The type is not given, the type is inferred from the
     *        type of the buffer. Maps Float32Array to `FLOAT`, Int32Array to `INT`, Uint32Array to
     *        `UNSIGNED_INT`, Int16Array to `SHORT`, Uint16Array to `UNSIGNED_SHORT`, Int8Array to `BYTE`,
     *        Uint8Array/Uint8ClampedArray to `UNSIGNED_BYTE`.
     * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.NPM]
     * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.SCALE_MODES.NEAREST]
     * @returns - The resulting new BaseTexture
     */
    static fromBuffer(buffer, width, height, options) {
      buffer = buffer || new Float32Array(width * height * 4);
      const resource = new BufferResource(buffer, { width, height, ...options?.resourceOptions });
      let format2, type;
      return buffer instanceof Float32Array ? (format2 = FORMATS.RGBA, type = TYPES.FLOAT) : buffer instanceof Int32Array ? (format2 = FORMATS.RGBA_INTEGER, type = TYPES.INT) : buffer instanceof Uint32Array ? (format2 = FORMATS.RGBA_INTEGER, type = TYPES.UNSIGNED_INT) : buffer instanceof Int16Array ? (format2 = FORMATS.RGBA_INTEGER, type = TYPES.SHORT) : buffer instanceof Uint16Array ? (format2 = FORMATS.RGBA_INTEGER, type = TYPES.UNSIGNED_SHORT) : buffer instanceof Int8Array ? (format2 = FORMATS.RGBA, type = TYPES.BYTE) : (format2 = FORMATS.RGBA, type = TYPES.UNSIGNED_BYTE), resource.internal = true, new _BaseTexture2(resource, Object.assign({}, defaultBufferOptions, { type, format: format2 }, options));
    }
    /**
     * Adds a BaseTexture to the global BaseTextureCache. This cache is shared across the whole PIXI object.
     * @param {PIXI.BaseTexture} baseTexture - The BaseTexture to add to the cache.
     * @param {string} id - The id that the BaseTexture will be stored against.
     */
    static addToCache(baseTexture, id) {
      id && (baseTexture.textureCacheIds.includes(id) || baseTexture.textureCacheIds.push(id), BaseTextureCache[id] && BaseTextureCache[id] !== baseTexture && console.warn(`BaseTexture added to the cache with an id [${id}] that already had an entry`), BaseTextureCache[id] = baseTexture);
    }
    /**
     * Remove a BaseTexture from the global BaseTextureCache.
     * @param {string|PIXI.BaseTexture} baseTexture - id of a BaseTexture to be removed, or a BaseTexture instance itself.
     * @returns {PIXI.BaseTexture|null} The BaseTexture that was removed.
     */
    static removeFromCache(baseTexture) {
      if (typeof baseTexture == "string") {
        const baseTextureFromCache = BaseTextureCache[baseTexture];
        if (baseTextureFromCache) {
          const index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);
          return index > -1 && baseTextureFromCache.textureCacheIds.splice(index, 1), delete BaseTextureCache[baseTexture], baseTextureFromCache;
        }
      } else if (baseTexture?.textureCacheIds) {
        for (let i2 = 0; i2 < baseTexture.textureCacheIds.length; ++i2)
          delete BaseTextureCache[baseTexture.textureCacheIds[i2]];
        return baseTexture.textureCacheIds.length = 0, baseTexture;
      }
      return null;
    }
  };
  _BaseTexture.defaultOptions = {
    /**
     * If mipmapping is enabled for texture.
     * @type {PIXI.MIPMAP_MODES}
     * @default PIXI.MIPMAP_MODES.POW2
     */
    mipmap: MIPMAP_MODES.POW2,
    /** Anisotropic filtering level of texture */
    anisotropicLevel: 0,
    /**
     * Default scale mode, linear, nearest.
     * @type {PIXI.SCALE_MODES}
     * @default PIXI.SCALE_MODES.LINEAR
     */
    scaleMode: SCALE_MODES.LINEAR,
    /**
     * Wrap mode for textures.
     * @type {PIXI.WRAP_MODES}
     * @default PIXI.WRAP_MODES.CLAMP
     */
    wrapMode: WRAP_MODES.CLAMP,
    /**
     * Pre multiply the image alpha
     * @type {PIXI.ALPHA_MODES}
     * @default PIXI.ALPHA_MODES.UNPACK
     */
    alphaMode: ALPHA_MODES.UNPACK,
    /**
     * GL texture target
     * @type {PIXI.TARGETS}
     * @default PIXI.TARGETS.TEXTURE_2D
     */
    target: TARGETS.TEXTURE_2D,
    /**
     * GL format type
     * @type {PIXI.FORMATS}
     * @default PIXI.FORMATS.RGBA
     */
    format: FORMATS.RGBA,
    /**
     * GL data type
     * @type {PIXI.TYPES}
     * @default PIXI.TYPES.UNSIGNED_BYTE
     */
    type: TYPES.UNSIGNED_BYTE
  }, /** Global number of the texture batch, used by multi-texture renderers. */
  _BaseTexture._globalBatch = 0;
  var BaseTexture = _BaseTexture;

  // node_modules/@pixi/core/lib/batch/BatchDrawCall.mjs
  var BatchDrawCall = class {
    constructor() {
      this.texArray = null, this.blend = 0, this.type = DRAW_MODES.TRIANGLES, this.start = 0, this.size = 0, this.data = null;
    }
  };

  // node_modules/@pixi/core/lib/geometry/Buffer.mjs
  var UID = 0;
  var Buffer2 = class _Buffer {
    /**
     * @param {PIXI.IArrayBuffer} data - the data to store in the buffer.
     * @param _static - `true` for static buffer
     * @param index - `true` for index buffer
     */
    constructor(data, _static = true, index = false) {
      this.data = data || new Float32Array(1), this._glBuffers = {}, this._updateID = 0, this.index = index, this.static = _static, this.id = UID++, this.disposeRunner = new Runner("disposeBuffer");
    }
    // TODO could explore flagging only a partial upload?
    /**
     * Flags this buffer as requiring an upload to the GPU.
     * @param {PIXI.IArrayBuffer|number[]} [data] - the data to update in the buffer.
     */
    update(data) {
      data instanceof Array && (data = new Float32Array(data)), this.data = data || this.data, this._updateID++;
    }
    /** Disposes WebGL resources that are connected to this geometry. */
    dispose() {
      this.disposeRunner.emit(this, false);
    }
    /** Destroys the buffer. */
    destroy() {
      this.dispose(), this.data = null;
    }
    /**
     * Flags whether this is an index buffer.
     *
     * Index buffers are of type `ELEMENT_ARRAY_BUFFER`. Note that setting this property to false will make
     * the buffer of type `ARRAY_BUFFER`.
     *
     * For backwards compatibility.
     */
    set index(value) {
      this.type = value ? BUFFER_TYPE.ELEMENT_ARRAY_BUFFER : BUFFER_TYPE.ARRAY_BUFFER;
    }
    get index() {
      return this.type === BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
    }
    /**
     * Helper function that creates a buffer based on an array or TypedArray
     * @param {ArrayBufferView | number[]} data - the TypedArray that the buffer will store. If this is a regular Array it will be converted to a Float32Array.
     * @returns - A new Buffer based on the data provided.
     */
    static from(data) {
      return data instanceof Array && (data = new Float32Array(data)), new _Buffer(data);
    }
  };

  // node_modules/@pixi/core/lib/geometry/Attribute.mjs
  var Attribute = class _Attribute {
    /**
     * @param buffer - the id of the buffer that this attribute will look for
     * @param size - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2.
     * @param normalized - should the data be normalized.
     * @param {PIXI.TYPES} [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {@link PIXI.TYPES} to see the ones available
     * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
     * @param [start=0] - How far into the array to start reading values (used for interleaving data)
     * @param [instance=false] - Whether the geometry is instanced.
     * @param [divisor=1] - Divisor to use when doing instanced rendering
     */
    constructor(buffer, size = 0, normalized = false, type = TYPES.FLOAT, stride, start, instance, divisor = 1) {
      this.buffer = buffer, this.size = size, this.normalized = normalized, this.type = type, this.stride = stride, this.start = start, this.instance = instance, this.divisor = divisor;
    }
    /** Destroys the Attribute. */
    destroy() {
      this.buffer = null;
    }
    /**
     * Helper function that creates an Attribute based on the information provided
     * @param buffer - the id of the buffer that this attribute will look for
     * @param [size=0] - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2
     * @param [normalized=false] - should the data be normalized.
     * @param [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {@link PIXI.TYPES} to see the ones available
     * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
     * @returns - A new {@link PIXI.Attribute} based on the information provided
     */
    static from(buffer, size, normalized, type, stride) {
      return new _Attribute(buffer, size, normalized, type, stride);
    }
  };

  // node_modules/@pixi/core/lib/geometry/utils/interleaveTypedArrays.mjs
  var map2 = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array
  };
  function interleaveTypedArrays2(arrays, sizes) {
    let outSize = 0, stride = 0;
    const views = {};
    for (let i2 = 0; i2 < arrays.length; i2++)
      stride += sizes[i2], outSize += arrays[i2].length;
    const buffer = new ArrayBuffer(outSize * 4);
    let out = null, littleOffset = 0;
    for (let i2 = 0; i2 < arrays.length; i2++) {
      const size = sizes[i2], array = arrays[i2], type = getBufferType(array);
      views[type] || (views[type] = new map2[type](buffer)), out = views[type];
      for (let j2 = 0; j2 < array.length; j2++) {
        const indexStart = (j2 / size | 0) * stride + littleOffset, index = j2 % size;
        out[indexStart + index] = array[j2];
      }
      littleOffset += size;
    }
    return new Float32Array(buffer);
  }

  // node_modules/@pixi/core/lib/geometry/Geometry.mjs
  var byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
  var UID2 = 0;
  var map3 = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array,
    Uint16Array
  };
  var Geometry = class _Geometry {
    /**
     * @param buffers - An array of buffers. optional.
     * @param attributes - Of the geometry, optional structure of the attributes layout
     */
    constructor(buffers = [], attributes = {}) {
      this.buffers = buffers, this.indexBuffer = null, this.attributes = attributes, this.glVertexArrayObjects = {}, this.id = UID2++, this.instanced = false, this.instanceCount = 1, this.disposeRunner = new Runner("disposeGeometry"), this.refCount = 0;
    }
    /**
     *
     * Adds an attribute to the geometry
     * Note: `stride` and `start` should be `undefined` if you dont know them, not 0!
     * @param id - the name of the attribute (matching up to a shader)
     * @param {PIXI.Buffer|number[]} buffer - the buffer that holds the data of the attribute . You can also provide an Array and a buffer will be created from it.
     * @param size - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2
     * @param normalized - should the data be normalized.
     * @param [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {@link PIXI.TYPES} to see the ones available
     * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
     * @param [start=0] - How far into the array to start reading values (used for interleaving data)
     * @param instance - Instancing flag
     * @returns - Returns self, useful for chaining.
     */
    addAttribute(id, buffer, size = 0, normalized = false, type, stride, start, instance = false) {
      if (!buffer)
        throw new Error("You must pass a buffer when creating an attribute");
      buffer instanceof Buffer2 || (buffer instanceof Array && (buffer = new Float32Array(buffer)), buffer = new Buffer2(buffer));
      const ids = id.split("|");
      if (ids.length > 1) {
        for (let i2 = 0; i2 < ids.length; i2++)
          this.addAttribute(ids[i2], buffer, size, normalized, type);
        return this;
      }
      let bufferIndex = this.buffers.indexOf(buffer);
      return bufferIndex === -1 && (this.buffers.push(buffer), bufferIndex = this.buffers.length - 1), this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance), this.instanced = this.instanced || instance, this;
    }
    /**
     * Returns the requested attribute.
     * @param id - The name of the attribute required
     * @returns - The attribute requested.
     */
    getAttribute(id) {
      return this.attributes[id];
    }
    /**
     * Returns the requested buffer.
     * @param id - The name of the buffer required.
     * @returns - The buffer requested.
     */
    getBuffer(id) {
      return this.buffers[this.getAttribute(id).buffer];
    }
    /**
     *
     * Adds an index buffer to the geometry
     * The index buffer contains integers, three for each triangle in the geometry, which reference the various attribute buffers (position, colour, UV coordinates, other UV coordinates, normal, …). There is only ONE index buffer.
     * @param {PIXI.Buffer|number[]} [buffer] - The buffer that holds the data of the index buffer. You can also provide an Array and a buffer will be created from it.
     * @returns - Returns self, useful for chaining.
     */
    addIndex(buffer) {
      return buffer instanceof Buffer2 || (buffer instanceof Array && (buffer = new Uint16Array(buffer)), buffer = new Buffer2(buffer)), buffer.type = BUFFER_TYPE.ELEMENT_ARRAY_BUFFER, this.indexBuffer = buffer, this.buffers.includes(buffer) || this.buffers.push(buffer), this;
    }
    /**
     * Returns the index buffer
     * @returns - The index buffer.
     */
    getIndex() {
      return this.indexBuffer;
    }
    /**
     * This function modifies the structure so that all current attributes become interleaved into a single buffer
     * This can be useful if your model remains static as it offers a little performance boost
     * @returns - Returns self, useful for chaining.
     */
    interleave() {
      if (this.buffers.length === 1 || this.buffers.length === 2 && this.indexBuffer)
        return this;
      const arrays = [], sizes = [], interleavedBuffer = new Buffer2();
      let i2;
      for (i2 in this.attributes) {
        const attribute = this.attributes[i2], buffer = this.buffers[attribute.buffer];
        arrays.push(buffer.data), sizes.push(attribute.size * byteSizeMap[attribute.type] / 4), attribute.buffer = 0;
      }
      for (interleavedBuffer.data = interleaveTypedArrays2(arrays, sizes), i2 = 0; i2 < this.buffers.length; i2++)
        this.buffers[i2] !== this.indexBuffer && this.buffers[i2].destroy();
      return this.buffers = [interleavedBuffer], this.indexBuffer && this.buffers.push(this.indexBuffer), this;
    }
    /** Get the size of the geometries, in vertices. */
    getSize() {
      for (const i2 in this.attributes) {
        const attribute = this.attributes[i2];
        return this.buffers[attribute.buffer].data.length / (attribute.stride / 4 || attribute.size);
      }
      return 0;
    }
    /** Disposes WebGL resources that are connected to this geometry. */
    dispose() {
      this.disposeRunner.emit(this, false);
    }
    /** Destroys the geometry. */
    destroy() {
      this.dispose(), this.buffers = null, this.indexBuffer = null, this.attributes = null;
    }
    /**
     * Returns a clone of the geometry.
     * @returns - A new clone of this geometry.
     */
    clone() {
      const geometry = new _Geometry();
      for (let i2 = 0; i2 < this.buffers.length; i2++)
        geometry.buffers[i2] = new Buffer2(this.buffers[i2].data.slice(0));
      for (const i2 in this.attributes) {
        const attrib = this.attributes[i2];
        geometry.attributes[i2] = new Attribute(
          attrib.buffer,
          attrib.size,
          attrib.normalized,
          attrib.type,
          attrib.stride,
          attrib.start,
          attrib.instance
        );
      }
      return this.indexBuffer && (geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)], geometry.indexBuffer.type = BUFFER_TYPE.ELEMENT_ARRAY_BUFFER), geometry;
    }
    /**
     * Merges an array of geometries into a new single one.
     *
     * Geometry attribute styles must match for this operation to work.
     * @param geometries - array of geometries to merge
     * @returns - Shiny new geometry!
     */
    static merge(geometries) {
      const geometryOut = new _Geometry(), arrays = [], sizes = [], offsets = [];
      let geometry;
      for (let i2 = 0; i2 < geometries.length; i2++) {
        geometry = geometries[i2];
        for (let j2 = 0; j2 < geometry.buffers.length; j2++)
          sizes[j2] = sizes[j2] || 0, sizes[j2] += geometry.buffers[j2].data.length, offsets[j2] = 0;
      }
      for (let i2 = 0; i2 < geometry.buffers.length; i2++)
        arrays[i2] = new map3[getBufferType(geometry.buffers[i2].data)](sizes[i2]), geometryOut.buffers[i2] = new Buffer2(arrays[i2]);
      for (let i2 = 0; i2 < geometries.length; i2++) {
        geometry = geometries[i2];
        for (let j2 = 0; j2 < geometry.buffers.length; j2++)
          arrays[j2].set(geometry.buffers[j2].data, offsets[j2]), offsets[j2] += geometry.buffers[j2].data.length;
      }
      if (geometryOut.attributes = geometry.attributes, geometry.indexBuffer) {
        geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)], geometryOut.indexBuffer.type = BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
        let offset = 0, stride = 0, offset2 = 0, bufferIndexToCount = 0;
        for (let i2 = 0; i2 < geometry.buffers.length; i2++)
          if (geometry.buffers[i2] !== geometry.indexBuffer) {
            bufferIndexToCount = i2;
            break;
          }
        for (const i2 in geometry.attributes) {
          const attribute = geometry.attributes[i2];
          (attribute.buffer | 0) === bufferIndexToCount && (stride += attribute.size * byteSizeMap[attribute.type] / 4);
        }
        for (let i2 = 0; i2 < geometries.length; i2++) {
          const indexBufferData = geometries[i2].indexBuffer.data;
          for (let j2 = 0; j2 < indexBufferData.length; j2++)
            geometryOut.indexBuffer.data[j2 + offset2] += offset;
          offset += geometries[i2].buffers[bufferIndexToCount].data.length / stride, offset2 += indexBufferData.length;
        }
      }
      return geometryOut;
    }
  };

  // node_modules/@pixi/core/lib/batch/BatchGeometry.mjs
  var BatchGeometry = class extends Geometry {
    /**
     * @param {boolean} [_static=false] - Optimization flag, where `false`
     *        is updated every frame, `true` doesn't change frame-to-frame.
     */
    constructor(_static = false) {
      super(), this._buffer = new Buffer2(null, _static, false), this._indexBuffer = new Buffer2(null, _static, true), this.addAttribute("aVertexPosition", this._buffer, 2, false, TYPES.FLOAT).addAttribute("aTextureCoord", this._buffer, 2, false, TYPES.FLOAT).addAttribute("aColor", this._buffer, 4, true, TYPES.UNSIGNED_BYTE).addAttribute("aTextureId", this._buffer, 1, true, TYPES.FLOAT).addIndex(this._indexBuffer);
    }
  };

  // node_modules/@pixi/math/lib/const.mjs
  var PI_2 = Math.PI * 2;
  var RAD_TO_DEG2 = 180 / Math.PI;
  var DEG_TO_RAD2 = Math.PI / 180;
  var SHAPES = /* @__PURE__ */ ((SHAPES2) => (SHAPES2[SHAPES2.POLY = 0] = "POLY", SHAPES2[SHAPES2.RECT = 1] = "RECT", SHAPES2[SHAPES2.CIRC = 2] = "CIRC", SHAPES2[SHAPES2.ELIP = 3] = "ELIP", SHAPES2[SHAPES2.RREC = 4] = "RREC", SHAPES2))(SHAPES || {});

  // node_modules/@pixi/math/lib/Point.mjs
  var Point = class _Point {
    /**
     * Creates a new `Point`
     * @param {number} [x=0] - position of the point on the x axis
     * @param {number} [y=0] - position of the point on the y axis
     */
    constructor(x2 = 0, y2 = 0) {
      this.x = 0, this.y = 0, this.x = x2, this.y = y2;
    }
    /**
     * Creates a clone of this point
     * @returns A clone of this point
     */
    clone() {
      return new _Point(this.x, this.y);
    }
    /**
     * Copies `x` and `y` from the given point into this point
     * @param p - The point to copy from
     * @returns The point instance itself
     */
    copyFrom(p3) {
      return this.set(p3.x, p3.y), this;
    }
    /**
     * Copies this point's x and y into the given point (`p`).
     * @param p - The point to copy to. Can be any of type that is or extends `IPointData`
     * @returns The point (`p`) with values updated
     */
    copyTo(p3) {
      return p3.set(this.x, this.y), p3;
    }
    /**
     * Accepts another point (`p`) and returns `true` if the given point is equal to this point
     * @param p - The point to check
     * @returns Returns `true` if both `x` and `y` are equal
     */
    equals(p3) {
      return p3.x === this.x && p3.y === this.y;
    }
    /**
     * Sets the point to a new `x` and `y` position.
     * If `y` is omitted, both `x` and `y` will be set to `x`.
     * @param {number} [x=0] - position of the point on the `x` axis
     * @param {number} [y=x] - position of the point on the `y` axis
     * @returns The point instance itself
     */
    set(x2 = 0, y2 = x2) {
      return this.x = x2, this.y = y2, this;
    }
  };
  Point.prototype.toString = function() {
    return `[@pixi/math:Point x=${this.x} y=${this.y}]`;
  };

  // node_modules/@pixi/math/lib/shapes/Rectangle.mjs
  var tempPoints = [new Point(), new Point(), new Point(), new Point()];
  var Rectangle = class _Rectangle {
    /**
     * @param x - The X coordinate of the upper-left corner of the rectangle
     * @param y - The Y coordinate of the upper-left corner of the rectangle
     * @param width - The overall width of the rectangle
     * @param height - The overall height of the rectangle
     */
    constructor(x2 = 0, y2 = 0, width = 0, height = 0) {
      this.x = Number(x2), this.y = Number(y2), this.width = Number(width), this.height = Number(height), this.type = SHAPES.RECT;
    }
    /** Returns the left edge of the rectangle. */
    get left() {
      return this.x;
    }
    /** Returns the right edge of the rectangle. */
    get right() {
      return this.x + this.width;
    }
    /** Returns the top edge of the rectangle. */
    get top() {
      return this.y;
    }
    /** Returns the bottom edge of the rectangle. */
    get bottom() {
      return this.y + this.height;
    }
    /** A constant empty rectangle. */
    static get EMPTY() {
      return new _Rectangle(0, 0, 0, 0);
    }
    /**
     * Creates a clone of this Rectangle
     * @returns a copy of the rectangle
     */
    clone() {
      return new _Rectangle(this.x, this.y, this.width, this.height);
    }
    /**
     * Copies another rectangle to this one.
     * @param rectangle - The rectangle to copy from.
     * @returns Returns itself.
     */
    copyFrom(rectangle) {
      return this.x = rectangle.x, this.y = rectangle.y, this.width = rectangle.width, this.height = rectangle.height, this;
    }
    /**
     * Copies this rectangle to another one.
     * @param rectangle - The rectangle to copy to.
     * @returns Returns given parameter.
     */
    copyTo(rectangle) {
      return rectangle.x = this.x, rectangle.y = this.y, rectangle.width = this.width, rectangle.height = this.height, rectangle;
    }
    /**
     * Checks whether the x and y coordinates given are contained within this Rectangle
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @returns Whether the x/y coordinates are within this Rectangle
     */
    contains(x2, y2) {
      return this.width <= 0 || this.height <= 0 ? false : x2 >= this.x && x2 < this.x + this.width && y2 >= this.y && y2 < this.y + this.height;
    }
    /**
     * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
     * Returns true only if the area of the intersection is >0, this means that Rectangles
     * sharing a side are not overlapping. Another side effect is that an arealess rectangle
     * (width or height equal to zero) can't intersect any other rectangle.
     * @param {Rectangle} other - The Rectangle to intersect with `this`.
     * @param {Matrix} transform - The transformation matrix of `other`.
     * @returns {boolean} A value of `true` if the transformed `other` Rectangle intersects with `this`; otherwise `false`.
     */
    intersects(other, transform) {
      if (!transform) {
        const x02 = this.x < other.x ? other.x : this.x;
        if ((this.right > other.right ? other.right : this.right) <= x02)
          return false;
        const y02 = this.y < other.y ? other.y : this.y;
        return (this.bottom > other.bottom ? other.bottom : this.bottom) > y02;
      }
      const x0 = this.left, x1 = this.right, y0 = this.top, y1 = this.bottom;
      if (x1 <= x0 || y1 <= y0)
        return false;
      const lt = tempPoints[0].set(other.left, other.top), lb = tempPoints[1].set(other.left, other.bottom), rt = tempPoints[2].set(other.right, other.top), rb = tempPoints[3].set(other.right, other.bottom);
      if (rt.x <= lt.x || lb.y <= lt.y)
        return false;
      const s2 = Math.sign(transform.a * transform.d - transform.b * transform.c);
      if (s2 === 0 || (transform.apply(lt, lt), transform.apply(lb, lb), transform.apply(rt, rt), transform.apply(rb, rb), Math.max(lt.x, lb.x, rt.x, rb.x) <= x0 || Math.min(lt.x, lb.x, rt.x, rb.x) >= x1 || Math.max(lt.y, lb.y, rt.y, rb.y) <= y0 || Math.min(lt.y, lb.y, rt.y, rb.y) >= y1))
        return false;
      const nx = s2 * (lb.y - lt.y), ny = s2 * (lt.x - lb.x), n00 = nx * x0 + ny * y0, n10 = nx * x1 + ny * y0, n01 = nx * x0 + ny * y1, n11 = nx * x1 + ny * y1;
      if (Math.max(n00, n10, n01, n11) <= nx * lt.x + ny * lt.y || Math.min(n00, n10, n01, n11) >= nx * rb.x + ny * rb.y)
        return false;
      const mx = s2 * (lt.y - rt.y), my = s2 * (rt.x - lt.x), m00 = mx * x0 + my * y0, m10 = mx * x1 + my * y0, m01 = mx * x0 + my * y1, m11 = mx * x1 + my * y1;
      return !(Math.max(m00, m10, m01, m11) <= mx * lt.x + my * lt.y || Math.min(m00, m10, m01, m11) >= mx * rb.x + my * rb.y);
    }
    /**
     * Pads the rectangle making it grow in all directions.
     * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
     * @param paddingX - The horizontal padding amount.
     * @param paddingY - The vertical padding amount.
     * @returns Returns itself.
     */
    pad(paddingX = 0, paddingY = paddingX) {
      return this.x -= paddingX, this.y -= paddingY, this.width += paddingX * 2, this.height += paddingY * 2, this;
    }
    /**
     * Fits this rectangle around the passed one.
     * @param rectangle - The rectangle to fit.
     * @returns Returns itself.
     */
    fit(rectangle) {
      const x1 = Math.max(this.x, rectangle.x), x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width), y1 = Math.max(this.y, rectangle.y), y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
      return this.x = x1, this.width = Math.max(x2 - x1, 0), this.y = y1, this.height = Math.max(y2 - y1, 0), this;
    }
    /**
     * Enlarges rectangle that way its corners lie on grid
     * @param resolution - resolution
     * @param eps - precision
     * @returns Returns itself.
     */
    ceil(resolution = 1, eps = 1e-3) {
      const x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution, y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
      return this.x = Math.floor((this.x + eps) * resolution) / resolution, this.y = Math.floor((this.y + eps) * resolution) / resolution, this.width = x2 - this.x, this.height = y2 - this.y, this;
    }
    /**
     * Enlarges this rectangle to include the passed rectangle.
     * @param rectangle - The rectangle to include.
     * @returns Returns itself.
     */
    enlarge(rectangle) {
      const x1 = Math.min(this.x, rectangle.x), x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width), y1 = Math.min(this.y, rectangle.y), y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
      return this.x = x1, this.width = x2 - x1, this.y = y1, this.height = y2 - y1, this;
    }
  };
  Rectangle.prototype.toString = function() {
    return `[@pixi/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
  };

  // node_modules/@pixi/math/lib/shapes/Circle.mjs
  var Circle = class _Circle {
    /**
     * @param x - The X coordinate of the center of this circle
     * @param y - The Y coordinate of the center of this circle
     * @param radius - The radius of the circle
     */
    constructor(x2 = 0, y2 = 0, radius = 0) {
      this.x = x2, this.y = y2, this.radius = radius, this.type = SHAPES.CIRC;
    }
    /**
     * Creates a clone of this Circle instance
     * @returns A copy of the Circle
     */
    clone() {
      return new _Circle(this.x, this.y, this.radius);
    }
    /**
     * Checks whether the x and y coordinates given are contained within this circle
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @returns Whether the x/y coordinates are within this Circle
     */
    contains(x2, y2) {
      if (this.radius <= 0)
        return false;
      const r2 = this.radius * this.radius;
      let dx = this.x - x2, dy = this.y - y2;
      return dx *= dx, dy *= dy, dx + dy <= r2;
    }
    /**
     * Returns the framing rectangle of the circle as a Rectangle object
     * @returns The framing rectangle
     */
    getBounds() {
      return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
  };
  Circle.prototype.toString = function() {
    return `[@pixi/math:Circle x=${this.x} y=${this.y} radius=${this.radius}]`;
  };

  // node_modules/@pixi/math/lib/shapes/Ellipse.mjs
  var Ellipse = class _Ellipse {
    /**
     * @param x - The X coordinate of the center of this ellipse
     * @param y - The Y coordinate of the center of this ellipse
     * @param halfWidth - The half width of this ellipse
     * @param halfHeight - The half height of this ellipse
     */
    constructor(x2 = 0, y2 = 0, halfWidth = 0, halfHeight = 0) {
      this.x = x2, this.y = y2, this.width = halfWidth, this.height = halfHeight, this.type = SHAPES.ELIP;
    }
    /**
     * Creates a clone of this Ellipse instance
     * @returns {PIXI.Ellipse} A copy of the ellipse
     */
    clone() {
      return new _Ellipse(this.x, this.y, this.width, this.height);
    }
    /**
     * Checks whether the x and y coordinates given are contained within this ellipse
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @returns Whether the x/y coords are within this ellipse
     */
    contains(x2, y2) {
      if (this.width <= 0 || this.height <= 0)
        return false;
      let normx = (x2 - this.x) / this.width, normy = (y2 - this.y) / this.height;
      return normx *= normx, normy *= normy, normx + normy <= 1;
    }
    /**
     * Returns the framing rectangle of the ellipse as a Rectangle object
     * @returns The framing rectangle
     */
    getBounds() {
      return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
    }
  };
  Ellipse.prototype.toString = function() {
    return `[@pixi/math:Ellipse x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
  };

  // node_modules/@pixi/math/lib/shapes/Polygon.mjs
  var Polygon = class _Polygon {
    /**
     * @param {PIXI.IPointData[]|number[]} points - This can be an array of Points
     *  that form the polygon, a flat array of numbers that will be interpreted as [x,y, x,y, ...], or
     *  the arguments passed can be all the points of the polygon e.g.
     *  `new Polygon(new Point(), new Point(), ...)`, or the arguments passed can be flat
     *  x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are Numbers.
     */
    constructor(...points) {
      let flat = Array.isArray(points[0]) ? points[0] : points;
      if (typeof flat[0] != "number") {
        const p3 = [];
        for (let i2 = 0, il = flat.length; i2 < il; i2++)
          p3.push(flat[i2].x, flat[i2].y);
        flat = p3;
      }
      this.points = flat, this.type = SHAPES.POLY, this.closeStroke = true;
    }
    /**
     * Creates a clone of this polygon.
     * @returns - A copy of the polygon.
     */
    clone() {
      const points = this.points.slice(), polygon = new _Polygon(points);
      return polygon.closeStroke = this.closeStroke, polygon;
    }
    /**
     * Checks whether the x and y coordinates passed to this function are contained within this polygon.
     * @param x - The X coordinate of the point to test.
     * @param y - The Y coordinate of the point to test.
     * @returns - Whether the x/y coordinates are within this polygon.
     */
    contains(x2, y2) {
      let inside = false;
      const length = this.points.length / 2;
      for (let i2 = 0, j2 = length - 1; i2 < length; j2 = i2++) {
        const xi = this.points[i2 * 2], yi = this.points[i2 * 2 + 1], xj = this.points[j2 * 2], yj = this.points[j2 * 2 + 1];
        yi > y2 != yj > y2 && x2 < (xj - xi) * ((y2 - yi) / (yj - yi)) + xi && (inside = !inside);
      }
      return inside;
    }
  };
  Polygon.prototype.toString = function() {
    return `[@pixi/math:PolygoncloseStroke=${this.closeStroke}points=${this.points.reduce((pointsDesc, currentPoint) => `${pointsDesc}, ${currentPoint}`, "")}]`;
  };

  // node_modules/@pixi/math/lib/shapes/RoundedRectangle.mjs
  var RoundedRectangle = class _RoundedRectangle {
    /**
     * @param x - The X coordinate of the upper-left corner of the rounded rectangle
     * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
     * @param width - The overall width of this rounded rectangle
     * @param height - The overall height of this rounded rectangle
     * @param radius - Controls the radius of the rounded corners
     */
    constructor(x2 = 0, y2 = 0, width = 0, height = 0, radius = 20) {
      this.x = x2, this.y = y2, this.width = width, this.height = height, this.radius = radius, this.type = SHAPES.RREC;
    }
    /**
     * Creates a clone of this Rounded Rectangle.
     * @returns - A copy of the rounded rectangle.
     */
    clone() {
      return new _RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
    }
    /**
     * Checks whether the x and y coordinates given are contained within this Rounded Rectangle
     * @param x - The X coordinate of the point to test.
     * @param y - The Y coordinate of the point to test.
     * @returns - Whether the x/y coordinates are within this Rounded Rectangle.
     */
    contains(x2, y2) {
      if (this.width <= 0 || this.height <= 0)
        return false;
      if (x2 >= this.x && x2 <= this.x + this.width && y2 >= this.y && y2 <= this.y + this.height) {
        const radius = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
        if (y2 >= this.y + radius && y2 <= this.y + this.height - radius || x2 >= this.x + radius && x2 <= this.x + this.width - radius)
          return true;
        let dx = x2 - (this.x + radius), dy = y2 - (this.y + radius);
        const radius2 = radius * radius;
        if (dx * dx + dy * dy <= radius2 || (dx = x2 - (this.x + this.width - radius), dx * dx + dy * dy <= radius2) || (dy = y2 - (this.y + this.height - radius), dx * dx + dy * dy <= radius2) || (dx = x2 - (this.x + radius), dx * dx + dy * dy <= radius2))
          return true;
      }
      return false;
    }
  };
  RoundedRectangle.prototype.toString = function() {
    return `[@pixi/math:RoundedRectangle x=${this.x} y=${this.y}width=${this.width} height=${this.height} radius=${this.radius}]`;
  };

  // node_modules/@pixi/math/lib/Matrix.mjs
  var Matrix = class _Matrix {
    /**
     * @param a - x scale
     * @param b - y skew
     * @param c - x skew
     * @param d - y scale
     * @param tx - x translation
     * @param ty - y translation
     */
    constructor(a2 = 1, b2 = 0, c2 = 0, d3 = 1, tx = 0, ty = 0) {
      this.array = null, this.a = a2, this.b = b2, this.c = c2, this.d = d3, this.tx = tx, this.ty = ty;
    }
    /**
     * Creates a Matrix object based on the given array. The Element to Matrix mapping order is as follows:
     *
     * a = array[0]
     * b = array[1]
     * c = array[3]
     * d = array[4]
     * tx = array[2]
     * ty = array[5]
     * @param array - The array that the matrix will be populated from.
     */
    fromArray(array) {
      this.a = array[0], this.b = array[1], this.c = array[3], this.d = array[4], this.tx = array[2], this.ty = array[5];
    }
    /**
     * Sets the matrix properties.
     * @param a - Matrix component
     * @param b - Matrix component
     * @param c - Matrix component
     * @param d - Matrix component
     * @param tx - Matrix component
     * @param ty - Matrix component
     * @returns This matrix. Good for chaining method calls.
     */
    set(a2, b2, c2, d3, tx, ty) {
      return this.a = a2, this.b = b2, this.c = c2, this.d = d3, this.tx = tx, this.ty = ty, this;
    }
    /**
     * Creates an array from the current Matrix object.
     * @param transpose - Whether we need to transpose the matrix or not
     * @param [out=new Float32Array(9)] - If provided the array will be assigned to out
     * @returns The newly created array which contains the matrix
     */
    toArray(transpose, out) {
      this.array || (this.array = new Float32Array(9));
      const array = out || this.array;
      return transpose ? (array[0] = this.a, array[1] = this.b, array[2] = 0, array[3] = this.c, array[4] = this.d, array[5] = 0, array[6] = this.tx, array[7] = this.ty, array[8] = 1) : (array[0] = this.a, array[1] = this.c, array[2] = this.tx, array[3] = this.b, array[4] = this.d, array[5] = this.ty, array[6] = 0, array[7] = 0, array[8] = 1), array;
    }
    /**
     * Get a new position with the current transformation applied.
     * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
     * @param pos - The origin
     * @param {PIXI.Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
     * @returns {PIXI.Point} The new point, transformed through this matrix
     */
    apply(pos, newPos) {
      newPos = newPos || new Point();
      const x2 = pos.x, y2 = pos.y;
      return newPos.x = this.a * x2 + this.c * y2 + this.tx, newPos.y = this.b * x2 + this.d * y2 + this.ty, newPos;
    }
    /**
     * Get a new position with the inverse of the current transformation applied.
     * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
     * @param pos - The origin
     * @param {PIXI.Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
     * @returns {PIXI.Point} The new point, inverse-transformed through this matrix
     */
    applyInverse(pos, newPos) {
      newPos = newPos || new Point();
      const id = 1 / (this.a * this.d + this.c * -this.b), x2 = pos.x, y2 = pos.y;
      return newPos.x = this.d * id * x2 + -this.c * id * y2 + (this.ty * this.c - this.tx * this.d) * id, newPos.y = this.a * id * y2 + -this.b * id * x2 + (-this.ty * this.a + this.tx * this.b) * id, newPos;
    }
    /**
     * Translates the matrix on the x and y.
     * @param x - How much to translate x by
     * @param y - How much to translate y by
     * @returns This matrix. Good for chaining method calls.
     */
    translate(x2, y2) {
      return this.tx += x2, this.ty += y2, this;
    }
    /**
     * Applies a scale transformation to the matrix.
     * @param x - The amount to scale horizontally
     * @param y - The amount to scale vertically
     * @returns This matrix. Good for chaining method calls.
     */
    scale(x2, y2) {
      return this.a *= x2, this.d *= y2, this.c *= x2, this.b *= y2, this.tx *= x2, this.ty *= y2, this;
    }
    /**
     * Applies a rotation transformation to the matrix.
     * @param angle - The angle in radians.
     * @returns This matrix. Good for chaining method calls.
     */
    rotate(angle) {
      const cos = Math.cos(angle), sin = Math.sin(angle), a1 = this.a, c1 = this.c, tx1 = this.tx;
      return this.a = a1 * cos - this.b * sin, this.b = a1 * sin + this.b * cos, this.c = c1 * cos - this.d * sin, this.d = c1 * sin + this.d * cos, this.tx = tx1 * cos - this.ty * sin, this.ty = tx1 * sin + this.ty * cos, this;
    }
    /**
     * Appends the given Matrix to this Matrix.
     * @param matrix - The matrix to append.
     * @returns This matrix. Good for chaining method calls.
     */
    append(matrix) {
      const a1 = this.a, b1 = this.b, c1 = this.c, d1 = this.d;
      return this.a = matrix.a * a1 + matrix.b * c1, this.b = matrix.a * b1 + matrix.b * d1, this.c = matrix.c * a1 + matrix.d * c1, this.d = matrix.c * b1 + matrix.d * d1, this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx, this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty, this;
    }
    /**
     * Sets the matrix based on all the available properties
     * @param x - Position on the x axis
     * @param y - Position on the y axis
     * @param pivotX - Pivot on the x axis
     * @param pivotY - Pivot on the y axis
     * @param scaleX - Scale on the x axis
     * @param scaleY - Scale on the y axis
     * @param rotation - Rotation in radians
     * @param skewX - Skew on the x axis
     * @param skewY - Skew on the y axis
     * @returns This matrix. Good for chaining method calls.
     */
    setTransform(x2, y2, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
      return this.a = Math.cos(rotation + skewY) * scaleX, this.b = Math.sin(rotation + skewY) * scaleX, this.c = -Math.sin(rotation - skewX) * scaleY, this.d = Math.cos(rotation - skewX) * scaleY, this.tx = x2 - (pivotX * this.a + pivotY * this.c), this.ty = y2 - (pivotX * this.b + pivotY * this.d), this;
    }
    /**
     * Prepends the given Matrix to this Matrix.
     * @param matrix - The matrix to prepend
     * @returns This matrix. Good for chaining method calls.
     */
    prepend(matrix) {
      const tx1 = this.tx;
      if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
        const a1 = this.a, c1 = this.c;
        this.a = a1 * matrix.a + this.b * matrix.c, this.b = a1 * matrix.b + this.b * matrix.d, this.c = c1 * matrix.a + this.d * matrix.c, this.d = c1 * matrix.b + this.d * matrix.d;
      }
      return this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx, this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty, this;
    }
    /**
     * Decomposes the matrix (x, y, scaleX, scaleY, and rotation) and sets the properties on to a transform.
     * @param transform - The transform to apply the properties to.
     * @returns The transform with the newly applied properties
     */
    decompose(transform) {
      const a2 = this.a, b2 = this.b, c2 = this.c, d3 = this.d, pivot = transform.pivot, skewX = -Math.atan2(-c2, d3), skewY = Math.atan2(b2, a2), delta = Math.abs(skewX + skewY);
      return delta < 1e-5 || Math.abs(PI_2 - delta) < 1e-5 ? (transform.rotation = skewY, transform.skew.x = transform.skew.y = 0) : (transform.rotation = 0, transform.skew.x = skewX, transform.skew.y = skewY), transform.scale.x = Math.sqrt(a2 * a2 + b2 * b2), transform.scale.y = Math.sqrt(c2 * c2 + d3 * d3), transform.position.x = this.tx + (pivot.x * a2 + pivot.y * c2), transform.position.y = this.ty + (pivot.x * b2 + pivot.y * d3), transform;
    }
    /**
     * Inverts this matrix
     * @returns This matrix. Good for chaining method calls.
     */
    invert() {
      const a1 = this.a, b1 = this.b, c1 = this.c, d1 = this.d, tx1 = this.tx, n3 = a1 * d1 - b1 * c1;
      return this.a = d1 / n3, this.b = -b1 / n3, this.c = -c1 / n3, this.d = a1 / n3, this.tx = (c1 * this.ty - d1 * tx1) / n3, this.ty = -(a1 * this.ty - b1 * tx1) / n3, this;
    }
    /**
     * Resets this Matrix to an identity (default) matrix.
     * @returns This matrix. Good for chaining method calls.
     */
    identity() {
      return this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0, this;
    }
    /**
     * Creates a new Matrix object with the same values as this one.
     * @returns A copy of this matrix. Good for chaining method calls.
     */
    clone() {
      const matrix = new _Matrix();
      return matrix.a = this.a, matrix.b = this.b, matrix.c = this.c, matrix.d = this.d, matrix.tx = this.tx, matrix.ty = this.ty, matrix;
    }
    /**
     * Changes the values of the given matrix to be the same as the ones in this matrix
     * @param matrix - The matrix to copy to.
     * @returns The matrix given in parameter with its values updated.
     */
    copyTo(matrix) {
      return matrix.a = this.a, matrix.b = this.b, matrix.c = this.c, matrix.d = this.d, matrix.tx = this.tx, matrix.ty = this.ty, matrix;
    }
    /**
     * Changes the values of the matrix to be the same as the ones in given matrix
     * @param {PIXI.Matrix} matrix - The matrix to copy from.
     * @returns {PIXI.Matrix} this
     */
    copyFrom(matrix) {
      return this.a = matrix.a, this.b = matrix.b, this.c = matrix.c, this.d = matrix.d, this.tx = matrix.tx, this.ty = matrix.ty, this;
    }
    /**
     * A default (identity) matrix
     * @readonly
     */
    static get IDENTITY() {
      return new _Matrix();
    }
    /**
     * A temp matrix
     * @readonly
     */
    static get TEMP_MATRIX() {
      return new _Matrix();
    }
  };
  Matrix.prototype.toString = function() {
    return `[@pixi/math:Matrix a=${this.a} b=${this.b} c=${this.c} d=${this.d} tx=${this.tx} ty=${this.ty}]`;
  };

  // node_modules/@pixi/math/lib/groupD8.mjs
  var ux = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1];
  var uy = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1];
  var vx = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1];
  var vy = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1];
  var rotationCayley = [];
  var rotationMatrices = [];
  var signum = Math.sign;
  function init() {
    for (let i2 = 0; i2 < 16; i2++) {
      const row = [];
      rotationCayley.push(row);
      for (let j2 = 0; j2 < 16; j2++) {
        const _ux = signum(ux[i2] * ux[j2] + vx[i2] * uy[j2]), _uy = signum(uy[i2] * ux[j2] + vy[i2] * uy[j2]), _vx = signum(ux[i2] * vx[j2] + vx[i2] * vy[j2]), _vy = signum(uy[i2] * vx[j2] + vy[i2] * vy[j2]);
        for (let k2 = 0; k2 < 16; k2++)
          if (ux[k2] === _ux && uy[k2] === _uy && vx[k2] === _vx && vy[k2] === _vy) {
            row.push(k2);
            break;
          }
      }
    }
    for (let i2 = 0; i2 < 16; i2++) {
      const mat = new Matrix();
      mat.set(ux[i2], uy[i2], vx[i2], vy[i2], 0, 0), rotationMatrices.push(mat);
    }
  }
  init();
  var groupD8 = {
    /**
     * | Rotation | Direction |
     * |----------|-----------|
     * | 0°       | East      |
     * @readonly
     */
    E: 0,
    /**
     * | Rotation | Direction |
     * |----------|-----------|
     * | 45°↻     | Southeast |
     * @readonly
     */
    SE: 1,
    /**
     * | Rotation | Direction |
     * |----------|-----------|
     * | 90°↻     | South     |
     * @readonly
     */
    S: 2,
    /**
     * | Rotation | Direction |
     * |----------|-----------|
     * | 135°↻    | Southwest |
     * @readonly
     */
    SW: 3,
    /**
     * | Rotation | Direction |
     * |----------|-----------|
     * | 180°     | West      |
     * @readonly
     */
    W: 4,
    /**
     * | Rotation    | Direction    |
     * |-------------|--------------|
     * | -135°/225°↻ | Northwest    |
     * @readonly
     */
    NW: 5,
    /**
     * | Rotation    | Direction    |
     * |-------------|--------------|
     * | -90°/270°↻  | North        |
     * @readonly
     */
    N: 6,
    /**
     * | Rotation    | Direction    |
     * |-------------|--------------|
     * | -45°/315°↻  | Northeast    |
     * @readonly
     */
    NE: 7,
    /**
     * Reflection about Y-axis.
     * @readonly
     */
    MIRROR_VERTICAL: 8,
    /**
     * Reflection about the main diagonal.
     * @readonly
     */
    MAIN_DIAGONAL: 10,
    /**
     * Reflection about X-axis.
     * @readonly
     */
    MIRROR_HORIZONTAL: 12,
    /**
     * Reflection about reverse diagonal.
     * @readonly
     */
    REVERSE_DIAGONAL: 14,
    /**
     * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
     * @returns {PIXI.GD8Symmetry} The X-component of the U-axis
     *    after rotating the axes.
     */
    uX: (ind) => ux[ind],
    /**
     * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
     * @returns {PIXI.GD8Symmetry} The Y-component of the U-axis
     *    after rotating the axes.
     */
    uY: (ind) => uy[ind],
    /**
     * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
     * @returns {PIXI.GD8Symmetry} The X-component of the V-axis
     *    after rotating the axes.
     */
    vX: (ind) => vx[ind],
    /**
     * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
     * @returns {PIXI.GD8Symmetry} The Y-component of the V-axis
     *    after rotating the axes.
     */
    vY: (ind) => vy[ind],
    /**
     * @param {PIXI.GD8Symmetry} rotation - symmetry whose opposite
     *   is needed. Only rotations have opposite symmetries while
     *   reflections don't.
     * @returns {PIXI.GD8Symmetry} The opposite symmetry of `rotation`
     */
    inv: (rotation) => rotation & 8 ? rotation & 15 : -rotation & 7,
    /**
     * Composes the two D8 operations.
     *
     * Taking `^` as reflection:
     *
     * |       | E=0 | S=2 | W=4 | N=6 | E^=8 | S^=10 | W^=12 | N^=14 |
     * |-------|-----|-----|-----|-----|------|-------|-------|-------|
     * | E=0   | E   | S   | W   | N   | E^   | S^    | W^    | N^    |
     * | S=2   | S   | W   | N   | E   | S^   | W^    | N^    | E^    |
     * | W=4   | W   | N   | E   | S   | W^   | N^    | E^    | S^    |
     * | N=6   | N   | E   | S   | W   | N^   | E^    | S^    | W^    |
     * | E^=8  | E^  | N^  | W^  | S^  | E    | N     | W     | S     |
     * | S^=10 | S^  | E^  | N^  | W^  | S    | E     | N     | W     |
     * | W^=12 | W^  | S^  | E^  | N^  | W    | S     | E     | N     |
     * | N^=14 | N^  | W^  | S^  | E^  | N    | W     | S     | E     |
     *
     * [This is a Cayley table]{@link https://en.wikipedia.org/wiki/Cayley_table}
     * @param {PIXI.GD8Symmetry} rotationSecond - Second operation, which
     *   is the row in the above cayley table.
     * @param {PIXI.GD8Symmetry} rotationFirst - First operation, which
     *   is the column in the above cayley table.
     * @returns {PIXI.GD8Symmetry} Composed operation
     */
    add: (rotationSecond, rotationFirst) => rotationCayley[rotationSecond][rotationFirst],
    /**
     * Reverse of `add`.
     * @param {PIXI.GD8Symmetry} rotationSecond - Second operation
     * @param {PIXI.GD8Symmetry} rotationFirst - First operation
     * @returns {PIXI.GD8Symmetry} Result
     */
    sub: (rotationSecond, rotationFirst) => rotationCayley[rotationSecond][groupD8.inv(rotationFirst)],
    /**
     * Adds 180 degrees to rotation, which is a commutative
     * operation.
     * @param {number} rotation - The number to rotate.
     * @returns {number} Rotated number
     */
    rotate180: (rotation) => rotation ^ 4,
    /**
     * Checks if the rotation angle is vertical, i.e. south
     * or north. It doesn't work for reflections.
     * @param {PIXI.GD8Symmetry} rotation - The number to check.
     * @returns {boolean} Whether or not the direction is vertical
     */
    isVertical: (rotation) => (rotation & 3) === 2,
    // rotation % 4 === 2
    /**
     * Approximates the vector `V(dx,dy)` into one of the
     * eight directions provided by `groupD8`.
     * @param {number} dx - X-component of the vector
     * @param {number} dy - Y-component of the vector
     * @returns {PIXI.GD8Symmetry} Approximation of the vector into
     *  one of the eight symmetries.
     */
    byDirection: (dx, dy) => Math.abs(dx) * 2 <= Math.abs(dy) ? dy >= 0 ? groupD8.S : groupD8.N : Math.abs(dy) * 2 <= Math.abs(dx) ? dx > 0 ? groupD8.E : groupD8.W : dy > 0 ? dx > 0 ? groupD8.SE : groupD8.SW : dx > 0 ? groupD8.NE : groupD8.NW,
    /**
     * Helps sprite to compensate texture packer rotation.
     * @param {PIXI.Matrix} matrix - sprite world matrix
     * @param {PIXI.GD8Symmetry} rotation - The rotation factor to use.
     * @param {number} tx - sprite anchoring
     * @param {number} ty - sprite anchoring
     */
    matrixAppendRotationInv: (matrix, rotation, tx = 0, ty = 0) => {
      const mat = rotationMatrices[groupD8.inv(rotation)];
      mat.tx = tx, mat.ty = ty, matrix.append(mat);
    }
  };

  // node_modules/@pixi/math/lib/ObservablePoint.mjs
  var ObservablePoint = class _ObservablePoint {
    /**
     * Creates a new `ObservablePoint`
     * @param cb - callback function triggered when `x` and/or `y` are changed
     * @param scope - owner of callback
     * @param {number} [x=0] - position of the point on the x axis
     * @param {number} [y=0] - position of the point on the y axis
     */
    constructor(cb, scope, x2 = 0, y2 = 0) {
      this._x = x2, this._y = y2, this.cb = cb, this.scope = scope;
    }
    /**
     * Creates a clone of this point.
     * The callback and scope params can be overridden otherwise they will default
     * to the clone object's values.
     * @override
     * @param cb - The callback function triggered when `x` and/or `y` are changed
     * @param scope - The owner of the callback
     * @returns a copy of this observable point
     */
    clone(cb = this.cb, scope = this.scope) {
      return new _ObservablePoint(cb, scope, this._x, this._y);
    }
    /**
     * Sets the point to a new `x` and `y` position.
     * If `y` is omitted, both `x` and `y` will be set to `x`.
     * @param {number} [x=0] - position of the point on the x axis
     * @param {number} [y=x] - position of the point on the y axis
     * @returns The observable point instance itself
     */
    set(x2 = 0, y2 = x2) {
      return (this._x !== x2 || this._y !== y2) && (this._x = x2, this._y = y2, this.cb.call(this.scope)), this;
    }
    /**
     * Copies x and y from the given point (`p`)
     * @param p - The point to copy from. Can be any of type that is or extends `IPointData`
     * @returns The observable point instance itself
     */
    copyFrom(p3) {
      return (this._x !== p3.x || this._y !== p3.y) && (this._x = p3.x, this._y = p3.y, this.cb.call(this.scope)), this;
    }
    /**
     * Copies this point's x and y into that of the given point (`p`)
     * @param p - The point to copy to. Can be any of type that is or extends `IPointData`
     * @returns The point (`p`) with values updated
     */
    copyTo(p3) {
      return p3.set(this._x, this._y), p3;
    }
    /**
     * Accepts another point (`p`) and returns `true` if the given point is equal to this point
     * @param p - The point to check
     * @returns Returns `true` if both `x` and `y` are equal
     */
    equals(p3) {
      return p3.x === this._x && p3.y === this._y;
    }
    /** Position of the observable point on the x axis. */
    get x() {
      return this._x;
    }
    set x(value) {
      this._x !== value && (this._x = value, this.cb.call(this.scope));
    }
    /** Position of the observable point on the y axis. */
    get y() {
      return this._y;
    }
    set y(value) {
      this._y !== value && (this._y = value, this.cb.call(this.scope));
    }
  };
  ObservablePoint.prototype.toString = function() {
    return `[@pixi/math:ObservablePoint x=${this.x} y=${this.y} scope=${this.scope}]`;
  };

  // node_modules/@pixi/math/lib/Transform.mjs
  var _Transform = class {
    constructor() {
      this.worldTransform = new Matrix(), this.localTransform = new Matrix(), this.position = new ObservablePoint(this.onChange, this, 0, 0), this.scale = new ObservablePoint(this.onChange, this, 1, 1), this.pivot = new ObservablePoint(this.onChange, this, 0, 0), this.skew = new ObservablePoint(this.updateSkew, this, 0, 0), this._rotation = 0, this._cx = 1, this._sx = 0, this._cy = 0, this._sy = 1, this._localID = 0, this._currentLocalID = 0, this._worldID = 0, this._parentID = 0;
    }
    /** Called when a value changes. */
    onChange() {
      this._localID++;
    }
    /** Called when the skew or the rotation changes. */
    updateSkew() {
      this._cx = Math.cos(this._rotation + this.skew.y), this._sx = Math.sin(this._rotation + this.skew.y), this._cy = -Math.sin(this._rotation - this.skew.x), this._sy = Math.cos(this._rotation - this.skew.x), this._localID++;
    }
    /** Updates the local transformation matrix. */
    updateLocalTransform() {
      const lt = this.localTransform;
      this._localID !== this._currentLocalID && (lt.a = this._cx * this.scale.x, lt.b = this._sx * this.scale.x, lt.c = this._cy * this.scale.y, lt.d = this._sy * this.scale.y, lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c), lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d), this._currentLocalID = this._localID, this._parentID = -1);
    }
    /**
     * Updates the local and the world transformation matrices.
     * @param parentTransform - The parent transform
     */
    updateTransform(parentTransform) {
      const lt = this.localTransform;
      if (this._localID !== this._currentLocalID && (lt.a = this._cx * this.scale.x, lt.b = this._sx * this.scale.x, lt.c = this._cy * this.scale.y, lt.d = this._sy * this.scale.y, lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c), lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d), this._currentLocalID = this._localID, this._parentID = -1), this._parentID !== parentTransform._worldID) {
        const pt = parentTransform.worldTransform, wt = this.worldTransform;
        wt.a = lt.a * pt.a + lt.b * pt.c, wt.b = lt.a * pt.b + lt.b * pt.d, wt.c = lt.c * pt.a + lt.d * pt.c, wt.d = lt.c * pt.b + lt.d * pt.d, wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx, wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty, this._parentID = parentTransform._worldID, this._worldID++;
      }
    }
    /**
     * Decomposes a matrix and sets the transforms properties based on it.
     * @param matrix - The matrix to decompose
     */
    setFromMatrix(matrix) {
      matrix.decompose(this), this._localID++;
    }
    /** The rotation of the object in radians. */
    get rotation() {
      return this._rotation;
    }
    set rotation(value) {
      this._rotation !== value && (this._rotation = value, this.updateSkew());
    }
  };
  _Transform.IDENTITY = new _Transform();
  var Transform = _Transform;
  Transform.prototype.toString = function() {
    return `[@pixi/math:Transform position=(${this.position.x}, ${this.position.y}) rotation=${this.rotation} scale=(${this.scale.x}, ${this.scale.y}) skew=(${this.skew.x}, ${this.skew.y}) ]`;
  };

  // node_modules/@pixi/core/lib/shader/defaultProgram.frag.mjs
  var defaultFragment = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor *= texture2D(uSampler, vTextureCoord);
}`;

  // node_modules/@pixi/core/lib/shader/defaultProgram.vert.mjs
  var defaultVertex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void){
   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
   vTextureCoord = aTextureCoord;
}
`;

  // node_modules/@pixi/core/lib/shader/utils/compileShader.mjs
  function compileShader(gl, type, src) {
    const shader = gl.createShader(type);
    return gl.shaderSource(shader, src), gl.compileShader(shader), shader;
  }

  // node_modules/@pixi/core/lib/shader/utils/defaultValue.mjs
  function booleanArray(size) {
    const array = new Array(size);
    for (let i2 = 0; i2 < array.length; i2++)
      array[i2] = false;
    return array;
  }
  function defaultValue(type, size) {
    switch (type) {
      case "float":
        return 0;
      case "vec2":
        return new Float32Array(2 * size);
      case "vec3":
        return new Float32Array(3 * size);
      case "vec4":
        return new Float32Array(4 * size);
      case "int":
      case "uint":
      case "sampler2D":
      case "sampler2DArray":
        return 0;
      case "ivec2":
        return new Int32Array(2 * size);
      case "ivec3":
        return new Int32Array(3 * size);
      case "ivec4":
        return new Int32Array(4 * size);
      case "uvec2":
        return new Uint32Array(2 * size);
      case "uvec3":
        return new Uint32Array(3 * size);
      case "uvec4":
        return new Uint32Array(4 * size);
      case "bool":
        return false;
      case "bvec2":
        return booleanArray(2 * size);
      case "bvec3":
        return booleanArray(3 * size);
      case "bvec4":
        return booleanArray(4 * size);
      case "mat2":
        return new Float32Array([
          1,
          0,
          0,
          1
        ]);
      case "mat3":
        return new Float32Array([
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ]);
      case "mat4":
        return new Float32Array([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]);
    }
    return null;
  }

  // node_modules/@pixi/core/lib/shader/utils/uniformParsers.mjs
  var uniformParsers = [
    // a float cache layer
    {
      test: (data) => data.type === "float" && data.size === 1 && !data.isArray,
      code: (name) => `
            if(uv["${name}"] !== ud["${name}"].value)
            {
                ud["${name}"].value = uv["${name}"]
                gl.uniform1f(ud["${name}"].location, uv["${name}"])
            }
            `
    },
    // handling samplers
    {
      test: (data, uniform) => (
        // eslint-disable-next-line max-len,no-eq-null,eqeqeq
        (data.type === "sampler2D" || data.type === "samplerCube" || data.type === "sampler2DArray") && data.size === 1 && !data.isArray && (uniform == null || uniform.castToBaseTexture !== void 0)
      ),
      code: (name) => `t = syncData.textureCount++;

            renderer.texture.bind(uv["${name}"], t);

            if(ud["${name}"].value !== t)
            {
                ud["${name}"].value = t;
                gl.uniform1i(ud["${name}"].location, t);
; // eslint-disable-line max-len
            }`
    },
    // uploading pixi matrix object to mat3
    {
      test: (data, uniform) => data.type === "mat3" && data.size === 1 && !data.isArray && uniform.a !== void 0,
      code: (name) => (
        // TODO and some smart caching dirty ids here!
        `
            gl.uniformMatrix3fv(ud["${name}"].location, false, uv["${name}"].toArray(true));
            `
      ),
      codeUbo: (name) => `
                var ${name}_matrix = uv.${name}.toArray(true);

                data[offset] = ${name}_matrix[0];
                data[offset+1] = ${name}_matrix[1];
                data[offset+2] = ${name}_matrix[2];
        
                data[offset + 4] = ${name}_matrix[3];
                data[offset + 5] = ${name}_matrix[4];
                data[offset + 6] = ${name}_matrix[5];
        
                data[offset + 8] = ${name}_matrix[6];
                data[offset + 9] = ${name}_matrix[7];
                data[offset + 10] = ${name}_matrix[8];
            `
    },
    // uploading a pixi point as a vec2 with caching layer
    {
      test: (data, uniform) => data.type === "vec2" && data.size === 1 && !data.isArray && uniform.x !== void 0,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v.x || cv[1] !== v.y)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    gl.uniform2f(ud["${name}"].location, v.x, v.y);
                }`,
      codeUbo: (name) => `
                v = uv.${name};

                data[offset] = v.x;
                data[offset+1] = v.y;
            `
    },
    // caching layer for a vec2
    {
      test: (data) => data.type === "vec2" && data.size === 1 && !data.isArray,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v[0] || cv[1] !== v[1])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    gl.uniform2f(ud["${name}"].location, v[0], v[1]);
                }
            `
    },
    // upload a pixi rectangle as a vec4 with caching layer
    {
      test: (data, uniform) => data.type === "vec4" && data.size === 1 && !data.isArray && uniform.width !== void 0,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    cv[2] = v.width;
                    cv[3] = v.height;
                    gl.uniform4f(ud["${name}"].location, v.x, v.y, v.width, v.height)
                }`,
      codeUbo: (name) => `
                    v = uv.${name};

                    data[offset] = v.x;
                    data[offset+1] = v.y;
                    data[offset+2] = v.width;
                    data[offset+3] = v.height;
                `
    },
    // upload a pixi color as vec4 with caching layer
    {
      test: (data, uniform) => data.type === "vec4" && data.size === 1 && !data.isArray && uniform.red !== void 0,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
                    cv[3] = v.alpha;
                    gl.uniform4f(ud["${name}"].location, v.red, v.green, v.blue, v.alpha)
                }`,
      codeUbo: (name) => `
                    v = uv.${name};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                    data[offset+3] = v.alpha;
                `
    },
    // upload a pixi color as a vec3 with caching layer
    {
      test: (data, uniform) => data.type === "vec3" && data.size === 1 && !data.isArray && uniform.red !== void 0,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.a)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
    
                    gl.uniform3f(ud["${name}"].location, v.red, v.green, v.blue)
                }`,
      codeUbo: (name) => `
                    v = uv.${name};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                `
    },
    // a caching layer for vec4 uploading
    {
      test: (data) => data.type === "vec4" && data.size === 1 && !data.isArray,
      code: (name) => `
                cv = ud["${name}"].value;
                v = uv["${name}"];

                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    cv[2] = v[2];
                    cv[3] = v[3];

                    gl.uniform4f(ud["${name}"].location, v[0], v[1], v[2], v[3])
                }`
    }
  ];

  // node_modules/@pixi/core/lib/shader/utils/generateUniformsSync.mjs
  var GLSL_TO_SINGLE_SETTERS_CACHED = {
    float: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1f(location, v);
    }`,
    vec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2f(location, v[0], v[1])
    }`,
    vec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3f(location, v[0], v[1], v[2])
    }`,
    vec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4f(location, v[0], v[1], v[2], v[3]);
    }`,
    int: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
    ivec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
    ivec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
    ivec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
    uint: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1ui(location, v);
    }`,
    uvec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2ui(location, v[0], v[1]);
    }`,
    uvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3ui(location, v[0], v[1], v[2]);
    }`,
    uvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
    }`,
    bool: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1i(location, v);
    }`,
    bvec2: `
    if (cv[0] != v[0] || cv[1] != v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
    bvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
    bvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
    mat2: "gl.uniformMatrix2fv(location, false, v)",
    mat3: "gl.uniformMatrix3fv(location, false, v)",
    mat4: "gl.uniformMatrix4fv(location, false, v)",
    sampler2D: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
    samplerCube: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
    sampler2DArray: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`
  };
  var GLSL_TO_ARRAY_SETTERS = {
    float: "gl.uniform1fv(location, v)",
    vec2: "gl.uniform2fv(location, v)",
    vec3: "gl.uniform3fv(location, v)",
    vec4: "gl.uniform4fv(location, v)",
    mat4: "gl.uniformMatrix4fv(location, false, v)",
    mat3: "gl.uniformMatrix3fv(location, false, v)",
    mat2: "gl.uniformMatrix2fv(location, false, v)",
    int: "gl.uniform1iv(location, v)",
    ivec2: "gl.uniform2iv(location, v)",
    ivec3: "gl.uniform3iv(location, v)",
    ivec4: "gl.uniform4iv(location, v)",
    uint: "gl.uniform1uiv(location, v)",
    uvec2: "gl.uniform2uiv(location, v)",
    uvec3: "gl.uniform3uiv(location, v)",
    uvec4: "gl.uniform4uiv(location, v)",
    bool: "gl.uniform1iv(location, v)",
    bvec2: "gl.uniform2iv(location, v)",
    bvec3: "gl.uniform3iv(location, v)",
    bvec4: "gl.uniform4iv(location, v)",
    sampler2D: "gl.uniform1iv(location, v)",
    samplerCube: "gl.uniform1iv(location, v)",
    sampler2DArray: "gl.uniform1iv(location, v)"
  };
  function generateUniformsSync(group, uniformData) {
    const funcFragments = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
    `];
    for (const i2 in group.uniforms) {
      const data = uniformData[i2];
      if (!data) {
        group.uniforms[i2]?.group === true && (group.uniforms[i2].ubo ? funcFragments.push(`
                        renderer.shader.syncUniformBufferGroup(uv.${i2}, '${i2}');
                    `) : funcFragments.push(`
                        renderer.shader.syncUniformGroup(uv.${i2}, syncData);
                    `));
        continue;
      }
      const uniform = group.uniforms[i2];
      let parsed = false;
      for (let j2 = 0; j2 < uniformParsers.length; j2++)
        if (uniformParsers[j2].test(data, uniform)) {
          funcFragments.push(uniformParsers[j2].code(i2, uniform)), parsed = true;
          break;
        }
      if (!parsed) {
        const template = (data.size === 1 && !data.isArray ? GLSL_TO_SINGLE_SETTERS_CACHED : GLSL_TO_ARRAY_SETTERS)[data.type].replace("location", `ud["${i2}"].location`);
        funcFragments.push(`
            cu = ud["${i2}"];
            cv = cu.value;
            v = uv["${i2}"];
            ${template};`);
      }
    }
    return new Function("ud", "uv", "renderer", "syncData", funcFragments.join(`
`));
  }

  // node_modules/@pixi/core/lib/shader/utils/getTestContext.mjs
  var unknownContext = {};
  var context = unknownContext;
  function getTestContext() {
    if (context === unknownContext || context?.isContextLost()) {
      const canvas = settings.ADAPTER.createCanvas();
      let gl;
      settings.PREFER_ENV >= ENV.WEBGL2 && (gl = canvas.getContext("webgl2", {})), gl || (gl = canvas.getContext("webgl", {}) || canvas.getContext("experimental-webgl", {}), gl ? gl.getExtension("WEBGL_draw_buffers") : gl = null), context = gl;
    }
    return context;
  }

  // node_modules/@pixi/core/lib/shader/utils/getMaxFragmentPrecision.mjs
  var maxFragmentPrecision;
  function getMaxFragmentPrecision() {
    if (!maxFragmentPrecision) {
      maxFragmentPrecision = PRECISION.MEDIUM;
      const gl = getTestContext();
      if (gl && gl.getShaderPrecisionFormat) {
        const shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        shaderFragment && (maxFragmentPrecision = shaderFragment.precision ? PRECISION.HIGH : PRECISION.MEDIUM);
      }
    }
    return maxFragmentPrecision;
  }

  // node_modules/@pixi/core/lib/shader/utils/logProgramError.mjs
  function logPrettyShaderError(gl, shader) {
    const shaderSrc = gl.getShaderSource(shader).split(`
`).map((line, index) => `${index}: ${line}`), shaderLog = gl.getShaderInfoLog(shader), splitShader = shaderLog.split(`
`), dedupe = {}, lineNumbers = splitShader.map((line) => parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((n3) => n3 && !dedupe[n3] ? (dedupe[n3] = true, true) : false), logArgs = [""];
    lineNumbers.forEach((number) => {
      shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`, logArgs.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
    });
    const fragmentSourceToLog = shaderSrc.join(`
`);
    logArgs[0] = fragmentSourceToLog, console.error(shaderLog), console.groupCollapsed("click to view full shader code"), console.warn(...logArgs), console.groupEnd();
  }
  function logProgramError(gl, program, vertexShader, fragmentShader) {
    gl.getProgramParameter(program, gl.LINK_STATUS) || (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) || logPrettyShaderError(gl, vertexShader), gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) || logPrettyShaderError(gl, fragmentShader), console.error("PixiJS Error: Could not initialize shader."), gl.getProgramInfoLog(program) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(program)));
  }

  // node_modules/@pixi/core/lib/shader/utils/mapSize.mjs
  var GLSL_TO_SIZE = {
    float: 1,
    vec2: 2,
    vec3: 3,
    vec4: 4,
    int: 1,
    ivec2: 2,
    ivec3: 3,
    ivec4: 4,
    uint: 1,
    uvec2: 2,
    uvec3: 3,
    uvec4: 4,
    bool: 1,
    bvec2: 2,
    bvec3: 3,
    bvec4: 4,
    mat2: 4,
    mat3: 9,
    mat4: 16,
    sampler2D: 1
  };
  function mapSize(type) {
    return GLSL_TO_SIZE[type];
  }

  // node_modules/@pixi/core/lib/shader/utils/mapType.mjs
  var GL_TABLE = null;
  var GL_TO_GLSL_TYPES = {
    FLOAT: "float",
    FLOAT_VEC2: "vec2",
    FLOAT_VEC3: "vec3",
    FLOAT_VEC4: "vec4",
    INT: "int",
    INT_VEC2: "ivec2",
    INT_VEC3: "ivec3",
    INT_VEC4: "ivec4",
    UNSIGNED_INT: "uint",
    UNSIGNED_INT_VEC2: "uvec2",
    UNSIGNED_INT_VEC3: "uvec3",
    UNSIGNED_INT_VEC4: "uvec4",
    BOOL: "bool",
    BOOL_VEC2: "bvec2",
    BOOL_VEC3: "bvec3",
    BOOL_VEC4: "bvec4",
    FLOAT_MAT2: "mat2",
    FLOAT_MAT3: "mat3",
    FLOAT_MAT4: "mat4",
    SAMPLER_2D: "sampler2D",
    INT_SAMPLER_2D: "sampler2D",
    UNSIGNED_INT_SAMPLER_2D: "sampler2D",
    SAMPLER_CUBE: "samplerCube",
    INT_SAMPLER_CUBE: "samplerCube",
    UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
    SAMPLER_2D_ARRAY: "sampler2DArray",
    INT_SAMPLER_2D_ARRAY: "sampler2DArray",
    UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
  };
  function mapType(gl, type) {
    if (!GL_TABLE) {
      const typeNames = Object.keys(GL_TO_GLSL_TYPES);
      GL_TABLE = {};
      for (let i2 = 0; i2 < typeNames.length; ++i2) {
        const tn = typeNames[i2];
        GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
      }
    }
    return GL_TABLE[type];
  }

  // node_modules/@pixi/core/lib/shader/utils/setPrecision.mjs
  function setPrecision(src, requestedPrecision, maxSupportedPrecision) {
    if (src.substring(0, 9) !== "precision") {
      let precision = requestedPrecision;
      return requestedPrecision === PRECISION.HIGH && maxSupportedPrecision !== PRECISION.HIGH && (precision = PRECISION.MEDIUM), `precision ${precision} float;
${src}`;
    } else if (maxSupportedPrecision !== PRECISION.HIGH && src.substring(0, 15) === "precision highp")
      return src.replace("precision highp", "precision mediump");
    return src;
  }

  // node_modules/@pixi/core/lib/shader/utils/unsafeEvalSupported.mjs
  var unsafeEval;
  function unsafeEvalSupported() {
    if (typeof unsafeEval == "boolean")
      return unsafeEval;
    try {
      unsafeEval = new Function("param1", "param2", "param3", "return param1[param2] === param3;")({ a: "b" }, "a", "b") === true;
    } catch {
      unsafeEval = false;
    }
    return unsafeEval;
  }

  // node_modules/@pixi/core/lib/shader/Program.mjs
  var UID3 = 0;
  var nameCache = {};
  var _Program = class _Program2 {
    /**
     * @param vertexSrc - The source of the vertex shader.
     * @param fragmentSrc - The source of the fragment shader.
     * @param name - Name for shader
     * @param extra - Extra data for shader
     */
    constructor(vertexSrc, fragmentSrc, name = "pixi-shader", extra = {}) {
      this.extra = {}, this.id = UID3++, this.vertexSrc = vertexSrc || _Program2.defaultVertexSrc, this.fragmentSrc = fragmentSrc || _Program2.defaultFragmentSrc, this.vertexSrc = this.vertexSrc.trim(), this.fragmentSrc = this.fragmentSrc.trim(), this.extra = extra, this.vertexSrc.substring(0, 8) !== "#version" && (name = name.replace(/\s+/g, "-"), nameCache[name] ? (nameCache[name]++, name += `-${nameCache[name]}`) : nameCache[name] = 1, this.vertexSrc = `#define SHADER_NAME ${name}
${this.vertexSrc}`, this.fragmentSrc = `#define SHADER_NAME ${name}
${this.fragmentSrc}`, this.vertexSrc = setPrecision(
        this.vertexSrc,
        _Program2.defaultVertexPrecision,
        PRECISION.HIGH
      ), this.fragmentSrc = setPrecision(
        this.fragmentSrc,
        _Program2.defaultFragmentPrecision,
        getMaxFragmentPrecision()
      )), this.glPrograms = {}, this.syncUniforms = null;
    }
    /**
     * The default vertex shader source.
     * @readonly
     */
    static get defaultVertexSrc() {
      return defaultVertex;
    }
    /**
     * The default fragment shader source.
     * @readonly
     */
    static get defaultFragmentSrc() {
      return defaultFragment;
    }
    /**
     * A short hand function to create a program based of a vertex and fragment shader.
     *
     * This method will also check to see if there is a cached program.
     * @param vertexSrc - The source of the vertex shader.
     * @param fragmentSrc - The source of the fragment shader.
     * @param name - Name for shader
     * @returns A shiny new PixiJS shader program!
     */
    static from(vertexSrc, fragmentSrc, name) {
      const key = vertexSrc + fragmentSrc;
      let program = ProgramCache[key];
      return program || (ProgramCache[key] = program = new _Program2(vertexSrc, fragmentSrc, name)), program;
    }
  };
  _Program.defaultVertexPrecision = PRECISION.HIGH, /**
  * Default specify float precision in fragment shader.
  * iOS is best set at highp due to https://github.com/pixijs/pixijs/issues/3742
  * @static
  * @type {PIXI.PRECISION}
  * @default PIXI.PRECISION.MEDIUM
  */
  _Program.defaultFragmentPrecision = isMobile2.apple.device ? PRECISION.HIGH : PRECISION.MEDIUM;
  var Program = _Program;

  // node_modules/@pixi/core/lib/shader/UniformGroup.mjs
  var UID4 = 0;
  var UniformGroup = class _UniformGroup {
    /**
     * @param {object | Buffer} [uniforms] - Custom uniforms to use to augment the built-in ones. Or a pixi buffer.
     * @param isStatic - Uniforms wont be changed after creation.
     * @param isUbo - If true, will treat this uniform group as a uniform buffer object.
     */
    constructor(uniforms, isStatic, isUbo) {
      this.group = true, this.syncUniforms = {}, this.dirtyId = 0, this.id = UID4++, this.static = !!isStatic, this.ubo = !!isUbo, uniforms instanceof Buffer2 ? (this.buffer = uniforms, this.buffer.type = BUFFER_TYPE.UNIFORM_BUFFER, this.autoManage = false, this.ubo = true) : (this.uniforms = uniforms, this.ubo && (this.buffer = new Buffer2(new Float32Array(1)), this.buffer.type = BUFFER_TYPE.UNIFORM_BUFFER, this.autoManage = true));
    }
    update() {
      this.dirtyId++, !this.autoManage && this.buffer && this.buffer.update();
    }
    add(name, uniforms, _static) {
      if (!this.ubo)
        this.uniforms[name] = new _UniformGroup(uniforms, _static);
      else
        throw new Error("[UniformGroup] uniform groups in ubo mode cannot be modified, or have uniform groups nested in them");
    }
    static from(uniforms, _static, _ubo) {
      return new _UniformGroup(uniforms, _static, _ubo);
    }
    /**
     * A short hand function for creating a static UBO UniformGroup.
     * @param uniforms - the ubo item
     * @param _static - should this be updated each time it is used? defaults to true here!
     */
    static uboFrom(uniforms, _static) {
      return new _UniformGroup(uniforms, _static ?? true, true);
    }
  };

  // node_modules/@pixi/core/lib/shader/Shader.mjs
  var Shader = class _Shader {
    /**
     * @param program - The program the shader will use.
     * @param uniforms - Custom uniforms to use to augment the built-in ones.
     */
    constructor(program, uniforms) {
      this.uniformBindCount = 0, this.program = program, uniforms ? uniforms instanceof UniformGroup ? this.uniformGroup = uniforms : this.uniformGroup = new UniformGroup(uniforms) : this.uniformGroup = new UniformGroup({}), this.disposeRunner = new Runner("disposeShader");
    }
    // TODO move to shader system..
    checkUniformExists(name, group) {
      if (group.uniforms[name])
        return true;
      for (const i2 in group.uniforms) {
        const uniform = group.uniforms[i2];
        if (uniform.group === true && this.checkUniformExists(name, uniform))
          return true;
      }
      return false;
    }
    destroy() {
      this.uniformGroup = null, this.disposeRunner.emit(this), this.disposeRunner.destroy();
    }
    /**
     * Shader uniform values, shortcut for `uniformGroup.uniforms`.
     * @readonly
     */
    get uniforms() {
      return this.uniformGroup.uniforms;
    }
    /**
     * A short hand function to create a shader based of a vertex and fragment shader.
     * @param vertexSrc - The source of the vertex shader.
     * @param fragmentSrc - The source of the fragment shader.
     * @param uniforms - Custom uniforms to use to augment the built-in ones.
     * @returns A shiny new PixiJS shader!
     */
    static from(vertexSrc, fragmentSrc, uniforms) {
      const program = Program.from(vertexSrc, fragmentSrc);
      return new _Shader(program, uniforms);
    }
  };

  // node_modules/@pixi/core/lib/batch/BatchShaderGenerator.mjs
  var BatchShaderGenerator = class {
    /**
     * @param vertexSrc - Vertex shader
     * @param fragTemplate - Fragment shader template
     */
    constructor(vertexSrc, fragTemplate3) {
      if (this.vertexSrc = vertexSrc, this.fragTemplate = fragTemplate3, this.programCache = {}, this.defaultGroupCache = {}, !fragTemplate3.includes("%count%"))
        throw new Error('Fragment template must contain "%count%".');
      if (!fragTemplate3.includes("%forloop%"))
        throw new Error('Fragment template must contain "%forloop%".');
    }
    generateShader(maxTextures) {
      if (!this.programCache[maxTextures]) {
        const sampleValues = new Int32Array(maxTextures);
        for (let i2 = 0; i2 < maxTextures; i2++)
          sampleValues[i2] = i2;
        this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);
        let fragmentSrc = this.fragTemplate;
        fragmentSrc = fragmentSrc.replace(/%count%/gi, `${maxTextures}`), fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures)), this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
      }
      const uniforms = {
        tint: new Float32Array([1, 1, 1, 1]),
        translationMatrix: new Matrix(),
        default: this.defaultGroupCache[maxTextures]
      };
      return new Shader(this.programCache[maxTextures], uniforms);
    }
    generateSampleSrc(maxTextures) {
      let src = "";
      src += `
`, src += `
`;
      for (let i2 = 0; i2 < maxTextures; i2++)
        i2 > 0 && (src += `
else `), i2 < maxTextures - 1 && (src += `if(vTextureId < ${i2}.5)`), src += `
{`, src += `
	color = texture2D(uSamplers[${i2}], vTextureCoord);`, src += `
}`;
      return src += `
`, src += `
`, src;
    }
  };

  // node_modules/@pixi/core/lib/batch/BatchTextureArray.mjs
  var BatchTextureArray = class {
    constructor() {
      this.elements = [], this.ids = [], this.count = 0;
    }
    clear() {
      for (let i2 = 0; i2 < this.count; i2++)
        this.elements[i2] = null;
      this.count = 0;
    }
  };

  // node_modules/@pixi/core/lib/batch/canUploadSameBuffer.mjs
  function canUploadSameBuffer() {
    return !isMobile2.apple.device;
  }

  // node_modules/@pixi/core/lib/batch/maxRecommendedTextures.mjs
  function maxRecommendedTextures(max) {
    let allowMax = true;
    const navigator2 = settings.ADAPTER.getNavigator();
    if (isMobile2.tablet || isMobile2.phone) {
      if (isMobile2.apple.device) {
        const match = navigator2.userAgent.match(/OS (\d+)_(\d+)?/);
        match && parseInt(match[1], 10) < 11 && (allowMax = false);
      }
      if (isMobile2.android.device) {
        const match = navigator2.userAgent.match(/Android\s([0-9.]*)/);
        match && parseInt(match[1], 10) < 7 && (allowMax = false);
      }
    }
    return allowMax ? max : 4;
  }

  // node_modules/@pixi/core/lib/batch/ObjectRenderer.mjs
  var ObjectRenderer = class {
    /**
     * @param renderer - The renderer this manager works for.
     */
    constructor(renderer) {
      this.renderer = renderer;
    }
    /** Stub method that should be used to empty the current batch by rendering objects now. */
    flush() {
    }
    /** Generic destruction method that frees all resources. This should be called by subclasses. */
    destroy() {
      this.renderer = null;
    }
    /**
     * Stub method that initializes any state required before
     * rendering starts. It is different from the `prerender`
     * signal, which occurs every frame, in that it is called
     * whenever an object requests _this_ renderer specifically.
     */
    start() {
    }
    /** Stops the renderer. It should free up any state and become dormant. */
    stop() {
      this.flush();
    }
    /**
     * Keeps the object to render. It doesn't have to be
     * rendered immediately.
     * @param {PIXI.DisplayObject} _object - The object to render.
     */
    render(_object) {
    }
  };

  // node_modules/@pixi/core/lib/batch/texture.frag.mjs
  var defaultFragment2 = `varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
    vec4 color;
    %forloop%
    gl_FragColor = color * vColor;
}
`;

  // node_modules/@pixi/core/lib/batch/texture.vert.mjs
  var defaultVertex2 = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor * tint;
}
`;

  // node_modules/@pixi/core/lib/batch/BatchRenderer.mjs
  var _BatchRenderer = class _BatchRenderer2 extends ObjectRenderer {
    /**
     * This will hook onto the renderer's `contextChange`
     * and `prerender` signals.
     * @param {PIXI.Renderer} renderer - The renderer this works for.
     */
    constructor(renderer) {
      super(renderer), this.setShaderGenerator(), this.geometryClass = BatchGeometry, this.vertexSize = 6, this.state = State.for2d(), this.size = _BatchRenderer2.defaultBatchSize * 4, this._vertexCount = 0, this._indexCount = 0, this._bufferedElements = [], this._bufferedTextures = [], this._bufferSize = 0, this._shader = null, this._packedGeometries = [], this._packedGeometryPoolSize = 2, this._flushId = 0, this._aBuffers = {}, this._iBuffers = {}, this.maxTextures = 1, this.renderer.on("prerender", this.onPrerender, this), renderer.runners.contextChange.add(this), this._dcIndex = 0, this._aIndex = 0, this._iIndex = 0, this._attributeBuffer = null, this._indexBuffer = null, this._tempBoundTextures = [];
    }
    /**
     * The maximum textures that this device supports.
     * @static
     * @default 32
     */
    static get defaultMaxTextures() {
      return this._defaultMaxTextures = this._defaultMaxTextures ?? maxRecommendedTextures(32), this._defaultMaxTextures;
    }
    static set defaultMaxTextures(value) {
      this._defaultMaxTextures = value;
    }
    /**
     * Can we upload the same buffer in a single frame?
     * @static
     */
    static get canUploadSameBuffer() {
      return this._canUploadSameBuffer = this._canUploadSameBuffer ?? canUploadSameBuffer(), this._canUploadSameBuffer;
    }
    static set canUploadSameBuffer(value) {
      this._canUploadSameBuffer = value;
    }
    /**
     * @see PIXI.BatchRenderer#maxTextures
     * @deprecated since 7.1.0
     * @readonly
     */
    get MAX_TEXTURES() {
      return deprecation("7.1.0", "BatchRenderer#MAX_TEXTURES renamed to BatchRenderer#maxTextures"), this.maxTextures;
    }
    /**
     * The default vertex shader source
     * @readonly
     */
    static get defaultVertexSrc() {
      return defaultVertex2;
    }
    /**
     * The default fragment shader source
     * @readonly
     */
    static get defaultFragmentTemplate() {
      return defaultFragment2;
    }
    /**
     * Set the shader generator.
     * @param {object} [options]
     * @param {string} [options.vertex=PIXI.BatchRenderer.defaultVertexSrc] - Vertex shader source
     * @param {string} [options.fragment=PIXI.BatchRenderer.defaultFragmentTemplate] - Fragment shader template
     */
    setShaderGenerator({
      vertex: vertex2 = _BatchRenderer2.defaultVertexSrc,
      fragment: fragment3 = _BatchRenderer2.defaultFragmentTemplate
    } = {}) {
      this.shaderGenerator = new BatchShaderGenerator(vertex2, fragment3);
    }
    /**
     * Handles the `contextChange` signal.
     *
     * It calculates `this.maxTextures` and allocating the packed-geometry object pool.
     */
    contextChange() {
      const gl = this.renderer.gl;
      settings.PREFER_ENV === ENV.WEBGL_LEGACY ? this.maxTextures = 1 : (this.maxTextures = Math.min(
        gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        _BatchRenderer2.defaultMaxTextures
      ), this.maxTextures = checkMaxIfStatementsInShader(
        this.maxTextures,
        gl
      )), this._shader = this.shaderGenerator.generateShader(this.maxTextures);
      for (let i2 = 0; i2 < this._packedGeometryPoolSize; i2++)
        this._packedGeometries[i2] = new this.geometryClass();
      this.initFlushBuffers();
    }
    /** Makes sure that static and dynamic flush pooled objects have correct dimensions. */
    initFlushBuffers() {
      const {
        _drawCallPool,
        _textureArrayPool
      } = _BatchRenderer2, MAX_SPRITES = this.size / 4, MAX_TA = Math.floor(MAX_SPRITES / this.maxTextures) + 1;
      for (; _drawCallPool.length < MAX_SPRITES; )
        _drawCallPool.push(new BatchDrawCall());
      for (; _textureArrayPool.length < MAX_TA; )
        _textureArrayPool.push(new BatchTextureArray());
      for (let i2 = 0; i2 < this.maxTextures; i2++)
        this._tempBoundTextures[i2] = null;
    }
    /** Handles the `prerender` signal. It ensures that flushes start from the first geometry object again. */
    onPrerender() {
      this._flushId = 0;
    }
    /**
     * Buffers the "batchable" object. It need not be rendered immediately.
     * @param {PIXI.DisplayObject} element - the element to render when
     *    using this renderer
     */
    render(element) {
      element._texture.valid && (this._vertexCount + element.vertexData.length / 2 > this.size && this.flush(), this._vertexCount += element.vertexData.length / 2, this._indexCount += element.indices.length, this._bufferedTextures[this._bufferSize] = element._texture.baseTexture, this._bufferedElements[this._bufferSize++] = element);
    }
    buildTexturesAndDrawCalls() {
      const {
        _bufferedTextures: textures,
        maxTextures
      } = this, textureArrays = _BatchRenderer2._textureArrayPool, batch = this.renderer.batch, boundTextures = this._tempBoundTextures, touch = this.renderer.textureGC.count;
      let TICK = ++BaseTexture._globalBatch, countTexArrays = 0, texArray = textureArrays[0], start = 0;
      batch.copyBoundTextures(boundTextures, maxTextures);
      for (let i2 = 0; i2 < this._bufferSize; ++i2) {
        const tex = textures[i2];
        textures[i2] = null, tex._batchEnabled !== TICK && (texArray.count >= maxTextures && (batch.boundArray(texArray, boundTextures, TICK, maxTextures), this.buildDrawCalls(texArray, start, i2), start = i2, texArray = textureArrays[++countTexArrays], ++TICK), tex._batchEnabled = TICK, tex.touched = touch, texArray.elements[texArray.count++] = tex);
      }
      texArray.count > 0 && (batch.boundArray(texArray, boundTextures, TICK, maxTextures), this.buildDrawCalls(texArray, start, this._bufferSize), ++countTexArrays, ++TICK);
      for (let i2 = 0; i2 < boundTextures.length; i2++)
        boundTextures[i2] = null;
      BaseTexture._globalBatch = TICK;
    }
    /**
     * Populating drawcalls for rendering
     * @param texArray
     * @param start
     * @param finish
     */
    buildDrawCalls(texArray, start, finish) {
      const {
        _bufferedElements: elements,
        _attributeBuffer,
        _indexBuffer,
        vertexSize
      } = this, drawCalls = _BatchRenderer2._drawCallPool;
      let dcIndex = this._dcIndex, aIndex = this._aIndex, iIndex = this._iIndex, drawCall = drawCalls[dcIndex];
      drawCall.start = this._iIndex, drawCall.texArray = texArray;
      for (let i2 = start; i2 < finish; ++i2) {
        const sprite = elements[i2], tex = sprite._texture.baseTexture, spriteBlendMode = premultiplyBlendMode[tex.alphaMode ? 1 : 0][sprite.blendMode];
        elements[i2] = null, start < i2 && drawCall.blend !== spriteBlendMode && (drawCall.size = iIndex - drawCall.start, start = i2, drawCall = drawCalls[++dcIndex], drawCall.texArray = texArray, drawCall.start = iIndex), this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex), aIndex += sprite.vertexData.length / 2 * vertexSize, iIndex += sprite.indices.length, drawCall.blend = spriteBlendMode;
      }
      start < finish && (drawCall.size = iIndex - drawCall.start, ++dcIndex), this._dcIndex = dcIndex, this._aIndex = aIndex, this._iIndex = iIndex;
    }
    /**
     * Bind textures for current rendering
     * @param texArray
     */
    bindAndClearTexArray(texArray) {
      const textureSystem = this.renderer.texture;
      for (let j2 = 0; j2 < texArray.count; j2++)
        textureSystem.bind(texArray.elements[j2], texArray.ids[j2]), texArray.elements[j2] = null;
      texArray.count = 0;
    }
    updateGeometry() {
      const {
        _packedGeometries: packedGeometries,
        _attributeBuffer: attributeBuffer,
        _indexBuffer: indexBuffer
      } = this;
      _BatchRenderer2.canUploadSameBuffer ? (packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData), packedGeometries[this._flushId]._indexBuffer.update(indexBuffer), this.renderer.geometry.updateBuffers()) : (this._packedGeometryPoolSize <= this._flushId && (this._packedGeometryPoolSize++, packedGeometries[this._flushId] = new this.geometryClass()), packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData), packedGeometries[this._flushId]._indexBuffer.update(indexBuffer), this.renderer.geometry.bind(packedGeometries[this._flushId]), this.renderer.geometry.updateBuffers(), this._flushId++);
    }
    drawBatches() {
      const dcCount = this._dcIndex, { gl, state: stateSystem } = this.renderer, drawCalls = _BatchRenderer2._drawCallPool;
      let curTexArray = null;
      for (let i2 = 0; i2 < dcCount; i2++) {
        const { texArray, type, size, start, blend } = drawCalls[i2];
        curTexArray !== texArray && (curTexArray = texArray, this.bindAndClearTexArray(texArray)), this.state.blendMode = blend, stateSystem.set(this.state), gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
      }
    }
    /** Renders the content _now_ and empties the current batch. */
    flush() {
      this._vertexCount !== 0 && (this._attributeBuffer = this.getAttributeBuffer(this._vertexCount), this._indexBuffer = this.getIndexBuffer(this._indexCount), this._aIndex = 0, this._iIndex = 0, this._dcIndex = 0, this.buildTexturesAndDrawCalls(), this.updateGeometry(), this.drawBatches(), this._bufferSize = 0, this._vertexCount = 0, this._indexCount = 0);
    }
    /** Starts a new sprite batch. */
    start() {
      this.renderer.state.set(this.state), this.renderer.texture.ensureSamplerType(this.maxTextures), this.renderer.shader.bind(this._shader), _BatchRenderer2.canUploadSameBuffer && this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
    }
    /** Stops and flushes the current batch. */
    stop() {
      this.flush();
    }
    /** Destroys this `BatchRenderer`. It cannot be used again. */
    destroy() {
      for (let i2 = 0; i2 < this._packedGeometryPoolSize; i2++)
        this._packedGeometries[i2] && this._packedGeometries[i2].destroy();
      this.renderer.off("prerender", this.onPrerender, this), this._aBuffers = null, this._iBuffers = null, this._packedGeometries = null, this._attributeBuffer = null, this._indexBuffer = null, this._shader && (this._shader.destroy(), this._shader = null), super.destroy();
    }
    /**
     * Fetches an attribute buffer from `this._aBuffers` that can hold atleast `size` floats.
     * @param size - minimum capacity required
     * @returns - buffer than can hold atleast `size` floats
     */
    getAttributeBuffer(size) {
      const roundedP2 = nextPow2(Math.ceil(size / 8)), roundedSizeIndex = log2(roundedP2), roundedSize = roundedP2 * 8;
      this._aBuffers.length <= roundedSizeIndex && (this._iBuffers.length = roundedSizeIndex + 1);
      let buffer = this._aBuffers[roundedSize];
      return buffer || (this._aBuffers[roundedSize] = buffer = new ViewableBuffer(roundedSize * this.vertexSize * 4)), buffer;
    }
    /**
     * Fetches an index buffer from `this._iBuffers` that can
     * have at least `size` capacity.
     * @param size - minimum required capacity
     * @returns - buffer that can fit `size` indices.
     */
    getIndexBuffer(size) {
      const roundedP2 = nextPow2(Math.ceil(size / 12)), roundedSizeIndex = log2(roundedP2), roundedSize = roundedP2 * 12;
      this._iBuffers.length <= roundedSizeIndex && (this._iBuffers.length = roundedSizeIndex + 1);
      let buffer = this._iBuffers[roundedSizeIndex];
      return buffer || (this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize)), buffer;
    }
    /**
     * Takes the four batching parameters of `element`, interleaves
     * and pushes them into the batching attribute/index buffers given.
     *
     * It uses these properties: `vertexData` `uvs`, `textureId` and
     * `indicies`. It also uses the "tint" of the base-texture, if
     * present.
     * @param {PIXI.DisplayObject} element - element being rendered
     * @param attributeBuffer - attribute buffer.
     * @param indexBuffer - index buffer
     * @param aIndex - number of floats already in the attribute buffer
     * @param iIndex - number of indices already in `indexBuffer`
     */
    packInterleavedGeometry(element, attributeBuffer, indexBuffer, aIndex, iIndex) {
      const {
        uint32View,
        float32View
      } = attributeBuffer, packedVertices = aIndex / this.vertexSize, uvs = element.uvs, indicies = element.indices, vertexData = element.vertexData, textureId = element._texture.baseTexture._batchLocation, alpha = Math.min(element.worldAlpha, 1), argb = Color.shared.setValue(element._tintRGB).toPremultiplied(alpha, element._texture.baseTexture.alphaMode > 0);
      for (let i2 = 0; i2 < vertexData.length; i2 += 2)
        float32View[aIndex++] = vertexData[i2], float32View[aIndex++] = vertexData[i2 + 1], float32View[aIndex++] = uvs[i2], float32View[aIndex++] = uvs[i2 + 1], uint32View[aIndex++] = argb, float32View[aIndex++] = textureId;
      for (let i2 = 0; i2 < indicies.length; i2++)
        indexBuffer[iIndex++] = packedVertices + indicies[i2];
    }
  };
  _BatchRenderer.defaultBatchSize = 4096, /** @ignore */
  _BatchRenderer.extension = {
    name: "batch",
    type: ExtensionType.RendererPlugin
  }, /**
  * Pool of `BatchDrawCall` objects that `flush` used
  * to create "batches" of the objects being rendered.
  *
  * These are never re-allocated again.
  * Shared between all batch renderers because it can be only one "flush" working at the moment.
  * @member {PIXI.BatchDrawCall[]}
  */
  _BatchRenderer._drawCallPool = [], /**
  * Pool of `BatchDrawCall` objects that `flush` used
  * to create "batches" of the objects being rendered.
  *
  * These are never re-allocated again.
  * Shared between all batch renderers because it can be only one "flush" working at the moment.
  * @member {PIXI.BatchTextureArray[]}
  */
  _BatchRenderer._textureArrayPool = [];
  var BatchRenderer = _BatchRenderer;
  extensions.add(BatchRenderer);

  // node_modules/@pixi/core/lib/filters/defaultFilter.frag.mjs
  var defaultFragment3 = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;

  // node_modules/@pixi/core/lib/filters/defaultFilter.vert.mjs
  var defaultVertex3 = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

  // node_modules/@pixi/core/lib/filters/Filter.mjs
  var _Filter = class _Filter2 extends Shader {
    /**
     * @param vertexSrc - The source of the vertex shader.
     * @param fragmentSrc - The source of the fragment shader.
     * @param uniforms - Custom uniforms to use to augment the built-in ones.
     */
    constructor(vertexSrc, fragmentSrc, uniforms) {
      const program = Program.from(
        vertexSrc || _Filter2.defaultVertexSrc,
        fragmentSrc || _Filter2.defaultFragmentSrc
      );
      super(program, uniforms), this.padding = 0, this.resolution = _Filter2.defaultResolution, this.multisample = _Filter2.defaultMultisample, this.enabled = true, this.autoFit = true, this.state = new State();
    }
    /**
     * Applies the filter
     * @param {PIXI.FilterSystem} filterManager - The renderer to retrieve the filter from
     * @param {PIXI.RenderTexture} input - The input render target.
     * @param {PIXI.RenderTexture} output - The target to output to.
     * @param {PIXI.CLEAR_MODES} [clearMode] - Should the output be cleared before rendering to it.
     * @param {object} [_currentState] - It's current state of filter.
     *        There are some useful properties in the currentState :
     *        target, filters, sourceFrame, destinationFrame, renderTarget, resolution
     */
    apply(filterManager, input, output, clearMode, _currentState) {
      filterManager.applyFilter(this, input, output, clearMode);
    }
    /**
     * Sets the blend mode of the filter.
     * @default PIXI.BLEND_MODES.NORMAL
     */
    get blendMode() {
      return this.state.blendMode;
    }
    set blendMode(value) {
      this.state.blendMode = value;
    }
    /**
     * The resolution of the filter. Setting this to be lower will lower the quality but
     * increase the performance of the filter.
     * If set to `null` or `0`, the resolution of the current render target is used.
     * @default PIXI.Filter.defaultResolution
     */
    get resolution() {
      return this._resolution;
    }
    set resolution(value) {
      this._resolution = value;
    }
    /**
     * The default vertex shader source
     * @readonly
     */
    static get defaultVertexSrc() {
      return defaultVertex3;
    }
    /**
     * The default fragment shader source
     * @readonly
     */
    static get defaultFragmentSrc() {
      return defaultFragment3;
    }
  };
  _Filter.defaultResolution = 1, /**
  * Default filter samples for any filter.
  * @static
  * @type {PIXI.MSAA_QUALITY|null}
  * @default PIXI.MSAA_QUALITY.NONE
  */
  _Filter.defaultMultisample = MSAA_QUALITY.NONE;
  var Filter = _Filter;

  // node_modules/@pixi/core/lib/background/BackgroundSystem.mjs
  var BackgroundSystem = class {
    constructor() {
      this.clearBeforeRender = true, this._backgroundColor = new Color(0), this.alpha = 1;
    }
    /**
     * initiates the background system
     * @param {PIXI.IRendererOptions} options - the options for the background colors
     */
    init(options) {
      this.clearBeforeRender = options.clearBeforeRender;
      const { backgroundColor, background, backgroundAlpha } = options, color = background ?? backgroundColor;
      color !== void 0 && (this.color = color), this.alpha = backgroundAlpha;
    }
    /**
     * The background color to fill if not transparent.
     * @member {PIXI.ColorSource}
     */
    get color() {
      return this._backgroundColor.value;
    }
    set color(value) {
      this._backgroundColor.setValue(value);
    }
    /**
     * The background color alpha. Setting this to 0 will make the canvas transparent.
     * @member {number}
     */
    get alpha() {
      return this._backgroundColor.alpha;
    }
    set alpha(value) {
      this._backgroundColor.setAlpha(value);
    }
    /** The background color object. */
    get backgroundColor() {
      return this._backgroundColor;
    }
    destroy() {
    }
  };
  BackgroundSystem.defaultOptions = {
    /**
     * {@link PIXI.IRendererOptions.backgroundAlpha}
     * @default 1
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    backgroundAlpha: 1,
    /**
     * {@link PIXI.IRendererOptions.backgroundColor}
     * @default 0x000000
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    backgroundColor: 0,
    /**
     * {@link PIXI.IRendererOptions.clearBeforeRender}
     * @default true
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    clearBeforeRender: true
  }, /** @ignore */
  BackgroundSystem.extension = {
    type: [
      ExtensionType.RendererSystem,
      ExtensionType.CanvasRendererSystem
    ],
    name: "background"
  };
  extensions.add(BackgroundSystem);

  // node_modules/@pixi/core/lib/batch/BatchSystem.mjs
  var BatchSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.emptyRenderer = new ObjectRenderer(renderer), this.currentRenderer = this.emptyRenderer;
    }
    /**
     * Changes the current renderer to the one given in parameter
     * @param objectRenderer - The object renderer to use.
     */
    setObjectRenderer(objectRenderer) {
      this.currentRenderer !== objectRenderer && (this.currentRenderer.stop(), this.currentRenderer = objectRenderer, this.currentRenderer.start());
    }
    /**
     * This should be called if you wish to do some custom rendering
     * It will basically render anything that may be batched up such as sprites
     */
    flush() {
      this.setObjectRenderer(this.emptyRenderer);
    }
    /** Reset the system to an empty renderer */
    reset() {
      this.setObjectRenderer(this.emptyRenderer);
    }
    /**
     * Handy function for batch renderers: copies bound textures in first maxTextures locations to array
     * sets actual _batchLocation for them
     * @param arr - arr copy destination
     * @param maxTextures - number of copied elements
     */
    copyBoundTextures(arr, maxTextures) {
      const { boundTextures } = this.renderer.texture;
      for (let i2 = maxTextures - 1; i2 >= 0; --i2)
        arr[i2] = boundTextures[i2] || null, arr[i2] && (arr[i2]._batchLocation = i2);
    }
    /**
     * Assigns batch locations to textures in array based on boundTextures state.
     * All textures in texArray should have `_batchEnabled = _batchId`,
     * and their count should be less than `maxTextures`.
     * @param texArray - textures to bound
     * @param boundTextures - current state of bound textures
     * @param batchId - marker for _batchEnabled param of textures in texArray
     * @param maxTextures - number of texture locations to manipulate
     */
    boundArray(texArray, boundTextures, batchId, maxTextures) {
      const { elements, ids, count } = texArray;
      let j2 = 0;
      for (let i2 = 0; i2 < count; i2++) {
        const tex = elements[i2], loc = tex._batchLocation;
        if (loc >= 0 && loc < maxTextures && boundTextures[loc] === tex) {
          ids[i2] = loc;
          continue;
        }
        for (; j2 < maxTextures; ) {
          const bound = boundTextures[j2];
          if (bound && bound._batchEnabled === batchId && bound._batchLocation === j2) {
            j2++;
            continue;
          }
          ids[i2] = j2, tex._batchLocation = j2, boundTextures[j2] = tex;
          break;
        }
      }
    }
    /**
     * @ignore
     */
    destroy() {
      this.renderer = null;
    }
  };
  BatchSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "batch"
  };
  extensions.add(BatchSystem);

  // node_modules/@pixi/core/lib/context/ContextSystem.mjs
  var CONTEXT_UID_COUNTER = 0;
  var ContextSystem = class {
    /** @param renderer - The renderer this System works for. */
    constructor(renderer) {
      this.renderer = renderer, this.webGLVersion = 1, this.extensions = {}, this.supports = {
        uint32Indices: false
      }, this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this);
    }
    /**
     * `true` if the context is lost
     * @readonly
     */
    get isLost() {
      return !this.gl || this.gl.isContextLost();
    }
    /**
     * Handles the context change event.
     * @param {WebGLRenderingContext} gl - New WebGL context.
     */
    contextChange(gl) {
      this.gl = gl, this.renderer.gl = gl, this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
    }
    init(options) {
      if (options.context)
        this.initFromContext(options.context);
      else {
        const alpha = this.renderer.background.alpha < 1, premultipliedAlpha = options.premultipliedAlpha;
        this.preserveDrawingBuffer = options.preserveDrawingBuffer, this.useContextAlpha = options.useContextAlpha, this.powerPreference = options.powerPreference, this.initFromOptions({
          alpha,
          premultipliedAlpha,
          antialias: options.antialias,
          stencil: true,
          preserveDrawingBuffer: options.preserveDrawingBuffer,
          powerPreference: options.powerPreference
        });
      }
    }
    /**
     * Initializes the context.
     * @protected
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    initFromContext(gl) {
      this.gl = gl, this.validateContext(gl), this.renderer.gl = gl, this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++, this.renderer.runners.contextChange.emit(gl);
      const view = this.renderer.view;
      view.addEventListener !== void 0 && (view.addEventListener("webglcontextlost", this.handleContextLost, false), view.addEventListener("webglcontextrestored", this.handleContextRestored, false));
    }
    /**
     * Initialize from context options
     * @protected
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
     * @param {object} options - context attributes
     */
    initFromOptions(options) {
      const gl = this.createContext(this.renderer.view, options);
      this.initFromContext(gl);
    }
    /**
     * Helper class to create a WebGL Context
     * @param canvas - the canvas element that we will get the context from
     * @param options - An options object that gets passed in to the canvas element containing the
     *    context attributes
     * @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
     * @returns {WebGLRenderingContext} the WebGL context
     */
    createContext(canvas, options) {
      let gl;
      if (settings.PREFER_ENV >= ENV.WEBGL2 && (gl = canvas.getContext("webgl2", options)), gl)
        this.webGLVersion = 2;
      else if (this.webGLVersion = 1, gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options), !gl)
        throw new Error("This browser does not support WebGL. Try using the canvas renderer");
      return this.gl = gl, this.getExtensions(), this.gl;
    }
    /** Auto-populate the {@link PIXI.ContextSystem.extensions extensions}. */
    getExtensions() {
      const { gl } = this, common = {
        loseContext: gl.getExtension("WEBGL_lose_context"),
        anisotropicFiltering: gl.getExtension("EXT_texture_filter_anisotropic"),
        floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
        s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
        s3tc_sRGB: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
        // eslint-disable-line camelcase
        etc: gl.getExtension("WEBGL_compressed_texture_etc"),
        etc1: gl.getExtension("WEBGL_compressed_texture_etc1"),
        pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
        atc: gl.getExtension("WEBGL_compressed_texture_atc"),
        astc: gl.getExtension("WEBGL_compressed_texture_astc"),
        bptc: gl.getExtension("EXT_texture_compression_bptc")
      };
      this.webGLVersion === 1 ? Object.assign(this.extensions, common, {
        drawBuffers: gl.getExtension("WEBGL_draw_buffers"),
        depthTexture: gl.getExtension("WEBGL_depth_texture"),
        vertexArrayObject: gl.getExtension("OES_vertex_array_object") || gl.getExtension("MOZ_OES_vertex_array_object") || gl.getExtension("WEBKIT_OES_vertex_array_object"),
        uint32ElementIndex: gl.getExtension("OES_element_index_uint"),
        // Floats and half-floats
        floatTexture: gl.getExtension("OES_texture_float"),
        floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
        textureHalfFloat: gl.getExtension("OES_texture_half_float"),
        textureHalfFloatLinear: gl.getExtension("OES_texture_half_float_linear")
      }) : this.webGLVersion === 2 && Object.assign(this.extensions, common, {
        // Floats and half-floats
        colorBufferFloat: gl.getExtension("EXT_color_buffer_float")
      });
    }
    /**
     * Handles a lost webgl context
     * @param {WebGLContextEvent} event - The context lost event.
     */
    handleContextLost(event) {
      event.preventDefault(), setTimeout(() => {
        this.gl.isContextLost() && this.extensions.loseContext && this.extensions.loseContext.restoreContext();
      }, 0);
    }
    /** Handles a restored webgl context. */
    handleContextRestored() {
      this.renderer.runners.contextChange.emit(this.gl);
    }
    destroy() {
      const view = this.renderer.view;
      this.renderer = null, view.removeEventListener !== void 0 && (view.removeEventListener("webglcontextlost", this.handleContextLost), view.removeEventListener("webglcontextrestored", this.handleContextRestored)), this.gl.useProgram(null), this.extensions.loseContext && this.extensions.loseContext.loseContext();
    }
    /** Handle the post-render runner event. */
    postrender() {
      this.renderer.objectRenderer.renderingToScreen && this.gl.flush();
    }
    /**
     * Validate context.
     * @param {WebGLRenderingContext} gl - Render context.
     */
    validateContext(gl) {
      const attributes = gl.getContextAttributes(), isWebGl2 = "WebGL2RenderingContext" in globalThis && gl instanceof globalThis.WebGL2RenderingContext;
      isWebGl2 && (this.webGLVersion = 2), attributes && !attributes.stencil && console.warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
      const hasuint32 = isWebGl2 || !!gl.getExtension("OES_element_index_uint");
      this.supports.uint32Indices = hasuint32, hasuint32 || console.warn("Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly");
    }
  };
  ContextSystem.defaultOptions = {
    /**
     * {@link PIXI.IRendererOptions.context}
     * @default null
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    context: null,
    /**
     * {@link PIXI.IRendererOptions.antialias}
     * @default false
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    antialias: false,
    /**
     * {@link PIXI.IRendererOptions.premultipliedAlpha}
     * @default true
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    premultipliedAlpha: true,
    /**
     * {@link PIXI.IRendererOptions.preserveDrawingBuffer}
     * @default false
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    preserveDrawingBuffer: false,
    /**
     * {@link PIXI.IRendererOptions.powerPreference}
     * @default default
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    powerPreference: "default"
  }, /** @ignore */
  ContextSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "context"
  };
  extensions.add(ContextSystem);

  // node_modules/@pixi/core/lib/framebuffer/Framebuffer.mjs
  var Framebuffer = class {
    /**
     * @param width - Width of the frame buffer
     * @param height - Height of the frame buffer
     */
    constructor(width, height) {
      if (this.width = Math.round(width), this.height = Math.round(height), !this.width || !this.height)
        throw new Error("Framebuffer width or height is zero");
      this.stencil = false, this.depth = false, this.dirtyId = 0, this.dirtyFormat = 0, this.dirtySize = 0, this.depthTexture = null, this.colorTextures = [], this.glFramebuffers = {}, this.disposeRunner = new Runner("disposeFramebuffer"), this.multisample = MSAA_QUALITY.NONE;
    }
    /**
     * Reference to the colorTexture.
     * @readonly
     */
    get colorTexture() {
      return this.colorTextures[0];
    }
    /**
     * Add texture to the colorTexture array.
     * @param index - Index of the array to add the texture to
     * @param texture - Texture to add to the array
     */
    addColorTexture(index = 0, texture) {
      return this.colorTextures[index] = texture || new BaseTexture(null, {
        scaleMode: SCALE_MODES.NEAREST,
        resolution: 1,
        mipmap: MIPMAP_MODES.OFF,
        width: this.width,
        height: this.height
      }), this.dirtyId++, this.dirtyFormat++, this;
    }
    /**
     * Add a depth texture to the frame buffer.
     * @param texture - Texture to add.
     */
    addDepthTexture(texture) {
      return this.depthTexture = texture || new BaseTexture(null, {
        scaleMode: SCALE_MODES.NEAREST,
        resolution: 1,
        width: this.width,
        height: this.height,
        mipmap: MIPMAP_MODES.OFF,
        format: FORMATS.DEPTH_COMPONENT,
        type: TYPES.UNSIGNED_SHORT
      }), this.dirtyId++, this.dirtyFormat++, this;
    }
    /** Enable depth on the frame buffer. */
    enableDepth() {
      return this.depth = true, this.dirtyId++, this.dirtyFormat++, this;
    }
    /** Enable stencil on the frame buffer. */
    enableStencil() {
      return this.stencil = true, this.dirtyId++, this.dirtyFormat++, this;
    }
    /**
     * Resize the frame buffer
     * @param width - Width of the frame buffer to resize to
     * @param height - Height of the frame buffer to resize to
     */
    resize(width, height) {
      if (width = Math.round(width), height = Math.round(height), !width || !height)
        throw new Error("Framebuffer width and height must not be zero");
      if (!(width === this.width && height === this.height)) {
        this.width = width, this.height = height, this.dirtyId++, this.dirtySize++;
        for (let i2 = 0; i2 < this.colorTextures.length; i2++) {
          const texture = this.colorTextures[i2], resolution = texture.resolution;
          texture.setSize(width / resolution, height / resolution);
        }
        if (this.depthTexture) {
          const resolution = this.depthTexture.resolution;
          this.depthTexture.setSize(width / resolution, height / resolution);
        }
      }
    }
    /** Disposes WebGL resources that are connected to this geometry. */
    dispose() {
      this.disposeRunner.emit(this, false);
    }
    /** Destroys and removes the depth texture added to this framebuffer. */
    destroyDepthTexture() {
      this.depthTexture && (this.depthTexture.destroy(), this.depthTexture = null, ++this.dirtyId, ++this.dirtyFormat);
    }
  };

  // node_modules/@pixi/core/lib/renderTexture/BaseRenderTexture.mjs
  var BaseRenderTexture = class extends BaseTexture {
    /**
     * @param options
     * @param {number} [options.width=100] - The width of the base render texture.
     * @param {number} [options.height=100] - The height of the base render texture.
     * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.BaseTexture.defaultOptions.scaleMode] - See {@link PIXI.SCALE_MODES}
     *   for possible values.
     * @param {number} [options.resolution=PIXI.settings.RESOLUTION] - The resolution / device pixel ratio
     *   of the texture being generated.
     * @param {PIXI.MSAA_QUALITY} [options.multisample=PIXI.MSAA_QUALITY.NONE] - The number of samples of the frame buffer.
     */
    constructor(options = {}) {
      if (typeof options == "number") {
        const width = arguments[0], height = arguments[1], scaleMode = arguments[2], resolution = arguments[3];
        options = { width, height, scaleMode, resolution };
      }
      options.width = options.width ?? 100, options.height = options.height ?? 100, options.multisample ?? (options.multisample = MSAA_QUALITY.NONE), super(null, options), this.mipmap = MIPMAP_MODES.OFF, this.valid = true, this._clear = new Color([0, 0, 0, 0]), this.framebuffer = new Framebuffer(this.realWidth, this.realHeight).addColorTexture(0, this), this.framebuffer.multisample = options.multisample, this.maskStack = [], this.filterStack = [{}];
    }
    /** Color when clearning the texture. */
    set clearColor(value) {
      this._clear.setValue(value);
    }
    get clearColor() {
      return this._clear.value;
    }
    /**
     * Color object when clearning the texture.
     * @readonly
     * @since 7.2.0
     */
    get clear() {
      return this._clear;
    }
    /**
     * Shortcut to `this.framebuffer.multisample`.
     * @default PIXI.MSAA_QUALITY.NONE
     */
    get multisample() {
      return this.framebuffer.multisample;
    }
    set multisample(value) {
      this.framebuffer.multisample = value;
    }
    /**
     * Resizes the BaseRenderTexture.
     * @param desiredWidth - The desired width to resize to.
     * @param desiredHeight - The desired height to resize to.
     */
    resize(desiredWidth, desiredHeight) {
      this.framebuffer.resize(desiredWidth * this.resolution, desiredHeight * this.resolution), this.setRealSize(this.framebuffer.width, this.framebuffer.height);
    }
    /**
     * Frees the texture and framebuffer from WebGL memory without destroying this texture object.
     * This means you can still use the texture later which will upload it to GPU
     * memory again.
     * @fires PIXI.BaseTexture#dispose
     */
    dispose() {
      this.framebuffer.dispose(), super.dispose();
    }
    /** Destroys this texture. */
    destroy() {
      super.destroy(), this.framebuffer.destroyDepthTexture(), this.framebuffer = null;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/BaseImageResource.mjs
  var BaseImageResource = class extends Resource {
    /**
     * @param {PIXI.ImageSourcee} source
     */
    constructor(source) {
      const sourceAny = source, width = sourceAny.naturalWidth || sourceAny.videoWidth || sourceAny.displayWidth || sourceAny.width, height = sourceAny.naturalHeight || sourceAny.videoHeight || sourceAny.displayHeight || sourceAny.height;
      super(width, height), this.source = source, this.noSubImage = false;
    }
    /**
     * Set cross origin based detecting the url and the crossorigin
     * @param element - Element to apply crossOrigin
     * @param url - URL to check
     * @param crossorigin - Cross origin value to use
     */
    static crossOrigin(element, url2, crossorigin) {
      crossorigin === void 0 && !url2.startsWith("data:") ? element.crossOrigin = determineCrossOrigin(url2) : crossorigin !== false && (element.crossOrigin = typeof crossorigin == "string" ? crossorigin : "anonymous");
    }
    /**
     * Upload the texture to the GPU.
     * @param renderer - Upload to the renderer
     * @param baseTexture - Reference to parent texture
     * @param glTexture
     * @param {PIXI.ImageSourcee} [source] - (optional)
     * @returns - true is success
     */
    upload(renderer, baseTexture, glTexture, source) {
      const gl = renderer.gl, width = baseTexture.realWidth, height = baseTexture.realHeight;
      if (source = source || this.source, typeof HTMLImageElement < "u" && source instanceof HTMLImageElement) {
        if (!source.complete || source.naturalWidth === 0)
          return false;
      } else if (typeof HTMLVideoElement < "u" && source instanceof HTMLVideoElement && source.readyState <= 1)
        return false;
      return gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === ALPHA_MODES.UNPACK), !this.noSubImage && baseTexture.target === gl.TEXTURE_2D && glTexture.width === width && glTexture.height === height ? gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, baseTexture.format, glTexture.type, source) : (glTexture.width = width, glTexture.height = height, gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, baseTexture.format, glTexture.type, source)), true;
    }
    /**
     * Checks if source width/height was changed, resize can cause extra baseTexture update.
     * Triggers one update in any case.
     */
    update() {
      if (this.destroyed)
        return;
      const source = this.source, width = source.naturalWidth || source.videoWidth || source.width, height = source.naturalHeight || source.videoHeight || source.height;
      this.resize(width, height), super.update();
    }
    /** Destroy this {@link PIXI.BaseImageResource} */
    dispose() {
      this.source = null;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/ImageResource.mjs
  var ImageResource = class extends BaseImageResource {
    /**
     * @param source - image source or URL
     * @param options
     * @param {boolean} [options.autoLoad=true] - start loading process
     * @param {boolean} [options.createBitmap=PIXI.settings.CREATE_IMAGE_BITMAP] - whether its required to create
     *        a bitmap before upload
     * @param {boolean} [options.crossorigin=true] - Load image using cross origin
     * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.UNPACK] - Premultiply image alpha in bitmap
     */
    constructor(source, options) {
      if (options = options || {}, typeof source == "string") {
        const imageElement = new Image();
        BaseImageResource.crossOrigin(imageElement, source, options.crossorigin), imageElement.src = source, source = imageElement;
      }
      super(source), !source.complete && this._width && this._height && (this._width = 0, this._height = 0), this.url = source.src, this._process = null, this.preserveBitmap = false, this.createBitmap = (options.createBitmap ?? settings.CREATE_IMAGE_BITMAP) && !!globalThis.createImageBitmap, this.alphaMode = typeof options.alphaMode == "number" ? options.alphaMode : null, this.bitmap = null, this._load = null, options.autoLoad !== false && this.load();
    }
    /**
     * Returns a promise when image will be loaded and processed.
     * @param createBitmap - whether process image into bitmap
     */
    load(createBitmap) {
      return this._load ? this._load : (createBitmap !== void 0 && (this.createBitmap = createBitmap), this._load = new Promise((resolve2, reject) => {
        const source = this.source;
        this.url = source.src;
        const completed = () => {
          this.destroyed || (source.onload = null, source.onerror = null, this.update(), this._load = null, this.createBitmap ? resolve2(this.process()) : resolve2(this));
        };
        source.complete && source.src ? completed() : (source.onload = completed, source.onerror = (event) => {
          reject(event), this.onError.emit(event);
        });
      }), this._load);
    }
    /**
     * Called when we need to convert image into BitmapImage.
     * Can be called multiple times, real promise is cached inside.
     * @returns - Cached promise to fill that bitmap
     */
    process() {
      const source = this.source;
      if (this._process !== null)
        return this._process;
      if (this.bitmap !== null || !globalThis.createImageBitmap)
        return Promise.resolve(this);
      const createImageBitmap2 = globalThis.createImageBitmap, cors = !source.crossOrigin || source.crossOrigin === "anonymous";
      return this._process = fetch(
        source.src,
        {
          mode: cors ? "cors" : "no-cors"
        }
      ).then((r2) => r2.blob()).then((blob) => createImageBitmap2(
        blob,
        0,
        0,
        source.width,
        source.height,
        {
          premultiplyAlpha: this.alphaMode === null || this.alphaMode === ALPHA_MODES.UNPACK ? "premultiply" : "none"
        }
      )).then((bitmap) => this.destroyed ? Promise.reject() : (this.bitmap = bitmap, this.update(), this._process = null, Promise.resolve(this))), this._process;
    }
    /**
     * Upload the image resource to GPU.
     * @param renderer - Renderer to upload to
     * @param baseTexture - BaseTexture for this resource
     * @param glTexture - GLTexture to use
     * @returns {boolean} true is success
     */
    upload(renderer, baseTexture, glTexture) {
      if (typeof this.alphaMode == "number" && (baseTexture.alphaMode = this.alphaMode), !this.createBitmap)
        return super.upload(renderer, baseTexture, glTexture);
      if (!this.bitmap && (this.process(), !this.bitmap))
        return false;
      if (super.upload(renderer, baseTexture, glTexture, this.bitmap), !this.preserveBitmap) {
        let flag = true;
        const glTextures = baseTexture._glTextures;
        for (const key in glTextures) {
          const otherTex = glTextures[key];
          if (otherTex !== glTexture && otherTex.dirtyId !== baseTexture.dirtyId) {
            flag = false;
            break;
          }
        }
        flag && (this.bitmap.close && this.bitmap.close(), this.bitmap = null);
      }
      return true;
    }
    /** Destroys this resource. */
    dispose() {
      this.source.onload = null, this.source.onerror = null, super.dispose(), this.bitmap && (this.bitmap.close(), this.bitmap = null), this._process = null, this._load = null;
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if current environment support HTMLImageElement, and source is string or HTMLImageElement
     */
    static test(source) {
      return typeof HTMLImageElement < "u" && (typeof source == "string" || source instanceof HTMLImageElement);
    }
  };

  // node_modules/@pixi/core/lib/textures/TextureUvs.mjs
  var TextureUvs = class {
    constructor() {
      this.x0 = 0, this.y0 = 0, this.x1 = 1, this.y1 = 0, this.x2 = 1, this.y2 = 1, this.x3 = 0, this.y3 = 1, this.uvsFloat32 = new Float32Array(8);
    }
    /**
     * Sets the texture Uvs based on the given frame information.
     * @protected
     * @param frame - The frame of the texture
     * @param baseFrame - The base frame of the texture
     * @param rotate - Rotation of frame, see {@link PIXI.groupD8}
     */
    set(frame, baseFrame, rotate) {
      const tw = baseFrame.width, th = baseFrame.height;
      if (rotate) {
        const w2 = frame.width / 2 / tw, h2 = frame.height / 2 / th, cX = frame.x / tw + w2, cY = frame.y / th + h2;
        rotate = groupD8.add(rotate, groupD8.NW), this.x0 = cX + w2 * groupD8.uX(rotate), this.y0 = cY + h2 * groupD8.uY(rotate), rotate = groupD8.add(rotate, 2), this.x1 = cX + w2 * groupD8.uX(rotate), this.y1 = cY + h2 * groupD8.uY(rotate), rotate = groupD8.add(rotate, 2), this.x2 = cX + w2 * groupD8.uX(rotate), this.y2 = cY + h2 * groupD8.uY(rotate), rotate = groupD8.add(rotate, 2), this.x3 = cX + w2 * groupD8.uX(rotate), this.y3 = cY + h2 * groupD8.uY(rotate);
      } else
        this.x0 = frame.x / tw, this.y0 = frame.y / th, this.x1 = (frame.x + frame.width) / tw, this.y1 = frame.y / th, this.x2 = (frame.x + frame.width) / tw, this.y2 = (frame.y + frame.height) / th, this.x3 = frame.x / tw, this.y3 = (frame.y + frame.height) / th;
      this.uvsFloat32[0] = this.x0, this.uvsFloat32[1] = this.y0, this.uvsFloat32[2] = this.x1, this.uvsFloat32[3] = this.y1, this.uvsFloat32[4] = this.x2, this.uvsFloat32[5] = this.y2, this.uvsFloat32[6] = this.x3, this.uvsFloat32[7] = this.y3;
    }
  };
  TextureUvs.prototype.toString = function() {
    return `[@pixi/core:TextureUvs x0=${this.x0} y0=${this.y0} x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2} x3=${this.x3} y3=${this.y3}]`;
  };

  // node_modules/@pixi/core/lib/textures/Texture.mjs
  var DEFAULT_UVS = new TextureUvs();
  function removeAllHandlers(tex) {
    tex.destroy = function() {
    }, tex.on = function() {
    }, tex.once = function() {
    }, tex.emit = function() {
    };
  }
  var Texture = class _Texture extends import_eventemitter3.default {
    /**
     * @param baseTexture - The base texture source to create the texture from
     * @param frame - The rectangle frame of the texture to show
     * @param orig - The area of original texture
     * @param trim - Trimmed rectangle of original texture
     * @param rotate - indicates how the texture was rotated by texture packer. See {@link PIXI.groupD8}
     * @param anchor - Default anchor point used for sprite placement / rotation
     * @param borders - Default borders used for 9-slice scaling. See {@link PIXI.NineSlicePlane}
     */
    constructor(baseTexture, frame, orig, trim, rotate, anchor, borders) {
      if (super(), this.noFrame = false, frame || (this.noFrame = true, frame = new Rectangle(0, 0, 1, 1)), baseTexture instanceof _Texture && (baseTexture = baseTexture.baseTexture), this.baseTexture = baseTexture, this._frame = frame, this.trim = trim, this.valid = false, this.destroyed = false, this._uvs = DEFAULT_UVS, this.uvMatrix = null, this.orig = orig || frame, this._rotate = Number(rotate || 0), rotate === true)
        this._rotate = 2;
      else if (this._rotate % 2 !== 0)
        throw new Error("attempt to use diamond-shaped UVs. If you are sure, set rotation manually");
      this.defaultAnchor = anchor ? new Point(anchor.x, anchor.y) : new Point(0, 0), this.defaultBorders = borders, this._updateID = 0, this.textureCacheIds = [], baseTexture.valid ? this.noFrame ? baseTexture.valid && this.onBaseTextureUpdated(baseTexture) : this.frame = frame : baseTexture.once("loaded", this.onBaseTextureUpdated, this), this.noFrame && baseTexture.on("update", this.onBaseTextureUpdated, this);
    }
    /**
     * Updates this texture on the gpu.
     *
     * Calls the TextureResource update.
     *
     * If you adjusted `frame` manually, please call `updateUvs()` instead.
     */
    update() {
      this.baseTexture.resource && this.baseTexture.resource.update();
    }
    /**
     * Called when the base texture is updated
     * @protected
     * @param baseTexture - The base texture.
     */
    onBaseTextureUpdated(baseTexture) {
      if (this.noFrame) {
        if (!this.baseTexture.valid)
          return;
        this._frame.width = baseTexture.width, this._frame.height = baseTexture.height, this.valid = true, this.updateUvs();
      } else
        this.frame = this._frame;
      this.emit("update", this);
    }
    /**
     * Destroys this texture
     * @param [destroyBase=false] - Whether to destroy the base texture as well
     * @fires PIXI.Texture#destroyed
     */
    destroy(destroyBase) {
      if (this.baseTexture) {
        if (destroyBase) {
          const { resource } = this.baseTexture;
          resource?.url && TextureCache[resource.url] && _Texture.removeFromCache(resource.url), this.baseTexture.destroy();
        }
        this.baseTexture.off("loaded", this.onBaseTextureUpdated, this), this.baseTexture.off("update", this.onBaseTextureUpdated, this), this.baseTexture = null;
      }
      this._frame = null, this._uvs = null, this.trim = null, this.orig = null, this.valid = false, _Texture.removeFromCache(this), this.textureCacheIds = null, this.destroyed = true, this.emit("destroyed", this), this.removeAllListeners();
    }
    /**
     * Creates a new texture object that acts the same as this one.
     * @returns - The new texture
     */
    clone() {
      const clonedFrame = this._frame.clone(), clonedOrig = this._frame === this.orig ? clonedFrame : this.orig.clone(), clonedTexture = new _Texture(
        this.baseTexture,
        !this.noFrame && clonedFrame,
        clonedOrig,
        this.trim?.clone(),
        this.rotate,
        this.defaultAnchor,
        this.defaultBorders
      );
      return this.noFrame && (clonedTexture._frame = clonedFrame), clonedTexture;
    }
    /**
     * Updates the internal WebGL UV cache. Use it after you change `frame` or `trim` of the texture.
     * Call it after changing the frame
     */
    updateUvs() {
      this._uvs === DEFAULT_UVS && (this._uvs = new TextureUvs()), this._uvs.set(this._frame, this.baseTexture, this.rotate), this._updateID++;
    }
    /**
     * Helper function that creates a new Texture based on the source you provide.
     * The source can be - frame id, image url, video url, canvas element, video element, base texture
     * @param {string|PIXI.BaseTexture|HTMLImageElement|HTMLVideoElement|ImageBitmap|PIXI.ICanvas} source -
     *        Source or array of sources to create texture from
     * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
     * @param {string} [options.pixiIdPrefix=pixiid] - If a source has no id, this is the prefix of the generated id
     * @param {boolean} [strict] - Enforce strict-mode, see {@link PIXI.settings.STRICT_TEXTURE_CACHE}.
     * @returns {PIXI.Texture} The newly created texture
     */
    static from(source, options = {}, strict = settings.STRICT_TEXTURE_CACHE) {
      const isFrame = typeof source == "string";
      let cacheId = null;
      if (isFrame)
        cacheId = source;
      else if (source instanceof BaseTexture) {
        if (!source.cacheId) {
          const prefix = options?.pixiIdPrefix || "pixiid";
          source.cacheId = `${prefix}-${uid()}`, BaseTexture.addToCache(source, source.cacheId);
        }
        cacheId = source.cacheId;
      } else {
        if (!source._pixiId) {
          const prefix = options?.pixiIdPrefix || "pixiid";
          source._pixiId = `${prefix}_${uid()}`;
        }
        cacheId = source._pixiId;
      }
      let texture = TextureCache[cacheId];
      if (isFrame && strict && !texture)
        throw new Error(`The cacheId "${cacheId}" does not exist in TextureCache.`);
      return !texture && !(source instanceof BaseTexture) ? (options.resolution || (options.resolution = getResolutionOfUrl(source)), texture = new _Texture(new BaseTexture(source, options)), texture.baseTexture.cacheId = cacheId, BaseTexture.addToCache(texture.baseTexture, cacheId), _Texture.addToCache(texture, cacheId)) : !texture && source instanceof BaseTexture && (texture = new _Texture(source), _Texture.addToCache(texture, cacheId)), texture;
    }
    /**
     * Useful for loading textures via URLs. Use instead of `Texture.from` because
     * it does a better job of handling failed URLs more effectively. This also ignores
     * `PIXI.settings.STRICT_TEXTURE_CACHE`. Works for Videos, SVGs, Images.
     * @param url - The remote URL or array of URLs to load.
     * @param options - Optional options to include
     * @returns - A Promise that resolves to a Texture.
     */
    static fromURL(url2, options) {
      const resourceOptions = Object.assign({ autoLoad: false }, options?.resourceOptions), texture = _Texture.from(url2, Object.assign({ resourceOptions }, options), false), resource = texture.baseTexture.resource;
      return texture.baseTexture.valid ? Promise.resolve(texture) : resource.load().then(() => Promise.resolve(texture));
    }
    /**
     * Create a new Texture with a BufferResource from a typed array.
     * @param buffer - The optional array to use. If no data is provided, a new Float32Array is created.
     * @param width - Width of the resource
     * @param height - Height of the resource
     * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
     *        Default properties are different from the constructor's defaults.
     * @param {PIXI.FORMATS} [options.format] - The format is not given, the type is inferred from the
     *        type of the buffer: `RGBA` if Float32Array, Int8Array, Uint8Array, or Uint8ClampedArray,
     *        otherwise `RGBA_INTEGER`.
     * @param {PIXI.TYPES} [options.type] - The type is not given, the type is inferred from the
     *        type of the buffer. Maps Float32Array to `FLOAT`, Int32Array to `INT`, Uint32Array to
     *        `UNSIGNED_INT`, Int16Array to `SHORT`, Uint16Array to `UNSIGNED_SHORT`, Int8Array to `BYTE`,
     *        Uint8Array/Uint8ClampedArray to `UNSIGNED_BYTE`.
     * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.NPM]
     * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.SCALE_MODES.NEAREST]
     * @returns - The resulting new BaseTexture
     */
    static fromBuffer(buffer, width, height, options) {
      return new _Texture(BaseTexture.fromBuffer(buffer, width, height, options));
    }
    /**
     * Create a texture from a source and add to the cache.
     * @param {HTMLImageElement|HTMLVideoElement|ImageBitmap|PIXI.ICanvas|string} source - The input source.
     * @param imageUrl - File name of texture, for cache and resolving resolution.
     * @param name - Human readable name for the texture cache. If no name is
     *        specified, only `imageUrl` will be used as the cache ID.
     * @param options
     * @returns - Output texture
     */
    static fromLoader(source, imageUrl, name, options) {
      const baseTexture = new BaseTexture(source, Object.assign({
        scaleMode: BaseTexture.defaultOptions.scaleMode,
        resolution: getResolutionOfUrl(imageUrl)
      }, options)), { resource } = baseTexture;
      resource instanceof ImageResource && (resource.url = imageUrl);
      const texture = new _Texture(baseTexture);
      return name || (name = imageUrl), BaseTexture.addToCache(texture.baseTexture, name), _Texture.addToCache(texture, name), name !== imageUrl && (BaseTexture.addToCache(texture.baseTexture, imageUrl), _Texture.addToCache(texture, imageUrl)), texture.baseTexture.valid ? Promise.resolve(texture) : new Promise((resolve2) => {
        texture.baseTexture.once("loaded", () => resolve2(texture));
      });
    }
    /**
     * Adds a Texture to the global TextureCache. This cache is shared across the whole PIXI object.
     * @param texture - The Texture to add to the cache.
     * @param id - The id that the Texture will be stored against.
     */
    static addToCache(texture, id) {
      id && (texture.textureCacheIds.includes(id) || texture.textureCacheIds.push(id), TextureCache[id] && TextureCache[id] !== texture && console.warn(`Texture added to the cache with an id [${id}] that already had an entry`), TextureCache[id] = texture);
    }
    /**
     * Remove a Texture from the global TextureCache.
     * @param texture - id of a Texture to be removed, or a Texture instance itself
     * @returns - The Texture that was removed
     */
    static removeFromCache(texture) {
      if (typeof texture == "string") {
        const textureFromCache = TextureCache[texture];
        if (textureFromCache) {
          const index = textureFromCache.textureCacheIds.indexOf(texture);
          return index > -1 && textureFromCache.textureCacheIds.splice(index, 1), delete TextureCache[texture], textureFromCache;
        }
      } else if (texture?.textureCacheIds) {
        for (let i2 = 0; i2 < texture.textureCacheIds.length; ++i2)
          TextureCache[texture.textureCacheIds[i2]] === texture && delete TextureCache[texture.textureCacheIds[i2]];
        return texture.textureCacheIds.length = 0, texture;
      }
      return null;
    }
    /**
     * Returns resolution of baseTexture
     * @readonly
     */
    get resolution() {
      return this.baseTexture.resolution;
    }
    /**
     * The frame specifies the region of the base texture that this texture uses.
     * Please call `updateUvs()` after you change coordinates of `frame` manually.
     */
    get frame() {
      return this._frame;
    }
    set frame(frame) {
      this._frame = frame, this.noFrame = false;
      const { x: x2, y: y2, width, height } = frame, xNotFit = x2 + width > this.baseTexture.width, yNotFit = y2 + height > this.baseTexture.height;
      if (xNotFit || yNotFit) {
        const relationship = xNotFit && yNotFit ? "and" : "or", errorX = `X: ${x2} + ${width} = ${x2 + width} > ${this.baseTexture.width}`, errorY = `Y: ${y2} + ${height} = ${y2 + height} > ${this.baseTexture.height}`;
        throw new Error(`Texture Error: frame does not fit inside the base Texture dimensions: ${errorX} ${relationship} ${errorY}`);
      }
      this.valid = width && height && this.baseTexture.valid, !this.trim && !this.rotate && (this.orig = frame), this.valid && this.updateUvs();
    }
    /**
     * Indicates whether the texture is rotated inside the atlas
     * set to 2 to compensate for texture packer rotation
     * set to 6 to compensate for spine packer rotation
     * can be used to rotate or mirror sprites
     * See {@link PIXI.groupD8} for explanation
     */
    get rotate() {
      return this._rotate;
    }
    set rotate(rotate) {
      this._rotate = rotate, this.valid && this.updateUvs();
    }
    /** The width of the Texture in pixels. */
    get width() {
      return this.orig.width;
    }
    /** The height of the Texture in pixels. */
    get height() {
      return this.orig.height;
    }
    /** Utility function for BaseTexture|Texture cast. */
    castToBaseTexture() {
      return this.baseTexture;
    }
    /** An empty texture, used often to not have to create multiple empty textures. Can not be destroyed. */
    static get EMPTY() {
      return _Texture._EMPTY || (_Texture._EMPTY = new _Texture(new BaseTexture()), removeAllHandlers(_Texture._EMPTY), removeAllHandlers(_Texture._EMPTY.baseTexture)), _Texture._EMPTY;
    }
    /** A white texture of 16x16 size, used for graphics and other things Can not be destroyed. */
    static get WHITE() {
      if (!_Texture._WHITE) {
        const canvas = settings.ADAPTER.createCanvas(16, 16), context2 = canvas.getContext("2d");
        canvas.width = 16, canvas.height = 16, context2.fillStyle = "white", context2.fillRect(0, 0, 16, 16), _Texture._WHITE = new _Texture(BaseTexture.from(canvas)), removeAllHandlers(_Texture._WHITE), removeAllHandlers(_Texture._WHITE.baseTexture);
      }
      return _Texture._WHITE;
    }
  };

  // node_modules/@pixi/core/lib/renderTexture/RenderTexture.mjs
  var RenderTexture = class _RenderTexture extends Texture {
    /**
     * @param baseRenderTexture - The base texture object that this texture uses.
     * @param frame - The rectangle frame of the texture to show.
     */
    constructor(baseRenderTexture, frame) {
      super(baseRenderTexture, frame), this.valid = true, this.filterFrame = null, this.filterPoolKey = null, this.updateUvs();
    }
    /**
     * Shortcut to `this.baseTexture.framebuffer`, saves baseTexture cast.
     * @readonly
     */
    get framebuffer() {
      return this.baseTexture.framebuffer;
    }
    /**
     * Shortcut to `this.framebuffer.multisample`.
     * @default PIXI.MSAA_QUALITY.NONE
     */
    get multisample() {
      return this.framebuffer.multisample;
    }
    set multisample(value) {
      this.framebuffer.multisample = value;
    }
    /**
     * Resizes the RenderTexture.
     * @param desiredWidth - The desired width to resize to.
     * @param desiredHeight - The desired height to resize to.
     * @param resizeBaseTexture - Should the baseTexture.width and height values be resized as well?
     */
    resize(desiredWidth, desiredHeight, resizeBaseTexture = true) {
      const resolution = this.baseTexture.resolution, width = Math.round(desiredWidth * resolution) / resolution, height = Math.round(desiredHeight * resolution) / resolution;
      this.valid = width > 0 && height > 0, this._frame.width = this.orig.width = width, this._frame.height = this.orig.height = height, resizeBaseTexture && this.baseTexture.resize(width, height), this.updateUvs();
    }
    /**
     * Changes the resolution of baseTexture, but does not change framebuffer size.
     * @param resolution - The new resolution to apply to RenderTexture
     */
    setResolution(resolution) {
      const { baseTexture } = this;
      baseTexture.resolution !== resolution && (baseTexture.setResolution(resolution), this.resize(baseTexture.width, baseTexture.height, false));
    }
    /**
     * A short hand way of creating a render texture.
     * @param options - Options
     * @param {number} [options.width=100] - The width of the render texture
     * @param {number} [options.height=100] - The height of the render texture
     * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.BaseTexture.defaultOptions.scaleMode] - See {@link PIXI.SCALE_MODES}
     *    for possible values
     * @param {number} [options.resolution=PIXI.settings.RESOLUTION] - The resolution / device pixel ratio of the texture
     *    being generated
     * @param {PIXI.MSAA_QUALITY} [options.multisample=PIXI.MSAA_QUALITY.NONE] - The number of samples of the frame buffer
     * @returns The new render texture
     */
    static create(options) {
      return new _RenderTexture(new BaseRenderTexture(options));
    }
  };

  // node_modules/@pixi/core/lib/renderTexture/RenderTexturePool.mjs
  var RenderTexturePool = class {
    /**
     * @param textureOptions - options that will be passed to BaseRenderTexture constructor
     * @param {PIXI.SCALE_MODES} [textureOptions.scaleMode] - See {@link PIXI.SCALE_MODES} for possible values.
     */
    constructor(textureOptions) {
      this.texturePool = {}, this.textureOptions = textureOptions || {}, this.enableFullScreen = false, this._pixelsWidth = 0, this._pixelsHeight = 0;
    }
    /**
     * Creates texture with params that were specified in pool constructor.
     * @param realWidth - Width of texture in pixels.
     * @param realHeight - Height of texture in pixels.
     * @param multisample - Number of samples of the framebuffer.
     */
    createTexture(realWidth, realHeight, multisample = MSAA_QUALITY.NONE) {
      const baseRenderTexture = new BaseRenderTexture(Object.assign({
        width: realWidth,
        height: realHeight,
        resolution: 1,
        multisample
      }, this.textureOptions));
      return new RenderTexture(baseRenderTexture);
    }
    /**
     * Gets a Power-of-Two render texture or fullScreen texture
     * @param minWidth - The minimum width of the render texture.
     * @param minHeight - The minimum height of the render texture.
     * @param resolution - The resolution of the render texture.
     * @param multisample - Number of samples of the render texture.
     * @returns The new render texture.
     */
    getOptimalTexture(minWidth, minHeight, resolution = 1, multisample = MSAA_QUALITY.NONE) {
      let key;
      minWidth = Math.max(Math.ceil(minWidth * resolution - 1e-6), 1), minHeight = Math.max(Math.ceil(minHeight * resolution - 1e-6), 1), !this.enableFullScreen || minWidth !== this._pixelsWidth || minHeight !== this._pixelsHeight ? (minWidth = nextPow2(minWidth), minHeight = nextPow2(minHeight), key = ((minWidth & 65535) << 16 | minHeight & 65535) >>> 0, multisample > 1 && (key += multisample * 4294967296)) : key = multisample > 1 ? -multisample : -1, this.texturePool[key] || (this.texturePool[key] = []);
      let renderTexture = this.texturePool[key].pop();
      return renderTexture || (renderTexture = this.createTexture(minWidth, minHeight, multisample)), renderTexture.filterPoolKey = key, renderTexture.setResolution(resolution), renderTexture;
    }
    /**
     * Gets extra texture of the same size as input renderTexture
     *
     * `getFilterTexture(input, 0.5)` or `getFilterTexture(0.5, input)`
     * @param input - renderTexture from which size and resolution will be copied
     * @param resolution - override resolution of the renderTexture
     *  It overrides, it does not multiply
     * @param multisample - number of samples of the renderTexture
     */
    getFilterTexture(input, resolution, multisample) {
      const filterTexture = this.getOptimalTexture(
        input.width,
        input.height,
        resolution || input.resolution,
        multisample || MSAA_QUALITY.NONE
      );
      return filterTexture.filterFrame = input.filterFrame, filterTexture;
    }
    /**
     * Place a render texture back into the pool.
     * @param renderTexture - The renderTexture to free
     */
    returnTexture(renderTexture) {
      const key = renderTexture.filterPoolKey;
      renderTexture.filterFrame = null, this.texturePool[key].push(renderTexture);
    }
    /**
     * Alias for returnTexture, to be compliant with FilterSystem interface.
     * @param renderTexture - The renderTexture to free
     */
    returnFilterTexture(renderTexture) {
      this.returnTexture(renderTexture);
    }
    /**
     * Clears the pool.
     * @param destroyTextures - Destroy all stored textures.
     */
    clear(destroyTextures) {
      if (destroyTextures = destroyTextures !== false, destroyTextures)
        for (const i2 in this.texturePool) {
          const textures = this.texturePool[i2];
          if (textures)
            for (let j2 = 0; j2 < textures.length; j2++)
              textures[j2].destroy(true);
        }
      this.texturePool = {};
    }
    /**
     * If screen size was changed, drops all screen-sized textures,
     * sets new screen size, sets `enableFullScreen` to true
     *
     * Size is measured in pixels, `renderer.view` can be passed here, not `renderer.screen`
     * @param size - Initial size of screen.
     */
    setScreenSize(size) {
      if (!(size.width === this._pixelsWidth && size.height === this._pixelsHeight)) {
        this.enableFullScreen = size.width > 0 && size.height > 0;
        for (const i2 in this.texturePool) {
          if (!(Number(i2) < 0))
            continue;
          const textures = this.texturePool[i2];
          if (textures)
            for (let j2 = 0; j2 < textures.length; j2++)
              textures[j2].destroy(true);
          this.texturePool[i2] = [];
        }
        this._pixelsWidth = size.width, this._pixelsHeight = size.height;
      }
    }
  };
  RenderTexturePool.SCREEN_KEY = -1;

  // node_modules/@pixi/core/lib/utils/Quad.mjs
  var Quad = class extends Geometry {
    constructor() {
      super(), this.addAttribute("aVertexPosition", new Float32Array([
        0,
        0,
        1,
        0,
        1,
        1,
        0,
        1
      ])).addIndex([0, 1, 3, 2]);
    }
  };

  // node_modules/@pixi/core/lib/utils/QuadUv.mjs
  var QuadUv = class extends Geometry {
    constructor() {
      super(), this.vertices = new Float32Array([
        -1,
        -1,
        1,
        -1,
        1,
        1,
        -1,
        1
      ]), this.uvs = new Float32Array([
        0,
        0,
        1,
        0,
        1,
        1,
        0,
        1
      ]), this.vertexBuffer = new Buffer2(this.vertices), this.uvBuffer = new Buffer2(this.uvs), this.addAttribute("aVertexPosition", this.vertexBuffer).addAttribute("aTextureCoord", this.uvBuffer).addIndex([0, 1, 2, 0, 2, 3]);
    }
    /**
     * Maps two Rectangle to the quad.
     * @param targetTextureFrame - The first rectangle
     * @param destinationFrame - The second rectangle
     * @returns - Returns itself.
     */
    map(targetTextureFrame, destinationFrame) {
      let x2 = 0, y2 = 0;
      return this.uvs[0] = x2, this.uvs[1] = y2, this.uvs[2] = x2 + destinationFrame.width / targetTextureFrame.width, this.uvs[3] = y2, this.uvs[4] = x2 + destinationFrame.width / targetTextureFrame.width, this.uvs[5] = y2 + destinationFrame.height / targetTextureFrame.height, this.uvs[6] = x2, this.uvs[7] = y2 + destinationFrame.height / targetTextureFrame.height, x2 = destinationFrame.x, y2 = destinationFrame.y, this.vertices[0] = x2, this.vertices[1] = y2, this.vertices[2] = x2 + destinationFrame.width, this.vertices[3] = y2, this.vertices[4] = x2 + destinationFrame.width, this.vertices[5] = y2 + destinationFrame.height, this.vertices[6] = x2, this.vertices[7] = y2 + destinationFrame.height, this.invalidate(), this;
    }
    /**
     * Legacy upload method, just marks buffers dirty.
     * @returns - Returns itself.
     */
    invalidate() {
      return this.vertexBuffer._updateID++, this.uvBuffer._updateID++, this;
    }
  };

  // node_modules/@pixi/core/lib/filters/FilterState.mjs
  var FilterState = class {
    constructor() {
      this.renderTexture = null, this.target = null, this.legacy = false, this.resolution = 1, this.multisample = MSAA_QUALITY.NONE, this.sourceFrame = new Rectangle(), this.destinationFrame = new Rectangle(), this.bindingSourceFrame = new Rectangle(), this.bindingDestinationFrame = new Rectangle(), this.filters = [], this.transform = null;
    }
    /** Clears the state */
    clear() {
      this.target = null, this.filters = null, this.renderTexture = null;
    }
  };

  // node_modules/@pixi/core/lib/filters/FilterSystem.mjs
  var tempPoints2 = [new Point(), new Point(), new Point(), new Point()];
  var tempMatrix = new Matrix();
  var FilterSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.defaultFilterStack = [{}], this.texturePool = new RenderTexturePool(), this.statePool = [], this.quad = new Quad(), this.quadUv = new QuadUv(), this.tempRect = new Rectangle(), this.activeState = {}, this.globalUniforms = new UniformGroup({
        outputFrame: new Rectangle(),
        inputSize: new Float32Array(4),
        inputPixel: new Float32Array(4),
        inputClamp: new Float32Array(4),
        resolution: 1,
        // legacy variables
        filterArea: new Float32Array(4),
        filterClamp: new Float32Array(4)
      }, true), this.forceClear = false, this.useMaxPadding = false;
    }
    init() {
      this.texturePool.setScreenSize(this.renderer.view);
    }
    /**
     * Pushes a set of filters to be applied later to the system. This will redirect further rendering into an
     * input render-texture for the rest of the filtering pipeline.
     * @param {PIXI.DisplayObject} target - The target of the filter to render.
     * @param filters - The filters to apply.
     */
    push(target, filters) {
      const renderer = this.renderer, filterStack = this.defaultFilterStack, state = this.statePool.pop() || new FilterState(), renderTextureSystem = renderer.renderTexture;
      let currentResolution, currentMultisample;
      if (renderTextureSystem.current) {
        const renderTexture = renderTextureSystem.current;
        currentResolution = renderTexture.resolution, currentMultisample = renderTexture.multisample;
      } else
        currentResolution = renderer.resolution, currentMultisample = renderer.multisample;
      let resolution = filters[0].resolution || currentResolution, multisample = filters[0].multisample ?? currentMultisample, padding = filters[0].padding, autoFit = filters[0].autoFit, legacy = filters[0].legacy ?? true;
      for (let i2 = 1; i2 < filters.length; i2++) {
        const filter = filters[i2];
        resolution = Math.min(resolution, filter.resolution || currentResolution), multisample = Math.min(multisample, filter.multisample ?? currentMultisample), padding = this.useMaxPadding ? Math.max(padding, filter.padding) : padding + filter.padding, autoFit = autoFit && filter.autoFit, legacy = legacy || (filter.legacy ?? true);
      }
      filterStack.length === 1 && (this.defaultFilterStack[0].renderTexture = renderTextureSystem.current), filterStack.push(state), state.resolution = resolution, state.multisample = multisample, state.legacy = legacy, state.target = target, state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true)), state.sourceFrame.pad(padding);
      const sourceFrameProjected = this.tempRect.copyFrom(renderTextureSystem.sourceFrame);
      renderer.projection.transform && this.transformAABB(
        tempMatrix.copyFrom(renderer.projection.transform).invert(),
        sourceFrameProjected
      ), autoFit ? (state.sourceFrame.fit(sourceFrameProjected), (state.sourceFrame.width <= 0 || state.sourceFrame.height <= 0) && (state.sourceFrame.width = 0, state.sourceFrame.height = 0)) : state.sourceFrame.intersects(sourceFrameProjected) || (state.sourceFrame.width = 0, state.sourceFrame.height = 0), this.roundFrame(
        state.sourceFrame,
        renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution,
        renderTextureSystem.sourceFrame,
        renderTextureSystem.destinationFrame,
        renderer.projection.transform
      ), state.renderTexture = this.getOptimalFilterTexture(
        state.sourceFrame.width,
        state.sourceFrame.height,
        resolution,
        multisample
      ), state.filters = filters, state.destinationFrame.width = state.renderTexture.width, state.destinationFrame.height = state.renderTexture.height;
      const destinationFrame = this.tempRect;
      destinationFrame.x = 0, destinationFrame.y = 0, destinationFrame.width = state.sourceFrame.width, destinationFrame.height = state.sourceFrame.height, state.renderTexture.filterFrame = state.sourceFrame, state.bindingSourceFrame.copyFrom(renderTextureSystem.sourceFrame), state.bindingDestinationFrame.copyFrom(renderTextureSystem.destinationFrame), state.transform = renderer.projection.transform, renderer.projection.transform = null, renderTextureSystem.bind(state.renderTexture, state.sourceFrame, destinationFrame), renderer.framebuffer.clear(0, 0, 0, 0);
    }
    /** Pops off the filter and applies it. */
    pop() {
      const filterStack = this.defaultFilterStack, state = filterStack.pop(), filters = state.filters;
      this.activeState = state;
      const globalUniforms = this.globalUniforms.uniforms;
      globalUniforms.outputFrame = state.sourceFrame, globalUniforms.resolution = state.resolution;
      const inputSize = globalUniforms.inputSize, inputPixel = globalUniforms.inputPixel, inputClamp = globalUniforms.inputClamp;
      if (inputSize[0] = state.destinationFrame.width, inputSize[1] = state.destinationFrame.height, inputSize[2] = 1 / inputSize[0], inputSize[3] = 1 / inputSize[1], inputPixel[0] = Math.round(inputSize[0] * state.resolution), inputPixel[1] = Math.round(inputSize[1] * state.resolution), inputPixel[2] = 1 / inputPixel[0], inputPixel[3] = 1 / inputPixel[1], inputClamp[0] = 0.5 * inputPixel[2], inputClamp[1] = 0.5 * inputPixel[3], inputClamp[2] = state.sourceFrame.width * inputSize[2] - 0.5 * inputPixel[2], inputClamp[3] = state.sourceFrame.height * inputSize[3] - 0.5 * inputPixel[3], state.legacy) {
        const filterArea = globalUniforms.filterArea;
        filterArea[0] = state.destinationFrame.width, filterArea[1] = state.destinationFrame.height, filterArea[2] = state.sourceFrame.x, filterArea[3] = state.sourceFrame.y, globalUniforms.filterClamp = globalUniforms.inputClamp;
      }
      this.globalUniforms.update();
      const lastState = filterStack[filterStack.length - 1];
      if (this.renderer.framebuffer.blit(), filters.length === 1)
        filters[0].apply(this, state.renderTexture, lastState.renderTexture, CLEAR_MODES.BLEND, state), this.returnFilterTexture(state.renderTexture);
      else {
        let flip = state.renderTexture, flop = this.getOptimalFilterTexture(
          flip.width,
          flip.height,
          state.resolution
        );
        flop.filterFrame = flip.filterFrame;
        let i2 = 0;
        for (i2 = 0; i2 < filters.length - 1; ++i2) {
          i2 === 1 && state.multisample > 1 && (flop = this.getOptimalFilterTexture(
            flip.width,
            flip.height,
            state.resolution
          ), flop.filterFrame = flip.filterFrame), filters[i2].apply(this, flip, flop, CLEAR_MODES.CLEAR, state);
          const t3 = flip;
          flip = flop, flop = t3;
        }
        filters[i2].apply(this, flip, lastState.renderTexture, CLEAR_MODES.BLEND, state), i2 > 1 && state.multisample > 1 && this.returnFilterTexture(state.renderTexture), this.returnFilterTexture(flip), this.returnFilterTexture(flop);
      }
      state.clear(), this.statePool.push(state);
    }
    /**
     * Binds a renderTexture with corresponding `filterFrame`, clears it if mode corresponds.
     * @param filterTexture - renderTexture to bind, should belong to filter pool or filter stack
     * @param clearMode - clearMode, by default its CLEAR/YES. See {@link PIXI.CLEAR_MODES}
     */
    bindAndClear(filterTexture, clearMode = CLEAR_MODES.CLEAR) {
      const {
        renderTexture: renderTextureSystem,
        state: stateSystem
      } = this.renderer;
      if (filterTexture === this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? this.renderer.projection.transform = this.activeState.transform : this.renderer.projection.transform = null, filterTexture?.filterFrame) {
        const destinationFrame = this.tempRect;
        destinationFrame.x = 0, destinationFrame.y = 0, destinationFrame.width = filterTexture.filterFrame.width, destinationFrame.height = filterTexture.filterFrame.height, renderTextureSystem.bind(filterTexture, filterTexture.filterFrame, destinationFrame);
      } else
        filterTexture !== this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? renderTextureSystem.bind(filterTexture) : this.renderer.renderTexture.bind(
          filterTexture,
          this.activeState.bindingSourceFrame,
          this.activeState.bindingDestinationFrame
        );
      const autoClear = stateSystem.stateId & 1 || this.forceClear;
      (clearMode === CLEAR_MODES.CLEAR || clearMode === CLEAR_MODES.BLIT && autoClear) && this.renderer.framebuffer.clear(0, 0, 0, 0);
    }
    /**
     * Draws a filter using the default rendering process.
     *
     * This should be called only by {@link PIXI.Filter#apply}.
     * @param filter - The filter to draw.
     * @param input - The input render target.
     * @param output - The target to output to.
     * @param clearMode - Should the output be cleared before rendering to it
     */
    applyFilter(filter, input, output, clearMode) {
      const renderer = this.renderer;
      renderer.state.set(filter.state), this.bindAndClear(output, clearMode), filter.uniforms.uSampler = input, filter.uniforms.filterGlobals = this.globalUniforms, renderer.shader.bind(filter), filter.legacy = !!filter.program.attributeData.aTextureCoord, filter.legacy ? (this.quadUv.map(input._frame, input.filterFrame), renderer.geometry.bind(this.quadUv), renderer.geometry.draw(DRAW_MODES.TRIANGLES)) : (renderer.geometry.bind(this.quad), renderer.geometry.draw(DRAW_MODES.TRIANGLE_STRIP));
    }
    /**
     * Multiply _input normalized coordinates_ to this matrix to get _sprite texture normalized coordinates_.
     *
     * Use `outputMatrix * vTextureCoord` in the shader.
     * @param outputMatrix - The matrix to output to.
     * @param {PIXI.Sprite} sprite - The sprite to map to.
     * @returns The mapped matrix.
     */
    calculateSpriteMatrix(outputMatrix, sprite) {
      const { sourceFrame, destinationFrame } = this.activeState, { orig } = sprite._texture, mappedMatrix = outputMatrix.set(
        destinationFrame.width,
        0,
        0,
        destinationFrame.height,
        sourceFrame.x,
        sourceFrame.y
      ), worldTransform = sprite.worldTransform.copyTo(Matrix.TEMP_MATRIX);
      return worldTransform.invert(), mappedMatrix.prepend(worldTransform), mappedMatrix.scale(1 / orig.width, 1 / orig.height), mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y), mappedMatrix;
    }
    /** Destroys this Filter System. */
    destroy() {
      this.renderer = null, this.texturePool.clear(false);
    }
    /**
     * Gets a Power-of-Two render texture or fullScreen texture
     * @param minWidth - The minimum width of the render texture in real pixels.
     * @param minHeight - The minimum height of the render texture in real pixels.
     * @param resolution - The resolution of the render texture.
     * @param multisample - Number of samples of the render texture.
     * @returns - The new render texture.
     */
    getOptimalFilterTexture(minWidth, minHeight, resolution = 1, multisample = MSAA_QUALITY.NONE) {
      return this.texturePool.getOptimalTexture(minWidth, minHeight, resolution, multisample);
    }
    /**
     * Gets extra render texture to use inside current filter
     * To be compliant with older filters, you can use params in any order
     * @param input - renderTexture from which size and resolution will be copied
     * @param resolution - override resolution of the renderTexture
     * @param multisample - number of samples of the renderTexture
     */
    getFilterTexture(input, resolution, multisample) {
      if (typeof input == "number") {
        const swap = input;
        input = resolution, resolution = swap;
      }
      input = input || this.activeState.renderTexture;
      const filterTexture = this.texturePool.getOptimalTexture(
        input.width,
        input.height,
        resolution || input.resolution,
        multisample || MSAA_QUALITY.NONE
      );
      return filterTexture.filterFrame = input.filterFrame, filterTexture;
    }
    /**
     * Frees a render texture back into the pool.
     * @param renderTexture - The renderTarget to free
     */
    returnFilterTexture(renderTexture) {
      this.texturePool.returnTexture(renderTexture);
    }
    /** Empties the texture pool. */
    emptyPool() {
      this.texturePool.clear(true);
    }
    /** Calls `texturePool.resize()`, affects fullScreen renderTextures. */
    resize() {
      this.texturePool.setScreenSize(this.renderer.view);
    }
    /**
     * @param matrix - first param
     * @param rect - second param
     */
    transformAABB(matrix, rect) {
      const lt = tempPoints2[0], lb = tempPoints2[1], rt = tempPoints2[2], rb = tempPoints2[3];
      lt.set(rect.left, rect.top), lb.set(rect.left, rect.bottom), rt.set(rect.right, rect.top), rb.set(rect.right, rect.bottom), matrix.apply(lt, lt), matrix.apply(lb, lb), matrix.apply(rt, rt), matrix.apply(rb, rb);
      const x0 = Math.min(lt.x, lb.x, rt.x, rb.x), y0 = Math.min(lt.y, lb.y, rt.y, rb.y), x1 = Math.max(lt.x, lb.x, rt.x, rb.x), y1 = Math.max(lt.y, lb.y, rt.y, rb.y);
      rect.x = x0, rect.y = y0, rect.width = x1 - x0, rect.height = y1 - y0;
    }
    roundFrame(frame, resolution, bindingSourceFrame, bindingDestinationFrame, transform) {
      if (!(frame.width <= 0 || frame.height <= 0 || bindingSourceFrame.width <= 0 || bindingSourceFrame.height <= 0)) {
        if (transform) {
          const { a: a2, b: b2, c: c2, d: d3 } = transform;
          if ((Math.abs(b2) > 1e-4 || Math.abs(c2) > 1e-4) && (Math.abs(a2) > 1e-4 || Math.abs(d3) > 1e-4))
            return;
        }
        transform = transform ? tempMatrix.copyFrom(transform) : tempMatrix.identity(), transform.translate(-bindingSourceFrame.x, -bindingSourceFrame.y).scale(
          bindingDestinationFrame.width / bindingSourceFrame.width,
          bindingDestinationFrame.height / bindingSourceFrame.height
        ).translate(bindingDestinationFrame.x, bindingDestinationFrame.y), this.transformAABB(transform, frame), frame.ceil(resolution), this.transformAABB(transform.invert(), frame);
      }
    }
  };
  FilterSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "filter"
  };
  extensions.add(FilterSystem);

  // node_modules/@pixi/core/lib/framebuffer/GLFramebuffer.mjs
  var GLFramebuffer = class {
    constructor(framebuffer) {
      this.framebuffer = framebuffer, this.stencil = null, this.dirtyId = -1, this.dirtyFormat = -1, this.dirtySize = -1, this.multisample = MSAA_QUALITY.NONE, this.msaaBuffer = null, this.blitFramebuffer = null, this.mipLevel = 0;
    }
  };

  // node_modules/@pixi/core/lib/framebuffer/FramebufferSystem.mjs
  var tempRectangle = new Rectangle();
  var FramebufferSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.managedFramebuffers = [], this.unknownFramebuffer = new Framebuffer(10, 10), this.msaaSamples = null;
    }
    /** Sets up the renderer context and necessary buffers. */
    contextChange() {
      this.disposeAll(true);
      const gl = this.gl = this.renderer.gl;
      if (this.CONTEXT_UID = this.renderer.CONTEXT_UID, this.current = this.unknownFramebuffer, this.viewport = new Rectangle(), this.hasMRT = true, this.writeDepthTexture = true, this.renderer.context.webGLVersion === 1) {
        let nativeDrawBuffersExtension = this.renderer.context.extensions.drawBuffers, nativeDepthTextureExtension = this.renderer.context.extensions.depthTexture;
        settings.PREFER_ENV === ENV.WEBGL_LEGACY && (nativeDrawBuffersExtension = null, nativeDepthTextureExtension = null), nativeDrawBuffersExtension ? gl.drawBuffers = (activeTextures) => nativeDrawBuffersExtension.drawBuffersWEBGL(activeTextures) : (this.hasMRT = false, gl.drawBuffers = () => {
        }), nativeDepthTextureExtension || (this.writeDepthTexture = false);
      } else
        this.msaaSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES);
    }
    /**
     * Bind a framebuffer.
     * @param framebuffer
     * @param frame - frame, default is framebuffer size
     * @param mipLevel - optional mip level to set on the framebuffer - defaults to 0
     */
    bind(framebuffer, frame, mipLevel = 0) {
      const { gl } = this;
      if (framebuffer) {
        const fbo = framebuffer.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
        this.current !== framebuffer && (this.current = framebuffer, gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer)), fbo.mipLevel !== mipLevel && (framebuffer.dirtyId++, framebuffer.dirtyFormat++, fbo.mipLevel = mipLevel), fbo.dirtyId !== framebuffer.dirtyId && (fbo.dirtyId = framebuffer.dirtyId, fbo.dirtyFormat !== framebuffer.dirtyFormat ? (fbo.dirtyFormat = framebuffer.dirtyFormat, fbo.dirtySize = framebuffer.dirtySize, this.updateFramebuffer(framebuffer, mipLevel)) : fbo.dirtySize !== framebuffer.dirtySize && (fbo.dirtySize = framebuffer.dirtySize, this.resizeFramebuffer(framebuffer)));
        for (let i2 = 0; i2 < framebuffer.colorTextures.length; i2++) {
          const tex = framebuffer.colorTextures[i2];
          this.renderer.texture.unbind(tex.parentTextureArray || tex);
        }
        if (framebuffer.depthTexture && this.renderer.texture.unbind(framebuffer.depthTexture), frame) {
          const mipWidth = frame.width >> mipLevel, mipHeight = frame.height >> mipLevel, scale = mipWidth / frame.width;
          this.setViewport(
            frame.x * scale,
            frame.y * scale,
            mipWidth,
            mipHeight
          );
        } else {
          const mipWidth = framebuffer.width >> mipLevel, mipHeight = framebuffer.height >> mipLevel;
          this.setViewport(0, 0, mipWidth, mipHeight);
        }
      } else
        this.current && (this.current = null, gl.bindFramebuffer(gl.FRAMEBUFFER, null)), frame ? this.setViewport(frame.x, frame.y, frame.width, frame.height) : this.setViewport(0, 0, this.renderer.width, this.renderer.height);
    }
    /**
     * Set the WebGLRenderingContext's viewport.
     * @param x - X position of viewport
     * @param y - Y position of viewport
     * @param width - Width of viewport
     * @param height - Height of viewport
     */
    setViewport(x2, y2, width, height) {
      const v2 = this.viewport;
      x2 = Math.round(x2), y2 = Math.round(y2), width = Math.round(width), height = Math.round(height), (v2.width !== width || v2.height !== height || v2.x !== x2 || v2.y !== y2) && (v2.x = x2, v2.y = y2, v2.width = width, v2.height = height, this.gl.viewport(x2, y2, width, height));
    }
    /**
     * Get the size of the current width and height. Returns object with `width` and `height` values.
     * @readonly
     */
    get size() {
      return this.current ? { x: 0, y: 0, width: this.current.width, height: this.current.height } : { x: 0, y: 0, width: this.renderer.width, height: this.renderer.height };
    }
    /**
     * Clear the color of the context
     * @param r - Red value from 0 to 1
     * @param g - Green value from 0 to 1
     * @param b - Blue value from 0 to 1
     * @param a - Alpha value from 0 to 1
     * @param {PIXI.BUFFER_BITS} [mask=BUFFER_BITS.COLOR | BUFFER_BITS.DEPTH] - Bitwise OR of masks
     *  that indicate the buffers to be cleared, by default COLOR and DEPTH buffers.
     */
    clear(r2, g2, b2, a2, mask = BUFFER_BITS.COLOR | BUFFER_BITS.DEPTH) {
      const { gl } = this;
      gl.clearColor(r2, g2, b2, a2), gl.clear(mask);
    }
    /**
     * Initialize framebuffer for this context
     * @protected
     * @param framebuffer
     * @returns - created GLFramebuffer
     */
    initFramebuffer(framebuffer) {
      const { gl } = this, fbo = new GLFramebuffer(gl.createFramebuffer());
      return fbo.multisample = this.detectSamples(framebuffer.multisample), framebuffer.glFramebuffers[this.CONTEXT_UID] = fbo, this.managedFramebuffers.push(framebuffer), framebuffer.disposeRunner.add(this), fbo;
    }
    /**
     * Resize the framebuffer
     * @param framebuffer
     * @protected
     */
    resizeFramebuffer(framebuffer) {
      const { gl } = this, fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
      if (fbo.stencil) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
        let stencilFormat;
        this.renderer.context.webGLVersion === 1 ? stencilFormat = gl.DEPTH_STENCIL : framebuffer.depth && framebuffer.stencil ? stencilFormat = gl.DEPTH24_STENCIL8 : framebuffer.depth ? stencilFormat = gl.DEPTH_COMPONENT24 : stencilFormat = gl.STENCIL_INDEX8, fbo.msaaBuffer ? gl.renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          fbo.multisample,
          stencilFormat,
          framebuffer.width,
          framebuffer.height
        ) : gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, framebuffer.width, framebuffer.height);
      }
      const colorTextures = framebuffer.colorTextures;
      let count = colorTextures.length;
      gl.drawBuffers || (count = Math.min(count, 1));
      for (let i2 = 0; i2 < count; i2++) {
        const texture = colorTextures[i2], parentTexture = texture.parentTextureArray || texture;
        this.renderer.texture.bind(parentTexture, 0), i2 === 0 && fbo.msaaBuffer && (gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer), gl.renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          fbo.multisample,
          parentTexture._glTextures[this.CONTEXT_UID].internalFormat,
          framebuffer.width,
          framebuffer.height
        ));
      }
      framebuffer.depthTexture && this.writeDepthTexture && this.renderer.texture.bind(framebuffer.depthTexture, 0);
    }
    /**
     * Update the framebuffer
     * @param framebuffer
     * @param mipLevel
     * @protected
     */
    updateFramebuffer(framebuffer, mipLevel) {
      const { gl } = this, fbo = framebuffer.glFramebuffers[this.CONTEXT_UID], colorTextures = framebuffer.colorTextures;
      let count = colorTextures.length;
      gl.drawBuffers || (count = Math.min(count, 1)), fbo.multisample > 1 && this.canMultisampleFramebuffer(framebuffer) ? fbo.msaaBuffer = fbo.msaaBuffer || gl.createRenderbuffer() : fbo.msaaBuffer && (gl.deleteRenderbuffer(fbo.msaaBuffer), fbo.msaaBuffer = null, fbo.blitFramebuffer && (fbo.blitFramebuffer.dispose(), fbo.blitFramebuffer = null));
      const activeTextures = [];
      for (let i2 = 0; i2 < count; i2++) {
        const texture = colorTextures[i2], parentTexture = texture.parentTextureArray || texture;
        this.renderer.texture.bind(parentTexture, 0), i2 === 0 && fbo.msaaBuffer ? (gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer), gl.renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          fbo.multisample,
          parentTexture._glTextures[this.CONTEXT_UID].internalFormat,
          framebuffer.width,
          framebuffer.height
        ), gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fbo.msaaBuffer)) : (gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + i2,
          texture.target,
          parentTexture._glTextures[this.CONTEXT_UID].texture,
          mipLevel
        ), activeTextures.push(gl.COLOR_ATTACHMENT0 + i2));
      }
      if (activeTextures.length > 1 && gl.drawBuffers(activeTextures), framebuffer.depthTexture && this.writeDepthTexture) {
        const depthTexture = framebuffer.depthTexture;
        this.renderer.texture.bind(depthTexture, 0), gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_2D,
          depthTexture._glTextures[this.CONTEXT_UID].texture,
          mipLevel
        );
      }
      if ((framebuffer.stencil || framebuffer.depth) && !(framebuffer.depthTexture && this.writeDepthTexture)) {
        fbo.stencil = fbo.stencil || gl.createRenderbuffer();
        let stencilAttachment, stencilFormat;
        this.renderer.context.webGLVersion === 1 ? (stencilAttachment = gl.DEPTH_STENCIL_ATTACHMENT, stencilFormat = gl.DEPTH_STENCIL) : framebuffer.depth && framebuffer.stencil ? (stencilAttachment = gl.DEPTH_STENCIL_ATTACHMENT, stencilFormat = gl.DEPTH24_STENCIL8) : framebuffer.depth ? (stencilAttachment = gl.DEPTH_ATTACHMENT, stencilFormat = gl.DEPTH_COMPONENT24) : (stencilAttachment = gl.STENCIL_ATTACHMENT, stencilFormat = gl.STENCIL_INDEX8), gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil), fbo.msaaBuffer ? gl.renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          fbo.multisample,
          stencilFormat,
          framebuffer.width,
          framebuffer.height
        ) : gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, framebuffer.width, framebuffer.height), gl.framebufferRenderbuffer(gl.FRAMEBUFFER, stencilAttachment, gl.RENDERBUFFER, fbo.stencil);
      } else
        fbo.stencil && (gl.deleteRenderbuffer(fbo.stencil), fbo.stencil = null);
    }
    /**
     * Returns true if the frame buffer can be multisampled.
     * @param framebuffer
     */
    canMultisampleFramebuffer(framebuffer) {
      return this.renderer.context.webGLVersion !== 1 && framebuffer.colorTextures.length <= 1 && !framebuffer.depthTexture;
    }
    /**
     * Detects number of samples that is not more than a param but as close to it as possible
     * @param samples - number of samples
     * @returns - recommended number of samples
     */
    detectSamples(samples) {
      const { msaaSamples } = this;
      let res = MSAA_QUALITY.NONE;
      if (samples <= 1 || msaaSamples === null)
        return res;
      for (let i2 = 0; i2 < msaaSamples.length; i2++)
        if (msaaSamples[i2] <= samples) {
          res = msaaSamples[i2];
          break;
        }
      return res === 1 && (res = MSAA_QUALITY.NONE), res;
    }
    /**
     * Only works with WebGL2
     *
     * blits framebuffer to another of the same or bigger size
     * after that target framebuffer is bound
     *
     * Fails with WebGL warning if blits multisample framebuffer to different size
     * @param framebuffer - by default it blits "into itself", from renderBuffer to texture.
     * @param sourcePixels - source rectangle in pixels
     * @param destPixels - dest rectangle in pixels, assumed to be the same as sourcePixels
     */
    blit(framebuffer, sourcePixels, destPixels) {
      const { current, renderer, gl, CONTEXT_UID } = this;
      if (renderer.context.webGLVersion !== 2 || !current)
        return;
      const fbo = current.glFramebuffers[CONTEXT_UID];
      if (!fbo)
        return;
      if (!framebuffer) {
        if (!fbo.msaaBuffer)
          return;
        const colorTexture = current.colorTextures[0];
        if (!colorTexture)
          return;
        fbo.blitFramebuffer || (fbo.blitFramebuffer = new Framebuffer(current.width, current.height), fbo.blitFramebuffer.addColorTexture(0, colorTexture)), framebuffer = fbo.blitFramebuffer, framebuffer.colorTextures[0] !== colorTexture && (framebuffer.colorTextures[0] = colorTexture, framebuffer.dirtyId++, framebuffer.dirtyFormat++), (framebuffer.width !== current.width || framebuffer.height !== current.height) && (framebuffer.width = current.width, framebuffer.height = current.height, framebuffer.dirtyId++, framebuffer.dirtySize++);
      }
      sourcePixels || (sourcePixels = tempRectangle, sourcePixels.width = current.width, sourcePixels.height = current.height), destPixels || (destPixels = sourcePixels);
      const sameSize = sourcePixels.width === destPixels.width && sourcePixels.height === destPixels.height;
      this.bind(framebuffer), gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo.framebuffer), gl.blitFramebuffer(
        sourcePixels.left,
        sourcePixels.top,
        sourcePixels.right,
        sourcePixels.bottom,
        destPixels.left,
        destPixels.top,
        destPixels.right,
        destPixels.bottom,
        gl.COLOR_BUFFER_BIT,
        sameSize ? gl.NEAREST : gl.LINEAR
      ), gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer.glFramebuffers[this.CONTEXT_UID].framebuffer);
    }
    /**
     * Disposes framebuffer.
     * @param framebuffer - framebuffer that has to be disposed of
     * @param contextLost - If context was lost, we suppress all delete function calls
     */
    disposeFramebuffer(framebuffer, contextLost) {
      const fbo = framebuffer.glFramebuffers[this.CONTEXT_UID], gl = this.gl;
      if (!fbo)
        return;
      delete framebuffer.glFramebuffers[this.CONTEXT_UID];
      const index = this.managedFramebuffers.indexOf(framebuffer);
      index >= 0 && this.managedFramebuffers.splice(index, 1), framebuffer.disposeRunner.remove(this), contextLost || (gl.deleteFramebuffer(fbo.framebuffer), fbo.msaaBuffer && gl.deleteRenderbuffer(fbo.msaaBuffer), fbo.stencil && gl.deleteRenderbuffer(fbo.stencil)), fbo.blitFramebuffer && this.disposeFramebuffer(fbo.blitFramebuffer, contextLost);
    }
    /**
     * Disposes all framebuffers, but not textures bound to them.
     * @param [contextLost=false] - If context was lost, we suppress all delete function calls
     */
    disposeAll(contextLost) {
      const list = this.managedFramebuffers;
      this.managedFramebuffers = [];
      for (let i2 = 0; i2 < list.length; i2++)
        this.disposeFramebuffer(list[i2], contextLost);
    }
    /**
     * Forcing creation of stencil buffer for current framebuffer, if it wasn't done before.
     * Used by MaskSystem, when its time to use stencil mask for Graphics element.
     *
     * Its an alternative for public lazy `framebuffer.enableStencil`, in case we need stencil without rebind.
     * @private
     */
    forceStencil() {
      const framebuffer = this.current;
      if (!framebuffer)
        return;
      const fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
      if (!fbo || fbo.stencil && framebuffer.stencil)
        return;
      framebuffer.stencil = true;
      const w2 = framebuffer.width, h2 = framebuffer.height, gl = this.gl, stencil = fbo.stencil = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
      let stencilAttachment, stencilFormat;
      this.renderer.context.webGLVersion === 1 ? (stencilAttachment = gl.DEPTH_STENCIL_ATTACHMENT, stencilFormat = gl.DEPTH_STENCIL) : framebuffer.depth ? (stencilAttachment = gl.DEPTH_STENCIL_ATTACHMENT, stencilFormat = gl.DEPTH24_STENCIL8) : (stencilAttachment = gl.STENCIL_ATTACHMENT, stencilFormat = gl.STENCIL_INDEX8), fbo.msaaBuffer ? gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, stencilFormat, w2, h2) : gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, w2, h2), gl.framebufferRenderbuffer(gl.FRAMEBUFFER, stencilAttachment, gl.RENDERBUFFER, stencil);
    }
    /** Resets framebuffer stored state, binds screen framebuffer. Should be called before renderTexture reset(). */
    reset() {
      this.current = this.unknownFramebuffer, this.viewport = new Rectangle();
    }
    destroy() {
      this.renderer = null;
    }
  };
  FramebufferSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "framebuffer"
  };
  extensions.add(FramebufferSystem);

  // node_modules/@pixi/core/lib/geometry/GeometrySystem.mjs
  var byteSizeMap2 = { 5126: 4, 5123: 2, 5121: 1 };
  var GeometrySystem = class {
    /** @param renderer - The renderer this System works for. */
    constructor(renderer) {
      this.renderer = renderer, this._activeGeometry = null, this._activeVao = null, this.hasVao = true, this.hasInstance = true, this.canUseUInt32ElementIndex = false, this.managedGeometries = {};
    }
    /** Sets up the renderer context and necessary buffers. */
    contextChange() {
      this.disposeAll(true);
      const gl = this.gl = this.renderer.gl, context2 = this.renderer.context;
      if (this.CONTEXT_UID = this.renderer.CONTEXT_UID, context2.webGLVersion !== 2) {
        let nativeVaoExtension = this.renderer.context.extensions.vertexArrayObject;
        settings.PREFER_ENV === ENV.WEBGL_LEGACY && (nativeVaoExtension = null), nativeVaoExtension ? (gl.createVertexArray = () => nativeVaoExtension.createVertexArrayOES(), gl.bindVertexArray = (vao) => nativeVaoExtension.bindVertexArrayOES(vao), gl.deleteVertexArray = (vao) => nativeVaoExtension.deleteVertexArrayOES(vao)) : (this.hasVao = false, gl.createVertexArray = () => null, gl.bindVertexArray = () => null, gl.deleteVertexArray = () => null);
      }
      if (context2.webGLVersion !== 2) {
        const instanceExt = gl.getExtension("ANGLE_instanced_arrays");
        instanceExt ? (gl.vertexAttribDivisor = (a2, b2) => instanceExt.vertexAttribDivisorANGLE(a2, b2), gl.drawElementsInstanced = (a2, b2, c2, d3, e2) => instanceExt.drawElementsInstancedANGLE(a2, b2, c2, d3, e2), gl.drawArraysInstanced = (a2, b2, c2, d3) => instanceExt.drawArraysInstancedANGLE(a2, b2, c2, d3)) : this.hasInstance = false;
      }
      this.canUseUInt32ElementIndex = context2.webGLVersion === 2 || !!context2.extensions.uint32ElementIndex;
    }
    /**
     * Binds geometry so that is can be drawn. Creating a Vao if required
     * @param geometry - Instance of geometry to bind.
     * @param shader - Instance of shader to use vao for.
     */
    bind(geometry, shader) {
      shader = shader || this.renderer.shader.shader;
      const { gl } = this;
      let vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID], incRefCount = false;
      vaos || (this.managedGeometries[geometry.id] = geometry, geometry.disposeRunner.add(this), geometry.glVertexArrayObjects[this.CONTEXT_UID] = vaos = {}, incRefCount = true);
      const vao = vaos[shader.program.id] || this.initGeometryVao(geometry, shader, incRefCount);
      this._activeGeometry = geometry, this._activeVao !== vao && (this._activeVao = vao, this.hasVao ? gl.bindVertexArray(vao) : this.activateVao(geometry, shader.program)), this.updateBuffers();
    }
    /** Reset and unbind any active VAO and geometry. */
    reset() {
      this.unbind();
    }
    /** Update buffers of the currently bound geometry. */
    updateBuffers() {
      const geometry = this._activeGeometry, bufferSystem = this.renderer.buffer;
      for (let i2 = 0; i2 < geometry.buffers.length; i2++) {
        const buffer = geometry.buffers[i2];
        bufferSystem.update(buffer);
      }
    }
    /**
     * Check compatibility between a geometry and a program
     * @param geometry - Geometry instance.
     * @param program - Program instance.
     */
    checkCompatibility(geometry, program) {
      const geometryAttributes = geometry.attributes, shaderAttributes = program.attributeData;
      for (const j2 in shaderAttributes)
        if (!geometryAttributes[j2])
          throw new Error(`shader and geometry incompatible, geometry missing the "${j2}" attribute`);
    }
    /**
     * Takes a geometry and program and generates a unique signature for them.
     * @param geometry - To get signature from.
     * @param program - To test geometry against.
     * @returns - Unique signature of the geometry and program
     */
    getSignature(geometry, program) {
      const attribs = geometry.attributes, shaderAttributes = program.attributeData, strings = ["g", geometry.id];
      for (const i2 in attribs)
        shaderAttributes[i2] && strings.push(i2, shaderAttributes[i2].location);
      return strings.join("-");
    }
    /**
     * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
     * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
     * attribute locations.
     * @param geometry - Instance of geometry to to generate Vao for.
     * @param shader - Instance of the shader.
     * @param incRefCount - Increment refCount of all geometry buffers.
     */
    initGeometryVao(geometry, shader, incRefCount = true) {
      const gl = this.gl, CONTEXT_UID = this.CONTEXT_UID, bufferSystem = this.renderer.buffer, program = shader.program;
      program.glPrograms[CONTEXT_UID] || this.renderer.shader.generateProgram(shader), this.checkCompatibility(geometry, program);
      const signature = this.getSignature(geometry, program), vaoObjectHash = geometry.glVertexArrayObjects[this.CONTEXT_UID];
      let vao = vaoObjectHash[signature];
      if (vao)
        return vaoObjectHash[program.id] = vao, vao;
      const buffers = geometry.buffers, attributes = geometry.attributes, tempStride = {}, tempStart = {};
      for (const j2 in buffers)
        tempStride[j2] = 0, tempStart[j2] = 0;
      for (const j2 in attributes)
        !attributes[j2].size && program.attributeData[j2] ? attributes[j2].size = program.attributeData[j2].size : attributes[j2].size || console.warn(`PIXI Geometry attribute '${j2}' size cannot be determined (likely the bound shader does not have the attribute)`), tempStride[attributes[j2].buffer] += attributes[j2].size * byteSizeMap2[attributes[j2].type];
      for (const j2 in attributes) {
        const attribute = attributes[j2], attribSize = attribute.size;
        attribute.stride === void 0 && (tempStride[attribute.buffer] === attribSize * byteSizeMap2[attribute.type] ? attribute.stride = 0 : attribute.stride = tempStride[attribute.buffer]), attribute.start === void 0 && (attribute.start = tempStart[attribute.buffer], tempStart[attribute.buffer] += attribSize * byteSizeMap2[attribute.type]);
      }
      vao = gl.createVertexArray(), gl.bindVertexArray(vao);
      for (let i2 = 0; i2 < buffers.length; i2++) {
        const buffer = buffers[i2];
        bufferSystem.bind(buffer), incRefCount && buffer._glBuffers[CONTEXT_UID].refCount++;
      }
      return this.activateVao(geometry, program), vaoObjectHash[program.id] = vao, vaoObjectHash[signature] = vao, gl.bindVertexArray(null), bufferSystem.unbind(BUFFER_TYPE.ARRAY_BUFFER), vao;
    }
    /**
     * Disposes geometry.
     * @param geometry - Geometry with buffers. Only VAO will be disposed
     * @param [contextLost=false] - If context was lost, we suppress deleteVertexArray
     */
    disposeGeometry(geometry, contextLost) {
      if (!this.managedGeometries[geometry.id])
        return;
      delete this.managedGeometries[geometry.id];
      const vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID], gl = this.gl, buffers = geometry.buffers, bufferSystem = this.renderer?.buffer;
      if (geometry.disposeRunner.remove(this), !!vaos) {
        if (bufferSystem)
          for (let i2 = 0; i2 < buffers.length; i2++) {
            const buf = buffers[i2]._glBuffers[this.CONTEXT_UID];
            buf && (buf.refCount--, buf.refCount === 0 && !contextLost && bufferSystem.dispose(buffers[i2], contextLost));
          }
        if (!contextLost) {
          for (const vaoId in vaos)
            if (vaoId[0] === "g") {
              const vao = vaos[vaoId];
              this._activeVao === vao && this.unbind(), gl.deleteVertexArray(vao);
            }
        }
        delete geometry.glVertexArrayObjects[this.CONTEXT_UID];
      }
    }
    /**
     * Dispose all WebGL resources of all managed geometries.
     * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
     */
    disposeAll(contextLost) {
      const all = Object.keys(this.managedGeometries);
      for (let i2 = 0; i2 < all.length; i2++)
        this.disposeGeometry(this.managedGeometries[all[i2]], contextLost);
    }
    /**
     * Activate vertex array object.
     * @param geometry - Geometry instance.
     * @param program - Shader program instance.
     */
    activateVao(geometry, program) {
      const gl = this.gl, CONTEXT_UID = this.CONTEXT_UID, bufferSystem = this.renderer.buffer, buffers = geometry.buffers, attributes = geometry.attributes;
      geometry.indexBuffer && bufferSystem.bind(geometry.indexBuffer);
      let lastBuffer = null;
      for (const j2 in attributes) {
        const attribute = attributes[j2], buffer = buffers[attribute.buffer], glBuffer = buffer._glBuffers[CONTEXT_UID];
        if (program.attributeData[j2]) {
          lastBuffer !== glBuffer && (bufferSystem.bind(buffer), lastBuffer = glBuffer);
          const location = program.attributeData[j2].location;
          if (gl.enableVertexAttribArray(location), gl.vertexAttribPointer(
            location,
            attribute.size,
            attribute.type || gl.FLOAT,
            attribute.normalized,
            attribute.stride,
            attribute.start
          ), attribute.instance)
            if (this.hasInstance)
              gl.vertexAttribDivisor(location, attribute.divisor);
            else
              throw new Error("geometry error, GPU Instancing is not supported on this device");
        }
      }
    }
    /**
     * Draws the currently bound geometry.
     * @param type - The type primitive to render.
     * @param size - The number of elements to be rendered. If not specified, all vertices after the
     *  starting vertex will be drawn.
     * @param start - The starting vertex in the geometry to start drawing from. If not specified,
     *  drawing will start from the first vertex.
     * @param instanceCount - The number of instances of the set of elements to execute. If not specified,
     *  all instances will be drawn.
     */
    draw(type, size, start, instanceCount) {
      const { gl } = this, geometry = this._activeGeometry;
      if (geometry.indexBuffer) {
        const byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT, glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
        byteSize === 2 || byteSize === 4 && this.canUseUInt32ElementIndex ? geometry.instanced ? gl.drawElementsInstanced(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount || 1) : gl.drawElements(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize) : console.warn("unsupported index buffer type: uint32");
      } else
        geometry.instanced ? gl.drawArraysInstanced(type, start, size || geometry.getSize(), instanceCount || 1) : gl.drawArrays(type, start, size || geometry.getSize());
      return this;
    }
    /** Unbind/reset everything. */
    unbind() {
      this.gl.bindVertexArray(null), this._activeVao = null, this._activeGeometry = null;
    }
    destroy() {
      this.renderer = null;
    }
  };
  GeometrySystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "geometry"
  };
  extensions.add(GeometrySystem);

  // node_modules/@pixi/core/lib/textures/TextureMatrix.mjs
  var tempMat = new Matrix();
  var TextureMatrix = class {
    /**
     * @param texture - observed texture
     * @param clampMargin - Changes frame clamping, 0.5 by default. Use -0.5 for extra border.
     */
    constructor(texture, clampMargin) {
      this._texture = texture, this.mapCoord = new Matrix(), this.uClampFrame = new Float32Array(4), this.uClampOffset = new Float32Array(2), this._textureID = -1, this._updateID = 0, this.clampOffset = 0, this.clampMargin = typeof clampMargin > "u" ? 0.5 : clampMargin, this.isSimple = false;
    }
    /** Texture property. */
    get texture() {
      return this._texture;
    }
    set texture(value) {
      this._texture = value, this._textureID = -1;
    }
    /**
     * Multiplies uvs array to transform
     * @param uvs - mesh uvs
     * @param [out=uvs] - output
     * @returns - output
     */
    multiplyUvs(uvs, out) {
      out === void 0 && (out = uvs);
      const mat = this.mapCoord;
      for (let i2 = 0; i2 < uvs.length; i2 += 2) {
        const x2 = uvs[i2], y2 = uvs[i2 + 1];
        out[i2] = x2 * mat.a + y2 * mat.c + mat.tx, out[i2 + 1] = x2 * mat.b + y2 * mat.d + mat.ty;
      }
      return out;
    }
    /**
     * Updates matrices if texture was changed.
     * @param [forceUpdate=false] - if true, matrices will be updated any case
     * @returns - Whether or not it was updated
     */
    update(forceUpdate) {
      const tex = this._texture;
      if (!tex || !tex.valid || !forceUpdate && this._textureID === tex._updateID)
        return false;
      this._textureID = tex._updateID, this._updateID++;
      const uvs = tex._uvs;
      this.mapCoord.set(uvs.x1 - uvs.x0, uvs.y1 - uvs.y0, uvs.x3 - uvs.x0, uvs.y3 - uvs.y0, uvs.x0, uvs.y0);
      const orig = tex.orig, trim = tex.trim;
      trim && (tempMat.set(
        orig.width / trim.width,
        0,
        0,
        orig.height / trim.height,
        -trim.x / trim.width,
        -trim.y / trim.height
      ), this.mapCoord.append(tempMat));
      const texBase = tex.baseTexture, frame = this.uClampFrame, margin = this.clampMargin / texBase.resolution, offset = this.clampOffset;
      return frame[0] = (tex._frame.x + margin + offset) / texBase.width, frame[1] = (tex._frame.y + margin + offset) / texBase.height, frame[2] = (tex._frame.x + tex._frame.width - margin + offset) / texBase.width, frame[3] = (tex._frame.y + tex._frame.height - margin + offset) / texBase.height, this.uClampOffset[0] = offset / texBase.realWidth, this.uClampOffset[1] = offset / texBase.realHeight, this.isSimple = tex._frame.width === texBase.width && tex._frame.height === texBase.height && tex.rotate === 0, true;
    }
  };

  // node_modules/@pixi/core/lib/filters/spriteMask/spriteMaskFilter.frag.mjs
  var fragment = `varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
        step(maskClamp.x, vMaskCoord.x) +
        step(maskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, maskClamp.z) +
        step(vMaskCoord.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * alpha * clip);

    gl_FragColor = original;
}
`;

  // node_modules/@pixi/core/lib/filters/spriteMask/spriteMaskFilter.vert.mjs
  var vertex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;
}
`;

  // node_modules/@pixi/core/lib/filters/spriteMask/SpriteMaskFilter.mjs
  var SpriteMaskFilter = class extends Filter {
    /** @ignore */
    constructor(vertexSrc, fragmentSrc, uniforms) {
      let sprite = null;
      typeof vertexSrc != "string" && fragmentSrc === void 0 && uniforms === void 0 && (sprite = vertexSrc, vertexSrc = void 0, fragmentSrc = void 0, uniforms = void 0), super(vertexSrc || vertex, fragmentSrc || fragment, uniforms), this.maskSprite = sprite, this.maskMatrix = new Matrix();
    }
    /**
     * Sprite mask
     * @type {PIXI.DisplayObject}
     */
    get maskSprite() {
      return this._maskSprite;
    }
    set maskSprite(value) {
      this._maskSprite = value, this._maskSprite && (this._maskSprite.renderable = false);
    }
    /**
     * Applies the filter
     * @param filterManager - The renderer to retrieve the filter from
     * @param input - The input render target.
     * @param output - The target to output to.
     * @param clearMode - Should the output be cleared before rendering to it.
     */
    apply(filterManager, input, output, clearMode) {
      const maskSprite = this._maskSprite, tex = maskSprite._texture;
      tex.valid && (tex.uvMatrix || (tex.uvMatrix = new TextureMatrix(tex, 0)), tex.uvMatrix.update(), this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0 : 1, this.uniforms.mask = tex, this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite).prepend(tex.uvMatrix.mapCoord), this.uniforms.alpha = maskSprite.worldAlpha, this.uniforms.maskClamp = tex.uvMatrix.uClampFrame, filterManager.applyFilter(this, input, output, clearMode));
    }
  };

  // node_modules/@pixi/core/lib/mask/MaskData.mjs
  var MaskData = class {
    /**
     * Create MaskData
     * @param {PIXI.DisplayObject} [maskObject=null] - object that describes the mask
     */
    constructor(maskObject = null) {
      this.type = MASK_TYPES.NONE, this.autoDetect = true, this.maskObject = maskObject || null, this.pooled = false, this.isMaskData = true, this.resolution = null, this.multisample = Filter.defaultMultisample, this.enabled = true, this.colorMask = 15, this._filters = null, this._stencilCounter = 0, this._scissorCounter = 0, this._scissorRect = null, this._scissorRectLocal = null, this._colorMask = 15, this._target = null;
    }
    /**
     * The sprite mask filter.
     * If set to `null`, the default sprite mask filter is used.
     * @default null
     */
    get filter() {
      return this._filters ? this._filters[0] : null;
    }
    set filter(value) {
      value ? this._filters ? this._filters[0] = value : this._filters = [value] : this._filters = null;
    }
    /** Resets the mask data after popMask(). */
    reset() {
      this.pooled && (this.maskObject = null, this.type = MASK_TYPES.NONE, this.autoDetect = true), this._target = null, this._scissorRectLocal = null;
    }
    /**
     * Copies counters from maskData above, called from pushMask().
     * @param maskAbove
     */
    copyCountersOrReset(maskAbove) {
      maskAbove ? (this._stencilCounter = maskAbove._stencilCounter, this._scissorCounter = maskAbove._scissorCounter, this._scissorRect = maskAbove._scissorRect) : (this._stencilCounter = 0, this._scissorCounter = 0, this._scissorRect = null);
    }
  };

  // node_modules/@pixi/core/lib/mask/MaskSystem.mjs
  var MaskSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.enableScissor = true, this.alphaMaskPool = [], this.maskDataPool = [], this.maskStack = [], this.alphaMaskIndex = 0;
    }
    /**
     * Changes the mask stack that is used by this System.
     * @param maskStack - The mask stack
     */
    setMaskStack(maskStack) {
      this.maskStack = maskStack, this.renderer.scissor.setMaskStack(maskStack), this.renderer.stencil.setMaskStack(maskStack);
    }
    /**
     * Enables the mask and appends it to the current mask stack.
     *
     * NOTE: The batch renderer should be flushed beforehand to prevent pending renders from being masked.
     * @param {PIXI.DisplayObject} target - Display Object to push the mask to
     * @param {PIXI.MaskData|PIXI.Sprite|PIXI.Graphics|PIXI.DisplayObject} maskDataOrTarget - The masking data.
     */
    push(target, maskDataOrTarget) {
      let maskData = maskDataOrTarget;
      if (!maskData.isMaskData) {
        const d3 = this.maskDataPool.pop() || new MaskData();
        d3.pooled = true, d3.maskObject = maskDataOrTarget, maskData = d3;
      }
      const maskAbove = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;
      if (maskData.copyCountersOrReset(maskAbove), maskData._colorMask = maskAbove ? maskAbove._colorMask : 15, maskData.autoDetect && this.detect(maskData), maskData._target = target, maskData.type !== MASK_TYPES.SPRITE && this.maskStack.push(maskData), maskData.enabled)
        switch (maskData.type) {
          case MASK_TYPES.SCISSOR:
            this.renderer.scissor.push(maskData);
            break;
          case MASK_TYPES.STENCIL:
            this.renderer.stencil.push(maskData);
            break;
          case MASK_TYPES.SPRITE:
            maskData.copyCountersOrReset(null), this.pushSpriteMask(maskData);
            break;
          case MASK_TYPES.COLOR:
            this.pushColorMask(maskData);
            break;
          default:
            break;
        }
      maskData.type === MASK_TYPES.SPRITE && this.maskStack.push(maskData);
    }
    /**
     * Removes the last mask from the mask stack and doesn't return it.
     *
     * NOTE: The batch renderer should be flushed beforehand to render the masked contents before the mask is removed.
     * @param {PIXI.IMaskTarget} target - Display Object to pop the mask from
     */
    pop(target) {
      const maskData = this.maskStack.pop();
      if (!(!maskData || maskData._target !== target)) {
        if (maskData.enabled)
          switch (maskData.type) {
            case MASK_TYPES.SCISSOR:
              this.renderer.scissor.pop(maskData);
              break;
            case MASK_TYPES.STENCIL:
              this.renderer.stencil.pop(maskData.maskObject);
              break;
            case MASK_TYPES.SPRITE:
              this.popSpriteMask(maskData);
              break;
            case MASK_TYPES.COLOR:
              this.popColorMask(maskData);
              break;
            default:
              break;
          }
        if (maskData.reset(), maskData.pooled && this.maskDataPool.push(maskData), this.maskStack.length !== 0) {
          const maskCurrent = this.maskStack[this.maskStack.length - 1];
          maskCurrent.type === MASK_TYPES.SPRITE && maskCurrent._filters && (maskCurrent._filters[0].maskSprite = maskCurrent.maskObject);
        }
      }
    }
    /**
     * Sets type of MaskData based on its maskObject.
     * @param maskData
     */
    detect(maskData) {
      const maskObject = maskData.maskObject;
      maskObject ? maskObject.isSprite ? maskData.type = MASK_TYPES.SPRITE : this.enableScissor && this.renderer.scissor.testScissor(maskData) ? maskData.type = MASK_TYPES.SCISSOR : maskData.type = MASK_TYPES.STENCIL : maskData.type = MASK_TYPES.COLOR;
    }
    /**
     * Applies the Mask and adds it to the current filter stack.
     * @param maskData - Sprite to be used as the mask.
     */
    pushSpriteMask(maskData) {
      const { maskObject } = maskData, target = maskData._target;
      let alphaMaskFilter = maskData._filters;
      alphaMaskFilter || (alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex], alphaMaskFilter || (alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter()])), alphaMaskFilter[0].resolution = maskData.resolution, alphaMaskFilter[0].multisample = maskData.multisample, alphaMaskFilter[0].maskSprite = maskObject;
      const stashFilterArea = target.filterArea;
      target.filterArea = maskObject.getBounds(true), this.renderer.filter.push(target, alphaMaskFilter), target.filterArea = stashFilterArea, maskData._filters || this.alphaMaskIndex++;
    }
    /**
     * Removes the last filter from the filter stack and doesn't return it.
     * @param maskData - Sprite to be used as the mask.
     */
    popSpriteMask(maskData) {
      this.renderer.filter.pop(), maskData._filters ? maskData._filters[0].maskSprite = null : (this.alphaMaskIndex--, this.alphaMaskPool[this.alphaMaskIndex][0].maskSprite = null);
    }
    /**
     * Pushes the color mask.
     * @param maskData - The mask data
     */
    pushColorMask(maskData) {
      const currColorMask = maskData._colorMask, nextColorMask = maskData._colorMask = currColorMask & maskData.colorMask;
      nextColorMask !== currColorMask && this.renderer.gl.colorMask(
        (nextColorMask & 1) !== 0,
        (nextColorMask & 2) !== 0,
        (nextColorMask & 4) !== 0,
        (nextColorMask & 8) !== 0
      );
    }
    /**
     * Pops the color mask.
     * @param maskData - The mask data
     */
    popColorMask(maskData) {
      const currColorMask = maskData._colorMask, nextColorMask = this.maskStack.length > 0 ? this.maskStack[this.maskStack.length - 1]._colorMask : 15;
      nextColorMask !== currColorMask && this.renderer.gl.colorMask(
        (nextColorMask & 1) !== 0,
        (nextColorMask & 2) !== 0,
        (nextColorMask & 4) !== 0,
        (nextColorMask & 8) !== 0
      );
    }
    destroy() {
      this.renderer = null;
    }
  };
  MaskSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "mask"
  };
  extensions.add(MaskSystem);

  // node_modules/@pixi/core/lib/mask/AbstractMaskSystem.mjs
  var AbstractMaskSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.maskStack = [], this.glConst = 0;
    }
    /** Gets count of masks of certain type. */
    getStackLength() {
      return this.maskStack.length;
    }
    /**
     * Changes the mask stack that is used by this System.
     * @param {PIXI.MaskData[]} maskStack - The mask stack
     */
    setMaskStack(maskStack) {
      const { gl } = this.renderer, curStackLen = this.getStackLength();
      this.maskStack = maskStack;
      const newStackLen = this.getStackLength();
      newStackLen !== curStackLen && (newStackLen === 0 ? gl.disable(this.glConst) : (gl.enable(this.glConst), this._useCurrent()));
    }
    /**
     * Setup renderer to use the current mask data.
     * @private
     */
    _useCurrent() {
    }
    /** Destroys the mask stack. */
    destroy() {
      this.renderer = null, this.maskStack = null;
    }
  };

  // node_modules/@pixi/core/lib/mask/ScissorSystem.mjs
  var tempMatrix2 = new Matrix();
  var rectPool = [];
  var _ScissorSystem = class _ScissorSystem2 extends AbstractMaskSystem {
    /**
     * @param {PIXI.Renderer} renderer - The renderer this System works for.
     */
    constructor(renderer) {
      super(renderer), this.glConst = settings.ADAPTER.getWebGLRenderingContext().SCISSOR_TEST;
    }
    getStackLength() {
      const maskData = this.maskStack[this.maskStack.length - 1];
      return maskData ? maskData._scissorCounter : 0;
    }
    /**
     * evaluates _boundsTransformed, _scissorRect for MaskData
     * @param maskData
     */
    calcScissorRect(maskData) {
      if (maskData._scissorRectLocal)
        return;
      const prevData = maskData._scissorRect, { maskObject } = maskData, { renderer } = this, renderTextureSystem = renderer.renderTexture, rect = maskObject.getBounds(true, rectPool.pop() ?? new Rectangle());
      this.roundFrameToPixels(
        rect,
        renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution,
        renderTextureSystem.sourceFrame,
        renderTextureSystem.destinationFrame,
        renderer.projection.transform
      ), prevData && rect.fit(prevData), maskData._scissorRectLocal = rect;
    }
    static isMatrixRotated(matrix) {
      if (!matrix)
        return false;
      const { a: a2, b: b2, c: c2, d: d3 } = matrix;
      return (Math.abs(b2) > 1e-4 || Math.abs(c2) > 1e-4) && (Math.abs(a2) > 1e-4 || Math.abs(d3) > 1e-4);
    }
    /**
     * Test, whether the object can be scissor mask with current renderer projection.
     * Calls "calcScissorRect()" if its true.
     * @param maskData - mask data
     * @returns whether Whether the object can be scissor mask
     */
    testScissor(maskData) {
      const { maskObject } = maskData;
      if (!maskObject.isFastRect || !maskObject.isFastRect() || _ScissorSystem2.isMatrixRotated(maskObject.worldTransform) || _ScissorSystem2.isMatrixRotated(this.renderer.projection.transform))
        return false;
      this.calcScissorRect(maskData);
      const rect = maskData._scissorRectLocal;
      return rect.width > 0 && rect.height > 0;
    }
    roundFrameToPixels(frame, resolution, bindingSourceFrame, bindingDestinationFrame, transform) {
      _ScissorSystem2.isMatrixRotated(transform) || (transform = transform ? tempMatrix2.copyFrom(transform) : tempMatrix2.identity(), transform.translate(-bindingSourceFrame.x, -bindingSourceFrame.y).scale(
        bindingDestinationFrame.width / bindingSourceFrame.width,
        bindingDestinationFrame.height / bindingSourceFrame.height
      ).translate(bindingDestinationFrame.x, bindingDestinationFrame.y), this.renderer.filter.transformAABB(transform, frame), frame.fit(bindingDestinationFrame), frame.x = Math.round(frame.x * resolution), frame.y = Math.round(frame.y * resolution), frame.width = Math.round(frame.width * resolution), frame.height = Math.round(frame.height * resolution));
    }
    /**
     * Applies the Mask and adds it to the current stencil stack.
     * @author alvin
     * @param maskData - The mask data.
     */
    push(maskData) {
      maskData._scissorRectLocal || this.calcScissorRect(maskData);
      const { gl } = this.renderer;
      maskData._scissorRect || gl.enable(gl.SCISSOR_TEST), maskData._scissorCounter++, maskData._scissorRect = maskData._scissorRectLocal, this._useCurrent();
    }
    /**
     * This should be called after a mask is popped off the mask stack. It will rebind the scissor box to be latest with the
     * last mask in the stack.
     *
     * This can also be called when you directly modify the scissor box and want to restore PixiJS state.
     * @param maskData - The mask data.
     */
    pop(maskData) {
      const { gl } = this.renderer;
      maskData && rectPool.push(maskData._scissorRectLocal), this.getStackLength() > 0 ? this._useCurrent() : gl.disable(gl.SCISSOR_TEST);
    }
    /**
     * Setup renderer to use the current scissor data.
     * @private
     */
    _useCurrent() {
      const rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
      let y2;
      this.renderer.renderTexture.current ? y2 = rect.y : y2 = this.renderer.height - rect.height - rect.y, this.renderer.gl.scissor(rect.x, y2, rect.width, rect.height);
    }
  };
  _ScissorSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "scissor"
  };
  var ScissorSystem = _ScissorSystem;
  extensions.add(ScissorSystem);

  // node_modules/@pixi/core/lib/mask/StencilSystem.mjs
  var StencilSystem = class extends AbstractMaskSystem {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      super(renderer), this.glConst = settings.ADAPTER.getWebGLRenderingContext().STENCIL_TEST;
    }
    getStackLength() {
      const maskData = this.maskStack[this.maskStack.length - 1];
      return maskData ? maskData._stencilCounter : 0;
    }
    /**
     * Applies the Mask and adds it to the current stencil stack.
     * @param maskData - The mask data
     */
    push(maskData) {
      const maskObject = maskData.maskObject, { gl } = this.renderer, prevMaskCount = maskData._stencilCounter;
      prevMaskCount === 0 && (this.renderer.framebuffer.forceStencil(), gl.clearStencil(0), gl.clear(gl.STENCIL_BUFFER_BIT), gl.enable(gl.STENCIL_TEST)), maskData._stencilCounter++;
      const colorMask = maskData._colorMask;
      colorMask !== 0 && (maskData._colorMask = 0, gl.colorMask(false, false, false, false)), gl.stencilFunc(gl.EQUAL, prevMaskCount, 4294967295), gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR), maskObject.renderable = true, maskObject.render(this.renderer), this.renderer.batch.flush(), maskObject.renderable = false, colorMask !== 0 && (maskData._colorMask = colorMask, gl.colorMask(
        (colorMask & 1) !== 0,
        (colorMask & 2) !== 0,
        (colorMask & 4) !== 0,
        (colorMask & 8) !== 0
      )), this._useCurrent();
    }
    /**
     * Pops stencil mask. MaskData is already removed from stack
     * @param {PIXI.DisplayObject} maskObject - object of popped mask data
     */
    pop(maskObject) {
      const gl = this.renderer.gl;
      if (this.getStackLength() === 0)
        gl.disable(gl.STENCIL_TEST);
      else {
        const maskData = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null, colorMask = maskData ? maskData._colorMask : 15;
        colorMask !== 0 && (maskData._colorMask = 0, gl.colorMask(false, false, false, false)), gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR), maskObject.renderable = true, maskObject.render(this.renderer), this.renderer.batch.flush(), maskObject.renderable = false, colorMask !== 0 && (maskData._colorMask = colorMask, gl.colorMask(
          (colorMask & 1) !== 0,
          (colorMask & 2) !== 0,
          (colorMask & 4) !== 0,
          (colorMask & 8) !== 0
        )), this._useCurrent();
      }
    }
    /**
     * Setup renderer to use the current stencil data.
     * @private
     */
    _useCurrent() {
      const gl = this.renderer.gl;
      gl.stencilFunc(gl.EQUAL, this.getStackLength(), 4294967295), gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }
  };
  StencilSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "stencil"
  };
  extensions.add(StencilSystem);

  // node_modules/@pixi/core/lib/plugin/PluginSystem.mjs
  var PluginSystem = class {
    constructor(renderer) {
      this.renderer = renderer, this.plugins = {}, Object.defineProperties(this.plugins, {
        extract: {
          enumerable: false,
          get() {
            return deprecation("7.0.0", "renderer.plugins.extract has moved to renderer.extract"), renderer.extract;
          }
        },
        prepare: {
          enumerable: false,
          get() {
            return deprecation("7.0.0", "renderer.plugins.prepare has moved to renderer.prepare"), renderer.prepare;
          }
        },
        interaction: {
          enumerable: false,
          get() {
            return deprecation("7.0.0", "renderer.plugins.interaction has been deprecated, use renderer.events"), renderer.events;
          }
        }
      });
    }
    /**
     * Initialize the plugins.
     * @protected
     */
    init() {
      const staticMap = this.rendererPlugins;
      for (const o2 in staticMap)
        this.plugins[o2] = new staticMap[o2](this.renderer);
    }
    destroy() {
      for (const o2 in this.plugins)
        this.plugins[o2].destroy(), this.plugins[o2] = null;
    }
  };
  PluginSystem.extension = {
    type: [
      ExtensionType.RendererSystem,
      ExtensionType.CanvasRendererSystem
    ],
    name: "_plugin"
  };
  extensions.add(PluginSystem);

  // node_modules/@pixi/core/lib/projection/ProjectionSystem.mjs
  var ProjectionSystem = class {
    /** @param renderer - The renderer this System works for. */
    constructor(renderer) {
      this.renderer = renderer, this.destinationFrame = null, this.sourceFrame = null, this.defaultFrame = null, this.projectionMatrix = new Matrix(), this.transform = null;
    }
    /**
     * Updates the projection-matrix based on the sourceFrame → destinationFrame mapping provided.
     *
     * NOTE: It is expected you call `renderer.framebuffer.setViewport(destinationFrame)` after this. This is because
     * the framebuffer viewport converts shader vertex output in normalized device coordinates to window coordinates.
     *
     * NOTE-2: {@link PIXI.RenderTextureSystem#bind} updates the projection-matrix when you bind a render-texture.
     * It is expected
     * that you dirty the current bindings when calling this manually.
     * @param destinationFrame - The rectangle in the render-target to render the contents into. If rendering to the canvas,
     *  the origin is on the top-left; if rendering to a render-texture, the origin is on the bottom-left.
     * @param sourceFrame - The rectangle in world space that contains the contents being rendered.
     * @param resolution - The resolution of the render-target, which is the ratio of
     *  world-space (or CSS) pixels to physical pixels.
     * @param root - Whether the render-target is the screen. This is required because rendering to textures
     *  is y-flipped (i.e. upside down relative to the screen).
     */
    update(destinationFrame, sourceFrame, resolution, root) {
      this.destinationFrame = destinationFrame || this.destinationFrame || this.defaultFrame, this.sourceFrame = sourceFrame || this.sourceFrame || destinationFrame, this.calculateProjection(this.destinationFrame, this.sourceFrame, resolution, root), this.transform && this.projectionMatrix.append(this.transform);
      const renderer = this.renderer;
      renderer.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix, renderer.globalUniforms.update(), renderer.shader.shader && renderer.shader.syncUniformGroup(renderer.shader.shader.uniforms.globals);
    }
    /**
     * Calculates the `projectionMatrix` to map points inside `sourceFrame` to inside `destinationFrame`.
     * @param _destinationFrame - The destination frame in the render-target.
     * @param sourceFrame - The source frame in world space.
     * @param _resolution - The render-target's resolution, i.e. ratio of CSS to physical pixels.
     * @param root - Whether rendering into the screen. Otherwise, if rendering to a framebuffer, the projection
     *  is y-flipped.
     */
    calculateProjection(_destinationFrame, sourceFrame, _resolution, root) {
      const pm = this.projectionMatrix, sign2 = root ? -1 : 1;
      pm.identity(), pm.a = 1 / sourceFrame.width * 2, pm.d = sign2 * (1 / sourceFrame.height * 2), pm.tx = -1 - sourceFrame.x * pm.a, pm.ty = -sign2 - sourceFrame.y * pm.d;
    }
    /**
     * Sets the transform of the active render target to the given matrix.
     * @param _matrix - The transformation matrix
     */
    setTransform(_matrix) {
    }
    destroy() {
      this.renderer = null;
    }
  };
  ProjectionSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "projection"
  };
  extensions.add(ProjectionSystem);

  // node_modules/@pixi/core/lib/renderTexture/GenerateTextureSystem.mjs
  var tempTransform = new Transform();
  var tempRect = new Rectangle();
  var GenerateTextureSystem = class {
    constructor(renderer) {
      this.renderer = renderer, this._tempMatrix = new Matrix();
    }
    /**
     * A Useful function that returns a texture of the display object that can then be used to create sprites
     * This can be quite useful if your displayObject is complicated and needs to be reused multiple times.
     * @param displayObject - The displayObject the object will be generated from.
     * @param {IGenerateTextureOptions} options - Generate texture options.
     * @param {PIXI.Rectangle} options.region - The region of the displayObject, that shall be rendered,
     *        if no region is specified, defaults to the local bounds of the displayObject.
     * @param {number} [options.resolution] - If not given, the renderer's resolution is used.
     * @param {PIXI.MSAA_QUALITY} [options.multisample] - If not given, the renderer's multisample is used.
     * @returns a shiny new texture of the display object passed in
     */
    generateTexture(displayObject, options) {
      const { region: manualRegion, ...textureOptions } = options || {}, region = manualRegion?.copyTo(tempRect) || displayObject.getLocalBounds(tempRect, true), resolution = textureOptions.resolution || this.renderer.resolution;
      region.width = Math.max(region.width, 1 / resolution), region.height = Math.max(region.height, 1 / resolution), textureOptions.width = region.width, textureOptions.height = region.height, textureOptions.resolution = resolution, textureOptions.multisample ?? (textureOptions.multisample = this.renderer.multisample);
      const renderTexture = RenderTexture.create(textureOptions);
      this._tempMatrix.tx = -region.x, this._tempMatrix.ty = -region.y;
      const transform = displayObject.transform;
      return displayObject.transform = tempTransform, this.renderer.render(displayObject, {
        renderTexture,
        transform: this._tempMatrix,
        skipUpdateTransform: !!displayObject.parent,
        blit: true
      }), displayObject.transform = transform, renderTexture;
    }
    destroy() {
    }
  };
  GenerateTextureSystem.extension = {
    type: [
      ExtensionType.RendererSystem,
      ExtensionType.CanvasRendererSystem
    ],
    name: "textureGenerator"
  };
  extensions.add(GenerateTextureSystem);

  // node_modules/@pixi/core/lib/renderTexture/RenderTextureSystem.mjs
  var tempRect2 = new Rectangle();
  var tempRect22 = new Rectangle();
  var RenderTextureSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.defaultMaskStack = [], this.current = null, this.sourceFrame = new Rectangle(), this.destinationFrame = new Rectangle(), this.viewportFrame = new Rectangle();
    }
    contextChange() {
      const attributes = this.renderer?.gl.getContextAttributes();
      this._rendererPremultipliedAlpha = !!(attributes && attributes.alpha && attributes.premultipliedAlpha);
    }
    /**
     * Bind the current render texture.
     * @param renderTexture - RenderTexture to bind, by default its `null` - the screen.
     * @param sourceFrame - Part of world that is mapped to the renderTexture.
     * @param destinationFrame - Part of renderTexture, by default it has the same size as sourceFrame.
     */
    bind(renderTexture = null, sourceFrame, destinationFrame) {
      const renderer = this.renderer;
      this.current = renderTexture;
      let baseTexture, framebuffer, resolution;
      renderTexture ? (baseTexture = renderTexture.baseTexture, resolution = baseTexture.resolution, sourceFrame || (tempRect2.width = renderTexture.frame.width, tempRect2.height = renderTexture.frame.height, sourceFrame = tempRect2), destinationFrame || (tempRect22.x = renderTexture.frame.x, tempRect22.y = renderTexture.frame.y, tempRect22.width = sourceFrame.width, tempRect22.height = sourceFrame.height, destinationFrame = tempRect22), framebuffer = baseTexture.framebuffer) : (resolution = renderer.resolution, sourceFrame || (tempRect2.width = renderer._view.screen.width, tempRect2.height = renderer._view.screen.height, sourceFrame = tempRect2), destinationFrame || (destinationFrame = tempRect2, destinationFrame.width = sourceFrame.width, destinationFrame.height = sourceFrame.height));
      const viewportFrame = this.viewportFrame;
      viewportFrame.x = destinationFrame.x * resolution, viewportFrame.y = destinationFrame.y * resolution, viewportFrame.width = destinationFrame.width * resolution, viewportFrame.height = destinationFrame.height * resolution, renderTexture || (viewportFrame.y = renderer.view.height - (viewportFrame.y + viewportFrame.height)), viewportFrame.ceil(), this.renderer.framebuffer.bind(framebuffer, viewportFrame), this.renderer.projection.update(destinationFrame, sourceFrame, resolution, !framebuffer), renderTexture ? this.renderer.mask.setMaskStack(baseTexture.maskStack) : this.renderer.mask.setMaskStack(this.defaultMaskStack), this.sourceFrame.copyFrom(sourceFrame), this.destinationFrame.copyFrom(destinationFrame);
    }
    /**
     * Erases the render texture and fills the drawing area with a colour.
     * @param clearColor - The color as rgba, default to use the renderer backgroundColor
     * @param [mask=BUFFER_BITS.COLOR | BUFFER_BITS.DEPTH] - Bitwise OR of masks
     *  that indicate the buffers to be cleared, by default COLOR and DEPTH buffers.
     */
    clear(clearColor, mask) {
      const fallbackColor = this.current ? this.current.baseTexture.clear : this.renderer.background.backgroundColor, color = Color.shared.setValue(clearColor || fallbackColor);
      (this.current && this.current.baseTexture.alphaMode > 0 || !this.current && this._rendererPremultipliedAlpha) && color.premultiply(color.alpha);
      const destinationFrame = this.destinationFrame, baseFrame = this.current ? this.current.baseTexture : this.renderer._view.screen, clearMask = destinationFrame.width !== baseFrame.width || destinationFrame.height !== baseFrame.height;
      if (clearMask) {
        let { x: x2, y: y2, width, height } = this.viewportFrame;
        x2 = Math.round(x2), y2 = Math.round(y2), width = Math.round(width), height = Math.round(height), this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST), this.renderer.gl.scissor(x2, y2, width, height);
      }
      this.renderer.framebuffer.clear(color.red, color.green, color.blue, color.alpha, mask), clearMask && this.renderer.scissor.pop();
    }
    resize() {
      this.bind(null);
    }
    /** Resets render-texture state. */
    reset() {
      this.bind(null);
    }
    destroy() {
      this.renderer = null;
    }
  };
  RenderTextureSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "renderTexture"
  };
  extensions.add(RenderTextureSystem);

  // node_modules/@pixi/core/lib/shader/GLProgram.mjs
  var GLProgram = class {
    /**
     * Makes a new Pixi program.
     * @param program - webgl program
     * @param uniformData - uniforms
     */
    constructor(program, uniformData) {
      this.program = program, this.uniformData = uniformData, this.uniformGroups = {}, this.uniformDirtyGroups = {}, this.uniformBufferBindings = {};
    }
    /** Destroys this program. */
    destroy() {
      this.uniformData = null, this.uniformGroups = null, this.uniformDirtyGroups = null, this.uniformBufferBindings = null, this.program = null;
    }
  };

  // node_modules/@pixi/core/lib/shader/utils/getAttributeData.mjs
  function getAttributeData(program, gl) {
    const attributes = {}, totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i2 = 0; i2 < totalAttributes; i2++) {
      const attribData = gl.getActiveAttrib(program, i2);
      if (attribData.name.startsWith("gl_"))
        continue;
      const type = mapType(gl, attribData.type), data = {
        type,
        name: attribData.name,
        size: mapSize(type),
        location: gl.getAttribLocation(program, attribData.name)
      };
      attributes[attribData.name] = data;
    }
    return attributes;
  }

  // node_modules/@pixi/core/lib/shader/utils/getUniformData.mjs
  function getUniformData(program, gl) {
    const uniforms = {}, totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i2 = 0; i2 < totalUniforms; i2++) {
      const uniformData = gl.getActiveUniform(program, i2), name = uniformData.name.replace(/\[.*?\]$/, ""), isArray = !!uniformData.name.match(/\[.*?\]$/), type = mapType(gl, uniformData.type);
      uniforms[name] = {
        name,
        index: i2,
        type,
        size: uniformData.size,
        isArray,
        value: defaultValue(type, uniformData.size)
      };
    }
    return uniforms;
  }

  // node_modules/@pixi/core/lib/shader/utils/generateProgram.mjs
  function generateProgram(gl, program) {
    const glVertShader = compileShader(gl, gl.VERTEX_SHADER, program.vertexSrc), glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, program.fragmentSrc), webGLProgram = gl.createProgram();
    gl.attachShader(webGLProgram, glVertShader), gl.attachShader(webGLProgram, glFragShader);
    const transformFeedbackVaryings = program.extra?.transformFeedbackVaryings;
    if (transformFeedbackVaryings && (typeof gl.transformFeedbackVaryings != "function" ? console.warn("TransformFeedback is not supported but TransformFeedbackVaryings are given.") : gl.transformFeedbackVaryings(
      webGLProgram,
      transformFeedbackVaryings.names,
      transformFeedbackVaryings.bufferMode === "separate" ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS
    )), gl.linkProgram(webGLProgram), gl.getProgramParameter(webGLProgram, gl.LINK_STATUS) || logProgramError(gl, webGLProgram, glVertShader, glFragShader), program.attributeData = getAttributeData(webGLProgram, gl), program.uniformData = getUniformData(webGLProgram, gl), !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(program.vertexSrc)) {
      const keys2 = Object.keys(program.attributeData);
      keys2.sort((a2, b2) => a2 > b2 ? 1 : -1);
      for (let i2 = 0; i2 < keys2.length; i2++)
        program.attributeData[keys2[i2]].location = i2, gl.bindAttribLocation(webGLProgram, i2, keys2[i2]);
      gl.linkProgram(webGLProgram);
    }
    gl.deleteShader(glVertShader), gl.deleteShader(glFragShader);
    const uniformData = {};
    for (const i2 in program.uniformData) {
      const data = program.uniformData[i2];
      uniformData[i2] = {
        location: gl.getUniformLocation(webGLProgram, i2),
        value: defaultValue(data.type, data.size)
      };
    }
    return new GLProgram(webGLProgram, uniformData);
  }

  // node_modules/@pixi/core/lib/shader/utils/generateUniformBufferSync.mjs
  function uboUpdate(_ud, _uv, _renderer, _syncData, buffer) {
    _renderer.buffer.update(buffer);
  }
  var UBO_TO_SINGLE_SETTERS = {
    float: `
        data[offset] = v;
    `,
    vec2: `
        data[offset] = v[0];
        data[offset+1] = v[1];
    `,
    vec3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

    `,
    vec4: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];
        data[offset+3] = v[3];
    `,
    mat2: `
        data[offset] = v[0];
        data[offset+1] = v[1];

        data[offset+4] = v[2];
        data[offset+5] = v[3];
    `,
    mat3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];

        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];
    `,
    mat4: `
        for(var i = 0; i < 16; i++)
        {
            data[offset + i] = v[i];
        }
    `
  };
  var GLSL_TO_STD40_SIZE = {
    float: 4,
    vec2: 8,
    vec3: 12,
    vec4: 16,
    int: 4,
    ivec2: 8,
    ivec3: 12,
    ivec4: 16,
    uint: 4,
    uvec2: 8,
    uvec3: 12,
    uvec4: 16,
    bool: 4,
    bvec2: 8,
    bvec3: 12,
    bvec4: 16,
    mat2: 16 * 2,
    mat3: 16 * 3,
    mat4: 16 * 4
  };
  function createUBOElements(uniformData) {
    const uboElements = uniformData.map((data) => ({
      data,
      offset: 0,
      dataLen: 0,
      dirty: 0
    }));
    let size = 0, chunkSize = 0, offset = 0;
    for (let i2 = 0; i2 < uboElements.length; i2++) {
      const uboElement = uboElements[i2];
      if (size = GLSL_TO_STD40_SIZE[uboElement.data.type], uboElement.data.size > 1 && (size = Math.max(size, 16) * uboElement.data.size), uboElement.dataLen = size, chunkSize % size !== 0 && chunkSize < 16) {
        const lineUpValue = chunkSize % size % 16;
        chunkSize += lineUpValue, offset += lineUpValue;
      }
      chunkSize + size > 16 ? (offset = Math.ceil(offset / 16) * 16, uboElement.offset = offset, offset += size, chunkSize = size) : (uboElement.offset = offset, chunkSize += size, offset += size);
    }
    return offset = Math.ceil(offset / 16) * 16, { uboElements, size: offset };
  }
  function getUBOData(uniforms, uniformData) {
    const usedUniformDatas = [];
    for (const i2 in uniforms)
      uniformData[i2] && usedUniformDatas.push(uniformData[i2]);
    return usedUniformDatas.sort((a2, b2) => a2.index - b2.index), usedUniformDatas;
  }
  function generateUniformBufferSync(group, uniformData) {
    if (!group.autoManage)
      return { size: 0, syncFunc: uboUpdate };
    const usedUniformDatas = getUBOData(group.uniforms, uniformData), { uboElements, size } = createUBOElements(usedUniformDatas), funcFragments = [`
    var v = null;
    var v2 = null;
    var cv = null;
    var t = 0;
    var gl = renderer.gl
    var index = 0;
    var data = buffer.data;
    `];
    for (let i2 = 0; i2 < uboElements.length; i2++) {
      const uboElement = uboElements[i2], uniform = group.uniforms[uboElement.data.name], name = uboElement.data.name;
      let parsed = false;
      for (let j2 = 0; j2 < uniformParsers.length; j2++) {
        const uniformParser = uniformParsers[j2];
        if (uniformParser.codeUbo && uniformParser.test(uboElement.data, uniform)) {
          funcFragments.push(
            `offset = ${uboElement.offset / 4};`,
            uniformParsers[j2].codeUbo(uboElement.data.name, uniform)
          ), parsed = true;
          break;
        }
      }
      if (!parsed)
        if (uboElement.data.size > 1) {
          const size2 = mapSize(uboElement.data.type), rowSize = Math.max(GLSL_TO_STD40_SIZE[uboElement.data.type] / 16, 1), elementSize = size2 / rowSize, remainder = (4 - elementSize % 4) % 4;
          funcFragments.push(`
                cv = ud.${name}.value;
                v = uv.${name};
                offset = ${uboElement.offset / 4};

                t = 0;

                for(var i=0; i < ${uboElement.data.size * rowSize}; i++)
                {
                    for(var j = 0; j < ${elementSize}; j++)
                    {
                        data[offset++] = v[t++];
                    }
                    offset += ${remainder};
                }

                `);
        } else {
          const template = UBO_TO_SINGLE_SETTERS[uboElement.data.type];
          funcFragments.push(`
                cv = ud.${name}.value;
                v = uv.${name};
                offset = ${uboElement.offset / 4};
                ${template};
                `);
        }
    }
    return funcFragments.push(`
       renderer.buffer.update(buffer);
    `), {
      size,
      // eslint-disable-next-line no-new-func
      syncFunc: new Function(
        "ud",
        "uv",
        "renderer",
        "syncData",
        "buffer",
        funcFragments.join(`
`)
      )
    };
  }

  // node_modules/@pixi/core/lib/shader/ShaderSystem.mjs
  var UID5 = 0;
  var defaultSyncData = { textureCount: 0, uboCount: 0 };
  var ShaderSystem = class {
    /** @param renderer - The renderer this System works for. */
    constructor(renderer) {
      this.destroyed = false, this.renderer = renderer, this.systemCheck(), this.gl = null, this.shader = null, this.program = null, this.cache = {}, this._uboCache = {}, this.id = UID5++;
    }
    /**
     * Overrideable function by `@pixi/unsafe-eval` to silence
     * throwing an error if platform doesn't support unsafe-evals.
     * @private
     */
    systemCheck() {
      if (!unsafeEvalSupported())
        throw new Error("Current environment does not allow unsafe-eval, please use @pixi/unsafe-eval module to enable support.");
    }
    contextChange(gl) {
      this.gl = gl, this.reset();
    }
    /**
     * Changes the current shader to the one given in parameter.
     * @param shader - the new shader
     * @param dontSync - false if the shader should automatically sync its uniforms.
     * @returns the glProgram that belongs to the shader.
     */
    bind(shader, dontSync) {
      shader.disposeRunner.add(this), shader.uniforms.globals = this.renderer.globalUniforms;
      const program = shader.program, glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateProgram(shader);
      return this.shader = shader, this.program !== program && (this.program = program, this.gl.useProgram(glProgram.program)), dontSync || (defaultSyncData.textureCount = 0, defaultSyncData.uboCount = 0, this.syncUniformGroup(shader.uniformGroup, defaultSyncData)), glProgram;
    }
    /**
     * Uploads the uniforms values to the currently bound shader.
     * @param uniforms - the uniforms values that be applied to the current shader
     */
    setUniforms(uniforms) {
      const shader = this.shader.program, glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];
      shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
    }
    /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
    /**
     * Syncs uniforms on the group
     * @param group - the uniform group to sync
     * @param syncData - this is data that is passed to the sync function and any nested sync functions
     */
    syncUniformGroup(group, syncData) {
      const glProgram = this.getGlProgram();
      (!group.static || group.dirtyId !== glProgram.uniformDirtyGroups[group.id]) && (glProgram.uniformDirtyGroups[group.id] = group.dirtyId, this.syncUniforms(group, glProgram, syncData));
    }
    /**
     * Overrideable by the @pixi/unsafe-eval package to use static syncUniforms instead.
     * @param group
     * @param glProgram
     * @param syncData
     */
    syncUniforms(group, glProgram, syncData) {
      (group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group))(glProgram.uniformData, group.uniforms, this.renderer, syncData);
    }
    createSyncGroups(group) {
      const id = this.getSignature(group, this.shader.program.uniformData, "u");
      return this.cache[id] || (this.cache[id] = generateUniformsSync(group, this.shader.program.uniformData)), group.syncUniforms[this.shader.program.id] = this.cache[id], group.syncUniforms[this.shader.program.id];
    }
    /**
     * Syncs uniform buffers
     * @param group - the uniform buffer group to sync
     * @param name - the name of the uniform buffer
     */
    syncUniformBufferGroup(group, name) {
      const glProgram = this.getGlProgram();
      if (!group.static || group.dirtyId !== 0 || !glProgram.uniformGroups[group.id]) {
        group.dirtyId = 0;
        const syncFunc = glProgram.uniformGroups[group.id] || this.createSyncBufferGroup(group, glProgram, name);
        group.buffer.update(), syncFunc(
          glProgram.uniformData,
          group.uniforms,
          this.renderer,
          defaultSyncData,
          group.buffer
        );
      }
      this.renderer.buffer.bindBufferBase(group.buffer, glProgram.uniformBufferBindings[name]);
    }
    /**
     * Will create a function that uploads a uniform buffer using the STD140 standard.
     * The upload function will then be cached for future calls
     * If a group is manually managed, then a simple upload function is generated
     * @param group - the uniform buffer group to sync
     * @param glProgram - the gl program to attach the uniform bindings to
     * @param name - the name of the uniform buffer (must exist on the shader)
     */
    createSyncBufferGroup(group, glProgram, name) {
      const { gl } = this.renderer;
      this.renderer.buffer.bind(group.buffer);
      const uniformBlockIndex = this.gl.getUniformBlockIndex(glProgram.program, name);
      glProgram.uniformBufferBindings[name] = this.shader.uniformBindCount, gl.uniformBlockBinding(glProgram.program, uniformBlockIndex, this.shader.uniformBindCount), this.shader.uniformBindCount++;
      const id = this.getSignature(group, this.shader.program.uniformData, "ubo");
      let uboData = this._uboCache[id];
      if (uboData || (uboData = this._uboCache[id] = generateUniformBufferSync(group, this.shader.program.uniformData)), group.autoManage) {
        const data = new Float32Array(uboData.size / 4);
        group.buffer.update(data);
      }
      return glProgram.uniformGroups[group.id] = uboData.syncFunc, glProgram.uniformGroups[group.id];
    }
    /**
     * Takes a uniform group and data and generates a unique signature for them.
     * @param group - The uniform group to get signature of
     * @param group.uniforms
     * @param uniformData - Uniform information generated by the shader
     * @param preFix
     * @returns Unique signature of the uniform group
     */
    getSignature(group, uniformData, preFix) {
      const uniforms = group.uniforms, strings = [`${preFix}-`];
      for (const i2 in uniforms)
        strings.push(i2), uniformData[i2] && strings.push(uniformData[i2].type);
      return strings.join("-");
    }
    /**
     * Returns the underlying GLShade rof the currently bound shader.
     *
     * This can be handy for when you to have a little more control over the setting of your uniforms.
     * @returns The glProgram for the currently bound Shader for this context
     */
    getGlProgram() {
      return this.shader ? this.shader.program.glPrograms[this.renderer.CONTEXT_UID] : null;
    }
    /**
     * Generates a glProgram version of the Shader provided.
     * @param shader - The shader that the glProgram will be based on.
     * @returns A shiny new glProgram!
     */
    generateProgram(shader) {
      const gl = this.gl, program = shader.program, glProgram = generateProgram(gl, program);
      return program.glPrograms[this.renderer.CONTEXT_UID] = glProgram, glProgram;
    }
    /** Resets ShaderSystem state, does not affect WebGL state. */
    reset() {
      this.program = null, this.shader = null;
    }
    /**
     * Disposes shader.
     * If disposing one equals with current shader, set current as null.
     * @param shader - Shader object
     */
    disposeShader(shader) {
      this.shader === shader && (this.shader = null);
    }
    /** Destroys this System and removes all its textures. */
    destroy() {
      this.renderer = null, this.destroyed = true;
    }
  };
  ShaderSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "shader"
  };
  extensions.add(ShaderSystem);

  // node_modules/@pixi/core/lib/startup/StartupSystem.mjs
  var StartupSystem = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    /**
     * It all starts here! This initiates every system, passing in the options for any system by name.
     * @param options - the config for the renderer and all its systems
     */
    run(options) {
      const { renderer } = this;
      renderer.runners.init.emit(renderer.options), options.hello && console.log(`PixiJS 7.4.3 - ${renderer.rendererLogId} - https://pixijs.com`), renderer.resize(renderer.screen.width, renderer.screen.height);
    }
    destroy() {
    }
  };
  StartupSystem.defaultOptions = {
    /**
     * {@link PIXI.IRendererOptions.hello}
     * @default false
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    hello: false
  }, /** @ignore */
  StartupSystem.extension = {
    type: [
      ExtensionType.RendererSystem,
      ExtensionType.CanvasRendererSystem
    ],
    name: "startup"
  };
  extensions.add(StartupSystem);

  // node_modules/@pixi/core/lib/state/utils/mapWebGLBlendModesToPixi.mjs
  function mapWebGLBlendModesToPixi(gl, array = []) {
    return array[BLEND_MODES.NORMAL] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.ADD] = [gl.ONE, gl.ONE], array[BLEND_MODES.MULTIPLY] = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.SCREEN] = [gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.OVERLAY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.DARKEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.LIGHTEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.COLOR_DODGE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.COLOR_BURN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.HARD_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.SOFT_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.DIFFERENCE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.EXCLUSION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.HUE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.SATURATION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.COLOR] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.LUMINOSITY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.NONE] = [0, 0], array[BLEND_MODES.NORMAL_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.ADD_NPM] = [gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE], array[BLEND_MODES.SCREEN_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.SRC_IN] = [gl.DST_ALPHA, gl.ZERO], array[BLEND_MODES.SRC_OUT] = [gl.ONE_MINUS_DST_ALPHA, gl.ZERO], array[BLEND_MODES.SRC_ATOP] = [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.DST_OVER] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE], array[BLEND_MODES.DST_IN] = [gl.ZERO, gl.SRC_ALPHA], array[BLEND_MODES.DST_OUT] = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.DST_ATOP] = [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA], array[BLEND_MODES.XOR] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA], array[BLEND_MODES.SUBTRACT] = [gl.ONE, gl.ONE, gl.ONE, gl.ONE, gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD], array;
  }

  // node_modules/@pixi/core/lib/state/StateSystem.mjs
  var BLEND2 = 0;
  var OFFSET2 = 1;
  var CULLING2 = 2;
  var DEPTH_TEST2 = 3;
  var WINDING2 = 4;
  var DEPTH_MASK2 = 5;
  var _StateSystem = class _StateSystem2 {
    constructor() {
      this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = BLEND_MODES.NONE, this._blendEq = false, this.map = [], this.map[BLEND2] = this.setBlend, this.map[OFFSET2] = this.setOffset, this.map[CULLING2] = this.setCullFace, this.map[DEPTH_TEST2] = this.setDepthTest, this.map[WINDING2] = this.setFrontFace, this.map[DEPTH_MASK2] = this.setDepthMask, this.checks = [], this.defaultState = new State(), this.defaultState.blend = true;
    }
    contextChange(gl) {
      this.gl = gl, this.blendModes = mapWebGLBlendModesToPixi(gl), this.set(this.defaultState), this.reset();
    }
    /**
     * Sets the current state
     * @param {*} state - The state to set.
     */
    set(state) {
      if (state = state || this.defaultState, this.stateId !== state.data) {
        let diff = this.stateId ^ state.data, i2 = 0;
        for (; diff; )
          diff & 1 && this.map[i2].call(this, !!(state.data & 1 << i2)), diff = diff >> 1, i2++;
        this.stateId = state.data;
      }
      for (let i2 = 0; i2 < this.checks.length; i2++)
        this.checks[i2](this, state);
    }
    /**
     * Sets the state, when previous state is unknown.
     * @param {*} state - The state to set
     */
    forceState(state) {
      state = state || this.defaultState;
      for (let i2 = 0; i2 < this.map.length; i2++)
        this.map[i2].call(this, !!(state.data & 1 << i2));
      for (let i2 = 0; i2 < this.checks.length; i2++)
        this.checks[i2](this, state);
      this.stateId = state.data;
    }
    /**
     * Sets whether to enable or disable blending.
     * @param value - Turn on or off WebGl blending.
     */
    setBlend(value) {
      this.updateCheck(_StateSystem2.checkBlendMode, value), this.gl[value ? "enable" : "disable"](this.gl.BLEND);
    }
    /**
     * Sets whether to enable or disable polygon offset fill.
     * @param value - Turn on or off webgl polygon offset testing.
     */
    setOffset(value) {
      this.updateCheck(_StateSystem2.checkPolygonOffset, value), this.gl[value ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
    }
    /**
     * Sets whether to enable or disable depth test.
     * @param value - Turn on or off webgl depth testing.
     */
    setDepthTest(value) {
      this.gl[value ? "enable" : "disable"](this.gl.DEPTH_TEST);
    }
    /**
     * Sets whether to enable or disable depth mask.
     * @param value - Turn on or off webgl depth mask.
     */
    setDepthMask(value) {
      this.gl.depthMask(value);
    }
    /**
     * Sets whether to enable or disable cull face.
     * @param {boolean} value - Turn on or off webgl cull face.
     */
    setCullFace(value) {
      this.gl[value ? "enable" : "disable"](this.gl.CULL_FACE);
    }
    /**
     * Sets the gl front face.
     * @param {boolean} value - true is clockwise and false is counter-clockwise
     */
    setFrontFace(value) {
      this.gl.frontFace(this.gl[value ? "CW" : "CCW"]);
    }
    /**
     * Sets the blend mode.
     * @param {number} value - The blend mode to set to.
     */
    setBlendMode(value) {
      if (value === this.blendMode)
        return;
      this.blendMode = value;
      const mode = this.blendModes[value], gl = this.gl;
      mode.length === 2 ? gl.blendFunc(mode[0], mode[1]) : gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]), mode.length === 6 ? (this._blendEq = true, gl.blendEquationSeparate(mode[4], mode[5])) : this._blendEq && (this._blendEq = false, gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD));
    }
    /**
     * Sets the polygon offset.
     * @param {number} value - the polygon offset
     * @param {number} scale - the polygon offset scale
     */
    setPolygonOffset(value, scale) {
      this.gl.polygonOffset(value, scale);
    }
    // used
    /** Resets all the logic and disables the VAOs. */
    reset() {
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false), this.forceState(this.defaultState), this._blendEq = true, this.blendMode = -1, this.setBlendMode(0);
    }
    /**
     * Checks to see which updates should be checked based on which settings have been activated.
     *
     * For example, if blend is enabled then we should check the blend modes each time the state is changed
     * or if polygon fill is activated then we need to check if the polygon offset changes.
     * The idea is that we only check what we have too.
     * @param func - the checking function to add or remove
     * @param value - should the check function be added or removed.
     */
    updateCheck(func, value) {
      const index = this.checks.indexOf(func);
      value && index === -1 ? this.checks.push(func) : !value && index !== -1 && this.checks.splice(index, 1);
    }
    /**
     * A private little wrapper function that we call to check the blend mode.
     * @param system - the System to perform the state check on
     * @param state - the state that the blendMode will pulled from
     */
    static checkBlendMode(system, state) {
      system.setBlendMode(state.blendMode);
    }
    /**
     * A private little wrapper function that we call to check the polygon offset.
     * @param system - the System to perform the state check on
     * @param state - the state that the blendMode will pulled from
     */
    static checkPolygonOffset(system, state) {
      system.setPolygonOffset(1, state.polygonOffset);
    }
    /**
     * @ignore
     */
    destroy() {
      this.gl = null;
    }
  };
  _StateSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "state"
  };
  var StateSystem = _StateSystem;
  extensions.add(StateSystem);

  // node_modules/@pixi/core/lib/system/SystemManager.mjs
  var SystemManager = class extends import_eventemitter3.default {
    constructor() {
      super(...arguments), this.runners = {}, this._systemsHash = {};
    }
    /**
     * Set up a system with a collection of SystemClasses and runners.
     * Systems are attached dynamically to this class when added.
     * @param config - the config for the system manager
     */
    setup(config) {
      this.addRunners(...config.runners);
      const priority = (config.priority ?? []).filter((key) => config.systems[key]), orderByPriority = [
        ...priority,
        ...Object.keys(config.systems).filter((key) => !priority.includes(key))
      ];
      for (const i2 of orderByPriority)
        this.addSystem(config.systems[i2], i2);
    }
    /**
     * Create a bunch of runners based of a collection of ids
     * @param runnerIds - the runner ids to add
     */
    addRunners(...runnerIds) {
      runnerIds.forEach((runnerId) => {
        this.runners[runnerId] = new Runner(runnerId);
      });
    }
    /**
     * Add a new system to the renderer.
     * @param ClassRef - Class reference
     * @param name - Property name for system, if not specified
     *        will use a static `name` property on the class itself. This
     *        name will be assigned as s property on the Renderer so make
     *        sure it doesn't collide with properties on Renderer.
     * @returns Return instance of renderer
     */
    addSystem(ClassRef, name) {
      const system = new ClassRef(this);
      if (this[name])
        throw new Error(`Whoops! The name "${name}" is already in use`);
      this[name] = system, this._systemsHash[name] = system;
      for (const i2 in this.runners)
        this.runners[i2].add(system);
      return this;
    }
    /**
     * A function that will run a runner and call the runners function but pass in different options
     * to each system based on there name.
     *
     * E.g. If you have two systems added called `systemA` and `systemB` you could call do the following:
     *
     * ```js
     * system.emitWithCustomOptions(init, {
     *     systemA: {...optionsForA},
     *     systemB: {...optionsForB},
     * });
     * ```
     *
     * `init` would be called on system A passing `optionsForA` and on system B passing `optionsForB`.
     * @param runner - the runner to target
     * @param options - key value options for each system
     */
    emitWithCustomOptions(runner, options) {
      const systemHashKeys = Object.keys(this._systemsHash);
      runner.items.forEach((system) => {
        const systemName = systemHashKeys.find((systemId) => this._systemsHash[systemId] === system);
        system[runner.name](options[systemName]);
      });
    }
    /** destroy the all runners and systems. Its apps job to */
    destroy() {
      Object.values(this.runners).forEach((runner) => {
        runner.destroy();
      }), this._systemsHash = {};
    }
    // TODO implement!
    // removeSystem(ClassRef: ISystemConstructor, name: string): void
    // {
    // }
  };

  // node_modules/@pixi/core/lib/textures/TextureGCSystem.mjs
  var _TextureGCSystem = class _TextureGCSystem2 {
    /** @param renderer - The renderer this System works for. */
    constructor(renderer) {
      this.renderer = renderer, this.count = 0, this.checkCount = 0, this.maxIdle = _TextureGCSystem2.defaultMaxIdle, this.checkCountMax = _TextureGCSystem2.defaultCheckCountMax, this.mode = _TextureGCSystem2.defaultMode;
    }
    /**
     * Checks to see when the last time a texture was used.
     * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
     */
    postrender() {
      this.renderer.objectRenderer.renderingToScreen && (this.count++, this.mode !== GC_MODES.MANUAL && (this.checkCount++, this.checkCount > this.checkCountMax && (this.checkCount = 0, this.run())));
    }
    /**
     * Checks to see when the last time a texture was used.
     * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
     */
    run() {
      const tm = this.renderer.texture, managedTextures = tm.managedTextures;
      let wasRemoved = false;
      for (let i2 = 0; i2 < managedTextures.length; i2++) {
        const texture = managedTextures[i2];
        texture.resource && this.count - texture.touched > this.maxIdle && (tm.destroyTexture(texture, true), managedTextures[i2] = null, wasRemoved = true);
      }
      if (wasRemoved) {
        let j2 = 0;
        for (let i2 = 0; i2 < managedTextures.length; i2++)
          managedTextures[i2] !== null && (managedTextures[j2++] = managedTextures[i2]);
        managedTextures.length = j2;
      }
    }
    /**
     * Removes all the textures within the specified displayObject and its children from the GPU.
     * @param {PIXI.DisplayObject} displayObject - the displayObject to remove the textures from.
     */
    unload(displayObject) {
      const tm = this.renderer.texture, texture = displayObject._texture;
      texture && !texture.framebuffer && tm.destroyTexture(texture);
      for (let i2 = displayObject.children.length - 1; i2 >= 0; i2--)
        this.unload(displayObject.children[i2]);
    }
    destroy() {
      this.renderer = null;
    }
  };
  _TextureGCSystem.defaultMode = GC_MODES.AUTO, /**
  * Default maximum idle frames before a texture is destroyed by garbage collection.
  * @static
  * @default 3600
  * @see PIXI.TextureGCSystem#maxIdle
  */
  _TextureGCSystem.defaultMaxIdle = 60 * 60, /**
  * Default frames between two garbage collections.
  * @static
  * @default 600
  * @see PIXI.TextureGCSystem#checkCountMax
  */
  _TextureGCSystem.defaultCheckCountMax = 60 * 10, /** @ignore */
  _TextureGCSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "textureGC"
  };
  var TextureGCSystem = _TextureGCSystem;
  extensions.add(TextureGCSystem);

  // node_modules/@pixi/core/lib/textures/GLTexture.mjs
  var GLTexture = class {
    constructor(texture) {
      this.texture = texture, this.width = -1, this.height = -1, this.dirtyId = -1, this.dirtyStyleId = -1, this.mipmap = false, this.wrapMode = 33071, this.type = TYPES.UNSIGNED_BYTE, this.internalFormat = FORMATS.RGBA, this.samplerType = 0;
    }
  };

  // node_modules/@pixi/core/lib/textures/utils/mapInternalFormatToSamplerType.mjs
  function mapInternalFormatToSamplerType(gl) {
    let table;
    return "WebGL2RenderingContext" in globalThis && gl instanceof globalThis.WebGL2RenderingContext ? table = {
      [gl.RGB]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA]: SAMPLER_TYPES.FLOAT,
      [gl.ALPHA]: SAMPLER_TYPES.FLOAT,
      [gl.LUMINANCE]: SAMPLER_TYPES.FLOAT,
      [gl.LUMINANCE_ALPHA]: SAMPLER_TYPES.FLOAT,
      [gl.R8]: SAMPLER_TYPES.FLOAT,
      [gl.R8_SNORM]: SAMPLER_TYPES.FLOAT,
      [gl.RG8]: SAMPLER_TYPES.FLOAT,
      [gl.RG8_SNORM]: SAMPLER_TYPES.FLOAT,
      [gl.RGB8]: SAMPLER_TYPES.FLOAT,
      [gl.RGB8_SNORM]: SAMPLER_TYPES.FLOAT,
      [gl.RGB565]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA4]: SAMPLER_TYPES.FLOAT,
      [gl.RGB5_A1]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA8]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA8_SNORM]: SAMPLER_TYPES.FLOAT,
      [gl.RGB10_A2]: SAMPLER_TYPES.FLOAT,
      [gl.RGB10_A2UI]: SAMPLER_TYPES.FLOAT,
      [gl.SRGB8]: SAMPLER_TYPES.FLOAT,
      [gl.SRGB8_ALPHA8]: SAMPLER_TYPES.FLOAT,
      [gl.R16F]: SAMPLER_TYPES.FLOAT,
      [gl.RG16F]: SAMPLER_TYPES.FLOAT,
      [gl.RGB16F]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA16F]: SAMPLER_TYPES.FLOAT,
      [gl.R32F]: SAMPLER_TYPES.FLOAT,
      [gl.RG32F]: SAMPLER_TYPES.FLOAT,
      [gl.RGB32F]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA32F]: SAMPLER_TYPES.FLOAT,
      [gl.R11F_G11F_B10F]: SAMPLER_TYPES.FLOAT,
      [gl.RGB9_E5]: SAMPLER_TYPES.FLOAT,
      [gl.R8I]: SAMPLER_TYPES.INT,
      [gl.R8UI]: SAMPLER_TYPES.UINT,
      [gl.R16I]: SAMPLER_TYPES.INT,
      [gl.R16UI]: SAMPLER_TYPES.UINT,
      [gl.R32I]: SAMPLER_TYPES.INT,
      [gl.R32UI]: SAMPLER_TYPES.UINT,
      [gl.RG8I]: SAMPLER_TYPES.INT,
      [gl.RG8UI]: SAMPLER_TYPES.UINT,
      [gl.RG16I]: SAMPLER_TYPES.INT,
      [gl.RG16UI]: SAMPLER_TYPES.UINT,
      [gl.RG32I]: SAMPLER_TYPES.INT,
      [gl.RG32UI]: SAMPLER_TYPES.UINT,
      [gl.RGB8I]: SAMPLER_TYPES.INT,
      [gl.RGB8UI]: SAMPLER_TYPES.UINT,
      [gl.RGB16I]: SAMPLER_TYPES.INT,
      [gl.RGB16UI]: SAMPLER_TYPES.UINT,
      [gl.RGB32I]: SAMPLER_TYPES.INT,
      [gl.RGB32UI]: SAMPLER_TYPES.UINT,
      [gl.RGBA8I]: SAMPLER_TYPES.INT,
      [gl.RGBA8UI]: SAMPLER_TYPES.UINT,
      [gl.RGBA16I]: SAMPLER_TYPES.INT,
      [gl.RGBA16UI]: SAMPLER_TYPES.UINT,
      [gl.RGBA32I]: SAMPLER_TYPES.INT,
      [gl.RGBA32UI]: SAMPLER_TYPES.UINT,
      [gl.DEPTH_COMPONENT16]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH_COMPONENT24]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH_COMPONENT32F]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH_STENCIL]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH24_STENCIL8]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH32F_STENCIL8]: SAMPLER_TYPES.FLOAT
    } : table = {
      [gl.RGB]: SAMPLER_TYPES.FLOAT,
      [gl.RGBA]: SAMPLER_TYPES.FLOAT,
      [gl.ALPHA]: SAMPLER_TYPES.FLOAT,
      [gl.LUMINANCE]: SAMPLER_TYPES.FLOAT,
      [gl.LUMINANCE_ALPHA]: SAMPLER_TYPES.FLOAT,
      [gl.DEPTH_STENCIL]: SAMPLER_TYPES.FLOAT
    }, table;
  }

  // node_modules/@pixi/core/lib/textures/utils/mapTypeAndFormatToInternalFormat.mjs
  function mapTypeAndFormatToInternalFormat(gl) {
    let table;
    return "WebGL2RenderingContext" in globalThis && gl instanceof globalThis.WebGL2RenderingContext ? table = {
      [TYPES.UNSIGNED_BYTE]: {
        [FORMATS.RGBA]: gl.RGBA8,
        [FORMATS.RGB]: gl.RGB8,
        [FORMATS.RG]: gl.RG8,
        [FORMATS.RED]: gl.R8,
        [FORMATS.RGBA_INTEGER]: gl.RGBA8UI,
        [FORMATS.RGB_INTEGER]: gl.RGB8UI,
        [FORMATS.RG_INTEGER]: gl.RG8UI,
        [FORMATS.RED_INTEGER]: gl.R8UI,
        [FORMATS.ALPHA]: gl.ALPHA,
        [FORMATS.LUMINANCE]: gl.LUMINANCE,
        [FORMATS.LUMINANCE_ALPHA]: gl.LUMINANCE_ALPHA
      },
      [TYPES.BYTE]: {
        [FORMATS.RGBA]: gl.RGBA8_SNORM,
        [FORMATS.RGB]: gl.RGB8_SNORM,
        [FORMATS.RG]: gl.RG8_SNORM,
        [FORMATS.RED]: gl.R8_SNORM,
        [FORMATS.RGBA_INTEGER]: gl.RGBA8I,
        [FORMATS.RGB_INTEGER]: gl.RGB8I,
        [FORMATS.RG_INTEGER]: gl.RG8I,
        [FORMATS.RED_INTEGER]: gl.R8I
      },
      [TYPES.UNSIGNED_SHORT]: {
        [FORMATS.RGBA_INTEGER]: gl.RGBA16UI,
        [FORMATS.RGB_INTEGER]: gl.RGB16UI,
        [FORMATS.RG_INTEGER]: gl.RG16UI,
        [FORMATS.RED_INTEGER]: gl.R16UI,
        [FORMATS.DEPTH_COMPONENT]: gl.DEPTH_COMPONENT16
      },
      [TYPES.SHORT]: {
        [FORMATS.RGBA_INTEGER]: gl.RGBA16I,
        [FORMATS.RGB_INTEGER]: gl.RGB16I,
        [FORMATS.RG_INTEGER]: gl.RG16I,
        [FORMATS.RED_INTEGER]: gl.R16I
      },
      [TYPES.UNSIGNED_INT]: {
        [FORMATS.RGBA_INTEGER]: gl.RGBA32UI,
        [FORMATS.RGB_INTEGER]: gl.RGB32UI,
        [FORMATS.RG_INTEGER]: gl.RG32UI,
        [FORMATS.RED_INTEGER]: gl.R32UI,
        [FORMATS.DEPTH_COMPONENT]: gl.DEPTH_COMPONENT24
      },
      [TYPES.INT]: {
        [FORMATS.RGBA_INTEGER]: gl.RGBA32I,
        [FORMATS.RGB_INTEGER]: gl.RGB32I,
        [FORMATS.RG_INTEGER]: gl.RG32I,
        [FORMATS.RED_INTEGER]: gl.R32I
      },
      [TYPES.FLOAT]: {
        [FORMATS.RGBA]: gl.RGBA32F,
        [FORMATS.RGB]: gl.RGB32F,
        [FORMATS.RG]: gl.RG32F,
        [FORMATS.RED]: gl.R32F,
        [FORMATS.DEPTH_COMPONENT]: gl.DEPTH_COMPONENT32F
      },
      [TYPES.HALF_FLOAT]: {
        [FORMATS.RGBA]: gl.RGBA16F,
        [FORMATS.RGB]: gl.RGB16F,
        [FORMATS.RG]: gl.RG16F,
        [FORMATS.RED]: gl.R16F
      },
      [TYPES.UNSIGNED_SHORT_5_6_5]: {
        [FORMATS.RGB]: gl.RGB565
      },
      [TYPES.UNSIGNED_SHORT_4_4_4_4]: {
        [FORMATS.RGBA]: gl.RGBA4
      },
      [TYPES.UNSIGNED_SHORT_5_5_5_1]: {
        [FORMATS.RGBA]: gl.RGB5_A1
      },
      [TYPES.UNSIGNED_INT_2_10_10_10_REV]: {
        [FORMATS.RGBA]: gl.RGB10_A2,
        [FORMATS.RGBA_INTEGER]: gl.RGB10_A2UI
      },
      [TYPES.UNSIGNED_INT_10F_11F_11F_REV]: {
        [FORMATS.RGB]: gl.R11F_G11F_B10F
      },
      [TYPES.UNSIGNED_INT_5_9_9_9_REV]: {
        [FORMATS.RGB]: gl.RGB9_E5
      },
      [TYPES.UNSIGNED_INT_24_8]: {
        [FORMATS.DEPTH_STENCIL]: gl.DEPTH24_STENCIL8
      },
      [TYPES.FLOAT_32_UNSIGNED_INT_24_8_REV]: {
        [FORMATS.DEPTH_STENCIL]: gl.DEPTH32F_STENCIL8
      }
    } : table = {
      [TYPES.UNSIGNED_BYTE]: {
        [FORMATS.RGBA]: gl.RGBA,
        [FORMATS.RGB]: gl.RGB,
        [FORMATS.ALPHA]: gl.ALPHA,
        [FORMATS.LUMINANCE]: gl.LUMINANCE,
        [FORMATS.LUMINANCE_ALPHA]: gl.LUMINANCE_ALPHA
      },
      [TYPES.UNSIGNED_SHORT_5_6_5]: {
        [FORMATS.RGB]: gl.RGB
      },
      [TYPES.UNSIGNED_SHORT_4_4_4_4]: {
        [FORMATS.RGBA]: gl.RGBA
      },
      [TYPES.UNSIGNED_SHORT_5_5_5_1]: {
        [FORMATS.RGBA]: gl.RGBA
      }
    }, table;
  }

  // node_modules/@pixi/core/lib/textures/TextureSystem.mjs
  var TextureSystem = class {
    /**
     * @param renderer - The renderer this system works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.boundTextures = [], this.currentLocation = -1, this.managedTextures = [], this._unknownBoundTextures = false, this.unknownTexture = new BaseTexture(), this.hasIntegerTextures = false;
    }
    /** Sets up the renderer context and necessary buffers. */
    contextChange() {
      const gl = this.gl = this.renderer.gl;
      this.CONTEXT_UID = this.renderer.CONTEXT_UID, this.webGLVersion = this.renderer.context.webGLVersion, this.internalFormats = mapTypeAndFormatToInternalFormat(gl), this.samplerTypes = mapInternalFormatToSamplerType(gl);
      const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      this.boundTextures.length = maxTextures;
      for (let i2 = 0; i2 < maxTextures; i2++)
        this.boundTextures[i2] = null;
      this.emptyTextures = {};
      const emptyTexture2D = new GLTexture(gl.createTexture());
      gl.bindTexture(gl.TEXTURE_2D, emptyTexture2D.texture), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)), this.emptyTextures[gl.TEXTURE_2D] = emptyTexture2D, this.emptyTextures[gl.TEXTURE_CUBE_MAP] = new GLTexture(gl.createTexture()), gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.emptyTextures[gl.TEXTURE_CUBE_MAP].texture);
      for (let i2 = 0; i2 < 6; i2++)
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i2, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR), gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      for (let i2 = 0; i2 < this.boundTextures.length; i2++)
        this.bind(null, i2);
    }
    /**
     * Bind a texture to a specific location
     *
     * If you want to unbind something, please use `unbind(texture)` instead of `bind(null, textureLocation)`
     * @param texture - Texture to bind
     * @param [location=0] - Location to bind at
     */
    bind(texture, location = 0) {
      const { gl } = this;
      if (texture = texture?.castToBaseTexture(), texture?.valid && !texture.parentTextureArray) {
        texture.touched = this.renderer.textureGC.count;
        const glTexture = texture._glTextures[this.CONTEXT_UID] || this.initTexture(texture);
        this.boundTextures[location] !== texture && (this.currentLocation !== location && (this.currentLocation = location, gl.activeTexture(gl.TEXTURE0 + location)), gl.bindTexture(texture.target, glTexture.texture)), glTexture.dirtyId !== texture.dirtyId ? (this.currentLocation !== location && (this.currentLocation = location, gl.activeTexture(gl.TEXTURE0 + location)), this.updateTexture(texture)) : glTexture.dirtyStyleId !== texture.dirtyStyleId && this.updateTextureStyle(texture), this.boundTextures[location] = texture;
      } else
        this.currentLocation !== location && (this.currentLocation = location, gl.activeTexture(gl.TEXTURE0 + location)), gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[gl.TEXTURE_2D].texture), this.boundTextures[location] = null;
    }
    /** Resets texture location and bound textures Actual `bind(null, i)` calls will be performed at next `unbind()` call */
    reset() {
      this._unknownBoundTextures = true, this.hasIntegerTextures = false, this.currentLocation = -1;
      for (let i2 = 0; i2 < this.boundTextures.length; i2++)
        this.boundTextures[i2] = this.unknownTexture;
    }
    /**
     * Unbind a texture.
     * @param texture - Texture to bind
     */
    unbind(texture) {
      const { gl, boundTextures } = this;
      if (this._unknownBoundTextures) {
        this._unknownBoundTextures = false;
        for (let i2 = 0; i2 < boundTextures.length; i2++)
          boundTextures[i2] === this.unknownTexture && this.bind(null, i2);
      }
      for (let i2 = 0; i2 < boundTextures.length; i2++)
        boundTextures[i2] === texture && (this.currentLocation !== i2 && (gl.activeTexture(gl.TEXTURE0 + i2), this.currentLocation = i2), gl.bindTexture(texture.target, this.emptyTextures[texture.target].texture), boundTextures[i2] = null);
    }
    /**
     * Ensures that current boundTextures all have FLOAT sampler type,
     * see {@link PIXI.SAMPLER_TYPES} for explanation.
     * @param maxTextures - number of locations to check
     */
    ensureSamplerType(maxTextures) {
      const { boundTextures, hasIntegerTextures, CONTEXT_UID } = this;
      if (hasIntegerTextures)
        for (let i2 = maxTextures - 1; i2 >= 0; --i2) {
          const tex = boundTextures[i2];
          tex && tex._glTextures[CONTEXT_UID].samplerType !== SAMPLER_TYPES.FLOAT && this.renderer.texture.unbind(tex);
        }
    }
    /**
     * Initialize a texture
     * @private
     * @param texture - Texture to initialize
     */
    initTexture(texture) {
      const glTexture = new GLTexture(this.gl.createTexture());
      return glTexture.dirtyId = -1, texture._glTextures[this.CONTEXT_UID] = glTexture, this.managedTextures.push(texture), texture.on("dispose", this.destroyTexture, this), glTexture;
    }
    initTextureType(texture, glTexture) {
      glTexture.internalFormat = this.internalFormats[texture.type]?.[texture.format] ?? texture.format, glTexture.samplerType = this.samplerTypes[glTexture.internalFormat] ?? SAMPLER_TYPES.FLOAT, this.webGLVersion === 2 && texture.type === TYPES.HALF_FLOAT ? glTexture.type = this.gl.HALF_FLOAT : glTexture.type = texture.type;
    }
    /**
     * Update a texture
     * @private
     * @param {PIXI.BaseTexture} texture - Texture to initialize
     */
    updateTexture(texture) {
      const glTexture = texture._glTextures[this.CONTEXT_UID];
      if (!glTexture)
        return;
      const renderer = this.renderer;
      if (this.initTextureType(texture, glTexture), texture.resource?.upload(renderer, texture, glTexture))
        glTexture.samplerType !== SAMPLER_TYPES.FLOAT && (this.hasIntegerTextures = true);
      else {
        const width = texture.realWidth, height = texture.realHeight, gl = renderer.gl;
        (glTexture.width !== width || glTexture.height !== height || glTexture.dirtyId < 0) && (glTexture.width = width, glTexture.height = height, gl.texImage2D(
          texture.target,
          0,
          glTexture.internalFormat,
          width,
          height,
          0,
          texture.format,
          glTexture.type,
          null
        ));
      }
      texture.dirtyStyleId !== glTexture.dirtyStyleId && this.updateTextureStyle(texture), glTexture.dirtyId = texture.dirtyId;
    }
    /**
     * Deletes the texture from WebGL
     * @private
     * @param texture - the texture to destroy
     * @param [skipRemove=false] - Whether to skip removing the texture from the TextureManager.
     */
    destroyTexture(texture, skipRemove) {
      const { gl } = this;
      if (texture = texture.castToBaseTexture(), texture._glTextures[this.CONTEXT_UID] && (this.unbind(texture), gl.deleteTexture(texture._glTextures[this.CONTEXT_UID].texture), texture.off("dispose", this.destroyTexture, this), delete texture._glTextures[this.CONTEXT_UID], !skipRemove)) {
        const i2 = this.managedTextures.indexOf(texture);
        i2 !== -1 && removeItems(this.managedTextures, i2, 1);
      }
    }
    /**
     * Update texture style such as mipmap flag
     * @private
     * @param {PIXI.BaseTexture} texture - Texture to update
     */
    updateTextureStyle(texture) {
      const glTexture = texture._glTextures[this.CONTEXT_UID];
      glTexture && ((texture.mipmap === MIPMAP_MODES.POW2 || this.webGLVersion !== 2) && !texture.isPowerOfTwo ? glTexture.mipmap = false : glTexture.mipmap = texture.mipmap >= 1, this.webGLVersion !== 2 && !texture.isPowerOfTwo ? glTexture.wrapMode = WRAP_MODES.CLAMP : glTexture.wrapMode = texture.wrapMode, texture.resource?.style(this.renderer, texture, glTexture) || this.setStyle(texture, glTexture), glTexture.dirtyStyleId = texture.dirtyStyleId);
    }
    /**
     * Set style for texture
     * @private
     * @param texture - Texture to update
     * @param glTexture
     */
    setStyle(texture, glTexture) {
      const gl = this.gl;
      if (glTexture.mipmap && texture.mipmap !== MIPMAP_MODES.ON_MANUAL && gl.generateMipmap(texture.target), gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, glTexture.wrapMode), gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, glTexture.wrapMode), glTexture.mipmap) {
        gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === SCALE_MODES.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
        const anisotropicExt = this.renderer.context.extensions.anisotropicFiltering;
        if (anisotropicExt && texture.anisotropicLevel > 0 && texture.scaleMode === SCALE_MODES.LINEAR) {
          const level = Math.min(texture.anisotropicLevel, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
          gl.texParameterf(texture.target, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
        }
      } else
        gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(texture.target, gl.TEXTURE_MAG_FILTER, texture.scaleMode === SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
    }
    destroy() {
      this.renderer = null;
    }
  };
  TextureSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "texture"
  };
  extensions.add(TextureSystem);

  // node_modules/@pixi/core/lib/transformFeedback/TransformFeedbackSystem.mjs
  var TransformFeedbackSystem = class {
    /**
     * @param renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer;
    }
    /** Sets up the renderer context and necessary buffers. */
    contextChange() {
      this.gl = this.renderer.gl, this.CONTEXT_UID = this.renderer.CONTEXT_UID;
    }
    /**
     * Bind TransformFeedback and buffers
     * @param transformFeedback - TransformFeedback to bind
     */
    bind(transformFeedback) {
      const { gl, CONTEXT_UID } = this, glTransformFeedback = transformFeedback._glTransformFeedbacks[CONTEXT_UID] || this.createGLTransformFeedback(transformFeedback);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, glTransformFeedback);
    }
    /** Unbind TransformFeedback */
    unbind() {
      const { gl } = this;
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    }
    /**
     * Begin TransformFeedback
     * @param drawMode - DrawMode for TransformFeedback
     * @param shader - A Shader used by TransformFeedback. Current bound shader will be used if not provided.
     */
    beginTransformFeedback(drawMode, shader) {
      const { gl, renderer } = this;
      shader && renderer.shader.bind(shader), gl.beginTransformFeedback(drawMode);
    }
    /** End TransformFeedback */
    endTransformFeedback() {
      const { gl } = this;
      gl.endTransformFeedback();
    }
    /**
     * Create TransformFeedback and bind buffers
     * @param tf - TransformFeedback
     * @returns WebGLTransformFeedback
     */
    createGLTransformFeedback(tf) {
      const { gl, renderer, CONTEXT_UID } = this, glTransformFeedback = gl.createTransformFeedback();
      tf._glTransformFeedbacks[CONTEXT_UID] = glTransformFeedback, gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, glTransformFeedback);
      for (let i2 = 0; i2 < tf.buffers.length; i2++) {
        const buffer = tf.buffers[i2];
        buffer && (renderer.buffer.update(buffer), buffer._glBuffers[CONTEXT_UID].refCount++, gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i2, buffer._glBuffers[CONTEXT_UID].buffer || null));
      }
      return gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null), tf.disposeRunner.add(this), glTransformFeedback;
    }
    /**
     * Disposes TransfromFeedback
     * @param {PIXI.TransformFeedback} tf - TransformFeedback
     * @param {boolean} [contextLost=false] - If context was lost, we suppress delete TransformFeedback
     */
    disposeTransformFeedback(tf, contextLost) {
      const glTF = tf._glTransformFeedbacks[this.CONTEXT_UID], gl = this.gl;
      tf.disposeRunner.remove(this);
      const bufferSystem = this.renderer.buffer;
      if (bufferSystem)
        for (let i2 = 0; i2 < tf.buffers.length; i2++) {
          const buffer = tf.buffers[i2];
          if (!buffer)
            continue;
          const buf = buffer._glBuffers[this.CONTEXT_UID];
          buf && (buf.refCount--, buf.refCount === 0 && !contextLost && bufferSystem.dispose(buffer, contextLost));
        }
      glTF && (contextLost || gl.deleteTransformFeedback(glTF), delete tf._glTransformFeedbacks[this.CONTEXT_UID]);
    }
    destroy() {
      this.renderer = null;
    }
  };
  TransformFeedbackSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "transformFeedback"
  };
  extensions.add(TransformFeedbackSystem);

  // node_modules/@pixi/core/lib/view/ViewSystem.mjs
  var ViewSystem = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    /**
     * initiates the view system
     * @param {PIXI.ViewOptions} options - the options for the view
     */
    init(options) {
      this.screen = new Rectangle(0, 0, options.width, options.height), this.element = options.view || settings.ADAPTER.createCanvas(), this.resolution = options.resolution || settings.RESOLUTION, this.autoDensity = !!options.autoDensity;
    }
    /**
     * Resizes the screen and canvas to the specified dimensions.
     * @param desiredScreenWidth - The new width of the screen.
     * @param desiredScreenHeight - The new height of the screen.
     */
    resizeView(desiredScreenWidth, desiredScreenHeight) {
      this.element.width = Math.round(desiredScreenWidth * this.resolution), this.element.height = Math.round(desiredScreenHeight * this.resolution);
      const screenWidth = this.element.width / this.resolution, screenHeight = this.element.height / this.resolution;
      this.screen.width = screenWidth, this.screen.height = screenHeight, this.autoDensity && (this.element.style.width = `${screenWidth}px`, this.element.style.height = `${screenHeight}px`), this.renderer.emit("resize", screenWidth, screenHeight), this.renderer.runners.resize.emit(this.screen.width, this.screen.height);
    }
    /**
     * Destroys this System and optionally removes the canvas from the dom.
     * @param {boolean} [removeView=false] - Whether to remove the canvas from the DOM.
     */
    destroy(removeView) {
      removeView && this.element.parentNode?.removeChild(this.element), this.renderer = null, this.element = null, this.screen = null;
    }
  };
  ViewSystem.defaultOptions = {
    /**
     * {@link PIXI.IRendererOptions.width}
     * @default 800
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    width: 800,
    /**
     * {@link PIXI.IRendererOptions.height}
     * @default 600
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    height: 600,
    /**
     * {@link PIXI.IRendererOptions.resolution}
     * @type {number}
     * @default PIXI.settings.RESOLUTION
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    resolution: void 0,
    /**
     * {@link PIXI.IRendererOptions.autoDensity}
     * @default false
     * @memberof PIXI.settings.RENDER_OPTIONS
     */
    autoDensity: false
  }, /** @ignore */
  ViewSystem.extension = {
    type: [
      ExtensionType.RendererSystem,
      ExtensionType.CanvasRendererSystem
    ],
    name: "_view"
  };
  extensions.add(ViewSystem);

  // node_modules/@pixi/core/lib/settings.mjs
  settings.PREFER_ENV = ENV.WEBGL2;
  settings.STRICT_TEXTURE_CACHE = false;
  settings.RENDER_OPTIONS = {
    ...ContextSystem.defaultOptions,
    ...BackgroundSystem.defaultOptions,
    ...ViewSystem.defaultOptions,
    ...StartupSystem.defaultOptions
  };
  Object.defineProperties(settings, {
    /**
     * @static
     * @name WRAP_MODE
     * @memberof PIXI.settings
     * @type {PIXI.WRAP_MODES}
     * @deprecated since 7.1.0
     * @see PIXI.BaseTexture.defaultOptions.wrapMode
     */
    WRAP_MODE: {
      get() {
        return BaseTexture.defaultOptions.wrapMode;
      },
      set(value) {
        deprecation("7.1.0", "settings.WRAP_MODE is deprecated, use BaseTexture.defaultOptions.wrapMode"), BaseTexture.defaultOptions.wrapMode = value;
      }
    },
    /**
     * @static
     * @name SCALE_MODE
     * @memberof PIXI.settings
     * @type {PIXI.SCALE_MODES}
     * @deprecated since 7.1.0
     * @see PIXI.BaseTexture.defaultOptions.scaleMode
     */
    SCALE_MODE: {
      get() {
        return BaseTexture.defaultOptions.scaleMode;
      },
      set(value) {
        deprecation("7.1.0", "settings.SCALE_MODE is deprecated, use BaseTexture.defaultOptions.scaleMode"), BaseTexture.defaultOptions.scaleMode = value;
      }
    },
    /**
     * @static
     * @name MIPMAP_TEXTURES
     * @memberof PIXI.settings
     * @type {PIXI.MIPMAP_MODES}
     * @deprecated since 7.1.0
     * @see PIXI.BaseTexture.defaultOptions.mipmap
     */
    MIPMAP_TEXTURES: {
      get() {
        return BaseTexture.defaultOptions.mipmap;
      },
      set(value) {
        deprecation("7.1.0", "settings.MIPMAP_TEXTURES is deprecated, use BaseTexture.defaultOptions.mipmap"), BaseTexture.defaultOptions.mipmap = value;
      }
      // MIPMAP_MODES.POW2,
    },
    /**
     * @static
     * @name ANISOTROPIC_LEVEL
     * @memberof PIXI.settings
     * @type {number}
     * @deprecated since 7.1.0
     * @see PIXI.BaseTexture.defaultOptions.anisotropicLevel
     */
    ANISOTROPIC_LEVEL: {
      get() {
        return BaseTexture.defaultOptions.anisotropicLevel;
      },
      set(value) {
        deprecation(
          "7.1.0",
          "settings.ANISOTROPIC_LEVEL is deprecated, use BaseTexture.defaultOptions.anisotropicLevel"
        ), BaseTexture.defaultOptions.anisotropicLevel = value;
      }
    },
    /**
     * Default filter resolution.
     * @static
     * @name FILTER_RESOLUTION
     * @memberof PIXI.settings
     * @deprecated since 7.1.0
     * @type {number|null}
     * @see PIXI.Filter.defaultResolution
     */
    FILTER_RESOLUTION: {
      get() {
        return deprecation("7.1.0", "settings.FILTER_RESOLUTION is deprecated, use Filter.defaultResolution"), Filter.defaultResolution;
      },
      set(value) {
        Filter.defaultResolution = value;
      }
    },
    /**
     * Default filter samples.
     * @static
     * @name FILTER_MULTISAMPLE
     * @memberof PIXI.settings
     * @deprecated since 7.1.0
     * @type {PIXI.MSAA_QUALITY}
     * @see PIXI.Filter.defaultMultisample
     */
    FILTER_MULTISAMPLE: {
      get() {
        return deprecation("7.1.0", "settings.FILTER_MULTISAMPLE is deprecated, use Filter.defaultMultisample"), Filter.defaultMultisample;
      },
      set(value) {
        Filter.defaultMultisample = value;
      }
    },
    /**
     * The maximum textures that this device supports.
     * @static
     * @name SPRITE_MAX_TEXTURES
     * @memberof PIXI.settings
     * @deprecated since 7.1.0
     * @see PIXI.BatchRenderer.defaultMaxTextures
     * @type {number}
     */
    SPRITE_MAX_TEXTURES: {
      get() {
        return BatchRenderer.defaultMaxTextures;
      },
      set(value) {
        deprecation("7.1.0", "settings.SPRITE_MAX_TEXTURES is deprecated, use BatchRenderer.defaultMaxTextures"), BatchRenderer.defaultMaxTextures = value;
      }
    },
    /**
     * The default sprite batch size.
     *
     * The default aims to balance desktop and mobile devices.
     * @static
     * @name SPRITE_BATCH_SIZE
     * @memberof PIXI.settings
     * @see PIXI.BatchRenderer.defaultBatchSize
     * @deprecated since 7.1.0
     * @type {number}
     */
    SPRITE_BATCH_SIZE: {
      get() {
        return BatchRenderer.defaultBatchSize;
      },
      set(value) {
        deprecation("7.1.0", "settings.SPRITE_BATCH_SIZE is deprecated, use BatchRenderer.defaultBatchSize"), BatchRenderer.defaultBatchSize = value;
      }
    },
    /**
     * Can we upload the same buffer in a single frame?
     * @static
     * @name CAN_UPLOAD_SAME_BUFFER
     * @memberof PIXI.settings
     * @see PIXI.BatchRenderer.canUploadSameBuffer
     * @deprecated since 7.1.0
     * @type {boolean}
     */
    CAN_UPLOAD_SAME_BUFFER: {
      get() {
        return BatchRenderer.canUploadSameBuffer;
      },
      set(value) {
        deprecation("7.1.0", "settings.CAN_UPLOAD_SAME_BUFFER is deprecated, use BatchRenderer.canUploadSameBuffer"), BatchRenderer.canUploadSameBuffer = value;
      }
    },
    /**
     * Default Garbage Collection mode.
     * @static
     * @name GC_MODE
     * @memberof PIXI.settings
     * @type {PIXI.GC_MODES}
     * @deprecated since 7.1.0
     * @see PIXI.TextureGCSystem.defaultMode
     */
    GC_MODE: {
      get() {
        return TextureGCSystem.defaultMode;
      },
      set(value) {
        deprecation("7.1.0", "settings.GC_MODE is deprecated, use TextureGCSystem.defaultMode"), TextureGCSystem.defaultMode = value;
      }
    },
    /**
     * Default Garbage Collection max idle.
     * @static
     * @name GC_MAX_IDLE
     * @memberof PIXI.settings
     * @type {number}
     * @deprecated since 7.1.0
     * @see PIXI.TextureGCSystem.defaultMaxIdle
     */
    GC_MAX_IDLE: {
      get() {
        return TextureGCSystem.defaultMaxIdle;
      },
      set(value) {
        deprecation("7.1.0", "settings.GC_MAX_IDLE is deprecated, use TextureGCSystem.defaultMaxIdle"), TextureGCSystem.defaultMaxIdle = value;
      }
    },
    /**
     * Default Garbage Collection maximum check count.
     * @static
     * @name GC_MAX_CHECK_COUNT
     * @memberof PIXI.settings
     * @type {number}
     * @deprecated since 7.1.0
     * @see PIXI.TextureGCSystem.defaultCheckCountMax
     */
    GC_MAX_CHECK_COUNT: {
      get() {
        return TextureGCSystem.defaultCheckCountMax;
      },
      set(value) {
        deprecation("7.1.0", "settings.GC_MAX_CHECK_COUNT is deprecated, use TextureGCSystem.defaultCheckCountMax"), TextureGCSystem.defaultCheckCountMax = value;
      }
    },
    /**
     * Default specify float precision in vertex shader.
     * @static
     * @name PRECISION_VERTEX
     * @memberof PIXI.settings
     * @type {PIXI.PRECISION}
     * @deprecated since 7.1.0
     * @see PIXI.Program.defaultVertexPrecision
     */
    PRECISION_VERTEX: {
      get() {
        return Program.defaultVertexPrecision;
      },
      set(value) {
        deprecation("7.1.0", "settings.PRECISION_VERTEX is deprecated, use Program.defaultVertexPrecision"), Program.defaultVertexPrecision = value;
      }
    },
    /**
     * Default specify float precision in fragment shader.
     * @static
     * @name PRECISION_FRAGMENT
     * @memberof PIXI.settings
     * @type {PIXI.PRECISION}
     * @deprecated since 7.1.0
     * @see PIXI.Program.defaultFragmentPrecision
     */
    PRECISION_FRAGMENT: {
      get() {
        return Program.defaultFragmentPrecision;
      },
      set(value) {
        deprecation("7.1.0", "settings.PRECISION_FRAGMENT is deprecated, use Program.defaultFragmentPrecision"), Program.defaultFragmentPrecision = value;
      }
    }
  });

  // node_modules/@pixi/ticker/lib/const.mjs
  var UPDATE_PRIORITY = /* @__PURE__ */ ((UPDATE_PRIORITY2) => (UPDATE_PRIORITY2[UPDATE_PRIORITY2.INTERACTION = 50] = "INTERACTION", UPDATE_PRIORITY2[UPDATE_PRIORITY2.HIGH = 25] = "HIGH", UPDATE_PRIORITY2[UPDATE_PRIORITY2.NORMAL = 0] = "NORMAL", UPDATE_PRIORITY2[UPDATE_PRIORITY2.LOW = -25] = "LOW", UPDATE_PRIORITY2[UPDATE_PRIORITY2.UTILITY = -50] = "UTILITY", UPDATE_PRIORITY2))(UPDATE_PRIORITY || {});

  // node_modules/@pixi/ticker/lib/TickerListener.mjs
  var TickerListener = class {
    /**
     * Constructor
     * @private
     * @param fn - The listener function to be added for one update
     * @param context - The listener context
     * @param priority - The priority for emitting
     * @param once - If the handler should fire once
     */
    constructor(fn, context2 = null, priority = 0, once = false) {
      this.next = null, this.previous = null, this._destroyed = false, this.fn = fn, this.context = context2, this.priority = priority, this.once = once;
    }
    /**
     * Simple compare function to figure out if a function and context match.
     * @private
     * @param fn - The listener function to be added for one update
     * @param context - The listener context
     * @returns `true` if the listener match the arguments
     */
    match(fn, context2 = null) {
      return this.fn === fn && this.context === context2;
    }
    /**
     * Emit by calling the current function.
     * @private
     * @param deltaTime - time since the last emit.
     * @returns Next ticker
     */
    emit(deltaTime) {
      this.fn && (this.context ? this.fn.call(this.context, deltaTime) : this.fn(deltaTime));
      const redirect = this.next;
      return this.once && this.destroy(true), this._destroyed && (this.next = null), redirect;
    }
    /**
     * Connect to the list.
     * @private
     * @param previous - Input node, previous listener
     */
    connect(previous) {
      this.previous = previous, previous.next && (previous.next.previous = this), this.next = previous.next, previous.next = this;
    }
    /**
     * Destroy and don't use after this.
     * @private
     * @param hard - `true` to remove the `next` reference, this
     *        is considered a hard destroy. Soft destroy maintains the next reference.
     * @returns The listener to redirect while emitting or removing.
     */
    destroy(hard = false) {
      this._destroyed = true, this.fn = null, this.context = null, this.previous && (this.previous.next = this.next), this.next && (this.next.previous = this.previous);
      const redirect = this.next;
      return this.next = hard ? null : redirect, this.previous = null, redirect;
    }
  };

  // node_modules/@pixi/ticker/lib/Ticker.mjs
  var _Ticker = class _Ticker2 {
    constructor() {
      this.autoStart = false, this.deltaTime = 1, this.lastTime = -1, this.speed = 1, this.started = false, this._requestId = null, this._maxElapsedMS = 100, this._minElapsedMS = 0, this._protected = false, this._lastFrame = -1, this._head = new TickerListener(null, null, 1 / 0), this.deltaMS = 1 / _Ticker2.targetFPMS, this.elapsedMS = 1 / _Ticker2.targetFPMS, this._tick = (time) => {
        this._requestId = null, this.started && (this.update(time), this.started && this._requestId === null && this._head.next && (this._requestId = requestAnimationFrame(this._tick)));
      };
    }
    /**
     * Conditionally requests a new animation frame.
     * If a frame has not already been requested, and if the internal
     * emitter has listeners, a new frame is requested.
     * @private
     */
    _requestIfNeeded() {
      this._requestId === null && this._head.next && (this.lastTime = performance.now(), this._lastFrame = this.lastTime, this._requestId = requestAnimationFrame(this._tick));
    }
    /**
     * Conditionally cancels a pending animation frame.
     * @private
     */
    _cancelIfNeeded() {
      this._requestId !== null && (cancelAnimationFrame(this._requestId), this._requestId = null);
    }
    /**
     * Conditionally requests a new animation frame.
     * If the ticker has been started it checks if a frame has not already
     * been requested, and if the internal emitter has listeners. If these
     * conditions are met, a new frame is requested. If the ticker has not
     * been started, but autoStart is `true`, then the ticker starts now,
     * and continues with the previous conditions to request a new frame.
     * @private
     */
    _startIfPossible() {
      this.started ? this._requestIfNeeded() : this.autoStart && this.start();
    }
    /**
     * Register a handler for tick events. Calls continuously unless
     * it is removed or the ticker is stopped.
     * @param fn - The listener function to be added for updates
     * @param context - The listener context
     * @param {number} [priority=PIXI.UPDATE_PRIORITY.NORMAL] - The priority for emitting
     * @returns This instance of a ticker
     */
    add(fn, context2, priority = UPDATE_PRIORITY.NORMAL) {
      return this._addListener(new TickerListener(fn, context2, priority));
    }
    /**
     * Add a handler for the tick event which is only execute once.
     * @param fn - The listener function to be added for one update
     * @param context - The listener context
     * @param {number} [priority=PIXI.UPDATE_PRIORITY.NORMAL] - The priority for emitting
     * @returns This instance of a ticker
     */
    addOnce(fn, context2, priority = UPDATE_PRIORITY.NORMAL) {
      return this._addListener(new TickerListener(fn, context2, priority, true));
    }
    /**
     * Internally adds the event handler so that it can be sorted by priority.
     * Priority allows certain handler (user, AnimatedSprite, Interaction) to be run
     * before the rendering.
     * @private
     * @param listener - Current listener being added.
     * @returns This instance of a ticker
     */
    _addListener(listener) {
      let current = this._head.next, previous = this._head;
      if (!current)
        listener.connect(previous);
      else {
        for (; current; ) {
          if (listener.priority > current.priority) {
            listener.connect(previous);
            break;
          }
          previous = current, current = current.next;
        }
        listener.previous || listener.connect(previous);
      }
      return this._startIfPossible(), this;
    }
    /**
     * Removes any handlers matching the function and context parameters.
     * If no handlers are left after removing, then it cancels the animation frame.
     * @param fn - The listener function to be removed
     * @param context - The listener context to be removed
     * @returns This instance of a ticker
     */
    remove(fn, context2) {
      let listener = this._head.next;
      for (; listener; )
        listener.match(fn, context2) ? listener = listener.destroy() : listener = listener.next;
      return this._head.next || this._cancelIfNeeded(), this;
    }
    /**
     * The number of listeners on this ticker, calculated by walking through linked list
     * @readonly
     * @member {number}
     */
    get count() {
      if (!this._head)
        return 0;
      let count = 0, current = this._head;
      for (; current = current.next; )
        count++;
      return count;
    }
    /** Starts the ticker. If the ticker has listeners a new animation frame is requested at this point. */
    start() {
      this.started || (this.started = true, this._requestIfNeeded());
    }
    /** Stops the ticker. If the ticker has requested an animation frame it is canceled at this point. */
    stop() {
      this.started && (this.started = false, this._cancelIfNeeded());
    }
    /** Destroy the ticker and don't use after this. Calling this method removes all references to internal events. */
    destroy() {
      if (!this._protected) {
        this.stop();
        let listener = this._head.next;
        for (; listener; )
          listener = listener.destroy(true);
        this._head.destroy(), this._head = null;
      }
    }
    /**
     * Triggers an update. An update entails setting the
     * current {@link PIXI.Ticker#elapsedMS},
     * the current {@link PIXI.Ticker#deltaTime},
     * invoking all listeners with current deltaTime,
     * and then finally setting {@link PIXI.Ticker#lastTime}
     * with the value of currentTime that was provided.
     * This method will be called automatically by animation
     * frame callbacks if the ticker instance has been started
     * and listeners are added.
     * @param {number} [currentTime=performance.now()] - the current time of execution
     */
    update(currentTime = performance.now()) {
      let elapsedMS;
      if (currentTime > this.lastTime) {
        if (elapsedMS = this.elapsedMS = currentTime - this.lastTime, elapsedMS > this._maxElapsedMS && (elapsedMS = this._maxElapsedMS), elapsedMS *= this.speed, this._minElapsedMS) {
          const delta = currentTime - this._lastFrame | 0;
          if (delta < this._minElapsedMS)
            return;
          this._lastFrame = currentTime - delta % this._minElapsedMS;
        }
        this.deltaMS = elapsedMS, this.deltaTime = this.deltaMS * _Ticker2.targetFPMS;
        const head = this._head;
        let listener = head.next;
        for (; listener; )
          listener = listener.emit(this.deltaTime);
        head.next || this._cancelIfNeeded();
      } else
        this.deltaTime = this.deltaMS = this.elapsedMS = 0;
      this.lastTime = currentTime;
    }
    /**
     * The frames per second at which this ticker is running.
     * The default is approximately 60 in most modern browsers.
     * **Note:** This does not factor in the value of
     * {@link PIXI.Ticker#speed}, which is specific
     * to scaling {@link PIXI.Ticker#deltaTime}.
     * @member {number}
     * @readonly
     */
    get FPS() {
      return 1e3 / this.elapsedMS;
    }
    /**
     * Manages the maximum amount of milliseconds allowed to
     * elapse between invoking {@link PIXI.Ticker#update}.
     * This value is used to cap {@link PIXI.Ticker#deltaTime},
     * but does not effect the measured value of {@link PIXI.Ticker#FPS}.
     * When setting this property it is clamped to a value between
     * `0` and `Ticker.targetFPMS * 1000`.
     * @member {number}
     * @default 10
     */
    get minFPS() {
      return 1e3 / this._maxElapsedMS;
    }
    set minFPS(fps) {
      const minFPS = Math.min(this.maxFPS, fps), minFPMS = Math.min(Math.max(0, minFPS) / 1e3, _Ticker2.targetFPMS);
      this._maxElapsedMS = 1 / minFPMS;
    }
    /**
     * Manages the minimum amount of milliseconds required to
     * elapse between invoking {@link PIXI.Ticker#update}.
     * This will effect the measured value of {@link PIXI.Ticker#FPS}.
     * If it is set to `0`, then there is no limit; PixiJS will render as many frames as it can.
     * Otherwise it will be at least `minFPS`
     * @member {number}
     * @default 0
     */
    get maxFPS() {
      return this._minElapsedMS ? Math.round(1e3 / this._minElapsedMS) : 0;
    }
    set maxFPS(fps) {
      if (fps === 0)
        this._minElapsedMS = 0;
      else {
        const maxFPS = Math.max(this.minFPS, fps);
        this._minElapsedMS = 1 / (maxFPS / 1e3);
      }
    }
    /**
     * The shared ticker instance used by {@link PIXI.AnimatedSprite} and by
     * {@link PIXI.VideoResource} to update animation frames / video textures.
     *
     * It may also be used by {@link PIXI.Application} if created with the `sharedTicker` option property set to true.
     *
     * The property {@link PIXI.Ticker#autoStart} is set to `true` for this instance.
     * Please follow the examples for usage, including how to opt-out of auto-starting the shared ticker.
     * @example
     * import { Ticker } from 'pixi.js';
     *
     * const ticker = Ticker.shared;
     * // Set this to prevent starting this ticker when listeners are added.
     * // By default this is true only for the PIXI.Ticker.shared instance.
     * ticker.autoStart = false;
     *
     * // FYI, call this to ensure the ticker is stopped. It should be stopped
     * // if you have not attempted to render anything yet.
     * ticker.stop();
     *
     * // Call this when you are ready for a running shared ticker.
     * ticker.start();
     * @example
     * import { autoDetectRenderer, Container } from 'pixi.js';
     *
     * // You may use the shared ticker to render...
     * const renderer = autoDetectRenderer();
     * const stage = new Container();
     * document.body.appendChild(renderer.view);
     * ticker.add((time) => renderer.render(stage));
     *
     * // Or you can just update it manually.
     * ticker.autoStart = false;
     * ticker.stop();
     * const animate = (time) => {
     *     ticker.update(time);
     *     renderer.render(stage);
     *     requestAnimationFrame(animate);
     * };
     * animate(performance.now());
     * @member {PIXI.Ticker}
     * @static
     */
    static get shared() {
      if (!_Ticker2._shared) {
        const shared = _Ticker2._shared = new _Ticker2();
        shared.autoStart = true, shared._protected = true;
      }
      return _Ticker2._shared;
    }
    /**
     * The system ticker instance used by {@link PIXI.BasePrepare} for core timing
     * functionality that shouldn't usually need to be paused, unlike the `shared`
     * ticker which drives visual animations and rendering which may want to be paused.
     *
     * The property {@link PIXI.Ticker#autoStart} is set to `true` for this instance.
     * @member {PIXI.Ticker}
     * @static
     */
    static get system() {
      if (!_Ticker2._system) {
        const system = _Ticker2._system = new _Ticker2();
        system.autoStart = true, system._protected = true;
      }
      return _Ticker2._system;
    }
  };
  _Ticker.targetFPMS = 0.06;
  var Ticker = _Ticker;

  // node_modules/@pixi/ticker/lib/settings.mjs
  Object.defineProperties(settings, {
    /**
     * Target frames per millisecond.
     * @static
     * @name TARGET_FPMS
     * @memberof PIXI.settings
     * @type {number}
     * @deprecated since 7.1.0
     * @see PIXI.Ticker.targetFPMS
     */
    TARGET_FPMS: {
      get() {
        return Ticker.targetFPMS;
      },
      set(value) {
        deprecation("7.1.0", "settings.TARGET_FPMS is deprecated, use Ticker.targetFPMS"), Ticker.targetFPMS = value;
      }
    }
  });

  // node_modules/@pixi/ticker/lib/TickerPlugin.mjs
  var TickerPlugin = class {
    /**
     * Initialize the plugin with scope of application instance
     * @static
     * @private
     * @param {object} [options] - See application options
     */
    static init(options) {
      options = Object.assign({
        autoStart: true,
        sharedTicker: false
      }, options), Object.defineProperty(
        this,
        "ticker",
        {
          set(ticker) {
            this._ticker && this._ticker.remove(this.render, this), this._ticker = ticker, ticker && ticker.add(this.render, this, UPDATE_PRIORITY.LOW);
          },
          get() {
            return this._ticker;
          }
        }
      ), this.stop = () => {
        this._ticker.stop();
      }, this.start = () => {
        this._ticker.start();
      }, this._ticker = null, this.ticker = options.sharedTicker ? Ticker.shared : new Ticker(), options.autoStart && this.start();
    }
    /**
     * Clean up the ticker, scoped to application.
     * @static
     * @private
     */
    static destroy() {
      if (this._ticker) {
        const oldTicker = this._ticker;
        this.ticker = null, oldTicker.destroy();
      }
    }
  };
  TickerPlugin.extension = ExtensionType.Application;
  extensions.add(TickerPlugin);

  // node_modules/@pixi/core/lib/autoDetectRenderer.mjs
  var renderers = [];
  extensions.handleByList(ExtensionType.Renderer, renderers);
  function autoDetectRenderer(options) {
    for (const RendererType of renderers)
      if (RendererType.test(options))
        return new RendererType(options);
    throw new Error("Unable to auto-detect a suitable renderer.");
  }

  // node_modules/@pixi/core/lib/fragments/defaultFilter.vert.mjs
  var $defaultFilterVertex = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

  // node_modules/@pixi/core/lib/fragments/index.mjs
  var defaultFilterVertex = $defaultFilterVertex;

  // node_modules/@pixi/core/lib/framebuffer/MultisampleSystem.mjs
  var MultisampleSystem = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    contextChange(gl) {
      let samples;
      if (this.renderer.context.webGLVersion === 1) {
        const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null), samples = gl.getParameter(gl.SAMPLES), gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      } else {
        const framebuffer = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null), samples = gl.getParameter(gl.SAMPLES), gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      }
      samples >= MSAA_QUALITY.HIGH ? this.multisample = MSAA_QUALITY.HIGH : samples >= MSAA_QUALITY.MEDIUM ? this.multisample = MSAA_QUALITY.MEDIUM : samples >= MSAA_QUALITY.LOW ? this.multisample = MSAA_QUALITY.LOW : this.multisample = MSAA_QUALITY.NONE;
    }
    destroy() {
    }
  };
  MultisampleSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "_multisample"
  };
  extensions.add(MultisampleSystem);

  // node_modules/@pixi/core/lib/geometry/GLBuffer.mjs
  var GLBuffer = class {
    constructor(buffer) {
      this.buffer = buffer || null, this.updateID = -1, this.byteLength = -1, this.refCount = 0;
    }
  };

  // node_modules/@pixi/core/lib/geometry/BufferSystem.mjs
  var BufferSystem = class {
    /**
     * @param {PIXI.Renderer} renderer - The renderer this System works for.
     */
    constructor(renderer) {
      this.renderer = renderer, this.managedBuffers = {}, this.boundBufferBases = {};
    }
    /**
     * @ignore
     */
    destroy() {
      this.renderer = null;
    }
    /** Sets up the renderer context and necessary buffers. */
    contextChange() {
      this.disposeAll(true), this.gl = this.renderer.gl, this.CONTEXT_UID = this.renderer.CONTEXT_UID;
    }
    /**
     * This binds specified buffer. On first run, it will create the webGL buffers for the context too
     * @param buffer - the buffer to bind to the renderer
     */
    bind(buffer) {
      const { gl, CONTEXT_UID } = this, glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
      gl.bindBuffer(buffer.type, glBuffer.buffer);
    }
    unbind(type) {
      const { gl } = this;
      gl.bindBuffer(type, null);
    }
    /**
     * Binds an uniform buffer to at the given index.
     *
     * A cache is used so a buffer will not be bound again if already bound.
     * @param buffer - the buffer to bind
     * @param index - the base index to bind it to.
     */
    bindBufferBase(buffer, index) {
      const { gl, CONTEXT_UID } = this;
      if (this.boundBufferBases[index] !== buffer) {
        const glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
        this.boundBufferBases[index] = buffer, gl.bindBufferBase(gl.UNIFORM_BUFFER, index, glBuffer.buffer);
      }
    }
    /**
     * Binds a buffer whilst also binding its range.
     * This will make the buffer start from the offset supplied rather than 0 when it is read.
     * @param buffer - the buffer to bind
     * @param index - the base index to bind at, defaults to 0
     * @param offset - the offset to bind at (this is blocks of 256). 0 = 0, 1 = 256, 2 = 512 etc
     */
    bindBufferRange(buffer, index, offset) {
      const { gl, CONTEXT_UID } = this;
      offset = offset || 0;
      const glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
      gl.bindBufferRange(gl.UNIFORM_BUFFER, index || 0, glBuffer.buffer, offset * 256, 256);
    }
    /**
     * Will ensure the data in the buffer is uploaded to the GPU.
     * @param {PIXI.Buffer} buffer - the buffer to update
     */
    update(buffer) {
      const { gl, CONTEXT_UID } = this, glBuffer = buffer._glBuffers[CONTEXT_UID] || this.createGLBuffer(buffer);
      if (buffer._updateID !== glBuffer.updateID)
        if (glBuffer.updateID = buffer._updateID, gl.bindBuffer(buffer.type, glBuffer.buffer), glBuffer.byteLength >= buffer.data.byteLength)
          gl.bufferSubData(buffer.type, 0, buffer.data);
        else {
          const drawType = buffer.static ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
          glBuffer.byteLength = buffer.data.byteLength, gl.bufferData(buffer.type, buffer.data, drawType);
        }
    }
    /**
     * Disposes buffer
     * @param {PIXI.Buffer} buffer - buffer with data
     * @param {boolean} [contextLost=false] - If context was lost, we suppress deleteVertexArray
     */
    dispose(buffer, contextLost) {
      if (!this.managedBuffers[buffer.id])
        return;
      delete this.managedBuffers[buffer.id];
      const glBuffer = buffer._glBuffers[this.CONTEXT_UID], gl = this.gl;
      buffer.disposeRunner.remove(this), glBuffer && (contextLost || gl.deleteBuffer(glBuffer.buffer), delete buffer._glBuffers[this.CONTEXT_UID]);
    }
    /**
     * dispose all WebGL resources of all managed buffers
     * @param {boolean} [contextLost=false] - If context was lost, we suppress `gl.delete` calls
     */
    disposeAll(contextLost) {
      const all = Object.keys(this.managedBuffers);
      for (let i2 = 0; i2 < all.length; i2++)
        this.dispose(this.managedBuffers[all[i2]], contextLost);
    }
    /**
     * creates and attaches a GLBuffer object tied to the current context.
     * @param buffer
     * @protected
     */
    createGLBuffer(buffer) {
      const { CONTEXT_UID, gl } = this;
      return buffer._glBuffers[CONTEXT_UID] = new GLBuffer(gl.createBuffer()), this.managedBuffers[buffer.id] = buffer, buffer.disposeRunner.add(this), buffer._glBuffers[CONTEXT_UID];
    }
  };
  BufferSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "buffer"
  };
  extensions.add(BufferSystem);

  // node_modules/@pixi/core/lib/render/ObjectRendererSystem.mjs
  var ObjectRendererSystem = class {
    // renderers scene graph!
    constructor(renderer) {
      this.renderer = renderer;
    }
    /**
     * Renders the object to its WebGL view.
     * @param displayObject - The object to be rendered.
     * @param options - the options to be passed to the renderer
     */
    render(displayObject, options) {
      const renderer = this.renderer;
      let renderTexture, clear, transform, skipUpdateTransform;
      if (options && (renderTexture = options.renderTexture, clear = options.clear, transform = options.transform, skipUpdateTransform = options.skipUpdateTransform), this.renderingToScreen = !renderTexture, renderer.runners.prerender.emit(), renderer.emit("prerender"), renderer.projection.transform = transform, !renderer.context.isLost) {
        if (renderTexture || (this.lastObjectRendered = displayObject), !skipUpdateTransform) {
          const cacheParent = displayObject.enableTempParent();
          displayObject.updateTransform(), displayObject.disableTempParent(cacheParent);
        }
        renderer.renderTexture.bind(renderTexture), renderer.batch.currentRenderer.start(), (clear ?? renderer.background.clearBeforeRender) && renderer.renderTexture.clear(), displayObject.render(renderer), renderer.batch.currentRenderer.flush(), renderTexture && (options.blit && renderer.framebuffer.blit(), renderTexture.baseTexture.update()), renderer.runners.postrender.emit(), renderer.projection.transform = null, renderer.emit("postrender");
      }
    }
    destroy() {
      this.renderer = null, this.lastObjectRendered = null;
    }
  };
  ObjectRendererSystem.extension = {
    type: ExtensionType.RendererSystem,
    name: "objectRenderer"
  };
  extensions.add(ObjectRendererSystem);

  // node_modules/@pixi/core/lib/Renderer.mjs
  var _Renderer = class _Renderer2 extends SystemManager {
    /**
     * @param {PIXI.IRendererOptions} [options] - See {@link PIXI.settings.RENDER_OPTIONS} for defaults.
     */
    constructor(options) {
      super(), this.type = RENDERER_TYPE.WEBGL, options = Object.assign({}, settings.RENDER_OPTIONS, options), this.gl = null, this.CONTEXT_UID = 0, this.globalUniforms = new UniformGroup({
        projectionMatrix: new Matrix()
      }, true);
      const systemConfig = {
        runners: [
          "init",
          "destroy",
          "contextChange",
          "resolutionChange",
          "reset",
          "update",
          "postrender",
          "prerender",
          "resize"
        ],
        systems: _Renderer2.__systems,
        priority: [
          "_view",
          "textureGenerator",
          "background",
          "_plugin",
          "startup",
          // low level WebGL systems
          "context",
          "state",
          "texture",
          "buffer",
          "geometry",
          "framebuffer",
          "transformFeedback",
          // high level pixi specific rendering
          "mask",
          "scissor",
          "stencil",
          "projection",
          "textureGC",
          "filter",
          "renderTexture",
          "batch",
          "objectRenderer",
          "_multisample"
        ]
      };
      this.setup(systemConfig), "useContextAlpha" in options && (deprecation("7.0.0", "options.useContextAlpha is deprecated, use options.premultipliedAlpha and options.backgroundAlpha instead"), options.premultipliedAlpha = options.useContextAlpha && options.useContextAlpha !== "notMultiplied", options.backgroundAlpha = options.useContextAlpha === false ? 1 : options.backgroundAlpha), this._plugin.rendererPlugins = _Renderer2.__plugins, this.options = options, this.startup.run(this.options);
    }
    /**
     * Create renderer if WebGL is available. Overrideable
     * by the **@pixi/canvas-renderer** package to allow fallback.
     * throws error if WebGL is not available.
     * @param options
     * @private
     */
    static test(options) {
      return options?.forceCanvas ? false : isWebGLSupported();
    }
    /**
     * Renders the object to its WebGL view.
     * @param displayObject - The object to be rendered.
     * @param {object} [options] - Object to use for render options.
     * @param {PIXI.RenderTexture} [options.renderTexture] - The render texture to render to.
     * @param {boolean} [options.clear=true] - Should the canvas be cleared before the new render.
     * @param {PIXI.Matrix} [options.transform] - A transform to apply to the render texture before rendering.
     * @param {boolean} [options.skipUpdateTransform=false] - Should we skip the update transform pass?
     */
    render(displayObject, options) {
      this.objectRenderer.render(displayObject, options);
    }
    /**
     * Resizes the WebGL view to the specified width and height.
     * @param desiredScreenWidth - The desired width of the screen.
     * @param desiredScreenHeight - The desired height of the screen.
     */
    resize(desiredScreenWidth, desiredScreenHeight) {
      this._view.resizeView(desiredScreenWidth, desiredScreenHeight);
    }
    /**
     * Resets the WebGL state so you can render things however you fancy!
     * @returns Returns itself.
     */
    reset() {
      return this.runners.reset.emit(), this;
    }
    /** Clear the frame buffer. */
    clear() {
      this.renderTexture.bind(), this.renderTexture.clear();
    }
    /**
     * Removes everything from the renderer (event listeners, spritebatch, etc...)
     * @param [removeView=false] - Removes the Canvas element from the DOM.
     *  See: https://github.com/pixijs/pixijs/issues/2233
     */
    destroy(removeView = false) {
      this.runners.destroy.items.reverse(), this.emitWithCustomOptions(this.runners.destroy, {
        _view: removeView
      }), super.destroy();
    }
    /** Collection of plugins */
    get plugins() {
      return this._plugin.plugins;
    }
    /** The number of msaa samples of the canvas. */
    get multisample() {
      return this._multisample.multisample;
    }
    /**
     * Same as view.width, actual number of pixels in the canvas by horizontal.
     * @member {number}
     * @readonly
     * @default 800
     */
    get width() {
      return this._view.element.width;
    }
    /**
     * Same as view.height, actual number of pixels in the canvas by vertical.
     * @default 600
     */
    get height() {
      return this._view.element.height;
    }
    /** The resolution / device pixel ratio of the renderer. */
    get resolution() {
      return this._view.resolution;
    }
    set resolution(value) {
      this._view.resolution = value, this.runners.resolutionChange.emit(value);
    }
    /** Whether CSS dimensions of canvas view should be resized to screen dimensions automatically. */
    get autoDensity() {
      return this._view.autoDensity;
    }
    /** The canvas element that everything is drawn to.*/
    get view() {
      return this._view.element;
    }
    /**
     * Measurements of the screen. (0, 0, screenWidth, screenHeight).
     *
     * Its safe to use as filterArea or hitArea for the whole stage.
     * @member {PIXI.Rectangle}
     */
    get screen() {
      return this._view.screen;
    }
    /** the last object rendered by the renderer. Useful for other plugins like interaction managers */
    get lastObjectRendered() {
      return this.objectRenderer.lastObjectRendered;
    }
    /** Flag if we are rendering to the screen vs renderTexture */
    get renderingToScreen() {
      return this.objectRenderer.renderingToScreen;
    }
    /** When logging Pixi to the console, this is the name we will show */
    get rendererLogId() {
      return `WebGL ${this.context.webGLVersion}`;
    }
    /**
     * This sets weather the screen is totally cleared between each frame withthe background color and alpha
     * @deprecated since 7.0.0
     */
    get clearBeforeRender() {
      return deprecation("7.0.0", "renderer.clearBeforeRender has been deprecated, please use renderer.background.clearBeforeRender instead."), this.background.clearBeforeRender;
    }
    /**
     * Pass-thru setting for the canvas' context `alpha` property. This is typically
     * not something you need to fiddle with. If you want transparency, use `backgroundAlpha`.
     * @deprecated since 7.0.0
     * @member {boolean}
     */
    get useContextAlpha() {
      return deprecation("7.0.0", "renderer.useContextAlpha has been deprecated, please use renderer.context.premultipliedAlpha instead."), this.context.useContextAlpha;
    }
    /**
     * readonly drawing buffer preservation
     * we can only know this if Pixi created the context
     * @deprecated since 7.0.0
     */
    get preserveDrawingBuffer() {
      return deprecation("7.0.0", "renderer.preserveDrawingBuffer has been deprecated, we cannot truly know this unless pixi created the context"), this.context.preserveDrawingBuffer;
    }
    /**
     * The background color to fill if not transparent
     * @member {number}
     * @deprecated since 7.0.0
     */
    get backgroundColor() {
      return deprecation("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."), this.background.color;
    }
    set backgroundColor(value) {
      deprecation("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."), this.background.color = value;
    }
    /**
     * The background color alpha. Setting this to 0 will make the canvas transparent.
     * @member {number}
     * @deprecated since 7.0.0
     */
    get backgroundAlpha() {
      return deprecation("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."), this.background.alpha;
    }
    /**
     * @deprecated since 7.0.0
     */
    set backgroundAlpha(value) {
      deprecation("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."), this.background.alpha = value;
    }
    /**
     * @deprecated since 7.0.0
     */
    get powerPreference() {
      return deprecation("7.0.0", "renderer.powerPreference has been deprecated, we can only know this if pixi creates the context"), this.context.powerPreference;
    }
    /**
     * Useful function that returns a texture of the display object that can then be used to create sprites
     * This can be quite useful if your displayObject is complicated and needs to be reused multiple times.
     * @param displayObject - The displayObject the object will be generated from.
     * @param {IGenerateTextureOptions} options - Generate texture options.
     * @param {PIXI.Rectangle} options.region - The region of the displayObject, that shall be rendered,
     *        if no region is specified, defaults to the local bounds of the displayObject.
     * @param {number} [options.resolution] - If not given, the renderer's resolution is used.
     * @param {PIXI.MSAA_QUALITY} [options.multisample] - If not given, the renderer's multisample is used.
     * @returns A texture of the graphics object.
     */
    generateTexture(displayObject, options) {
      return this.textureGenerator.generateTexture(displayObject, options);
    }
  };
  _Renderer.extension = {
    type: ExtensionType.Renderer,
    priority: 1
  }, /**
  * Collection of installed plugins. These are included by default in PIXI, but can be excluded
  * by creating a custom build. Consult the README for more information about creating custom
  * builds and excluding plugins.
  * @private
  */
  _Renderer.__plugins = {}, /**
  * The collection of installed systems.
  * @private
  */
  _Renderer.__systems = {};
  var Renderer = _Renderer;
  extensions.handleByMap(ExtensionType.RendererPlugin, Renderer.__plugins);
  extensions.handleByMap(ExtensionType.RendererSystem, Renderer.__systems);
  extensions.add(Renderer);

  // node_modules/@pixi/core/lib/textures/resources/AbstractMultiResource.mjs
  var AbstractMultiResource = class extends Resource {
    /**
     * @param length
     * @param options - Options to for Resource constructor
     * @param {number} [options.width] - Width of the resource
     * @param {number} [options.height] - Height of the resource
     */
    constructor(length, options) {
      const { width, height } = options || {};
      super(width, height), this.items = [], this.itemDirtyIds = [];
      for (let i2 = 0; i2 < length; i2++) {
        const partTexture = new BaseTexture();
        this.items.push(partTexture), this.itemDirtyIds.push(-2);
      }
      this.length = length, this._load = null, this.baseTexture = null;
    }
    /**
     * Used from ArrayResource and CubeResource constructors.
     * @param resources - Can be resources, image elements, canvas, etc. ,
     *  length should be same as constructor length
     * @param options - Detect options for resources
     */
    initFromArray(resources, options) {
      for (let i2 = 0; i2 < this.length; i2++)
        resources[i2] && (resources[i2].castToBaseTexture ? this.addBaseTextureAt(resources[i2].castToBaseTexture(), i2) : resources[i2] instanceof Resource ? this.addResourceAt(resources[i2], i2) : this.addResourceAt(autoDetectResource(resources[i2], options), i2));
    }
    /** Destroy this BaseImageResource. */
    dispose() {
      for (let i2 = 0, len = this.length; i2 < len; i2++)
        this.items[i2].destroy();
      this.items = null, this.itemDirtyIds = null, this._load = null;
    }
    /**
     * Set a resource by ID
     * @param resource
     * @param index - Zero-based index of resource to set
     * @returns - Instance for chaining
     */
    addResourceAt(resource, index) {
      if (!this.items[index])
        throw new Error(`Index ${index} is out of bounds`);
      return resource.valid && !this.valid && this.resize(resource.width, resource.height), this.items[index].setResource(resource), this;
    }
    /**
     * Set the parent base texture.
     * @param baseTexture
     */
    bind(baseTexture) {
      if (this.baseTexture !== null)
        throw new Error("Only one base texture per TextureArray is allowed");
      super.bind(baseTexture);
      for (let i2 = 0; i2 < this.length; i2++)
        this.items[i2].parentTextureArray = baseTexture, this.items[i2].on("update", baseTexture.update, baseTexture);
    }
    /**
     * Unset the parent base texture.
     * @param baseTexture
     */
    unbind(baseTexture) {
      super.unbind(baseTexture);
      for (let i2 = 0; i2 < this.length; i2++)
        this.items[i2].parentTextureArray = null, this.items[i2].off("update", baseTexture.update, baseTexture);
    }
    /**
     * Load all the resources simultaneously
     * @returns - When load is resolved
     */
    load() {
      if (this._load)
        return this._load;
      const promises = this.items.map((item) => item.resource).filter((item) => item).map((item) => item.load());
      return this._load = Promise.all(promises).then(
        () => {
          const { realWidth, realHeight } = this.items[0];
          return this.resize(realWidth, realHeight), this.update(), Promise.resolve(this);
        }
      ), this._load;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/ArrayResource.mjs
  var ArrayResource = class extends AbstractMultiResource {
    /**
     * @param source - Number of items in array or the collection
     *        of image URLs to use. Can also be resources, image elements, canvas, etc.
     * @param options - Options to apply to {@link PIXI.autoDetectResource}
     * @param {number} [options.width] - Width of the resource
     * @param {number} [options.height] - Height of the resource
     */
    constructor(source, options) {
      const { width, height } = options || {};
      let urls, length;
      Array.isArray(source) ? (urls = source, length = source.length) : length = source, super(length, { width, height }), urls && this.initFromArray(urls, options);
    }
    /**
     * Set a baseTexture by ID,
     * ArrayResource just takes resource from it, nothing more
     * @param baseTexture
     * @param index - Zero-based index of resource to set
     * @returns - Instance for chaining
     */
    addBaseTextureAt(baseTexture, index) {
      if (baseTexture.resource)
        this.addResourceAt(baseTexture.resource, index);
      else
        throw new Error("ArrayResource does not support RenderTexture");
      return this;
    }
    /**
     * Add binding
     * @param baseTexture
     */
    bind(baseTexture) {
      super.bind(baseTexture), baseTexture.target = TARGETS.TEXTURE_2D_ARRAY;
    }
    /**
     * Upload the resources to the GPU.
     * @param renderer
     * @param texture
     * @param glTexture
     * @returns - whether texture was uploaded
     */
    upload(renderer, texture, glTexture) {
      const { length, itemDirtyIds, items } = this, { gl } = renderer;
      glTexture.dirtyId < 0 && gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        glTexture.internalFormat,
        this._width,
        this._height,
        length,
        0,
        texture.format,
        glTexture.type,
        null
      );
      for (let i2 = 0; i2 < length; i2++) {
        const item = items[i2];
        itemDirtyIds[i2] < item.dirtyId && (itemDirtyIds[i2] = item.dirtyId, item.valid && gl.texSubImage3D(
          gl.TEXTURE_2D_ARRAY,
          0,
          0,
          // xoffset
          0,
          // yoffset
          i2,
          // zoffset
          item.resource.width,
          item.resource.height,
          1,
          texture.format,
          glTexture.type,
          item.resource.source
        ));
      }
      return true;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/CanvasResource.mjs
  var CanvasResource = class extends BaseImageResource {
    /**
     * @param source - Canvas element to use
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(source) {
      super(source);
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if source is HTMLCanvasElement or OffscreenCanvas
     */
    static test(source) {
      const { OffscreenCanvas: OffscreenCanvas2 } = globalThis;
      return OffscreenCanvas2 && source instanceof OffscreenCanvas2 ? true : globalThis.HTMLCanvasElement && source instanceof HTMLCanvasElement;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/CubeResource.mjs
  var _CubeResource = class _CubeResource2 extends AbstractMultiResource {
    /**
     * @param {Array<string|PIXI.Resource>} [source] - Collection of URLs or resources
     *        to use as the sides of the cube.
     * @param options - ImageResource options
     * @param {number} [options.width] - Width of resource
     * @param {number} [options.height] - Height of resource
     * @param {number} [options.autoLoad=true] - Whether to auto-load resources
     * @param {number} [options.linkBaseTexture=true] - In case BaseTextures are supplied,
     *   whether to copy them or use
     */
    constructor(source, options) {
      const { width, height, autoLoad, linkBaseTexture } = options || {};
      if (source && source.length !== _CubeResource2.SIDES)
        throw new Error(`Invalid length. Got ${source.length}, expected 6`);
      super(6, { width, height });
      for (let i2 = 0; i2 < _CubeResource2.SIDES; i2++)
        this.items[i2].target = TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + i2;
      this.linkBaseTexture = linkBaseTexture !== false, source && this.initFromArray(source, options), autoLoad !== false && this.load();
    }
    /**
     * Add binding.
     * @param baseTexture - parent base texture
     */
    bind(baseTexture) {
      super.bind(baseTexture), baseTexture.target = TARGETS.TEXTURE_CUBE_MAP;
    }
    addBaseTextureAt(baseTexture, index, linkBaseTexture) {
      if (linkBaseTexture === void 0 && (linkBaseTexture = this.linkBaseTexture), !this.items[index])
        throw new Error(`Index ${index} is out of bounds`);
      if (!this.linkBaseTexture || baseTexture.parentTextureArray || Object.keys(baseTexture._glTextures).length > 0)
        if (baseTexture.resource)
          this.addResourceAt(baseTexture.resource, index);
        else
          throw new Error("CubeResource does not support copying of renderTexture.");
      else
        baseTexture.target = TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + index, baseTexture.parentTextureArray = this.baseTexture, this.items[index] = baseTexture;
      return baseTexture.valid && !this.valid && this.resize(baseTexture.realWidth, baseTexture.realHeight), this.items[index] = baseTexture, this;
    }
    /**
     * Upload the resource
     * @param renderer
     * @param _baseTexture
     * @param glTexture
     * @returns {boolean} true is success
     */
    upload(renderer, _baseTexture, glTexture) {
      const dirty = this.itemDirtyIds;
      for (let i2 = 0; i2 < _CubeResource2.SIDES; i2++) {
        const side = this.items[i2];
        (dirty[i2] < side.dirtyId || glTexture.dirtyId < _baseTexture.dirtyId) && (side.valid && side.resource ? (side.resource.upload(renderer, side, glTexture), dirty[i2] = side.dirtyId) : dirty[i2] < -1 && (renderer.gl.texImage2D(
          side.target,
          0,
          glTexture.internalFormat,
          _baseTexture.realWidth,
          _baseTexture.realHeight,
          0,
          _baseTexture.format,
          glTexture.type,
          null
        ), dirty[i2] = -1));
      }
      return true;
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if source is an array of 6 elements
     */
    static test(source) {
      return Array.isArray(source) && source.length === _CubeResource2.SIDES;
    }
  };
  _CubeResource.SIDES = 6;
  var CubeResource = _CubeResource;

  // node_modules/@pixi/core/lib/textures/resources/ImageBitmapResource.mjs
  var ImageBitmapResource = class _ImageBitmapResource extends BaseImageResource {
    /**
     * @param source - ImageBitmap or URL to use.
     * @param options - Options to use.
     */
    constructor(source, options) {
      options = options || {};
      let baseSource, url2, ownsImageBitmap;
      typeof source == "string" ? (baseSource = _ImageBitmapResource.EMPTY, url2 = source, ownsImageBitmap = true) : (baseSource = source, url2 = null, ownsImageBitmap = false), super(baseSource), this.url = url2, this.crossOrigin = options.crossOrigin ?? true, this.alphaMode = typeof options.alphaMode == "number" ? options.alphaMode : null, this.ownsImageBitmap = options.ownsImageBitmap ?? ownsImageBitmap, this._load = null, options.autoLoad !== false && this.load();
    }
    load() {
      return this._load ? this._load : (this._load = new Promise(async (resolve2, reject) => {
        if (this.url === null) {
          resolve2(this);
          return;
        }
        try {
          const response = await settings.ADAPTER.fetch(this.url, {
            mode: this.crossOrigin ? "cors" : "no-cors"
          });
          if (this.destroyed)
            return;
          const imageBlob = await response.blob();
          if (this.destroyed)
            return;
          const imageBitmap = await createImageBitmap(imageBlob, {
            premultiplyAlpha: this.alphaMode === null || this.alphaMode === ALPHA_MODES.UNPACK ? "premultiply" : "none"
          });
          if (this.destroyed) {
            imageBitmap.close();
            return;
          }
          this.source = imageBitmap, this.update(), resolve2(this);
        } catch (e2) {
          if (this.destroyed)
            return;
          reject(e2), this.onError.emit(e2);
        }
      }), this._load);
    }
    /**
     * Upload the image bitmap resource to GPU.
     * @param renderer - Renderer to upload to
     * @param baseTexture - BaseTexture for this resource
     * @param glTexture - GLTexture to use
     * @returns {boolean} true is success
     */
    upload(renderer, baseTexture, glTexture) {
      return this.source instanceof ImageBitmap ? (typeof this.alphaMode == "number" && (baseTexture.alphaMode = this.alphaMode), super.upload(renderer, baseTexture, glTexture)) : (this.load(), false);
    }
    /** Destroys this resource. */
    dispose() {
      this.ownsImageBitmap && this.source instanceof ImageBitmap && this.source.close(), super.dispose(), this._load = null;
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if current environment support ImageBitmap, and source is string or ImageBitmap
     */
    static test(source) {
      return !!globalThis.createImageBitmap && typeof ImageBitmap < "u" && (typeof source == "string" || source instanceof ImageBitmap);
    }
    /**
     * ImageBitmap cannot be created synchronously, so a empty placeholder canvas is needed when loading from URLs.
     * Only for internal usage.
     * @returns The cached placeholder canvas.
     */
    static get EMPTY() {
      return _ImageBitmapResource._EMPTY = _ImageBitmapResource._EMPTY ?? settings.ADAPTER.createCanvas(0, 0), _ImageBitmapResource._EMPTY;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/SVGResource.mjs
  var _SVGResource = class _SVGResource2 extends BaseImageResource {
    /**
     * @param sourceBase64 - Base64 encoded SVG element or URL for SVG file.
     * @param {object} [options] - Options to use
     * @param {number} [options.scale=1] - Scale to apply to SVG. Overridden by...
     * @param {number} [options.width] - Rasterize SVG this wide. Aspect ratio preserved if height not specified.
     * @param {number} [options.height] - Rasterize SVG this high. Aspect ratio preserved if width not specified.
     * @param {boolean} [options.autoLoad=true] - Start loading right away.
     */
    constructor(sourceBase64, options) {
      options = options || {}, super(settings.ADAPTER.createCanvas()), this._width = 0, this._height = 0, this.svg = sourceBase64, this.scale = options.scale || 1, this._overrideWidth = options.width, this._overrideHeight = options.height, this._resolve = null, this._crossorigin = options.crossorigin, this._load = null, options.autoLoad !== false && this.load();
    }
    load() {
      return this._load ? this._load : (this._load = new Promise((resolve2) => {
        if (this._resolve = () => {
          this.update(), resolve2(this);
        }, _SVGResource2.SVG_XML.test(this.svg.trim())) {
          if (!btoa)
            throw new Error("Your browser doesn't support base64 conversions.");
          this.svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(this.svg)))}`;
        }
        this._loadSvg();
      }), this._load);
    }
    /** Loads an SVG image from `imageUrl` or `data URL`. */
    _loadSvg() {
      const tempImage = new Image();
      BaseImageResource.crossOrigin(tempImage, this.svg, this._crossorigin), tempImage.src = this.svg, tempImage.onerror = (event) => {
        this._resolve && (tempImage.onerror = null, this.onError.emit(event));
      }, tempImage.onload = () => {
        if (!this._resolve)
          return;
        const svgWidth = tempImage.width, svgHeight = tempImage.height;
        if (!svgWidth || !svgHeight)
          throw new Error("The SVG image must have width and height defined (in pixels), canvas API needs them.");
        let width = svgWidth * this.scale, height = svgHeight * this.scale;
        (this._overrideWidth || this._overrideHeight) && (width = this._overrideWidth || this._overrideHeight / svgHeight * svgWidth, height = this._overrideHeight || this._overrideWidth / svgWidth * svgHeight), width = Math.round(width), height = Math.round(height);
        const canvas = this.source;
        canvas.width = width, canvas.height = height, canvas._pixiId = `canvas_${uid()}`, canvas.getContext("2d").drawImage(tempImage, 0, 0, svgWidth, svgHeight, 0, 0, width, height), this._resolve(), this._resolve = null;
      };
    }
    /**
     * Get size from an svg string using a regular expression.
     * @param svgString - a serialized svg element
     * @returns - image extension
     */
    static getSize(svgString) {
      const sizeMatch = _SVGResource2.SVG_SIZE.exec(svgString), size = {};
      return sizeMatch && (size[sizeMatch[1]] = Math.round(parseFloat(sizeMatch[3])), size[sizeMatch[5]] = Math.round(parseFloat(sizeMatch[7]))), size;
    }
    /** Destroys this texture. */
    dispose() {
      super.dispose(), this._resolve = null, this._crossorigin = null;
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @param {string} extension - The extension of source, if set
     * @returns {boolean} - If the source is a SVG source or data file
     */
    static test(source, extension) {
      return extension === "svg" || typeof source == "string" && source.startsWith("data:image/svg+xml") || typeof source == "string" && _SVGResource2.SVG_XML.test(source);
    }
    // eslint-disable-line max-len
  };
  _SVGResource.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m, /**
  * Regular expression for SVG size.
  * @example &lt;svg width="100" height="100"&gt;&lt;/svg&gt;
  * @readonly
  */
  _SVGResource.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;
  var SVGResource = _SVGResource;

  // node_modules/@pixi/core/lib/textures/resources/VideoFrameResource.mjs
  var VideoFrameResource = class extends BaseImageResource {
    /**
     * @param source - Image element to use
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(source) {
      super(source);
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @returns {boolean} `true` if source is an VideoFrame
     */
    static test(source) {
      return !!globalThis.VideoFrame && source instanceof globalThis.VideoFrame;
    }
  };

  // node_modules/@pixi/core/lib/textures/resources/VideoResource.mjs
  var _VideoResource = class _VideoResource2 extends BaseImageResource {
    /**
     * @param {HTMLVideoElement|object|string|Array<string|object>} source - Video element to use.
     * @param {object} [options] - Options to use
     * @param {boolean} [options.autoLoad=true] - Start loading the video immediately
     * @param {boolean} [options.autoPlay=true] - Start playing video immediately
     * @param {number} [options.updateFPS=0] - How many times a second to update the texture from the video.
     * If 0, `requestVideoFrameCallback` is used to update the texture.
     * If `requestVideoFrameCallback` is not available, the texture is updated every render.
     * @param {boolean} [options.crossorigin=true] - Load image using cross origin
     * @param {boolean} [options.loop=false] - Loops the video
     * @param {boolean} [options.muted=false] - Mutes the video audio, useful for autoplay
     * @param {boolean} [options.playsinline=true] - Prevents opening the video on mobile devices
     */
    constructor(source, options) {
      if (options = options || {}, !(source instanceof HTMLVideoElement)) {
        const videoElement = document.createElement("video");
        options.autoLoad !== false && videoElement.setAttribute("preload", "auto"), options.playsinline !== false && (videoElement.setAttribute("webkit-playsinline", ""), videoElement.setAttribute("playsinline", "")), options.muted === true && (videoElement.setAttribute("muted", ""), videoElement.muted = true), options.loop === true && videoElement.setAttribute("loop", ""), options.autoPlay !== false && videoElement.setAttribute("autoplay", ""), typeof source == "string" && (source = [source]);
        const firstSrc = source[0].src || source[0];
        BaseImageResource.crossOrigin(videoElement, firstSrc, options.crossorigin);
        for (let i2 = 0; i2 < source.length; ++i2) {
          const sourceElement = document.createElement("source");
          let { src, mime } = source[i2];
          if (src = src || source[i2], src.startsWith("data:"))
            mime = src.slice(5, src.indexOf(";"));
          else if (!src.startsWith("blob:")) {
            const baseSrc = src.split("?").shift().toLowerCase(), ext = baseSrc.slice(baseSrc.lastIndexOf(".") + 1);
            mime = mime || _VideoResource2.MIME_TYPES[ext] || `video/${ext}`;
          }
          sourceElement.src = src, mime && (sourceElement.type = mime), videoElement.appendChild(sourceElement);
        }
        source = videoElement;
      }
      super(source), this.noSubImage = true, this._autoUpdate = true, this._isConnectedToTicker = false, this._updateFPS = options.updateFPS || 0, this._msToNextUpdate = 0, this.autoPlay = options.autoPlay !== false, this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this), this._videoFrameRequestCallbackHandle = null, this._load = null, this._resolve = null, this._reject = null, this._onCanPlay = this._onCanPlay.bind(this), this._onError = this._onError.bind(this), this._onPlayStart = this._onPlayStart.bind(this), this._onPlayStop = this._onPlayStop.bind(this), this._onSeeked = this._onSeeked.bind(this), options.autoLoad !== false && this.load();
    }
    /**
     * Trigger updating of the texture.
     * @param _deltaTime - time delta since last tick
     */
    update(_deltaTime = 0) {
      if (!this.destroyed) {
        if (this._updateFPS) {
          const elapsedMS = Ticker.shared.elapsedMS * this.source.playbackRate;
          this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
        }
        (!this._updateFPS || this._msToNextUpdate <= 0) && (super.update(
          /* deltaTime*/
        ), this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0);
      }
    }
    _videoFrameRequestCallback() {
      this.update(), this.destroyed ? this._videoFrameRequestCallbackHandle = null : this._videoFrameRequestCallbackHandle = this.source.requestVideoFrameCallback(
        this._videoFrameRequestCallback
      );
    }
    /**
     * Start preloading the video resource.
     * @returns {Promise<void>} Handle the validate event
     */
    load() {
      if (this._load)
        return this._load;
      const source = this.source;
      return (source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA) && source.width && source.height && (source.complete = true), source.addEventListener("play", this._onPlayStart), source.addEventListener("pause", this._onPlayStop), source.addEventListener("seeked", this._onSeeked), this._isSourceReady() ? this._onCanPlay() : (source.addEventListener("canplay", this._onCanPlay), source.addEventListener("canplaythrough", this._onCanPlay), source.addEventListener("error", this._onError, true)), this._load = new Promise((resolve2, reject) => {
        this.valid ? resolve2(this) : (this._resolve = resolve2, this._reject = reject, source.load());
      }), this._load;
    }
    /**
     * Handle video error events.
     * @param event
     */
    _onError(event) {
      this.source.removeEventListener("error", this._onError, true), this.onError.emit(event), this._reject && (this._reject(event), this._reject = null, this._resolve = null);
    }
    /**
     * Returns true if the underlying source is playing.
     * @returns - True if playing.
     */
    _isSourcePlaying() {
      const source = this.source;
      return !source.paused && !source.ended;
    }
    /**
     * Returns true if the underlying source is ready for playing.
     * @returns - True if ready.
     */
    _isSourceReady() {
      return this.source.readyState > 2;
    }
    /** Runs the update loop when the video is ready to play. */
    _onPlayStart() {
      this.valid || this._onCanPlay(), this._configureAutoUpdate();
    }
    /** Fired when a pause event is triggered, stops the update loop. */
    _onPlayStop() {
      this._configureAutoUpdate();
    }
    /** Fired when the video is completed seeking to the current playback position. */
    _onSeeked() {
      this._autoUpdate && !this._isSourcePlaying() && (this._msToNextUpdate = 0, this.update(), this._msToNextUpdate = 0);
    }
    /** Fired when the video is loaded and ready to play. */
    _onCanPlay() {
      const source = this.source;
      source.removeEventListener("canplay", this._onCanPlay), source.removeEventListener("canplaythrough", this._onCanPlay);
      const valid = this.valid;
      this._msToNextUpdate = 0, this.update(), this._msToNextUpdate = 0, !valid && this._resolve && (this._resolve(this), this._resolve = null, this._reject = null), this._isSourcePlaying() ? this._onPlayStart() : this.autoPlay && source.play();
    }
    /** Destroys this texture. */
    dispose() {
      this._configureAutoUpdate();
      const source = this.source;
      source && (source.removeEventListener("play", this._onPlayStart), source.removeEventListener("pause", this._onPlayStop), source.removeEventListener("seeked", this._onSeeked), source.removeEventListener("canplay", this._onCanPlay), source.removeEventListener("canplaythrough", this._onCanPlay), source.removeEventListener("error", this._onError, true), source.pause(), source.src = "", source.load()), super.dispose();
    }
    /** Should the base texture automatically update itself, set to true by default. */
    get autoUpdate() {
      return this._autoUpdate;
    }
    set autoUpdate(value) {
      value !== this._autoUpdate && (this._autoUpdate = value, this._configureAutoUpdate());
    }
    /**
     * How many times a second to update the texture from the video. If 0, `requestVideoFrameCallback` is used to
     * update the texture. If `requestVideoFrameCallback` is not available, the texture is updated every render.
     * A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
     */
    get updateFPS() {
      return this._updateFPS;
    }
    set updateFPS(value) {
      value !== this._updateFPS && (this._updateFPS = value, this._configureAutoUpdate());
    }
    _configureAutoUpdate() {
      this._autoUpdate && this._isSourcePlaying() ? !this._updateFPS && this.source.requestVideoFrameCallback ? (this._isConnectedToTicker && (Ticker.shared.remove(this.update, this), this._isConnectedToTicker = false, this._msToNextUpdate = 0), this._videoFrameRequestCallbackHandle === null && (this._videoFrameRequestCallbackHandle = this.source.requestVideoFrameCallback(
        this._videoFrameRequestCallback
      ))) : (this._videoFrameRequestCallbackHandle !== null && (this.source.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker || (Ticker.shared.add(this.update, this), this._isConnectedToTicker = true, this._msToNextUpdate = 0)) : (this._videoFrameRequestCallbackHandle !== null && (this.source.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker && (Ticker.shared.remove(this.update, this), this._isConnectedToTicker = false, this._msToNextUpdate = 0));
    }
    /**
     * Used to auto-detect the type of resource.
     * @param {*} source - The source object
     * @param {string} extension - The extension of source, if set
     * @returns {boolean} `true` if video source
     */
    static test(source, extension) {
      return globalThis.HTMLVideoElement && source instanceof HTMLVideoElement || _VideoResource2.TYPES.includes(extension);
    }
  };
  _VideoResource.TYPES = ["mp4", "m4v", "webm", "ogg", "ogv", "h264", "avi", "mov"], /**
  * Map of video MIME types that can't be directly derived from file extensions.
  * @readonly
  */
  _VideoResource.MIME_TYPES = {
    ogv: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/mp4"
  };
  var VideoResource = _VideoResource;

  // node_modules/@pixi/core/lib/textures/resources/index.mjs
  INSTALLED.push(
    ImageBitmapResource,
    ImageResource,
    CanvasResource,
    VideoResource,
    VideoFrameResource,
    SVGResource,
    BufferResource,
    CubeResource,
    ArrayResource
  );

  // node_modules/@pixi/display/lib/Bounds.mjs
  var Bounds = class {
    constructor() {
      this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.rect = null, this.updateID = -1;
    }
    /**
     * Checks if bounds are empty.
     * @returns - True if empty.
     */
    isEmpty() {
      return this.minX > this.maxX || this.minY > this.maxY;
    }
    /** Clears the bounds and resets. */
    clear() {
      this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0;
    }
    /**
     * Can return Rectangle.EMPTY constant, either construct new rectangle, either use your rectangle
     * It is not guaranteed that it will return tempRect
     * @param rect - Temporary object will be used if AABB is not empty
     * @returns - A rectangle of the bounds
     */
    getRectangle(rect) {
      return this.minX > this.maxX || this.minY > this.maxY ? Rectangle.EMPTY : (rect = rect || new Rectangle(0, 0, 1, 1), rect.x = this.minX, rect.y = this.minY, rect.width = this.maxX - this.minX, rect.height = this.maxY - this.minY, rect);
    }
    /**
     * This function should be inlined when its possible.
     * @param point - The point to add.
     */
    addPoint(point) {
      this.minX = Math.min(this.minX, point.x), this.maxX = Math.max(this.maxX, point.x), this.minY = Math.min(this.minY, point.y), this.maxY = Math.max(this.maxY, point.y);
    }
    /**
     * Adds a point, after transformed. This should be inlined when its possible.
     * @param matrix
     * @param point
     */
    addPointMatrix(matrix, point) {
      const { a: a2, b: b2, c: c2, d: d3, tx, ty } = matrix, x2 = a2 * point.x + c2 * point.y + tx, y2 = b2 * point.x + d3 * point.y + ty;
      this.minX = Math.min(this.minX, x2), this.maxX = Math.max(this.maxX, x2), this.minY = Math.min(this.minY, y2), this.maxY = Math.max(this.maxY, y2);
    }
    /**
     * Adds a quad, not transformed
     * @param vertices - The verts to add.
     */
    addQuad(vertices) {
      let minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY, x2 = vertices[0], y2 = vertices[1];
      minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = vertices[2], y2 = vertices[3], minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = vertices[4], y2 = vertices[5], minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = vertices[6], y2 = vertices[7], minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, this.minX = minX, this.minY = minY, this.maxX = maxX, this.maxY = maxY;
    }
    /**
     * Adds sprite frame, transformed.
     * @param transform - transform to apply
     * @param x0 - left X of frame
     * @param y0 - top Y of frame
     * @param x1 - right X of frame
     * @param y1 - bottom Y of frame
     */
    addFrame(transform, x0, y0, x1, y1) {
      this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
    }
    /**
     * Adds sprite frame, multiplied by matrix
     * @param matrix - matrix to apply
     * @param x0 - left X of frame
     * @param y0 - top Y of frame
     * @param x1 - right X of frame
     * @param y1 - bottom Y of frame
     */
    addFrameMatrix(matrix, x0, y0, x1, y1) {
      const a2 = matrix.a, b2 = matrix.b, c2 = matrix.c, d3 = matrix.d, tx = matrix.tx, ty = matrix.ty;
      let minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY, x2 = a2 * x0 + c2 * y0 + tx, y2 = b2 * x0 + d3 * y0 + ty;
      minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = a2 * x1 + c2 * y0 + tx, y2 = b2 * x1 + d3 * y0 + ty, minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = a2 * x0 + c2 * y1 + tx, y2 = b2 * x0 + d3 * y1 + ty, minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, x2 = a2 * x1 + c2 * y1 + tx, y2 = b2 * x1 + d3 * y1 + ty, minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY, this.minX = minX, this.minY = minY, this.maxX = maxX, this.maxY = maxY;
    }
    /**
     * Adds screen vertices from array
     * @param vertexData - calculated vertices
     * @param beginOffset - begin offset
     * @param endOffset - end offset, excluded
     */
    addVertexData(vertexData, beginOffset, endOffset) {
      let minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
      for (let i2 = beginOffset; i2 < endOffset; i2 += 2) {
        const x2 = vertexData[i2], y2 = vertexData[i2 + 1];
        minX = x2 < minX ? x2 : minX, minY = y2 < minY ? y2 : minY, maxX = x2 > maxX ? x2 : maxX, maxY = y2 > maxY ? y2 : maxY;
      }
      this.minX = minX, this.minY = minY, this.maxX = maxX, this.maxY = maxY;
    }
    /**
     * Add an array of mesh vertices
     * @param transform - mesh transform
     * @param vertices - mesh coordinates in array
     * @param beginOffset - begin offset
     * @param endOffset - end offset, excluded
     */
    addVertices(transform, vertices, beginOffset, endOffset) {
      this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
    }
    /**
     * Add an array of mesh vertices.
     * @param matrix - mesh matrix
     * @param vertices - mesh coordinates in array
     * @param beginOffset - begin offset
     * @param endOffset - end offset, excluded
     * @param padX - x padding
     * @param padY - y padding
     */
    addVerticesMatrix(matrix, vertices, beginOffset, endOffset, padX = 0, padY = padX) {
      const a2 = matrix.a, b2 = matrix.b, c2 = matrix.c, d3 = matrix.d, tx = matrix.tx, ty = matrix.ty;
      let minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
      for (let i2 = beginOffset; i2 < endOffset; i2 += 2) {
        const rawX = vertices[i2], rawY = vertices[i2 + 1], x2 = a2 * rawX + c2 * rawY + tx, y2 = d3 * rawY + b2 * rawX + ty;
        minX = Math.min(minX, x2 - padX), maxX = Math.max(maxX, x2 + padX), minY = Math.min(minY, y2 - padY), maxY = Math.max(maxY, y2 + padY);
      }
      this.minX = minX, this.minY = minY, this.maxX = maxX, this.maxY = maxY;
    }
    /**
     * Adds other {@link PIXI.Bounds}.
     * @param bounds - The Bounds to be added
     */
    addBounds(bounds) {
      const minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
      this.minX = bounds.minX < minX ? bounds.minX : minX, this.minY = bounds.minY < minY ? bounds.minY : minY, this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX, this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
    }
    /**
     * Adds other Bounds, masked with Bounds.
     * @param bounds - The Bounds to be added.
     * @param mask - TODO
     */
    addBoundsMask(bounds, mask) {
      const _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX, _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY, _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX, _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;
      if (_minX <= _maxX && _minY <= _maxY) {
        const minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
        this.minX = _minX < minX ? _minX : minX, this.minY = _minY < minY ? _minY : minY, this.maxX = _maxX > maxX ? _maxX : maxX, this.maxY = _maxY > maxY ? _maxY : maxY;
      }
    }
    /**
     * Adds other Bounds, multiplied by matrix. Bounds shouldn't be empty.
     * @param bounds - other bounds
     * @param matrix - multiplicator
     */
    addBoundsMatrix(bounds, matrix) {
      this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    }
    /**
     * Adds other Bounds, masked with Rectangle.
     * @param bounds - TODO
     * @param area - TODO
     */
    addBoundsArea(bounds, area) {
      const _minX = bounds.minX > area.x ? bounds.minX : area.x, _minY = bounds.minY > area.y ? bounds.minY : area.y, _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : area.x + area.width, _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : area.y + area.height;
      if (_minX <= _maxX && _minY <= _maxY) {
        const minX = this.minX, minY = this.minY, maxX = this.maxX, maxY = this.maxY;
        this.minX = _minX < minX ? _minX : minX, this.minY = _minY < minY ? _minY : minY, this.maxX = _maxX > maxX ? _maxX : maxX, this.maxY = _maxY > maxY ? _maxY : maxY;
      }
    }
    /**
     * Pads bounds object, making it grow in all directions.
     * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
     * @param paddingX - The horizontal padding amount.
     * @param paddingY - The vertical padding amount.
     */
    pad(paddingX = 0, paddingY = paddingX) {
      this.isEmpty() || (this.minX -= paddingX, this.maxX += paddingX, this.minY -= paddingY, this.maxY += paddingY);
    }
    /**
     * Adds padded frame. (x0, y0) should be strictly less than (x1, y1)
     * @param x0 - left X of frame
     * @param y0 - top Y of frame
     * @param x1 - right X of frame
     * @param y1 - bottom Y of frame
     * @param padX - padding X
     * @param padY - padding Y
     */
    addFramePad(x0, y0, x1, y1, padX, padY) {
      x0 -= padX, y0 -= padY, x1 += padX, y1 += padY, this.minX = this.minX < x0 ? this.minX : x0, this.maxX = this.maxX > x1 ? this.maxX : x1, this.minY = this.minY < y0 ? this.minY : y0, this.maxY = this.maxY > y1 ? this.maxY : y1;
    }
  };

  // node_modules/@pixi/display/lib/DisplayObject.mjs
  var DisplayObject = class _DisplayObject extends lib_exports.EventEmitter {
    constructor() {
      super(), this.tempDisplayObjectParent = null, this.transform = new Transform(), this.alpha = 1, this.visible = true, this.renderable = true, this.cullable = false, this.cullArea = null, this.parent = null, this.worldAlpha = 1, this._lastSortedIndex = 0, this._zIndex = 0, this.filterArea = null, this.filters = null, this._enabledFilters = null, this._bounds = new Bounds(), this._localBounds = null, this._boundsID = 0, this._boundsRect = null, this._localBoundsRect = null, this._mask = null, this._maskRefCount = 0, this._destroyed = false, this.isSprite = false, this.isMask = false;
    }
    /**
     * Mixes all enumerable properties and methods from a source object to DisplayObject.
     * @param source - The source of properties and methods to mix in.
     */
    static mixin(source) {
      const keys2 = Object.keys(source);
      for (let i2 = 0; i2 < keys2.length; ++i2) {
        const propertyName = keys2[i2];
        Object.defineProperty(
          _DisplayObject.prototype,
          propertyName,
          Object.getOwnPropertyDescriptor(source, propertyName)
        );
      }
    }
    /**
     * Fired when this DisplayObject is added to a Container.
     * @instance
     * @event added
     * @param {PIXI.Container} container - The container added to.
     */
    /**
     * Fired when this DisplayObject is removed from a Container.
     * @instance
     * @event removed
     * @param {PIXI.Container} container - The container removed from.
     */
    /**
     * Fired when this DisplayObject is destroyed. This event is emitted once
     * destroy is finished.
     * @instance
     * @event destroyed
     */
    /** Readonly flag for destroyed display objects. */
    get destroyed() {
      return this._destroyed;
    }
    /** Recursively updates transform of all objects from the root to this one internal function for toLocal() */
    _recursivePostUpdateTransform() {
      this.parent ? (this.parent._recursivePostUpdateTransform(), this.transform.updateTransform(this.parent.transform)) : this.transform.updateTransform(this._tempDisplayObjectParent.transform);
    }
    /** Updates the object transform for rendering. TODO - Optimization pass! */
    updateTransform() {
      this._boundsID++, this.transform.updateTransform(this.parent.transform), this.worldAlpha = this.alpha * this.parent.worldAlpha;
    }
    /**
     * Calculates and returns the (world) bounds of the display object as a [Rectangle]{@link PIXI.Rectangle}.
     *
     * This method is expensive on containers with a large subtree (like the stage). This is because the bounds
     * of a container depend on its children's bounds, which recursively causes all bounds in the subtree to
     * be recalculated. The upside, however, is that calling `getBounds` once on a container will indeed update
     * the bounds of all children (the whole subtree, in fact). This side effect should be exploited by using
     * `displayObject._bounds.getRectangle()` when traversing through all the bounds in a scene graph. Otherwise,
     * calling `getBounds` on each object in a subtree will cause the total cost to increase quadratically as
     * its height increases.
     *
     * The transforms of all objects in a container's **subtree** and of all **ancestors** are updated.
     * The world bounds of all display objects in a container's **subtree** will also be recalculated.
     *
     * The `_bounds` object stores the last calculation of the bounds. You can use to entirely skip bounds
     * calculation if needed.
     *
     * ```js
     * const lastCalculatedBounds = displayObject._bounds.getRectangle(optionalRect);
     * ```
     *
     * Do know that usage of `getLocalBounds` can corrupt the `_bounds` of children (the whole subtree, actually). This
     * is a known issue that has not been solved. See [getLocalBounds]{@link PIXI.DisplayObject#getLocalBounds} for more
     * details.
     *
     * `getBounds` should be called with `skipUpdate` equal to `true` in a render() call. This is because the transforms
     * are guaranteed to be update-to-date. In fact, recalculating inside a render() call may cause corruption in certain
     * cases.
     * @param skipUpdate - Setting to `true` will stop the transforms of the scene graph from
     *  being updated. This means the calculation returned MAY be out of date BUT will give you a
     *  nice performance boost.
     * @param rect - Optional rectangle to store the result of the bounds calculation.
     * @returns - The minimum axis-aligned rectangle in world space that fits around this object.
     */
    getBounds(skipUpdate, rect) {
      return skipUpdate || (this.parent ? (this._recursivePostUpdateTransform(), this.updateTransform()) : (this.parent = this._tempDisplayObjectParent, this.updateTransform(), this.parent = null)), this._bounds.updateID !== this._boundsID && (this.calculateBounds(), this._bounds.updateID = this._boundsID), rect || (this._boundsRect || (this._boundsRect = new Rectangle()), rect = this._boundsRect), this._bounds.getRectangle(rect);
    }
    /**
     * Retrieves the local bounds of the displayObject as a rectangle object.
     * @param rect - Optional rectangle to store the result of the bounds calculation.
     * @returns - The rectangular bounding area.
     */
    getLocalBounds(rect) {
      rect || (this._localBoundsRect || (this._localBoundsRect = new Rectangle()), rect = this._localBoundsRect), this._localBounds || (this._localBounds = new Bounds());
      const transformRef = this.transform, parentRef = this.parent;
      this.parent = null, this._tempDisplayObjectParent.worldAlpha = parentRef?.worldAlpha ?? 1, this.transform = this._tempDisplayObjectParent.transform;
      const worldBounds = this._bounds, worldBoundsID = this._boundsID;
      this._bounds = this._localBounds;
      const bounds = this.getBounds(false, rect);
      return this.parent = parentRef, this.transform = transformRef, this._bounds = worldBounds, this._bounds.updateID += this._boundsID - worldBoundsID, bounds;
    }
    /**
     * Calculates the global position of the display object.
     * @param position - The world origin to calculate from.
     * @param point - A Point object in which to store the value, optional
     *  (otherwise will create a new Point).
     * @param skipUpdate - Should we skip the update transform.
     * @returns - A point object representing the position of this object.
     */
    toGlobal(position, point, skipUpdate = false) {
      return skipUpdate || (this._recursivePostUpdateTransform(), this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent, this.displayObjectUpdateTransform(), this.parent = null)), this.worldTransform.apply(position, point);
    }
    /**
     * Calculates the local position of the display object relative to another point.
     * @param position - The world origin to calculate from.
     * @param from - The DisplayObject to calculate the global position from.
     * @param point - A Point object in which to store the value, optional
     *  (otherwise will create a new Point).
     * @param skipUpdate - Should we skip the update transform
     * @returns - A point object representing the position of this object
     */
    toLocal(position, from, point, skipUpdate) {
      return from && (position = from.toGlobal(position, point, skipUpdate)), skipUpdate || (this._recursivePostUpdateTransform(), this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent, this.displayObjectUpdateTransform(), this.parent = null)), this.worldTransform.applyInverse(position, point);
    }
    /**
     * Set the parent Container of this DisplayObject.
     * @param container - The Container to add this DisplayObject to.
     * @returns - The Container that this DisplayObject was added to.
     */
    setParent(container) {
      if (!container || !container.addChild)
        throw new Error("setParent: Argument must be a Container");
      return container.addChild(this), container;
    }
    /** Remove the DisplayObject from its parent Container. If the DisplayObject has no parent, do nothing. */
    removeFromParent() {
      this.parent?.removeChild(this);
    }
    /**
     * Convenience function to set the position, scale, skew and pivot at once.
     * @param x - The X position
     * @param y - The Y position
     * @param scaleX - The X scale value
     * @param scaleY - The Y scale value
     * @param rotation - The rotation
     * @param skewX - The X skew value
     * @param skewY - The Y skew value
     * @param pivotX - The X pivot value
     * @param pivotY - The Y pivot value
     * @returns - The DisplayObject instance
     */
    setTransform(x2 = 0, y2 = 0, scaleX = 1, scaleY = 1, rotation = 0, skewX = 0, skewY = 0, pivotX = 0, pivotY = 0) {
      return this.position.x = x2, this.position.y = y2, this.scale.x = scaleX || 1, this.scale.y = scaleY || 1, this.rotation = rotation, this.skew.x = skewX, this.skew.y = skewY, this.pivot.x = pivotX, this.pivot.y = pivotY, this;
    }
    /**
     * Base destroy method for generic display objects. This will automatically
     * remove the display object from its parent Container as well as remove
     * all current event listeners and internal references. Do not use a DisplayObject
     * after calling `destroy()`.
     * @param _options
     */
    destroy(_options) {
      this.removeFromParent(), this._destroyed = true, this.transform = null, this.parent = null, this._bounds = null, this.mask = null, this.cullArea = null, this.filters = null, this.filterArea = null, this.hitArea = null, this.eventMode = "auto", this.interactiveChildren = false, this.emit("destroyed"), this.removeAllListeners();
    }
    /**
     * @protected
     * @member {PIXI.Container}
     */
    get _tempDisplayObjectParent() {
      return this.tempDisplayObjectParent === null && (this.tempDisplayObjectParent = new TemporaryDisplayObject()), this.tempDisplayObjectParent;
    }
    /**
     * Used in Renderer, cacheAsBitmap and other places where you call an `updateTransform` on root.
     *
     * ```js
     * const cacheParent = elem.enableTempParent();
     * elem.updateTransform();
     * elem.disableTempParent(cacheParent);
     * ```
     * @returns - Current parent
     */
    enableTempParent() {
      const myParent = this.parent;
      return this.parent = this._tempDisplayObjectParent, myParent;
    }
    /**
     * Pair method for `enableTempParent`
     * @param cacheParent - Actual parent of element
     */
    disableTempParent(cacheParent) {
      this.parent = cacheParent;
    }
    /**
     * The position of the displayObject on the x axis relative to the local coordinates of the parent.
     * An alias to position.x
     */
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.transform.position.x = value;
    }
    /**
     * The position of the displayObject on the y axis relative to the local coordinates of the parent.
     * An alias to position.y
     */
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.transform.position.y = value;
    }
    /**
     * Current transform of the object based on world (parent) factors.
     * @readonly
     */
    get worldTransform() {
      return this.transform.worldTransform;
    }
    /**
     * Current transform of the object based on local factors: position, scale, other stuff.
     * @readonly
     */
    get localTransform() {
      return this.transform.localTransform;
    }
    /**
     * The coordinate of the object relative to the local coordinates of the parent.
     * @since 4.0.0
     */
    get position() {
      return this.transform.position;
    }
    set position(value) {
      this.transform.position.copyFrom(value);
    }
    /**
     * The scale factors of this object along the local coordinate axes.
     *
     * The default scale is (1, 1).
     * @since 4.0.0
     */
    get scale() {
      return this.transform.scale;
    }
    set scale(value) {
      this.transform.scale.copyFrom(value);
    }
    /**
     * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
     * is the projection of `pivot` in the parent's local space.
     *
     * By default, the pivot is the origin (0, 0).
     * @since 4.0.0
     */
    get pivot() {
      return this.transform.pivot;
    }
    set pivot(value) {
      this.transform.pivot.copyFrom(value);
    }
    /**
     * The skew factor for the object in radians.
     * @since 4.0.0
     */
    get skew() {
      return this.transform.skew;
    }
    set skew(value) {
      this.transform.skew.copyFrom(value);
    }
    /**
     * The rotation of the object in radians.
     * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
     */
    get rotation() {
      return this.transform.rotation;
    }
    set rotation(value) {
      this.transform.rotation = value;
    }
    /**
     * The angle of the object in degrees.
     * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
     */
    get angle() {
      return this.transform.rotation * RAD_TO_DEG2;
    }
    set angle(value) {
      this.transform.rotation = value * DEG_TO_RAD2;
    }
    /**
     * The zIndex of the displayObject.
     *
     * If a container has the sortableChildren property set to true, children will be automatically
     * sorted by zIndex value; a higher value will mean it will be moved towards the end of the array,
     * and thus rendered on top of other display objects within the same container.
     * @see PIXI.Container#sortableChildren
     */
    get zIndex() {
      return this._zIndex;
    }
    set zIndex(value) {
      this._zIndex !== value && (this._zIndex = value, this.parent && (this.parent.sortDirty = true));
    }
    /**
     * Indicates if the object is globally visible.
     * @readonly
     */
    get worldVisible() {
      let item = this;
      do {
        if (!item.visible)
          return false;
        item = item.parent;
      } while (item);
      return true;
    }
    /**
     * Sets a mask for the displayObject. A mask is an object that limits the visibility of an
     * object to the shape of the mask applied to it. In PixiJS a regular mask must be a
     * {@link PIXI.Graphics} or a {@link PIXI.Sprite} object. This allows for much faster masking in canvas as it
     * utilities shape clipping. Furthermore, a mask of an object must be in the subtree of its parent.
     * Otherwise, `getLocalBounds` may calculate incorrect bounds, which makes the container's width and height wrong.
     * To remove a mask, set this property to `null`.
     *
     * For sprite mask both alpha and red channel are used. Black mask is the same as transparent mask.
     * @example
     * import { Graphics, Sprite } from 'pixi.js';
     *
     * const graphics = new Graphics();
     * graphics.beginFill(0xFF3300);
     * graphics.drawRect(50, 250, 100, 100);
     * graphics.endFill();
     *
     * const sprite = new Sprite(texture);
     * sprite.mask = graphics;
     * @todo At the moment, CanvasRenderer doesn't support Sprite as mask.
     */
    get mask() {
      return this._mask;
    }
    set mask(value) {
      if (this._mask !== value) {
        if (this._mask) {
          const maskObject = this._mask.isMaskData ? this._mask.maskObject : this._mask;
          maskObject && (maskObject._maskRefCount--, maskObject._maskRefCount === 0 && (maskObject.renderable = true, maskObject.isMask = false));
        }
        if (this._mask = value, this._mask) {
          const maskObject = this._mask.isMaskData ? this._mask.maskObject : this._mask;
          maskObject && (maskObject._maskRefCount === 0 && (maskObject.renderable = false, maskObject.isMask = true), maskObject._maskRefCount++);
        }
      }
    }
  };
  var TemporaryDisplayObject = class extends DisplayObject {
    constructor() {
      super(...arguments), this.sortDirty = null;
    }
  };
  DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;

  // node_modules/@pixi/display/lib/Container.mjs
  var tempMatrix3 = new Matrix();
  function sortChildren(a2, b2) {
    return a2.zIndex === b2.zIndex ? a2._lastSortedIndex - b2._lastSortedIndex : a2.zIndex - b2.zIndex;
  }
  var _Container = class _Container2 extends DisplayObject {
    constructor() {
      super(), this.children = [], this.sortableChildren = _Container2.defaultSortableChildren, this.sortDirty = false;
    }
    /**
     * Overridable method that can be used by Container subclasses whenever the children array is modified.
     * @param _length
     */
    onChildrenChange(_length) {
    }
    /**
     * Adds one or more children to the container.
     *
     * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
     * @param {...PIXI.DisplayObject} children - The DisplayObject(s) to add to the container
     * @returns {PIXI.DisplayObject} - The first child that was added.
     */
    addChild(...children) {
      if (children.length > 1)
        for (let i2 = 0; i2 < children.length; i2++)
          this.addChild(children[i2]);
      else {
        const child = children[0];
        child.parent && child.parent.removeChild(child), child.parent = this, this.sortDirty = true, child.transform._parentID = -1, this.children.push(child), this._boundsID++, this.onChildrenChange(this.children.length - 1), this.emit("childAdded", child, this, this.children.length - 1), child.emit("added", this);
      }
      return children[0];
    }
    /**
     * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown.
     * If the child is already in this container, it will be moved to the specified index.
     * @param {PIXI.DisplayObject} child - The child to add.
     * @param {number} index - The absolute index where the child will be positioned at the end of the operation.
     * @returns {PIXI.DisplayObject} The child that was added.
     */
    addChildAt(child, index) {
      if (index < 0 || index > this.children.length)
        throw new Error(`${child}addChildAt: The index ${index} supplied is out of bounds ${this.children.length}`);
      return child.parent && child.parent.removeChild(child), child.parent = this, this.sortDirty = true, child.transform._parentID = -1, this.children.splice(index, 0, child), this._boundsID++, this.onChildrenChange(index), child.emit("added", this), this.emit("childAdded", child, this, index), child;
    }
    /**
     * Swaps the position of 2 Display Objects within this container.
     * @param child - First display object to swap
     * @param child2 - Second display object to swap
     */
    swapChildren(child, child2) {
      if (child === child2)
        return;
      const index1 = this.getChildIndex(child), index2 = this.getChildIndex(child2);
      this.children[index1] = child2, this.children[index2] = child, this.onChildrenChange(index1 < index2 ? index1 : index2);
    }
    /**
     * Returns the index position of a child DisplayObject instance
     * @param child - The DisplayObject instance to identify
     * @returns - The index position of the child display object to identify
     */
    getChildIndex(child) {
      const index = this.children.indexOf(child);
      if (index === -1)
        throw new Error("The supplied DisplayObject must be a child of the caller");
      return index;
    }
    /**
     * Changes the position of an existing child in the display object container
     * @param child - The child DisplayObject instance for which you want to change the index number
     * @param index - The resulting index number for the child display object
     */
    setChildIndex(child, index) {
      if (index < 0 || index >= this.children.length)
        throw new Error(`The index ${index} supplied is out of bounds ${this.children.length}`);
      const currentIndex = this.getChildIndex(child);
      lib_exports.removeItems(this.children, currentIndex, 1), this.children.splice(index, 0, child), this.onChildrenChange(index);
    }
    /**
     * Returns the child at the specified index
     * @param index - The index to get the child at
     * @returns - The child at the given index, if any.
     */
    getChildAt(index) {
      if (index < 0 || index >= this.children.length)
        throw new Error(`getChildAt: Index (${index}) does not exist.`);
      return this.children[index];
    }
    /**
     * Removes one or more children from the container.
     * @param {...PIXI.DisplayObject} children - The DisplayObject(s) to remove
     * @returns {PIXI.DisplayObject} The first child that was removed.
     */
    removeChild(...children) {
      if (children.length > 1)
        for (let i2 = 0; i2 < children.length; i2++)
          this.removeChild(children[i2]);
      else {
        const child = children[0], index = this.children.indexOf(child);
        if (index === -1)
          return null;
        child.parent = null, child.transform._parentID = -1, lib_exports.removeItems(this.children, index, 1), this._boundsID++, this.onChildrenChange(index), child.emit("removed", this), this.emit("childRemoved", child, this, index);
      }
      return children[0];
    }
    /**
     * Removes a child from the specified index position.
     * @param index - The index to get the child from
     * @returns The child that was removed.
     */
    removeChildAt(index) {
      const child = this.getChildAt(index);
      return child.parent = null, child.transform._parentID = -1, lib_exports.removeItems(this.children, index, 1), this._boundsID++, this.onChildrenChange(index), child.emit("removed", this), this.emit("childRemoved", child, this, index), child;
    }
    /**
     * Removes all children from this container that are within the begin and end indexes.
     * @param beginIndex - The beginning position.
     * @param endIndex - The ending position. Default value is size of the container.
     * @returns - List of removed children
     */
    removeChildren(beginIndex = 0, endIndex = this.children.length) {
      const begin = beginIndex, end = endIndex, range = end - begin;
      let removed;
      if (range > 0 && range <= end) {
        removed = this.children.splice(begin, range);
        for (let i2 = 0; i2 < removed.length; ++i2)
          removed[i2].parent = null, removed[i2].transform && (removed[i2].transform._parentID = -1);
        this._boundsID++, this.onChildrenChange(beginIndex);
        for (let i2 = 0; i2 < removed.length; ++i2)
          removed[i2].emit("removed", this), this.emit("childRemoved", removed[i2], this, i2);
        return removed;
      } else if (range === 0 && this.children.length === 0)
        return [];
      throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
    }
    /** Sorts children by zIndex. Previous order is maintained for 2 children with the same zIndex. */
    sortChildren() {
      let sortRequired = false;
      for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2) {
        const child = this.children[i2];
        child._lastSortedIndex = i2, !sortRequired && child.zIndex !== 0 && (sortRequired = true);
      }
      sortRequired && this.children.length > 1 && this.children.sort(sortChildren), this.sortDirty = false;
    }
    /** Updates the transform on all children of this container for rendering. */
    updateTransform() {
      this.sortableChildren && this.sortDirty && this.sortChildren(), this._boundsID++, this.transform.updateTransform(this.parent.transform), this.worldAlpha = this.alpha * this.parent.worldAlpha;
      for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2) {
        const child = this.children[i2];
        child.visible && child.updateTransform();
      }
    }
    /**
     * Recalculates the bounds of the container.
     *
     * This implementation will automatically fit the children's bounds into the calculation. Each child's bounds
     * is limited to its mask's bounds or filterArea, if any is applied.
     */
    calculateBounds() {
      this._bounds.clear(), this._calculateBounds();
      for (let i2 = 0; i2 < this.children.length; i2++) {
        const child = this.children[i2];
        if (!(!child.visible || !child.renderable))
          if (child.calculateBounds(), child._mask) {
            const maskObject = child._mask.isMaskData ? child._mask.maskObject : child._mask;
            maskObject ? (maskObject.calculateBounds(), this._bounds.addBoundsMask(child._bounds, maskObject._bounds)) : this._bounds.addBounds(child._bounds);
          } else
            child.filterArea ? this._bounds.addBoundsArea(child._bounds, child.filterArea) : this._bounds.addBounds(child._bounds);
      }
      this._bounds.updateID = this._boundsID;
    }
    /**
     * Retrieves the local bounds of the displayObject as a rectangle object.
     *
     * Calling `getLocalBounds` may invalidate the `_bounds` of the whole subtree below. If using it inside a render()
     * call, it is advised to call `getBounds()` immediately after to recalculate the world bounds of the subtree.
     * @param rect - Optional rectangle to store the result of the bounds calculation.
     * @param skipChildrenUpdate - Setting to `true` will stop re-calculation of children transforms,
     *  it was default behaviour of pixi 4.0-5.2 and caused many problems to users.
     * @returns - The rectangular bounding area.
     */
    getLocalBounds(rect, skipChildrenUpdate = false) {
      const result = super.getLocalBounds(rect);
      if (!skipChildrenUpdate)
        for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2) {
          const child = this.children[i2];
          child.visible && child.updateTransform();
        }
      return result;
    }
    /**
     * Recalculates the content bounds of this object. This should be overriden to
     * calculate the bounds of this specific object (not including children).
     * @protected
     */
    _calculateBounds() {
    }
    /**
     * Renders this object and its children with culling.
     * @protected
     * @param {PIXI.Renderer} renderer - The renderer
     */
    _renderWithCulling(renderer) {
      const sourceFrame = renderer.renderTexture.sourceFrame;
      if (!(sourceFrame.width > 0 && sourceFrame.height > 0))
        return;
      let bounds, transform;
      this.cullArea ? (bounds = this.cullArea, transform = this.worldTransform) : this._render !== _Container2.prototype._render && (bounds = this.getBounds(true));
      const projectionTransform = renderer.projection.transform;
      if (projectionTransform && (transform ? (transform = tempMatrix3.copyFrom(transform), transform.prepend(projectionTransform)) : transform = projectionTransform), bounds && sourceFrame.intersects(bounds, transform))
        this._render(renderer);
      else if (this.cullArea)
        return;
      for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2) {
        const child = this.children[i2], childCullable = child.cullable;
        child.cullable = childCullable || !this.cullArea, child.render(renderer), child.cullable = childCullable;
      }
    }
    /**
     * Renders the object using the WebGL renderer.
     *
     * The [_render]{@link PIXI.Container#_render} method is be overriden for rendering the contents of the
     * container itself. This `render` method will invoke it, and also invoke the `render` methods of all
     * children afterward.
     *
     * If `renderable` or `visible` is false or if `worldAlpha` is not positive or if `cullable` is true and
     * the bounds of this object are out of frame, this implementation will entirely skip rendering.
     * See {@link PIXI.DisplayObject} for choosing between `renderable` or `visible`. Generally,
     * setting alpha to zero is not recommended for purely skipping rendering.
     *
     * When your scene becomes large (especially when it is larger than can be viewed in a single screen), it is
     * advised to employ **culling** to automatically skip rendering objects outside of the current screen.
     * See [cullable]{@link PIXI.DisplayObject#cullable} and [cullArea]{@link PIXI.DisplayObject#cullArea}.
     * Other culling methods might be better suited for a large number static objects; see
     * [@pixi-essentials/cull]{@link https://www.npmjs.com/package/@pixi-essentials/cull} and
     * [pixi-cull]{@link https://www.npmjs.com/package/pixi-cull}.
     *
     * The [renderAdvanced]{@link PIXI.Container#renderAdvanced} method is internally used when when masking or
     * filtering is applied on a container. This does, however, break batching and can affect performance when
     * masking and filtering is applied extensively throughout the scene graph.
     * @param renderer - The renderer
     */
    render(renderer) {
      if (!(!this.visible || this.worldAlpha <= 0 || !this.renderable))
        if (this._mask || this.filters?.length)
          this.renderAdvanced(renderer);
        else if (this.cullable)
          this._renderWithCulling(renderer);
        else {
          this._render(renderer);
          for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2)
            this.children[i2].render(renderer);
        }
    }
    /**
     * Render the object using the WebGL renderer and advanced features.
     * @param renderer - The renderer
     */
    renderAdvanced(renderer) {
      const filters = this.filters, mask = this._mask;
      if (filters) {
        this._enabledFilters || (this._enabledFilters = []), this._enabledFilters.length = 0;
        for (let i2 = 0; i2 < filters.length; i2++)
          filters[i2].enabled && this._enabledFilters.push(filters[i2]);
      }
      const flush = filters && this._enabledFilters?.length || mask && (!mask.isMaskData || mask.enabled && (mask.autoDetect || mask.type !== MASK_TYPES.NONE));
      if (flush && renderer.batch.flush(), filters && this._enabledFilters?.length && renderer.filter.push(this, this._enabledFilters), mask && renderer.mask.push(this, this._mask), this.cullable)
        this._renderWithCulling(renderer);
      else {
        this._render(renderer);
        for (let i2 = 0, j2 = this.children.length; i2 < j2; ++i2)
          this.children[i2].render(renderer);
      }
      flush && renderer.batch.flush(), mask && renderer.mask.pop(this), filters && this._enabledFilters?.length && renderer.filter.pop();
    }
    /**
     * To be overridden by the subclasses.
     * @param _renderer - The renderer
     */
    _render(_renderer) {
    }
    /**
     * Removes all internal references and listeners as well as removes children from the display list.
     * Do not use a Container after calling `destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options) {
      super.destroy(), this.sortDirty = false;
      const destroyChildren = typeof options == "boolean" ? options : options?.children, oldChildren = this.removeChildren(0, this.children.length);
      if (destroyChildren)
        for (let i2 = 0; i2 < oldChildren.length; ++i2)
          oldChildren[i2].destroy(options);
    }
    /** The width of the Container, setting this will actually modify the scale to achieve the value set. */
    get width() {
      return this.scale.x * this.getLocalBounds().width;
    }
    set width(value) {
      const width = this.getLocalBounds().width;
      width !== 0 ? this.scale.x = value / width : this.scale.x = 1, this._width = value;
    }
    /** The height of the Container, setting this will actually modify the scale to achieve the value set. */
    get height() {
      return this.scale.y * this.getLocalBounds().height;
    }
    set height(value) {
      const height = this.getLocalBounds().height;
      height !== 0 ? this.scale.y = value / height : this.scale.y = 1, this._height = value;
    }
  };
  _Container.defaultSortableChildren = false;
  var Container = _Container;
  Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;

  // node_modules/@pixi/display/lib/settings.mjs
  Object.defineProperties(settings, {
    /**
     * Sets the default value for the container property 'sortableChildren'.
     * @static
     * @name SORTABLE_CHILDREN
     * @memberof PIXI.settings
     * @deprecated since 7.1.0
     * @type {boolean}
     * @see PIXI.Container.defaultSortableChildren
     */
    SORTABLE_CHILDREN: {
      get() {
        return Container.defaultSortableChildren;
      },
      set(value) {
        lib_exports.deprecation("7.1.0", "settings.SORTABLE_CHILDREN is deprecated, use Container.defaultSortableChildren"), Container.defaultSortableChildren = value;
      }
    }
  });

  // node_modules/@pixi/app/lib/Application.mjs
  var _Application = class _Application2 {
    /**
     * @param options - The optional application and renderer parameters.
     */
    constructor(options) {
      this.stage = new Container(), options = Object.assign({
        forceCanvas: false
      }, options), this.renderer = autoDetectRenderer(options), _Application2._plugins.forEach((plugin) => {
        plugin.init.call(this, options);
      });
    }
    /** Render the current stage. */
    render() {
      this.renderer.render(this.stage);
    }
    /**
     * Reference to the renderer's canvas element.
     * @member {PIXI.ICanvas}
     * @readonly
     */
    get view() {
      return this.renderer?.view;
    }
    /**
     * Reference to the renderer's screen rectangle. Its safe to use as `filterArea` or `hitArea` for the whole screen.
     * @member {PIXI.Rectangle}
     * @readonly
     */
    get screen() {
      return this.renderer?.screen;
    }
    /**
     * Destroy and don't use after this.
     * @param {boolean} [removeView=false] - Automatically remove canvas from DOM.
     * @param {object|boolean} [stageOptions] - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [stageOptions.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'stageOptions' will be passed on to those calls.
     * @param {boolean} [stageOptions.texture=false] - Only used for child Sprites if stageOptions.children is set
     *  to true. Should it destroy the texture of the child sprite
     * @param {boolean} [stageOptions.baseTexture=false] - Only used for child Sprites if stageOptions.children is set
     *  to true. Should it destroy the base texture of the child sprite
     */
    destroy(removeView, stageOptions) {
      const plugins = _Application2._plugins.slice(0);
      plugins.reverse(), plugins.forEach((plugin) => {
        plugin.destroy.call(this);
      }), this.stage.destroy(stageOptions), this.stage = null, this.renderer.destroy(removeView), this.renderer = null;
    }
  };
  _Application._plugins = [];
  var Application = _Application;
  extensions.handleByList(ExtensionType.Application, Application._plugins);

  // node_modules/@pixi/app/lib/ResizePlugin.mjs
  var ResizePlugin = class {
    /**
     * Initialize the plugin with scope of application instance
     * @static
     * @private
     * @param {object} [options] - See application options
     */
    static init(options) {
      Object.defineProperty(
        this,
        "resizeTo",
        /**
         * The HTML element or window to automatically resize the
         * renderer's view element to match width and height.
         * @member {Window|HTMLElement}
         * @name resizeTo
         * @memberof PIXI.Application#
         */
        {
          set(dom) {
            globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = dom, dom && (globalThis.addEventListener("resize", this.queueResize), this.resize());
          },
          get() {
            return this._resizeTo;
          }
        }
      ), this.queueResize = () => {
        this._resizeTo && (this.cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()));
      }, this.cancelResize = () => {
        this._resizeId && (cancelAnimationFrame(this._resizeId), this._resizeId = null);
      }, this.resize = () => {
        if (!this._resizeTo)
          return;
        this.cancelResize();
        let width, height;
        if (this._resizeTo === globalThis.window)
          width = globalThis.innerWidth, height = globalThis.innerHeight;
        else {
          const { clientWidth, clientHeight } = this._resizeTo;
          width = clientWidth, height = clientHeight;
        }
        this.renderer.resize(width, height), this.render();
      }, this._resizeId = null, this._resizeTo = null, this.resizeTo = options.resizeTo || null;
    }
    /**
     * Clean up the ticker, scoped to application
     * @static
     * @private
     */
    static destroy() {
      globalThis.removeEventListener("resize", this.queueResize), this.cancelResize(), this.cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null;
    }
  };
  ResizePlugin.extension = ExtensionType.Application;
  extensions.add(ResizePlugin);

  // node_modules/@pixi/filter-blur/lib/generateBlurFragSource.mjs
  var fragTemplate2 = [
    "varying vec2 vBlurTexCoords[%size%];",
    "uniform sampler2D uSampler;",
    "void main(void)",
    "{",
    "    gl_FragColor = vec4(0.0);",
    "    %blur%",
    "}"
  ].join(`
`);

  // node_modules/@pixi/filter-bulge-pinch/dist/filter-bulge-pinch.mjs
  var d2 = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`;
  var u2 = `uniform float radius;
uniform float strength;
uniform vec2 center;
uniform sampler2D uSampler;
varying vec2 vTextureCoord;

uniform vec4 filterArea;
uniform vec4 filterClamp;
uniform vec2 dimensions;

void main()
{
    vec2 coord = vTextureCoord * filterArea.xy;
    coord -= center * dimensions.xy;
    float distance = length(coord);
    if (distance < radius) {
        float percent = distance / radius;
        if (strength > 0.0) {
            coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
        } else {
            coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);
        }
    }
    coord += center * dimensions.xy;
    coord /= filterArea.xy;
    vec2 clampedCoord = clamp(coord, filterClamp.xy, filterClamp.zw);
    vec4 color = texture2D(uSampler, clampedCoord);
    if (coord != clampedCoord) {
        color *= max(0.0, 1.0 - length(coord - clampedCoord));
    }

    gl_FragColor = color;
}
`;
  var n2 = class extends Filter {
    constructor(e2) {
      super(d2, u2), this.uniforms.dimensions = new Float32Array(2), Object.assign(this, n2.defaults, e2);
    }
    apply(e2, r2, o2, i2) {
      const { width: s2, height: a2 } = r2.filterFrame;
      this.uniforms.dimensions[0] = s2, this.uniforms.dimensions[1] = a2, e2.applyFilter(this, r2, o2, i2);
    }
    get radius() {
      return this.uniforms.radius;
    }
    set radius(e2) {
      this.uniforms.radius = e2;
    }
    get strength() {
      return this.uniforms.strength;
    }
    set strength(e2) {
      this.uniforms.strength = e2;
    }
    get center() {
      return this.uniforms.center;
    }
    set center(e2) {
      this.uniforms.center = e2;
    }
  };
  var t2 = n2;
  t2.defaults = { center: [0.5, 0.5], radius: 100, strength: 1 };

  // node_modules/@pixi/filter-color-matrix/lib/colorMatrix.frag.mjs
  var fragment2 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float m[20];
uniform float uAlpha;

void main(void)
{
    vec4 c = texture2D(uSampler, vTextureCoord);

    if (uAlpha == 0.0) {
        gl_FragColor = c;
        return;
    }

    // Un-premultiply alpha before applying the color matrix. See issue #3539.
    if (c.a > 0.0) {
      c.rgb /= c.a;
    }

    vec4 result;

    result.r = (m[0] * c.r);
        result.r += (m[1] * c.g);
        result.r += (m[2] * c.b);
        result.r += (m[3] * c.a);
        result.r += m[4];

    result.g = (m[5] * c.r);
        result.g += (m[6] * c.g);
        result.g += (m[7] * c.b);
        result.g += (m[8] * c.a);
        result.g += m[9];

    result.b = (m[10] * c.r);
       result.b += (m[11] * c.g);
       result.b += (m[12] * c.b);
       result.b += (m[13] * c.a);
       result.b += m[14];

    result.a = (m[15] * c.r);
       result.a += (m[16] * c.g);
       result.a += (m[17] * c.b);
       result.a += (m[18] * c.a);
       result.a += m[19];

    vec3 rgb = mix(c.rgb, result.rgb, uAlpha);

    // Premultiply alpha again.
    rgb *= result.a;

    gl_FragColor = vec4(rgb, result.a);
}
`;

  // node_modules/@pixi/filter-color-matrix/lib/ColorMatrixFilter.mjs
  var ColorMatrixFilter = class extends Filter {
    constructor() {
      const uniforms = {
        m: new Float32Array([
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]),
        uAlpha: 1
      };
      super(defaultFilterVertex, fragment2, uniforms), this.alpha = 1;
    }
    /**
     * Transforms current matrix and set the new one
     * @param {number[]} matrix - 5x4 matrix
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    _loadMatrix(matrix, multiply = false) {
      let newMatrix = matrix;
      multiply && (this._multiply(newMatrix, this.uniforms.m, matrix), newMatrix = this._colorMatrix(newMatrix)), this.uniforms.m = newMatrix;
    }
    /**
     * Multiplies two mat5's
     * @private
     * @param out - 5x4 matrix the receiving matrix
     * @param a - 5x4 matrix the first operand
     * @param b - 5x4 matrix the second operand
     * @returns {number[]} 5x4 matrix
     */
    _multiply(out, a2, b2) {
      return out[0] = a2[0] * b2[0] + a2[1] * b2[5] + a2[2] * b2[10] + a2[3] * b2[15], out[1] = a2[0] * b2[1] + a2[1] * b2[6] + a2[2] * b2[11] + a2[3] * b2[16], out[2] = a2[0] * b2[2] + a2[1] * b2[7] + a2[2] * b2[12] + a2[3] * b2[17], out[3] = a2[0] * b2[3] + a2[1] * b2[8] + a2[2] * b2[13] + a2[3] * b2[18], out[4] = a2[0] * b2[4] + a2[1] * b2[9] + a2[2] * b2[14] + a2[3] * b2[19] + a2[4], out[5] = a2[5] * b2[0] + a2[6] * b2[5] + a2[7] * b2[10] + a2[8] * b2[15], out[6] = a2[5] * b2[1] + a2[6] * b2[6] + a2[7] * b2[11] + a2[8] * b2[16], out[7] = a2[5] * b2[2] + a2[6] * b2[7] + a2[7] * b2[12] + a2[8] * b2[17], out[8] = a2[5] * b2[3] + a2[6] * b2[8] + a2[7] * b2[13] + a2[8] * b2[18], out[9] = a2[5] * b2[4] + a2[6] * b2[9] + a2[7] * b2[14] + a2[8] * b2[19] + a2[9], out[10] = a2[10] * b2[0] + a2[11] * b2[5] + a2[12] * b2[10] + a2[13] * b2[15], out[11] = a2[10] * b2[1] + a2[11] * b2[6] + a2[12] * b2[11] + a2[13] * b2[16], out[12] = a2[10] * b2[2] + a2[11] * b2[7] + a2[12] * b2[12] + a2[13] * b2[17], out[13] = a2[10] * b2[3] + a2[11] * b2[8] + a2[12] * b2[13] + a2[13] * b2[18], out[14] = a2[10] * b2[4] + a2[11] * b2[9] + a2[12] * b2[14] + a2[13] * b2[19] + a2[14], out[15] = a2[15] * b2[0] + a2[16] * b2[5] + a2[17] * b2[10] + a2[18] * b2[15], out[16] = a2[15] * b2[1] + a2[16] * b2[6] + a2[17] * b2[11] + a2[18] * b2[16], out[17] = a2[15] * b2[2] + a2[16] * b2[7] + a2[17] * b2[12] + a2[18] * b2[17], out[18] = a2[15] * b2[3] + a2[16] * b2[8] + a2[17] * b2[13] + a2[18] * b2[18], out[19] = a2[15] * b2[4] + a2[16] * b2[9] + a2[17] * b2[14] + a2[18] * b2[19] + a2[19], out;
    }
    /**
     * Create a Float32 Array and normalize the offset component to 0-1
     * @param {number[]} matrix - 5x4 matrix
     * @returns {number[]} 5x4 matrix with all values between 0-1
     */
    _colorMatrix(matrix) {
      const m2 = new Float32Array(matrix);
      return m2[4] /= 255, m2[9] /= 255, m2[14] /= 255, m2[19] /= 255, m2;
    }
    /**
     * Adjusts brightness
     * @param b - value of the brigthness (0-1, where 0 is black)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    brightness(b2, multiply) {
      const matrix = [
        b2,
        0,
        0,
        0,
        0,
        0,
        b2,
        0,
        0,
        0,
        0,
        0,
        b2,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Sets each channel on the diagonal of the color matrix.
     * This can be used to achieve a tinting effect on Containers similar to the tint field of some
     * display objects like Sprite, Text, Graphics, and Mesh.
     * @param color - Color of the tint. This is a hex value.
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    tint(color, multiply) {
      const [r2, g2, b2] = Color.shared.setValue(color).toArray(), matrix = [
        r2,
        0,
        0,
        0,
        0,
        0,
        g2,
        0,
        0,
        0,
        0,
        0,
        b2,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Set the matrices in grey scales
     * @param scale - value of the grey (0-1, where 0 is black)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    greyscale(scale, multiply) {
      const matrix = [
        scale,
        scale,
        scale,
        0,
        0,
        scale,
        scale,
        scale,
        0,
        0,
        scale,
        scale,
        scale,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Set the black and white matrice.
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    blackAndWhite(multiply) {
      const matrix = [
        0.3,
        0.6,
        0.1,
        0,
        0,
        0.3,
        0.6,
        0.1,
        0,
        0,
        0.3,
        0.6,
        0.1,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Set the hue property of the color
     * @param rotation - in degrees
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    hue(rotation, multiply) {
      rotation = (rotation || 0) / 180 * Math.PI;
      const cosR = Math.cos(rotation), sinR = Math.sin(rotation), sqrt2 = Math.sqrt, w2 = 1 / 3, sqrW = sqrt2(w2), a00 = cosR + (1 - cosR) * w2, a01 = w2 * (1 - cosR) - sqrW * sinR, a02 = w2 * (1 - cosR) + sqrW * sinR, a10 = w2 * (1 - cosR) + sqrW * sinR, a11 = cosR + w2 * (1 - cosR), a12 = w2 * (1 - cosR) - sqrW * sinR, a20 = w2 * (1 - cosR) - sqrW * sinR, a21 = w2 * (1 - cosR) + sqrW * sinR, a22 = cosR + w2 * (1 - cosR), matrix = [
        a00,
        a01,
        a02,
        0,
        0,
        a10,
        a11,
        a12,
        0,
        0,
        a20,
        a21,
        a22,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Set the contrast matrix, increase the separation between dark and bright
     * Increase contrast : shadows darker and highlights brighter
     * Decrease contrast : bring the shadows up and the highlights down
     * @param amount - value of the contrast (0-1)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    contrast(amount, multiply) {
      const v2 = (amount || 0) + 1, o2 = -0.5 * (v2 - 1), matrix = [
        v2,
        0,
        0,
        0,
        o2,
        0,
        v2,
        0,
        0,
        o2,
        0,
        0,
        v2,
        0,
        o2,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Set the saturation matrix, increase the separation between colors
     * Increase saturation : increase contrast, brightness, and sharpness
     * @param amount - The saturation amount (0-1)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    saturate(amount = 0, multiply) {
      const x2 = amount * 2 / 3 + 1, y2 = (x2 - 1) * -0.5, matrix = [
        x2,
        y2,
        y2,
        0,
        0,
        y2,
        x2,
        y2,
        0,
        0,
        y2,
        y2,
        x2,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /** Desaturate image (remove color) Call the saturate function */
    desaturate() {
      this.saturate(-1);
    }
    /**
     * Negative image (inverse of classic rgb matrix)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    negative(multiply) {
      const matrix = [
        -1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        0,
        -1,
        1,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Sepia image
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    sepia(multiply) {
      const matrix = [
        0.393,
        0.7689999,
        0.18899999,
        0,
        0,
        0.349,
        0.6859999,
        0.16799999,
        0,
        0,
        0.272,
        0.5339999,
        0.13099999,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Color motion picture process invented in 1916 (thanks Dominic Szablewski)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    technicolor(multiply) {
      const matrix = [
        1.9125277891456083,
        -0.8545344976951645,
        -0.09155508482755585,
        0,
        11.793603434377337,
        -0.3087833385928097,
        1.7658908555458428,
        -0.10601743074722245,
        0,
        -70.35205161461398,
        -0.231103377548616,
        -0.7501899197440212,
        1.847597816108189,
        0,
        30.950940869491138,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Polaroid filter
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    polaroid(multiply) {
      const matrix = [
        1.438,
        -0.062,
        -0.062,
        0,
        0,
        -0.122,
        1.378,
        -0.122,
        0,
        0,
        -0.016,
        -0.016,
        1.483,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Filter who transforms : Red -> Blue and Blue -> Red
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    toBGR(multiply) {
      const matrix = [
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Color reversal film introduced by Eastman Kodak in 1935. (thanks Dominic Szablewski)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    kodachrome(multiply) {
      const matrix = [
        1.1285582396593525,
        -0.3967382283601348,
        -0.03992559172921793,
        0,
        63.72958762196502,
        -0.16404339962244616,
        1.0835251566291304,
        -0.05498805115633132,
        0,
        24.732407896706203,
        -0.16786010706155763,
        -0.5603416277695248,
        1.6014850761964943,
        0,
        35.62982807460946,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Brown delicious browni filter (thanks Dominic Szablewski)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    browni(multiply) {
      const matrix = [
        0.5997023498159715,
        0.34553243048391263,
        -0.2708298674538042,
        0,
        47.43192855600873,
        -0.037703249837783157,
        0.8609577587992641,
        0.15059552388459913,
        0,
        -36.96841498319127,
        0.24113635128153335,
        -0.07441037908422492,
        0.44972182064877153,
        0,
        -7.562075277591283,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Vintage filter (thanks Dominic Szablewski)
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    vintage(multiply) {
      const matrix = [
        0.6279345635605994,
        0.3202183420819367,
        -0.03965408211312453,
        0,
        9.651285835294123,
        0.02578397704808868,
        0.6441188644374771,
        0.03259127616149294,
        0,
        7.462829176470591,
        0.0466055556782719,
        -0.0851232987247891,
        0.5241648018700465,
        0,
        5.159190588235296,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * We don't know exactly what it does, kind of gradient map, but funny to play with!
     * @param desaturation - Tone values.
     * @param toned - Tone values.
     * @param lightColor - Tone values, example: `0xFFE580`
     * @param darkColor - Tone values, example: `0xFFE580`
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    colorTone(desaturation, toned, lightColor, darkColor, multiply) {
      desaturation = desaturation || 0.2, toned = toned || 0.15, lightColor = lightColor || 16770432, darkColor = darkColor || 3375104;
      const temp = Color.shared, [lR, lG, lB] = temp.setValue(lightColor).toArray(), [dR, dG, dB] = temp.setValue(darkColor).toArray(), matrix = [
        0.3,
        0.59,
        0.11,
        0,
        0,
        lR,
        lG,
        lB,
        desaturation,
        0,
        dR,
        dG,
        dB,
        toned,
        0,
        lR - dR,
        lG - dG,
        lB - dB,
        0,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Night effect
     * @param intensity - The intensity of the night effect.
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    night(intensity, multiply) {
      intensity = intensity || 0.1;
      const matrix = [
        intensity * -2,
        -intensity,
        0,
        0,
        0,
        -intensity,
        0,
        intensity,
        0,
        0,
        0,
        intensity,
        intensity * 2,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * Predator effect
     *
     * Erase the current matrix by setting a new indepent one
     * @param amount - how much the predator feels his future victim
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    predator(amount, multiply) {
      const matrix = [
        // row 1
        11.224130630493164 * amount,
        -4.794486999511719 * amount,
        -2.8746118545532227 * amount,
        0 * amount,
        0.40342438220977783 * amount,
        // row 2
        -3.6330697536468506 * amount,
        9.193157196044922 * amount,
        -2.951810836791992 * amount,
        0 * amount,
        -1.316135048866272 * amount,
        // row 3
        -3.2184197902679443 * amount,
        -4.2375030517578125 * amount,
        7.476448059082031 * amount,
        0 * amount,
        0.8044459223747253 * amount,
        // row 4
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /**
     * LSD effect
     *
     * Multiply the current matrix
     * @param multiply - if true, current matrix and matrix are multiplied. If false,
     *  just set the current matrix with @param matrix
     */
    lsd(multiply) {
      const matrix = [
        2,
        -0.4,
        0.5,
        0,
        0,
        -0.5,
        2,
        -0.4,
        0,
        0,
        -0.4,
        -0.5,
        3,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, multiply);
    }
    /** Erase the current matrix by setting the default one. */
    reset() {
      const matrix = [
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ];
      this._loadMatrix(matrix, false);
    }
    /**
     * The matrix of the color matrix filter
     * @member {number[]}
     * @default [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
     */
    get matrix() {
      return this.uniforms.m;
    }
    set matrix(value) {
      this.uniforms.m = value;
    }
    /**
     * The opacity value to use when mixing the original and resultant colors.
     *
     * When the value is 0, the original color is used without modification.
     * When the value is 1, the result color is used.
     * When in the range (0, 1) the color is interpolated between the original and result by this amount.
     * @default 1
     */
    get alpha() {
      return this.uniforms.uAlpha;
    }
    set alpha(value) {
      this.uniforms.uAlpha = value;
    }
  };
  ColorMatrixFilter.prototype.grayscale = ColorMatrixFilter.prototype.greyscale;

  // node_modules/@pixi/sprite/lib/Sprite.mjs
  var tempPoint = new Point();
  var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  // node_modules/@ungap/structured-clone/esm/types.js
  var VOID = -1;
  var PRIMITIVE = 0;
  var ARRAY = 1;
  var OBJECT = 2;
  var DATE = 3;
  var REGEXP = 4;
  var MAP = 5;
  var SET = 6;
  var ERROR = 7;
  var BIGINT = 8;

  // node_modules/@ungap/structured-clone/esm/deserialize.js
  var env = typeof self === "object" ? self : globalThis;
  var guard = (name, init2) => {
    switch (name) {
      case "Function":
      case "SharedWorker":
      case "Worker":
      case "eval":
      case "setInterval":
      case "setTimeout":
        throw new TypeError("unable to deserialize " + name);
    }
    return new env[name](init2);
  };
  var deserializer = ($2, _) => {
    const as = (out, index) => {
      $2.set(index, out);
      return out;
    };
    const unpair = (index) => {
      if ($2.has(index))
        return $2.get(index);
      const [type, value] = _[index];
      switch (type) {
        case PRIMITIVE:
        case VOID:
          return as(value, index);
        case ARRAY: {
          const arr = as([], index);
          for (const index2 of value)
            arr.push(unpair(index2));
          return arr;
        }
        case OBJECT: {
          const object = as({}, index);
          for (const [key, index2] of value)
            object[unpair(key)] = unpair(index2);
          return object;
        }
        case DATE:
          return as(new Date(value), index);
        case REGEXP: {
          const { source, flags } = value;
          return as(new RegExp(source, flags), index);
        }
        case MAP: {
          const map4 = as(/* @__PURE__ */ new Map(), index);
          for (const [key, index2] of value)
            map4.set(unpair(key), unpair(index2));
          return map4;
        }
        case SET: {
          const set = as(/* @__PURE__ */ new Set(), index);
          for (const index2 of value)
            set.add(unpair(index2));
          return set;
        }
        case ERROR: {
          const { name, message } = value;
          return as(
            typeof env[name] === "function" ? guard(name, message) : new Error(message),
            index
          );
        }
        case BIGINT:
          return as(BigInt(value), index);
        case "BigInt":
          return as(Object(BigInt(value)), index);
        case "ArrayBuffer":
          return as(new Uint8Array(value).buffer, value);
        case "DataView": {
          const { buffer } = new Uint8Array(value);
          return as(new DataView(buffer), value);
        }
      }
      return as(guard(type, value), index);
    };
    return unpair;
  };
  var deserialize = (serialized) => deserializer(/* @__PURE__ */ new Map(), serialized)(0);

  // node_modules/@ungap/structured-clone/esm/serialize.js
  var EMPTY = "";
  var { toString } = {};
  var { keys } = Object;
  var typeOf = (value) => {
    const type = typeof value;
    if (type !== "object" || !value)
      return [PRIMITIVE, type];
    const asString = toString.call(value).slice(8, -1);
    switch (asString) {
      case "Array":
        return [ARRAY, EMPTY];
      case "Object":
        return [OBJECT, EMPTY];
      case "Date":
        return [DATE, EMPTY];
      case "RegExp":
        return [REGEXP, EMPTY];
      case "Map":
        return [MAP, EMPTY];
      case "Set":
        return [SET, EMPTY];
      case "DataView":
        return [ARRAY, asString];
    }
    if (asString.includes("Array"))
      return [ARRAY, asString];
    if (value instanceof Error)
      return [ERROR, value.name || "Error"];
    return [OBJECT, asString];
  };
  var shouldSkip = ([TYPE, type]) => TYPE === PRIMITIVE && (type === "function" || type === "symbol");
  var serializer = (strict, json, $2, _) => {
    const as = (out, value) => {
      const index = _.push(out) - 1;
      $2.set(value, index);
      return index;
    };
    const pair = (value) => {
      if ($2.has(value))
        return $2.get(value);
      let [TYPE, type] = typeOf(value);
      switch (TYPE) {
        case PRIMITIVE: {
          let entry = value;
          switch (type) {
            case "bigint":
              TYPE = BIGINT;
              entry = value.toString();
              break;
            case "function":
            case "symbol":
              if (strict)
                throw new TypeError("unable to serialize " + type);
              entry = null;
              break;
            case "undefined":
              return as([VOID], value);
          }
          return as([TYPE, entry], value);
        }
        case ARRAY: {
          if (type) {
            let spread = value;
            if (type === "DataView") {
              spread = new Uint8Array(value.buffer);
            } else if (type === "ArrayBuffer") {
              spread = new Uint8Array(value);
            }
            return as([type, [...spread]], value);
          }
          const arr = [];
          const index = as([TYPE, arr], value);
          for (const entry of value)
            arr.push(pair(entry));
          return index;
        }
        case OBJECT: {
          if (type) {
            switch (type) {
              case "BigInt":
                return as([type, value.toString()], value);
              case "Boolean":
              case "Number":
              case "String":
                return as([type, value.valueOf()], value);
            }
          }
          if (json && "toJSON" in value)
            return pair(value.toJSON());
          const entries = [];
          const index = as([TYPE, entries], value);
          for (const key of keys(value)) {
            if (strict || !shouldSkip(typeOf(value[key])))
              entries.push([pair(key), pair(value[key])]);
          }
          return index;
        }
        case DATE:
          return as([TYPE, isNaN(value.getTime()) ? EMPTY : value.toISOString()], value);
        case REGEXP: {
          const { source, flags } = value;
          return as([TYPE, { source, flags }], value);
        }
        case MAP: {
          const entries = [];
          const index = as([TYPE, entries], value);
          for (const [key, entry] of value) {
            if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
              entries.push([pair(key), pair(entry)]);
          }
          return index;
        }
        case SET: {
          const entries = [];
          const index = as([TYPE, entries], value);
          for (const entry of value) {
            if (strict || !shouldSkip(typeOf(entry)))
              entries.push(pair(entry));
          }
          return index;
        }
      }
      const { message } = value;
      return as([TYPE, { name: type, message }], value);
    };
    return pair;
  };
  var serialize = (value, { json, lossy } = {}) => {
    const _ = [];
    return serializer(!(json || lossy), !!json, /* @__PURE__ */ new Map(), _)(value), _;
  };

  // node_modules/@ungap/structured-clone/esm/index.js
  var esm_default = typeof structuredClone === "function" ? (
    /* c8 ignore start */
    (any, options) => options && ("json" in options || "lossy" in options) ? deserialize(serialize(any, options)) : structuredClone(any)
  ) : (any, options) => deserialize(serialize(any, options));

  // node_modules/bezier-easing/src/index.js
  function LinearEasing(x2) {
    return x2;
  }
  var { cbrt, sqrt, PI: \u03C0 } = Math;
  var x2t = (x2, a2, b2, c2, d3) => {
    const q = a2 + b2 * x2;
    const s2 = q ** 2 + c2;
    if (s2 > 0) {
      const root = sqrt(s2);
      return cbrt(q + root) + cbrt(q - root) - d3;
    }
    const l2 = cbrt(sqrt(q * q - s2));
    const angle = q ? Math.atan(sqrt(-s2) / q) : -\u03C0 / 2;
    let \u03C6;
    if (b2 < 0) {
      \u03C6 = (q > 0 ? 2 * \u03C0 : \u03C0) - angle;
    } else if (d3 < 0) {
      \u03C6 = (q > 0 ? 2 * \u03C0 : -3 * \u03C0) + angle;
    } else {
      \u03C6 = (q > 0 ? 0 : \u03C0) + angle;
    }
    return 2 * l2 * Math.cos(\u03C6 / 3) - d3;
  };
  var Y = (t3, ay, by, cy) => ((ay * t3 + 3 * by) * t3 + cy) * t3;
  function bezier(mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
      throw new Error("bezier x values must be in [0, 1] range");
    }
    if (mX1 === mY1 && mX2 === mY2) {
      return LinearEasing;
    }
    const a2 = 6 * (3 * mX1 - 3 * mX2 + 1);
    const b2 = 6 * (mX2 - 2 * mX1);
    const c2 = 3 * mX1;
    const a22 = a2 * a2;
    const b22 = b2 * b2;
    const d3 = b2 / a2;
    const e2 = 3 * b2 * c2 / a22 - b22 * b2 / (a22 * a2);
    const w1 = 2 * c2 / a2 - b22 / a22;
    const w2 = w1 * w1 * w1;
    const o2 = 3 / a2;
    const ay = 3 * mY1 - 3 * mY2 + 1;
    const by = mY2 - 2 * mY1;
    const cy = 3 * mY1;
    const X2T = a2 ? x2t : LinearEasing;
    return function BezierEasing(x2) {
      if (x2 === 0 || x2 === 1) {
        return x2;
      }
      return Y(X2T(x2, e2, o2, w2, d3), ay, by, cy);
    };
  }

  // node_modules/@applemusic-like-lyrics/core/dist/amll-core.mjs
  function clamp(x2, min, max) {
    return Math.min(Math.max(x2, min), max);
  }
  function clamp01(x2) {
    return clamp(x2, 0, 1);
  }
  function clampPositive(x2) {
    return Math.max(0, x2);
  }
  var p2 = (cx, cy, x2, y2, ur = 0, vr = 0, up = 1, vp = 1) => Object.freeze({
    cx,
    cy,
    x: x2,
    y: y2,
    ur,
    vr,
    up,
    vp
  });
  var preset = (width, height, conf) => Object.freeze({
    width,
    height,
    conf
  });
  var CONTROL_POINT_PRESETS = [
    preset(5, 5, [
      p2(0, 0, -1, -1, 0, 0, 1, 1),
      p2(1, 0, -0.5, -1, 0, 0, 1, 1),
      p2(2, 0, 0, -1, 0, 0, 1, 1),
      p2(3, 0, 0.5, -1, 0, 0, 1, 1),
      p2(4, 0, 1, -1, 0, 0, 1, 1),
      p2(0, 1, -1, -0.5, 0, 0, 1, 1),
      p2(1, 1, -0.5, -0.5, 0, 0, 1, 1),
      p2(2, 1, -0.0052029684413368305, -0.6131420587090777, 0, 0, 1, 1),
      p2(3, 1, 0.5884227308309977, -0.3990805107556692, 0, 0, 1, 1),
      p2(4, 1, 1, -0.5, 0, 0, 1, 1),
      p2(0, 2, -1, 0, 0, 0, 1, 1),
      p2(1, 2, -0.4210024670505933, -0.11895058380429502, 0, 0, 1, 1),
      p2(2, 2, -0.1019613423315412, -0.023812118047224606, 0, -47, 0.629, 0.849),
      p2(3, 2, 0.40275125660925437, -0.06345314544600389, 0, 0, 1, 1),
      p2(4, 2, 1, 0, 0, 0, 1, 1),
      p2(0, 3, -1, 0.5, 0, 0, 1, 1),
      p2(1, 3, 0.06801958477287173, 0.5205913248960121, -31, -45, 1, 1),
      p2(2, 3, 0.21446469120128908, 0.29331610114301043, 6, -56, 0.566, 1.321),
      p2(3, 3, 0.5, 0.5, 0, 0, 1, 1),
      p2(4, 3, 1, 0.5, 0, 0, 1, 1),
      p2(0, 4, -1, 1, 0, 0, 1, 1),
      p2(1, 4, -0.31378372841550195, 1, 0, 0, 1, 1),
      p2(2, 4, 0.26153633255328046, 1, 0, 0, 1, 1),
      p2(3, 4, 0.5, 1, 0, 0, 1, 1),
      p2(4, 4, 1, 1, 0, 0, 1, 1)
    ]),
    preset(4, 4, [
      p2(0, 0, -1, -1, 0, 0, 1, 1),
      p2(1, 0, -0.33333333333333337, -1, 0, 0, 1, 1),
      p2(2, 0, 0.33333333333333326, -1, 0, 0, 1, 1),
      p2(3, 0, 1, -1, 0, 0, 1, 1),
      p2(0, 1, -1, -0.04495399932657351, 0, 0, 1, 1),
      p2(1, 1, -0.24056117520129328, -0.22465999020104, 0, 0, 1, 1),
      p2(2, 1, 0.334758885767489, -0.00531297192779423, 0, 0, 1, 1),
      p2(3, 1, 0.9989920470678106, -0.3382976020775408, 8, 0, 0.566, 1.792),
      p2(0, 2, -1, 0.33333333333333326, 0, 0, 1, 1),
      p2(1, 2, -0.3425497314639411, -27501607956947893e-21, 0, 0, 1, 1),
      p2(2, 2, 0.3321437945812673, 0.1981776353859399, 0, 0, 1, 1),
      p2(3, 2, 1, 0.0766118180296832, 0, 0, 1, 1),
      p2(0, 3, -1, 1, 0, 0, 1, 1),
      p2(1, 3, -0.33333333333333337, 1, 0, 0, 1, 1),
      p2(2, 3, 0.33333333333333326, 1, 0, 0, 1, 1),
      p2(3, 3, 1, 1, 0, 0, 1, 1)
    ]),
    preset(4, 4, [
      p2(0, 0, -1, -1, 0, 0, 1, 2.075),
      p2(1, 0, -0.33333333333333337, -1, 0, 0, 1, 1),
      p2(2, 0, 0.33333333333333326, -1, 0, 0, 1, 1),
      p2(3, 0, 1, -1, 0, 0, 1, 1),
      p2(0, 1, -1, -0.4545779491139603, 0, 0, 1, 1),
      p2(1, 1, -0.33333333333333337, -0.33333333333333337, 0, 0, 1, 1),
      p2(2, 1, 0.0889403142626457, -0.6025711180694033, -32, 45, 1, 1),
      p2(3, 1, 1, -0.33333333333333337, 0, 0, 1, 1),
      p2(0, 2, -1, -0.07402408608567845, 1, 0, 1, 0.094),
      p2(1, 2, -0.2719422694359541, 0.09775369930903222, 25, -18, 1.321, 0),
      p2(2, 2, 0.19877414408395877, 0.4307383294587789, 48, -40, 0.755, 0.975),
      p2(3, 2, 1, 0.33333333333333326, -37, 0, 1, 1),
      p2(0, 3, -1, 1, 0, 0, 1, 1),
      p2(1, 3, -0.33333333333333337, 1, 0, 0, 1, 1),
      p2(2, 3, 0.5125850864305672, 1, -20, -18, 0, 1.604),
      p2(3, 3, 1, 1, 0, 0, 1, 1)
    ]),
    preset(5, 5, [
      p2(0, 0, -1, -1, 0, 0, 1, 1),
      p2(1, 0, -0.4501953125, -1, 0, 55, 1, 2.075),
      p2(2, 0, 0.1953125, -1, 0, 0, 1, 1),
      p2(3, 0, 0.4580078125, -1, 0, -25, 1, 1),
      p2(4, 0, 1, -1, 0, 0, 1, 1),
      p2(0, 1, -1, -0.2514475377525607, -16, 0, 2.327, 0.943),
      p2(1, 1, -0.55859375, -0.6609325945787148, 47, 0, 2.358, 0.377),
      p2(2, 1, 0.232421875, -0.5244375756366635, -66, -25, 1.855, 1.164),
      p2(3, 1, 0.685546875, -0.3753706470552125, 0, 0, 1, 1),
      p2(4, 1, 1, -0.6699125300354287, 0, 0, 1, 1),
      p2(0, 2, -1, 0.035910396862284255, 0, 0, 1, 1),
      p2(1, 2, -0.4921875, 0.005378616309457018, 90, 23, 1, 1.981),
      p2(2, 2, 0.021484375, -0.1365043639066228, 0, 42, 1, 1),
      p2(3, 2, 0.4765625, 0.05925822904974043, -30, 0, 1.95, 0.44),
      p2(4, 2, 1, 0.251428847823418, 0, 0, 1, 1),
      p2(0, 3, -1, 0.6968336464764276, -68, 0, 1, 0.786),
      p2(1, 3, -0.6904296875, 0.5890744209958608, -68, 0, 1, 1),
      p2(2, 3, 0.1845703125, 0.3879238667654693, 61, 0, 1, 1),
      p2(3, 3, 0.60546875, 0.4633553246018661, -47, -59, 0.849, 1.73),
      p2(4, 3, 1, 0.6214021886400309, -33, 0, 0.377, 1.604),
      p2(0, 4, -1, 1, 0, 0, 1, 1),
      p2(1, 4, -0.5, 1, 0, -73, 1, 1),
      p2(2, 4, -0.3271484375, 1, 0, -24, 0.314, 2.704),
      p2(3, 4, 0.5, 1, 0, 0, 1, 1),
      p2(4, 4, 1, 1, 0, 0, 1, 1)
    ]),
    preset(5, 5, [
      p2(0, 0, -1, -1),
      p2(1, 0, -0.6393, -1, 0, 0, 1, 2.3884),
      p2(2, 0, 0, -1),
      p2(3, 0, 0.5, -1),
      p2(4, 0, 1, -1),
      p2(0, 1, -1, -0.2301),
      p2(1, 1, -0.6934, -0.331, 0, -0.7188, 1, 1.063),
      p2(2, 1, -82e-4, -0.6814, -0.2583, 0, 1.0964, 1),
      p2(3, 1, 0.5836, -0.531, 0.7029, 0, 1.5466, 1),
      p2(4, 1, 1, -0.6407),
      p2(0, 2, -1, 0.2973, 0, 0, 1.8352, 1),
      p2(1, 2, -0.4082, 0.0602),
      p2(2, 2, -0.1803, -0.3646, -0.2998, 0, 1.1513, 1),
      p2(3, 2, 0.477, -0.1027, 0.8903, -0.1882, 1.0807, 0.8551),
      p2(4, 2, 1, -0.2973),
      p2(0, 3, -1, 0.7628, 0, 0, 2.3868, 1),
      p2(1, 3, -0.2525, 0.4814, -0.8406, -1.6199, 1.4093, 1.2215),
      p2(2, 3, 0.3607, 0.2814, -1.0713, -0.0529, 1.0025, 0.7611),
      p2(3, 3, 0.4885, 0.623, 0, 0.8184, 1, 1.2876),
      p2(4, 3, 1, 0.5),
      p2(0, 4, -1, 1),
      p2(1, 4, -0.4033, 1),
      p2(2, 4, 0.2672, 1),
      p2(3, 4, 0.5967, 1),
      p2(4, 4, 1, 1)
    ]),
    preset(5, 5, [
      p2(0, 0, -1, -1),
      p2(1, 0, -0.2197, -1),
      p2(2, 0, 0.0197, -1),
      p2(3, 0, 0.8033, -1),
      p2(4, 0, 1, -1),
      p2(0, 1, -1, -0.5451),
      p2(1, 1, -0.4885, -0.4035, -1.0246, -0.2268, 1.1936, 0.8005),
      p2(2, 1, -0.1213, -0.2867, 0, -0.6981, 1, 0.809),
      p2(3, 1, 0.3246, -0.5628, 0, -1.2188, 1, 1.044),
      p2(4, 1, 1, -0.3292),
      p2(0, 2, -1, 0.1416),
      p2(1, 2, -0.341, -0.0142, 0, -0.4004, 1, 1.1293),
      p2(2, 2, -0.0393, -0.023, 0.2915, -0.373, 1.044, 0.9879),
      p2(3, 2, 0.3148, -0.0673, -0.7853, -0.8962, 1.4709, 1.0247),
      p2(4, 2, 1, 0.1912),
      p2(0, 3, -1, 0.5),
      p2(1, 3, -0.2689, 0.2743, 0.3404, -0.5248, 1.0184, 0.4391),
      p2(2, 3, 0.0721, 0.269, 0.5302, 0.1244, 0.6723, 0.3225),
      p2(3, 3, 0.4148, 0.3894, -0.6977, -0.6783, 0.8094, 0.9247),
      p2(4, 3, 1, 0.446),
      p2(0, 4, -1, 1),
      p2(1, 4, -0.7311, 1),
      p2(2, 4, 0.323, 1),
      p2(3, 4, 0.6393, 1),
      p2(4, 4, 1, 1)
    ])
  ];
  var H2 = Mat4.fromValues(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
  var H_T = Mat4.clone(H2).transpose();
  var lyric_player_module_default = {
    "active": "FmKaba_active",
    "bgWrapper": "FmKaba_bgWrapper",
    "bgWrapperActive": "FmKaba_bgWrapperActive",
    "bgWrapperHidden": "FmKaba_bgWrapperHidden",
    "bgWrapperTop": "FmKaba_bgWrapperTop",
    "bottomLine": "FmKaba_bottomLine",
    "disableSpring": "FmKaba_disableSpring",
    "duet": "FmKaba_duet",
    "emphasize": "FmKaba_emphasize",
    "emphasizeWrapper": "FmKaba_emphasizeWrapper",
    "enabled": "FmKaba_enabled",
    "hasDuetLine": "FmKaba_hasDuetLine",
    "interludeDots": "FmKaba_interludeDots",
    "lyricBgLine": "FmKaba_lyricBgLine",
    "lyricDuetLine": "FmKaba_lyricDuetLine",
    "lyricLine": "FmKaba_lyricLine",
    "lyricLineWrapper": "FmKaba_lyricLineWrapper",
    "lyricMainLine": "FmKaba_lyricMainLine",
    "lyricSubLine": "FmKaba_lyricSubLine",
    "playing": "FmKaba_playing",
    "romanWord": "FmKaba_romanWord",
    "rubyWord": "FmKaba_rubyWord",
    "tmpDisableTransition": "FmKaba_tmpDisableTransition",
    "wordBody": "FmKaba_wordBody",
    "wordWithRuby": "FmKaba_wordWithRuby"
  };
  var DEFAULT_OPTIMIZE_OPTIONS = {
    normalizeSpaces: true,
    resetLineTimestamps: true,
    convertExcessiveBackgroundLines: true,
    syncMainAndBackgroundLines: true,
    cleanUnintentionalOverlaps: true,
    tryAdvanceStartTime: true
  };
  function normalizeSpaces(lines) {
    for (const line of lines) for (const word of line.words) word.word = word.word.replace(/\s+/g, " ");
  }
  function resetLineTimestamps(lines) {
    for (const line of lines) if (line.words.length === 1 && line.words[0].startTime === 0 && line.words[0].endTime === 0 && (line.startTime !== 0 || line.endTime !== 0)) {
      line.words[0].startTime = line.startTime;
      line.words[0].endTime = line.endTime;
    } else if (line.words.length > 0) {
      const firstWord = line.words[0];
      const lastWord = line.words[line.words.length - 1];
      line.startTime = firstWord.startTime;
      line.endTime = lastWord.endTime;
    }
  }
  function convertExcessiveBackgroundLines(lines) {
    let consecutiveBgCount = 0;
    for (const line of lines) if (line.isBG) {
      consecutiveBgCount++;
      if (consecutiveBgCount > 1) line.isBG = false;
    } else consecutiveBgCount = 0;
  }
  function syncMainAndBackgroundLines(lines) {
    for (let i2 = lines.length - 1; i2 >= 0; i2--) {
      const line = lines[i2];
      if (line.isBG) continue;
      const nextLine = lines[i2 + 1];
      if (nextLine?.isBG) {
        const allWords = [...line.words, ...nextLine.words].filter((w2) => w2.word.trim().length > 0);
        if (allWords.length > 0) {
          const minStart = Math.min(...allWords.map((w2) => w2.startTime));
          const maxEnd = Math.max(...allWords.map((w2) => w2.endTime));
          const finalStart = Math.min(minStart, line.startTime, nextLine.startTime);
          const finalEnd = Math.max(maxEnd, line.endTime, nextLine.endTime);
          line.startTime = finalStart;
          line.endTime = finalEnd;
          nextLine.startTime = finalStart;
          nextLine.endTime = finalEnd;
        }
      }
    }
  }
  function cleanUnintentionalOverlaps(lines) {
    for (let i2 = 0; i2 < lines.length - 1; i2++) {
      const line = lines[i2];
      if (line.isBG) continue;
      let nextMainIndex = i2 + 1;
      while (nextMainIndex < lines.length && lines[nextMainIndex].isBG) nextMainIndex++;
      if (nextMainIndex < lines.length) {
        const nextLine = lines[nextMainIndex];
        const overlap = line.endTime - nextLine.startTime;
        if (overlap > 0) {
          const percentageThreshold = (nextLine.endTime - nextLine.startTime) * 0.1;
          if (!(overlap > 100 && overlap > percentageThreshold)) {
            line.endTime = nextLine.startTime;
            const attachedBgLine = lines[i2 + 1];
            if (attachedBgLine?.isBG) attachedBgLine.endTime = nextLine.startTime;
          }
        }
      }
    }
  }
  function tryAdvanceStartTime(lines) {
    const defaultAdvanceAmount = 600;
    const fallbackAdvanceAmount = 400;
    const fallbackAdvanceRatio = 0.3;
    let prevLineStartTime = 0;
    let prevLineEndTime = 0;
    let prevMainGroupStartTime = 0;
    let prevMainGroupEndTime = 0;
    let hasPrevLine = false;
    for (let i2 = 0; i2 < lines.length; i2++) {
      const line = lines[i2];
      if (line.isBG) continue;
      const originalStartTime = line.startTime;
      const originalEndTime = line.endTime;
      let targetAdvanceAmount = 0;
      let safeBoundary = 0;
      if (hasPrevLine) if (originalStartTime >= prevLineEndTime) {
        targetAdvanceAmount = defaultAdvanceAmount;
        safeBoundary = prevMainGroupEndTime;
      } else {
        targetAdvanceAmount = fallbackAdvanceAmount;
        const prevDuration = prevLineEndTime - prevLineStartTime;
        safeBoundary = prevLineStartTime + prevDuration * fallbackAdvanceRatio;
      }
      else {
        targetAdvanceAmount = defaultAdvanceAmount;
        safeBoundary = 0;
      }
      const targetTime = line.startTime - targetAdvanceAmount;
      const newStartTime = Math.max(safeBoundary, targetTime);
      if (newStartTime < line.startTime) line.startTime = newStartTime;
      const nextLine = lines[i2 + 1];
      if (nextLine?.isBG) nextLine.startTime = line.startTime;
      if (hasPrevLine) if (originalStartTime < prevMainGroupEndTime && originalEndTime > prevMainGroupStartTime) {
        prevMainGroupStartTime = Math.min(prevMainGroupStartTime, originalStartTime);
        prevMainGroupEndTime = Math.max(prevMainGroupEndTime, originalEndTime);
      } else {
        prevMainGroupStartTime = originalStartTime;
        prevMainGroupEndTime = originalEndTime;
      }
      else {
        prevMainGroupStartTime = originalStartTime;
        prevMainGroupEndTime = originalEndTime;
      }
      prevLineStartTime = originalStartTime;
      prevLineEndTime = originalEndTime;
      hasPrevLine = true;
    }
  }
  function optimizeLyricLines(lines, options) {
    const config = {
      ...DEFAULT_OPTIMIZE_OPTIONS,
      ...options
    };
    if (config.normalizeSpaces) normalizeSpaces(lines);
    if (config.resetLineTimestamps) resetLineTimestamps(lines);
    if (config.convertExcessiveBackgroundLines) convertExcessiveBackgroundLines(lines);
    if (config.syncMainAndBackgroundLines) syncMainAndBackgroundLines(lines);
    if (config.cleanUnintentionalOverlaps) cleanUnintentionalOverlaps(lines);
    if (config.tryAdvanceStartTime) tryAdvanceStartTime(lines);
  }
  function easeInOutBack(x2) {
    const c2 = 1.70158 * 1.525;
    return x2 < 0.5 ? (2 * x2) ** 2 * ((c2 + 1) * 2 * x2 - c2) / 2 : ((2 * x2 - 2) ** 2 * ((c2 + 1) * (x2 * 2 - 2) + c2) + 2) / 2;
  }
  function easeOutExpo(x2) {
    return x2 === 1 ? 1 : 1 - 2 ** (-10 * x2);
  }
  var InterludeDots = class {
    element = document.createElement("div");
    dot0 = document.createElement("span");
    dot1 = document.createElement("span");
    dot2 = document.createElement("span");
    left = 0;
    top = 0;
    playing = true;
    lastStyle = "";
    currentInterlude;
    currentTime = 0;
    targetBreatheDuration = 1500;
    constructor() {
      this.element.className = lyric_player_module_default.interludeDots;
      this.element.appendChild(this.dot0);
      this.element.appendChild(this.dot1);
      this.element.appendChild(this.dot2);
    }
    getElement() {
      return this.element;
    }
    setTransform(left = this.left, top = this.top) {
      this.left = left;
      this.top = top;
      this.update();
    }
    setInterlude(interlude) {
      this.currentInterlude = interlude;
      this.currentTime = interlude?.[0] ?? 0;
      if (interlude) this.element.classList.add(lyric_player_module_default.enabled);
      else this.element.classList.remove(lyric_player_module_default.enabled);
    }
    pause() {
      this.playing = false;
      this.element.classList.remove(lyric_player_module_default.playing);
    }
    resume() {
      this.playing = true;
      this.element.classList.add(lyric_player_module_default.playing);
    }
    update(delta = 0) {
      if (!this.playing) return;
      this.currentTime += delta;
      let curStyle = "";
      curStyle += `transform:translate(${this.left.toFixed(2)}px, ${this.top.toFixed(2)}px)`;
      if (this.currentInterlude) {
        const interludeDuration = this.currentInterlude[1] - this.currentInterlude[0];
        const currentDuration = this.currentTime - this.currentInterlude[0];
        if (currentDuration <= interludeDuration) {
          const breatheDuration = interludeDuration / Math.ceil(interludeDuration / this.targetBreatheDuration);
          let scale = 1;
          let globalOpacity = 1;
          scale *= Math.sin(1.5 * Math.PI - currentDuration / breatheDuration * 2) / 20 + 1;
          if (currentDuration < 2e3) scale *= easeOutExpo(currentDuration / 2e3);
          if (currentDuration < 500) globalOpacity = 0;
          else if (currentDuration < 1e3) globalOpacity *= (currentDuration - 500) / 500;
          if (interludeDuration - currentDuration < 750) scale *= 1 - easeInOutBack((750 - (interludeDuration - currentDuration)) / 750 / 2);
          if (interludeDuration - currentDuration < 375) globalOpacity *= clamp01((interludeDuration - currentDuration) / 375);
          const dotsDuration = clampPositive(interludeDuration - 750);
          scale = clampPositive(scale) * 0.7;
          curStyle += ` scale(${scale})`;
          const dot0Opacity = clamp(0.25, currentDuration * 3 / dotsDuration * 0.75, 1);
          const dot1Opacity = clamp(0.25, (currentDuration - dotsDuration / 3) * 3 / dotsDuration * 0.75, 1);
          const dot2Opacity = clamp(0.25, (currentDuration - dotsDuration / 3 * 2) * 3 / dotsDuration * 0.75, 1);
          this.dot0.style.opacity = `${clamp01(globalOpacity * dot0Opacity)}`;
          this.dot1.style.opacity = `${clamp01(globalOpacity * dot1Opacity)}`;
          this.dot2.style.opacity = `${clamp01(globalOpacity * dot2Opacity)}`;
        } else {
          curStyle += " scale(0)";
          this.dot0.style.opacity = "0";
          this.dot1.style.opacity = "0";
          this.dot2.style.opacity = "0";
        }
        curStyle += ";";
        if (this.lastStyle !== curStyle) {
          this.element.setAttribute("style", curStyle);
          this.lastStyle = curStyle;
        }
      }
    }
    dispose() {
      this.element.remove();
    }
  };
  var measureTasks = [];
  var mutateTasks = [];
  var scheduled = false;
  function onFlush() {
    let tmp = mutateTasks.shift();
    while (tmp) {
      try {
        tmp.resolve(tmp.task());
      } catch (error) {
        tmp.reject(error);
      }
      tmp = mutateTasks.shift();
    }
    tmp = measureTasks.shift();
    while (tmp) {
      try {
        tmp.resolve(tmp.task());
      } catch (error) {
        tmp.reject(error);
      }
      tmp = measureTasks.shift();
    }
    scheduled = false;
  }
  function scheduleFlush() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(onFlush);
    }
  }
  function measure(callback) {
    const task = {
      task: callback,
      resolve: () => {
      },
      reject: () => {
      }
    };
    const promise2 = new Promise((resolve2, reject) => {
      task.resolve = resolve2;
      task.reject = reject;
    });
    measureTasks.push(task);
    scheduleFlush();
    return promise2;
  }
  function derivative(f2) {
    const h2 = 1e-3;
    return (x2) => (f2(x2 + h2) - f2(x2 - h2)) / (2 * h2);
  }
  function getVelocity(f2) {
    return derivative(f2);
  }
  var Spring = class {
    currentPosition = 0;
    targetPosition = 0;
    currentTime = 0;
    params = {};
    currentSolver;
    getV;
    getV2;
    queueParams;
    queuePosition;
    constructor(currentPosition = 0) {
      this.targetPosition = currentPosition;
      this.currentPosition = this.targetPosition;
      this.currentSolver = () => this.targetPosition;
      this.getV = () => 0;
      this.getV2 = () => 0;
    }
    resetSolver() {
      const curV = this.getV(this.currentTime);
      this.currentTime = 0;
      this.currentSolver = solveSpring(this.currentPosition, curV, this.targetPosition, 0, this.params);
      this.getV = getVelocity(this.currentSolver);
      this.getV2 = getVelocity(this.getV);
    }
    arrived() {
      return Math.abs(this.targetPosition - this.currentPosition) < 0.01 && this.getV(this.currentTime) < 0.01 && this.getV2(this.currentTime) < 0.01 && this.queueParams === void 0 && this.queuePosition === void 0;
    }
    setPosition(targetPosition) {
      this.targetPosition = targetPosition;
      this.currentPosition = targetPosition;
      this.currentSolver = () => this.targetPosition;
      this.getV = () => 0;
      this.getV2 = () => 0;
    }
    update(delta = 0) {
      this.currentTime += delta;
      this.currentPosition = this.currentSolver(this.currentTime);
      if (this.queueParams) {
        this.queueParams.time -= delta;
        if (this.queueParams.time <= 0) this.updateParams({ ...this.queueParams });
      }
      if (this.queuePosition) {
        this.queuePosition.time -= delta;
        if (this.queuePosition.time <= 0) this.setTargetPosition(this.queuePosition.position);
      }
      if (this.arrived()) this.setPosition(this.targetPosition);
    }
    updateParams(params, delay = 0) {
      if (delay > 0) this.queueParams = {
        ...this.queuePosition ?? {},
        ...params,
        time: delay
      };
      else {
        this.queuePosition = void 0;
        this.params = {
          ...this.params,
          ...params
        };
        this.resetSolver();
      }
    }
    setTargetPosition(targetPosition, delay = 0) {
      if (delay > 0) this.queuePosition = {
        ...this.queuePosition ?? {},
        position: targetPosition,
        time: delay
      };
      else {
        this.queuePosition = void 0;
        this.targetPosition = targetPosition;
        this.resetSolver();
      }
    }
    getCurrentPosition() {
      return this.currentPosition;
    }
  };
  function solveSpring(from, velocity, to, delay = 0, params) {
    const soft = params?.soft ?? false;
    const stiffness = params?.stiffness ?? 100;
    const damping = params?.damping ?? 10;
    const mass = params?.mass ?? 1;
    const delta = to - from;
    if (soft || 1 <= damping / (2 * Math.sqrt(stiffness * mass))) {
      const angular_frequency = -Math.sqrt(stiffness / mass);
      const leftover2 = -angular_frequency * delta - velocity;
      return (t3) => {
        t3 -= delay;
        if (t3 < 0) return from;
        return to - (delta + t3 * leftover2) * Math.E ** (t3 * angular_frequency);
      };
    }
    const damping_frequency = Math.sqrt(4 * mass * stiffness - damping ** 2);
    const leftover = (damping * delta - 2 * mass * velocity) / damping_frequency;
    const dfm = 0.5 * damping_frequency / mass;
    const dm = -(0.5 * damping) / mass;
    return (t3) => {
      t3 -= delay;
      if (t3 < 0) return from;
      return to - (Math.cos(t3 * dfm) * delta + Math.sin(t3 * dfm) * leftover) * Math.E ** (t3 * dm);
    };
  }
  var BottomLineEl = class {
    lyricPlayer;
    element = document.createElement("div");
    left = 0;
    top = 0;
    delay = 0;
    lineSize = [0, 0];
    lineTransforms = {
      posX: new Spring(0),
      posY: new Spring(0)
    };
    isFocused = false;
    blur = 0;
    constructor(lyricPlayer) {
      this.lyricPlayer = lyricPlayer;
      this.element.setAttribute("class", `${lyric_player_module_default.lyricLine} ${lyric_player_module_default.bottomLine}`);
      this.element.dataset.bottomLine = "true";
      this.rebuildStyle();
    }
    async measureSize() {
      return await measure(() => [this.element.clientWidth, this.element.clientHeight]);
    }
    lastStyle = "";
    show() {
      this.rebuildStyle();
    }
    hide() {
      this.rebuildStyle();
    }
    setFocused(focused) {
      if (this.isFocused !== focused) {
        this.isFocused = focused;
        if (focused) this.element.dataset.focused = "true";
        else delete this.element.dataset.focused;
      }
    }
    rebuildStyle() {
      let style = `transform:translate(${this.lineTransforms.posX.getCurrentPosition().toFixed(2)}px,${this.lineTransforms.posY.getCurrentPosition().toFixed(2)}px);`;
      if (!this.lyricPlayer.getEnableSpring() && this.isInSight) style += `transition-delay:${this.delay}ms;`;
      style += `filter:blur(${Math.min(5, this.blur)}px);`;
      if (style !== this.lastStyle) {
        this.lastStyle = style;
        this.element.setAttribute("style", style);
      }
    }
    getElement() {
      return this.element;
    }
    setTransform(left = this.left, top = this.top, blur = 0, force = false, delay = 0) {
      this.left = left;
      this.top = top;
      this.delay = delay * 1e3 | 0;
      if (force || !this.lyricPlayer.getEnableSpring()) {
        this.blur = Math.min(32, blur);
        if (force) this.element.classList.add(lyric_player_module_default.tmpDisableTransition);
        this.lineTransforms.posX.setPosition(left);
        this.lineTransforms.posY.setPosition(top);
        if (!this.lyricPlayer.getEnableSpring()) this.show();
        else this.rebuildStyle();
        if (force) requestAnimationFrame(() => {
          this.element.classList.remove(lyric_player_module_default.tmpDisableTransition);
        });
      } else {
        this.blur = Math.min(5, blur);
        this.lineTransforms.posX.setTargetPosition(left, delay);
        this.lineTransforms.posY.setTargetPosition(top, delay);
      }
    }
    update(delta = 0) {
      if (!this.lyricPlayer.getEnableSpring()) return;
      this.lineTransforms.posX.update(delta);
      this.lineTransforms.posY.update(delta);
      if (this.isInSight) this.show();
      else this.hide();
    }
    get isInSight() {
      const l2 = this.lineTransforms.posX.getCurrentPosition();
      const t3 = this.lineTransforms.posY.getCurrentPosition();
      const r2 = l2 + this.lineSize[0];
      const b2 = t3 + this.lineSize[1];
      const pr = this.lyricPlayer.size[0];
      const pb = this.lyricPlayer.size[1];
      return !(l2 > pr || t3 > pb || r2 < 0 || b2 < 0);
    }
    dispose() {
      this.element.remove();
    }
  };
  var MaskObsceneWordsMode = {
    /** 禁用任何不雅用语掩码 */
    Disabled: "",
    /** 完全掩码所有不雅用语 */
    FullMask: "full-mask",
    /** 保留首尾字符，屏蔽中间字符 */
    PartialMask: "partial-mask"
  };
  var LyricLineRenderMode = {
    SOLID: 0,
    GRADIENT: 1
  };
  var LayoutAlignAnchor = {
    Top: "top",
    Center: "center",
    Bottom: "bottom"
  };
  function computeCurrentInterlude(input) {
    const currentTime = input.currentTime + 20;
    const currentIndex = input.scrollToIndex;
    const groups = input.currentGroups;
    const checkGap = (k2) => {
      if (k2 < -1 || k2 >= groups.length - 1) return void 0;
      const prevGroup = k2 === -1 ? null : groups[k2];
      const nextGroup = groups[k2 + 1];
      const gapStart = prevGroup ? prevGroup.endTime : 0;
      const gapEnd = Math.max(gapStart, nextGroup.startTime - 250);
      if (gapEnd - gapStart < 4e3) return void 0;
      if (gapEnd > currentTime && gapStart < currentTime) return {
        startTime: Math.max(gapStart, currentTime),
        endTime: gapEnd,
        anchorLineIndex: k2,
        isNextDuet: nextGroup.mainLine.getLine().isDuet
      };
    };
    return checkGap(currentIndex - 1) || checkGap(currentIndex) || checkGap(currentIndex + 1);
  }
  function computeLinePosYSpringParams(input) {
    const { enabled, currentGroups, scrollToIndex, isSeeking, isInterludeActive } = input;
    if (!enabled || currentGroups.length === 0) return { shouldUpdate: false };
    if (isSeeking || isInterludeActive) return {
      shouldUpdate: true,
      params: {
        stiffness: 90,
        damping: 15
      }
    };
    const currentGroup = currentGroups[scrollToIndex];
    const prevGroup = currentGroups[scrollToIndex - 1];
    if (!currentGroup || !prevGroup) return { shouldUpdate: false };
    const interval = currentGroup.startTime - prevGroup.startTime;
    const MIN_INTERVAL = 100;
    const MAX_INTERVAL = 800;
    const clampedInterval = clamp(interval, MIN_INTERVAL, MAX_INTERVAL);
    const MAX_STIFFNESS = 220;
    const MIN_STIFFNESS = 170;
    let ratio = 1 - (clampedInterval - MIN_INTERVAL) / (MAX_INTERVAL - MIN_INTERVAL);
    ratio = ratio ** 0.2;
    const targetStiffness = MIN_STIFFNESS + ratio * (MAX_STIFFNESS - MIN_STIFFNESS);
    return {
      shouldUpdate: true,
      params: {
        stiffness: targetStiffness,
        damping: Math.sqrt(targetStiffness) * 2.2
      }
    };
  }
  function computeGroupPresentation(input) {
    const { groupIndex, scrollToIndex, latestIndex, hasBuffered, hidePassedLines, isPlaying, isNonDynamic, enableBlur, isUserScrolling, isCompact, interlude } = input;
    const isActive = hasBuffered || groupIndex >= scrollToIndex && groupIndex < latestIndex;
    const blurLevel = computeLineBlur({
      enableBlur,
      isUserScrolling,
      isActive,
      itemIndex: groupIndex,
      scrollToIndex,
      latestIndex,
      isCompact
    });
    let targetOpacity;
    if (hidePassedLines) if (groupIndex < (interlude ? interlude.anchorLineIndex + 1 : scrollToIndex) && isPlaying) targetOpacity = 1e-4;
    else if (hasBuffered) targetOpacity = 0.85;
    else targetOpacity = isNonDynamic ? 0.2 : 1;
    else if (hasBuffered) targetOpacity = 0.85;
    else targetOpacity = isNonDynamic ? 0.2 : 1;
    return {
      isActive,
      targetOpacity,
      blurLevel
    };
  }
  function computeLineBlur(input) {
    const { enableBlur, isUserScrolling, isActive, itemIndex, scrollToIndex, latestIndex, isCompact } = input;
    if (!enableBlur || isUserScrolling || isActive) return 0;
    let blurLevel = 1;
    if (itemIndex < scrollToIndex) blurLevel += Math.abs(scrollToIndex - itemIndex) + 1;
    else blurLevel += Math.abs(itemIndex - Math.max(scrollToIndex, latestIndex));
    return isCompact ? blurLevel * 0.8 : blurLevel;
  }
  function clampPlayerScrollOffset(scrollState) {
    scrollState.scrollOffset = clamp(scrollState.scrollOffset, scrollState.scrollBoundary.minOffset, scrollState.scrollBoundary.maxOffset);
  }
  function resetPlayerScrollState(scrollState) {
    scrollState.isScrolled = false;
    scrollState.scrollOffset = 0;
    scrollState.isUserScrolling = false;
  }
  function attachPlayerScrollHandlers(element, scrollState, callbacks) {
    let startScrollY = 0;
    let startTouchPosY = 0;
    let startTouchStartX = 0;
    let startTouchStartY = 0;
    let lastMoveY = 0;
    let startScrollTime = 0;
    let scrollSpeed = 0;
    let curScrollId = 0;
    element.addEventListener("touchstart", (evt) => {
      if (callbacks.onBeginScroll()) {
        scrollState.isUserScrolling = true;
        evt.preventDefault();
        startScrollY = scrollState.scrollOffset;
        startTouchPosY = evt.touches[0].screenY;
        lastMoveY = startTouchPosY;
        startTouchStartX = evt.touches[0].screenX;
        startTouchStartY = evt.touches[0].screenY;
        startScrollTime = Date.now();
        scrollSpeed = 0;
        callbacks.onLayout(true, true);
      }
    });
    element.addEventListener("touchmove", (evt) => {
      if (callbacks.onBeginScroll()) {
        evt.preventDefault();
        const currentY = evt.touches[0].screenY;
        const deltaY = currentY - startTouchPosY;
        scrollState.scrollOffset = startScrollY - deltaY;
        clampPlayerScrollOffset(scrollState);
        const now = Date.now();
        const dt = now - startScrollTime;
        if (dt > 0) scrollSpeed = (currentY - lastMoveY) / dt;
        lastMoveY = currentY;
        startScrollTime = now;
        callbacks.onLayout(true, true);
      }
    });
    element.addEventListener("touchend", (evt) => {
      if (callbacks.onBeginScroll()) {
        evt.preventDefault();
        const touch = evt.changedTouches[0];
        const moveX = Math.abs(touch.screenX - startTouchStartX);
        const moveY = Math.abs(touch.screenY - startTouchStartY);
        if (moveX < 10 && moveY < 10) {
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          if (target instanceof HTMLElement && callbacks.containsTarget(target)) callbacks.clickTarget(target);
          scrollState.isUserScrolling = false;
          callbacks.onEndScroll();
          return;
        }
        startTouchPosY = 0;
        const scrollId = ++curScrollId;
        if (Math.abs(scrollSpeed) < 0.1) scrollSpeed = 0;
        let lastFrameTime = performance.now();
        const onScrollFrame = (time) => {
          if (scrollId !== curScrollId) return;
          const dt = time - lastFrameTime;
          lastFrameTime = time;
          if (dt <= 0 || dt > 100) {
            requestAnimationFrame(onScrollFrame);
            return;
          }
          if (Math.abs(scrollSpeed) > 0.05) {
            scrollState.scrollOffset -= scrollSpeed * dt;
            clampPlayerScrollOffset(scrollState);
            const frictionFactor = 0.95 ** (dt / 16);
            scrollSpeed *= frictionFactor;
            callbacks.onLayout(true, true);
            requestAnimationFrame(onScrollFrame);
          } else {
            scrollState.isUserScrolling = false;
            callbacks.onEndScroll();
          }
        };
        requestAnimationFrame(onScrollFrame);
      } else scrollState.isUserScrolling = false;
    });
    element.addEventListener("wheel", (evt) => {
      if (callbacks.onBeginScroll()) {
        evt.preventDefault();
        if (evt.deltaMode === evt.DOM_DELTA_PIXEL) {
          scrollState.scrollOffset += evt.deltaY;
          clampPlayerScrollOffset(scrollState);
          callbacks.onLayout(true, false);
        } else {
          scrollState.scrollOffset += evt.deltaY * 50;
          clampPlayerScrollOffset(scrollState);
          callbacks.onLayout(false, false);
        }
      }
    }, { passive: false });
  }
  var eqSet = (xs, ys) => xs.size === ys.size && [...xs].every((x2) => ys.has(x2));
  function computePlayerTimeState(input) {
    const { time, currentGroups, timelineState: { hotGroups, bufferedGroups } } = input;
    const nextHotGroups = new Set(hotGroups);
    const addedIds = /* @__PURE__ */ new Set();
    const removedHotIds = /* @__PURE__ */ new Set();
    const removedBufferedIds = /* @__PURE__ */ new Set();
    for (const lastHotId of hotGroups) {
      const group = currentGroups[lastHotId];
      if (!group || time < group.startTime || group.endTime <= time) {
        nextHotGroups.delete(lastHotId);
        removedHotIds.add(lastHotId);
      }
    }
    for (let id = 0; id < currentGroups.length; id++) {
      const group = currentGroups[id];
      if (!group) continue;
      if (group.startTime <= time && group.endTime > time && !nextHotGroups.has(id)) {
        nextHotGroups.add(id);
        addedIds.add(id);
      }
    }
    for (const id of bufferedGroups) if (!nextHotGroups.has(id)) removedBufferedIds.add(id);
    return {
      nextHotGroups,
      addedIds,
      removedHotIds,
      removedBufferedIds
    };
  }
  function pickScrollToIndexForSeek(time, currentGroups, bufferedGroups) {
    if (bufferedGroups.size > 0) return Math.min(...bufferedGroups);
    const foundIndex = currentGroups.findIndex((group) => group.startTime >= time);
    return foundIndex === -1 ? currentGroups.length : foundIndex;
  }
  function commitPlayerTimeState(input) {
    const { timelineState, time, currentGroups, hasBottomContent, stateResult } = input;
    const { addedIds, removedHotIds, removedBufferedIds } = stateResult;
    const { isSeeking } = timelineState;
    timelineState.currentTime = time;
    timelineState.hotGroups = stateResult.nextHotGroups;
    let shouldLayout = false;
    let shouldResetScroll = false;
    const groupsToEnable = [];
    const groupsToDisable = /* @__PURE__ */ new Set();
    if (isSeeking) {
      timelineState.bufferedGroups = /* @__PURE__ */ new Set([...timelineState.hotGroups]);
      timelineState.scrollToIndex = pickScrollToIndexForSeek(time, currentGroups, timelineState.bufferedGroups);
      for (const id of removedHotIds) groupsToDisable.add(id);
      for (const id of timelineState.hotGroups) groupsToEnable.push(id);
      for (const id of removedBufferedIds) groupsToDisable.add(id);
      shouldResetScroll = true;
      shouldLayout = true;
    } else if (addedIds.size > 0) {
      for (const id of addedIds) {
        timelineState.bufferedGroups.add(id);
        groupsToEnable.push(id);
      }
      for (const id of removedBufferedIds) {
        timelineState.bufferedGroups.delete(id);
        groupsToDisable.add(id);
      }
      if (timelineState.bufferedGroups.size > 0) timelineState.scrollToIndex = Math.min(...timelineState.bufferedGroups);
      shouldLayout = true;
    } else if (removedBufferedIds.size > 0 && eqSet(removedBufferedIds, timelineState.bufferedGroups)) {
      for (const id of timelineState.bufferedGroups) {
        if (timelineState.hotGroups.has(id)) continue;
        timelineState.bufferedGroups.delete(id);
        groupsToDisable.add(id);
      }
      shouldLayout = true;
    }
    if (timelineState.bufferedGroups.size === 0 && currentGroups.length > 0) {
      if (time >= currentGroups[currentGroups.length - 1].endTime) {
        const targetIndex = hasBottomContent ? currentGroups.length : currentGroups.length - 1;
        if (timelineState.scrollToIndex !== targetIndex) {
          timelineState.scrollToIndex = targetIndex;
          shouldLayout = true;
        }
      }
    }
    timelineState.lastCurrentTime = time;
    return {
      shouldLayout,
      shouldResetScroll,
      groupsToEnable,
      groupsToDisable: [...groupsToDisable]
    };
  }
  var LyricPlayerBase = class extends EventTarget {
    element = document.createElement("div");
    /** 播放时间线状态 */
    timelineState = {
      currentTime: 0,
      lastCurrentTime: 0,
      hotGroups: /* @__PURE__ */ new Set(),
      bufferedGroups: /* @__PURE__ */ new Set(),
      scrollToIndex: 0,
      isSeeking: false,
      isPlaying: true,
      initialLayoutFinished: false
    };
    /** @internal */
    lyricGroupElementMap = /* @__PURE__ */ new WeakMap();
    currentLyricLines = [];
    processedLines = [];
    lyricLinesIndexes = /* @__PURE__ */ new WeakMap();
    isNonDynamic = false;
    hasDuetLine = false;
    disableSpring = false;
    layoutState = {
      interludeDotsSize: [0, 0],
      targetAlignIndex: 0,
      lastInterludeState: false,
      alignAnchor: LayoutAlignAnchor.Center,
      alignPosition: 0.35,
      overscanPx: 300
    };
    interludeDots = new InterludeDots();
    bottomLine = new BottomLineEl(this);
    enableBlur = true;
    enableScale = true;
    maskObsceneWords = MaskObsceneWordsMode.Disabled;
    maskObsceneWordChar = "*";
    hidePassedLines = false;
    scrollState = {
      scrollBoundary: {
        minOffset: 0,
        maxOffset: 0
      },
      scrollOffset: 0,
      allowScroll: true,
      isScrolled: false,
      isUserScrolling: false
    };
    currentLyricGroups = [];
    lyricGroupSize = /* @__PURE__ */ new WeakMap();
    size = [0, 0];
    isPageVisible = true;
    optimizeOptions = {};
    /** 是否强制让背景人声行始终后置（即始终在主歌词下方显示，不前置背景人声） */
    alwaysPostpositionBackground = false;
    posXSpringParams = {
      mass: 1,
      damping: 10,
      stiffness: 100
    };
    posYSpringParams = {
      mass: 0.9,
      damping: 15,
      stiffness: 90
    };
    scaleSpringParams = {
      mass: 2,
      damping: 25,
      stiffness: 100
    };
    scaleForBGSpringParams = {
      mass: 1,
      damping: 20,
      stiffness: 50
    };
    onPageShow = () => {
      this.isPageVisible = true;
      this.setCurrentTime(this.timelineState.currentTime, true);
    };
    onPageHide = () => {
      this.isPageVisible = false;
    };
    scrolledHandler;
    /** @internal */
    resizeObserver = new ResizeObserver(((entries) => {
      let shouldRelayout = false;
      let shouldRebuildPlayerStyle = false;
      for (const entry of entries) if (entry.target === this.element) {
        const rect = entry.contentRect;
        this.size[0] = rect.width;
        this.size[1] = rect.height;
        shouldRebuildPlayerStyle = true;
      } else if (entry.target === this.interludeDots.getElement()) {
        this.layoutState.interludeDotsSize[0] = entry.target.clientWidth;
        this.layoutState.interludeDotsSize[1] = entry.target.clientHeight;
        shouldRelayout = true;
      } else if (entry.target === this.bottomLine.getElement()) {
        const newSize = [entry.target.clientWidth, entry.target.clientHeight];
        const oldSize = this.bottomLine.lineSize;
        if (newSize[0] !== oldSize[0] || newSize[1] !== oldSize[1]) {
          this.bottomLine.lineSize = newSize;
          shouldRelayout = true;
        }
      } else {
        const groupObj = this.lyricGroupElementMap.get(entry.target);
        if (groupObj) {
          const newSize = [entry.target.clientWidth, entry.target.clientHeight];
          const oldSize = this.lyricGroupSize.get(groupObj) ?? [0, 0];
          if (newSize[0] !== oldSize[0] || newSize[1] !== oldSize[1]) {
            this.lyricGroupSize.set(groupObj, newSize);
            groupObj.onLineSizeChange(newSize);
            shouldRelayout = true;
          }
        }
      }
      if (shouldRelayout) this.calcLayout(true);
      if (shouldRebuildPlayerStyle) this.onResize();
    }));
    wordFadeWidth = 0.5;
    constructor(element) {
      super();
      if (element) this.element = element;
      this.element.classList.add("amll-lyric-player");
      this.resizeObserver.observe(this.element);
      this.resizeObserver.observe(this.interludeDots.getElement());
      this.element.appendChild(this.interludeDots.getElement());
      this.element.appendChild(this.bottomLine.getElement());
      this.interludeDots.setTransform(0, 200);
      window.addEventListener("pageshow", this.onPageShow);
      window.addEventListener("pagehide", this.onPageHide);
      attachPlayerScrollHandlers(this.element, this.scrollState, {
        onBeginScroll: () => this.beginScrollHandler(),
        onEndScroll: () => this.endScrollHandler(),
        onLayout: (sync, force) => this.calcLayout(sync, force),
        containsTarget: (target) => this.element.contains(target),
        clickTarget: (target) => target.click()
      });
    }
    beginScrollHandler() {
      const allowed = this.scrollState.allowScroll;
      if (allowed) {
        this.scrollState.isScrolled = true;
        clearTimeout(this.scrolledHandler);
        this.scrolledHandler = setTimeout(() => {
          this.scrollState.isScrolled = false;
          this.scrollState.scrollOffset = 0;
        }, 5e3);
      }
      return allowed;
    }
    endScrollHandler() {
    }
    /**
    * 设置文字动画的渐变宽度，单位以歌词行的主文字字体大小的倍数为单位，默认为 0.5，即一个全角字符的一半宽度
    *
    * 如果要模拟 Apple Music for Android 的效果，可以设置为 1
    *
    * 如果要模拟 Apple Music for iPad 的效果，可以设置为 0.5
    *
    * 如果想要近乎禁用渐变效果，可以设置成非常接近 0 的小数（例如 `0.0001` ），但是**不可以为 0**
    *
    * @param value 需要设置的渐变宽度，单位以歌词行的主文字字体大小的倍数为单位，默认为 0.5
    */
    setWordFadeWidth(value = 0.5) {
      this.wordFadeWidth = Math.max(1e-4, value);
    }
    /**
    * 是否启用歌词行缩放效果，默认启用
    *
    * 如果启用，非选中的歌词行会轻微缩小以凸显当前播放歌词行效果
    *
    * 此效果对性能影响微乎其微，推荐启用
    * @param enable 是否启用歌词行缩放效果
    */
    setEnableScale(enable = true) {
      this.enableScale = enable;
      this.calcLayout();
    }
    /**
    * 获取当前是否启用了歌词行缩放效果
    * @returns 是否启用歌词行缩放效果
    */
    getEnableScale() {
      return this.enableScale;
    }
    /**
    * 获取当前文字动画的渐变宽度，单位以歌词行的主文字字体大小的倍数为单位
    * @returns 当前文字动画的渐变宽度，单位以歌词行的主文字字体大小的倍数为单位
    */
    getWordFadeWidth() {
      return this.wordFadeWidth;
    }
    setIsSeeking(isSeeking) {
      this.timelineState.isSeeking = isSeeking;
    }
    /**
    * 设置是否隐藏已经播放过的歌词行，默认不隐藏
    * @param hide 是否隐藏已经播放过的歌词行，默认不隐藏
    */
    setHidePassedLines(hide) {
      this.hidePassedLines = hide;
      this.calcLayout();
    }
    /**
    * 设置是否启用歌词行的模糊效果
    * @param enable 是否启用
    */
    setEnableBlur(enable) {
      if (this.enableBlur === enable) return;
      this.enableBlur = enable;
      this.calcLayout();
    }
    /**
    * 设置歌词中不雅用语的掩码模式
    * @param mode 掩码模式
    * @see {@link MaskObsceneWordsMode}
    */
    setMaskObsceneWords(mode) {
      if (this.maskObsceneWords === mode) return;
      this.maskObsceneWords = mode;
      this.rebuildLyricLines();
      this.calcLayout();
    }
    /**
    * 设置不雅用语掩码使用的字符，默认为 `*`
    * @param char 单个字符，用于替换不雅用语中的字符
    */
    setMaskObsceneWordChar(char) {
      const c2 = char.charAt(0) || "*";
      if (this.maskObsceneWordChar === c2) return;
      this.maskObsceneWordChar = c2;
      if (this.maskObsceneWords !== MaskObsceneWordsMode.Disabled) {
        this.rebuildLyricLines();
        this.calcLayout();
      }
    }
    rebuildLyricLines() {
      for (const group of this.currentLyricGroups) group.rebuildAllLines();
    }
    /**
    * 根据当前配置处理不雅用语单词
    * @param word 单词对象
    * @internal
    */
    processObsceneWord(word) {
      const text = word.word;
      if (!word.obscene || this.maskObsceneWords === MaskObsceneWordsMode.Disabled) return text;
      const maskChar = this.maskObsceneWordChar;
      if (this.maskObsceneWords === MaskObsceneWordsMode.FullMask) return text.replace(/\S/g, maskChar);
      if (this.maskObsceneWords === MaskObsceneWordsMode.PartialMask) {
        const trimmed = text.trim();
        if (trimmed.length <= 2) return text.replace(/\S/g, maskChar);
        const startPos = text.indexOf(trimmed);
        const endPos = startPos + trimmed.length - 1;
        return text.slice(0, startPos + 1) + text.slice(startPos + 1, endPos).replace(/\S/g, maskChar) + text.slice(endPos);
      }
      return text;
    }
    /**
    * 设置目标歌词行的对齐方式，默认为 `center`
    *
    * - 设置成 `top` 的话将会向目标歌词行的顶部对齐
    * - 设置成 `bottom` 的话将会向目标歌词行的底部对齐
    * - 设置成 `center` 的话将会向目标歌词行的垂直中心对齐
    * @param alignAnchor 歌词行对齐方式，详情见函数说明
    */
    setAlignAnchor(alignAnchor) {
      this.layoutState.alignAnchor = alignAnchor;
    }
    /**
    * 设置默认的歌词行对齐位置，相对于整个歌词播放组件的大小位置，默认为 `0.5`
    * @param alignPosition 一个 `[0.0-1.0]` 之间的任意数字，代表组件高度由上到下的比例位置
    */
    setAlignPosition(alignPosition) {
      this.layoutState.alignPosition = alignPosition;
    }
    /**
    * 设置 overscan（视图上下额外缓冲渲染区）距离，单位：像素。
    * @param px 像素值，默认 300
    */
    setOverscanPx(px) {
      this.layoutState.overscanPx = clampPositive(px | 0);
    }
    /** 获取当前 overscan 像素距离 */
    getOverscanPx() {
      return this.layoutState.overscanPx;
    }
    /**
    * 设置是否使用物理弹簧算法实现歌词动画效果，默认启用
    *
    * 如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行
    *
    * 如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一
    */
    setEnableSpring(enable = true) {
      this.disableSpring = !enable;
      if (enable) this.element.classList.remove(lyric_player_module_default.disableSpring);
      else this.element.classList.add(lyric_player_module_default.disableSpring);
      this.calcLayout(true);
    }
    /**
    * 获取当前是否启用了物理弹簧
    * @returns 是否启用物理弹簧
    */
    getEnableSpring() {
      return !this.disableSpring;
    }
    /**
    * 设置歌词的优化配置项，这些配置项默认全部开启
    *
    * 注意，如果在 `setLyricLines` 之后修改此配置，需要重新调用 `setLyricLines()` 才能对当前歌词生效
    * @param options 优化配置选项
    * @see {@link OptimizeLyricOptions}
    */
    setOptimizeOptions(options) {
      this.optimizeOptions = {
        ...this.optimizeOptions,
        ...options
      };
    }
    /**
    * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
    * @param lines 歌词数组
    * @param initialTime 初始时间，默认为 0
    */
    setLyricLines(lines, initialTime = 0) {
      if (true) console.log("\u8BBE\u7F6E\u6B4C\u8BCD\u884C", lines, initialTime);
      this.timelineState.initialLayoutFinished = true;
      this.timelineState.lastCurrentTime = initialTime;
      this.timelineState.currentTime = initialTime;
      this.currentLyricLines = esm_default(lines);
      this.processedLines = esm_default(this.currentLyricLines);
      optimizeLyricLines(this.processedLines, this.optimizeOptions);
      this.isNonDynamic = true;
      for (const line of this.processedLines) if (line.words.length > 1) {
        this.isNonDynamic = false;
        break;
      }
      this.hasDuetLine = this.processedLines.some((line) => line.isDuet);
      for (const group of this.currentLyricGroups) group.dispose();
      this.currentLyricGroups = [];
      this.interludeDots.setInterlude(void 0);
      this.timelineState.hotGroups.clear();
      this.timelineState.bufferedGroups.clear();
      if (true) console.log("\u6B4C\u8BCD\u5904\u7406\u5B8C\u6210", this);
    }
    /**
    * 获取当前是否在播放
    * @returns 当前是否在播放
    */
    getIsPlaying() {
      return this.timelineState.isPlaying;
    }
    /**
    * 设置当前播放进度，此时将会更新内部的歌词进度信息。
    *
    * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好。
    * 调用完成后，应每帧调用 {@link update} 方法来执行歌词动画效果。**此函数本身不会触发动画效果**。
    *
    * @param time 当前播放进度，单位为毫秒
    */
    setCurrentTime(time, isSeek = false) {
      time = Math.round(time);
      const { timelineState } = this;
      timelineState.isSeeking = Boolean(isSeek);
      timelineState.currentTime = time;
      if (!timelineState.initialLayoutFinished && !timelineState.isSeeking) return;
      const stateResult = computePlayerTimeState({
        time,
        currentGroups: this.currentLyricGroups,
        timelineState
      });
      const hasBottomContent = this.bottomLine.getElement().innerHTML.trim().length > 0;
      const commitResult = commitPlayerTimeState({
        timelineState,
        time,
        currentGroups: this.currentLyricGroups,
        hasBottomContent,
        stateResult
      });
      for (const id of commitResult.groupsToDisable) this.currentLyricGroups[id]?.disable();
      for (const id of commitResult.groupsToEnable) this.currentLyricGroups[id]?.enable();
      if (commitResult.shouldResetScroll) this.resetScroll();
      if (commitResult.shouldLayout) this.calcLayout();
    }
    /**
    * 重新布局定位歌词行的位置，调用完成后再逐帧调用 `update`
    * 函数即可让歌词通过动画移动到目标位置。
    *
    * 函数有一个 `force` 参数，用于指定是否强制修改布局，也就是不经过动画直接调整元素位置和大小。
    *
    * 此函数还有一个 `reflow` 参数，用于指定是否需要重新计算布局
    *
    * 因为计算布局必定会导致浏览器重排布局，所以会大幅度影响流畅度和性能，故请只在以下情况下将其​设置为 true：
    *
    * 1. 歌词页面大小发生改变时（这个组件会自行处理）
    * 2. 加载了新的歌词时（不论前后歌词是否完全一样）
    * 3. 用户自行跳转了歌曲播放位置（不论距离远近）
    *
    * @param sync 是否同步执行，通常用于初始化或 Resize 时立即布局
    * @param force 是否绕过弹簧效果强制更新位置
    */
    async calcLayout(sync = false, force = false) {
      const interlude = computeCurrentInterlude({
        currentTime: this.timelineState.currentTime,
        scrollToIndex: this.timelineState.scrollToIndex,
        currentGroups: this.currentLyricGroups
      });
      const isInterludeActive = !!interlude;
      if (this.layoutState.targetAlignIndex !== this.timelineState.scrollToIndex || this.layoutState.lastInterludeState !== isInterludeActive) {
        this.layoutState.lastInterludeState = isInterludeActive;
        const springParams = computeLinePosYSpringParams({
          enabled: this.getEnableSpring(),
          currentGroups: this.currentLyricGroups,
          scrollToIndex: this.timelineState.scrollToIndex,
          isSeeking: this.timelineState.isSeeking,
          isInterludeActive
        });
        if (springParams.shouldUpdate && springParams.params) this.setLinePosYSpringParams(springParams.params);
      }
      let curPos = -this.scrollState.scrollOffset;
      const targetAlignIndex = this.timelineState.scrollToIndex;
      let isNextDuet = false;
      if (interlude) isNextDuet = interlude.isNextDuet;
      else this.interludeDots.setInterlude(void 0);
      const dotMargin = (this.baseFontSize || 24) * 0.4;
      const totalInterludeHeight = this.layoutState.interludeDotsSize[1] + dotMargin * 2;
      if (interlude) {
        if (interlude.anchorLineIndex !== -1) curPos -= totalInterludeHeight;
      }
      const LINE_HEIGHT_FALLBACK = this.size[1] / 5;
      const scrollOffset = this.currentLyricGroups.slice(0, targetAlignIndex).reduce((acc, group) => acc + (this.lyricGroupSize.get(group)?.[1] ?? LINE_HEIGHT_FALLBACK), 0);
      this.scrollState.scrollBoundary.minOffset = -scrollOffset;
      curPos -= scrollOffset;
      curPos += this.size[1] * this.layoutState.alignPosition;
      const curGroup = this.currentLyricGroups[targetAlignIndex];
      this.layoutState.targetAlignIndex = targetAlignIndex;
      const isBottomFocused = targetAlignIndex === this.currentLyricGroups.length;
      this.bottomLine.setFocused(isBottomFocused);
      const targetLineHeight = curGroup ? this.lyricGroupSize.get(curGroup)?.[1] ?? LINE_HEIGHT_FALLBACK : isBottomFocused ? this.bottomLine.lineSize[1] : 0;
      if (targetLineHeight > 0) switch (this.layoutState.alignAnchor) {
        case LayoutAlignAnchor.Bottom:
          curPos -= targetLineHeight;
          break;
        case LayoutAlignAnchor.Center:
          curPos -= targetLineHeight / 2;
          break;
        case LayoutAlignAnchor.Top:
          break;
      }
      const latestIndex = Math.max(...this.timelineState.bufferedGroups);
      let delay = 0;
      let baseDelay = sync ? 0 : 0.05;
      let setDots = false;
      this.currentLyricGroups.forEach((group, i2) => {
        const hasBuffered = this.timelineState.bufferedGroups.has(i2);
        const shouldShowDots = interlude && i2 === interlude.anchorLineIndex + 1;
        if (!setDots && shouldShowDots) {
          setDots = true;
          curPos += dotMargin;
          let targetX = 0;
          if (interlude && isNextDuet) targetX = this.size[0] - this.layoutState.interludeDotsSize[0];
          this.interludeDots.setTransform(targetX, curPos);
          if (interlude) this.interludeDots.setInterlude([interlude.startTime, interlude.endTime]);
          curPos += this.layoutState.interludeDotsSize[1];
          curPos += dotMargin;
        }
        const presentation = computeGroupPresentation({
          groupIndex: i2,
          scrollToIndex: this.timelineState.scrollToIndex,
          latestIndex,
          hasBuffered,
          hidePassedLines: this.hidePassedLines,
          isPlaying: this.timelineState.isPlaying,
          isNonDynamic: this.isNonDynamic,
          enableBlur: this.enableBlur,
          isUserScrolling: this.scrollState.isUserScrolling,
          isCompact: window.innerWidth <= 1024,
          interlude
        });
        group.setTransform(curPos, force, delay, presentation.isActive, presentation.targetOpacity, presentation.blurLevel);
        curPos += this.lyricGroupSize.get(group)?.[1] ?? LINE_HEIGHT_FALLBACK;
        if (curPos >= 0 && !this.timelineState.isSeeking) {
          delay += baseDelay;
          if (i2 >= this.timelineState.scrollToIndex) baseDelay /= 1.05;
        }
      });
      this.scrollState.scrollBoundary.maxOffset = curPos + this.scrollState.scrollOffset - this.size[1] / 2;
      const bottomIndex = this.currentLyricGroups.length;
      const finalBottomBlur = computeLineBlur({
        enableBlur: this.enableBlur,
        isUserScrolling: this.scrollState.isUserScrolling,
        isActive: isBottomFocused,
        itemIndex: bottomIndex,
        scrollToIndex: this.timelineState.scrollToIndex,
        latestIndex,
        isCompact: window.innerWidth <= 1024
      });
      this.bottomLine.setTransform(0, curPos, finalBottomBlur, force, delay);
    }
    /**
    * 设置所有歌词行在横坐标上的弹簧属性，包括重量、弹力和阻力。
    *
    * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
    * @deprecated 考虑到横向弹簧效果并不常见，所以这个函数将会在未来的版本中移除
    */
    setLinePosXSpringParams(_params = {}) {
    }
    /**
    * 设置所有歌词行在​纵坐标上的弹簧属性，包括重量、弹力和阻力。
    *
    * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
    */
    setLinePosYSpringParams(params = {}) {
      this.posYSpringParams = {
        ...this.posYSpringParams,
        ...params
      };
      this.bottomLine.lineTransforms.posY.updateParams(this.posYSpringParams);
      for (const group of this.currentLyricGroups) {
        group.posY.updateParams(this.posYSpringParams);
        group.bgSlideY.updateParams(this.posYSpringParams);
      }
    }
    /**
    * 设置所有歌词行在​缩放大小上的弹簧属性，包括重量、弹力和阻力。
    *
    * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
    */
    setLineScaleSpringParams(params = {}) {
      this.scaleSpringParams = {
        ...this.scaleSpringParams,
        ...params
      };
      this.scaleForBGSpringParams = {
        ...this.scaleForBGSpringParams,
        ...params
      };
      for (const group of this.currentLyricGroups) {
        group.mainLine.lineTransforms.scale.updateParams(this.scaleSpringParams);
        group.bgLine?.lineTransforms.scale.updateParams(this.scaleForBGSpringParams);
      }
    }
    /**
    * 暂停部分效果演出，目前会暂停播放间奏点的动画，且将背景歌词显示出来
    */
    pause() {
      this.interludeDots.pause();
      if (this.timelineState.isPlaying) {
        this.timelineState.isPlaying = false;
        this.calcLayout();
      }
    }
    /**
    * 恢复部分效果演出，目前会恢复播放间奏点的动画
    */
    resume() {
      this.interludeDots.resume();
      if (!this.timelineState.isPlaying) {
        this.timelineState.isPlaying = true;
        this.calcLayout();
      }
    }
    /**
    * 更新动画，这个函数应该被逐帧调用或者在以下情况下调用一次：
    *
    * 1. 刚刚调用完设置歌词函数的时候
    * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
    */
    update(delta = 0) {
      this.bottomLine.update(delta / 1e3);
      this.interludeDots.update(delta);
    }
    onResize() {
    }
    /**
    * 获取一个特殊的底栏元素，默认是空白的，可以往内部添加任意元素
    *
    * 这个元素始终在歌词的底部，可以用于显示歌曲创作者等信息
    *
    * 但是请勿删除该元素，只能在内部存放元素
    *
    * @returns 一个元素，可以往内部添加任意元素
    */
    getBottomLineElement() {
      return this.bottomLine.getElement();
    }
    /**
    * 重置用户滚动状态
    *
    * 请在用户完成滚动点击跳转歌词时调用本事件再调用 `calcLayout` 以正确滚动到目标位置
    */
    resetScroll() {
      resetPlayerScrollState(this.scrollState);
      clearTimeout(this.scrolledHandler);
    }
    /**
    * 获取当前歌词数组
    *
    * 一般和最后调用 `setLyricLines` 给予的参数一样
    * @returns 当前歌词数组
    */
    getLyricLines() {
      return this.currentLyricLines;
    }
    /**
    * 获取当前歌词的播放位置
    *
    * 一般和最后调用 `setCurrentTime` 给予的参数一样
    * @returns 当前播放位置
    */
    getCurrentTime() {
      return this.timelineState.currentTime;
    }
    /**
    * 设置是否让背景人声行始终后置显示
    *
    * 默认情况下，如果背景歌词开始时间早于主歌词，会在主歌词上方展示；
    * 如果设置为 `true`，则无论时间顺序如何，背景歌词都会始终在主歌词下方展示
    * @param enable 是否启用始终后置
    */
    setAlwaysPostpositionBackground(enable) {
      if (this.alwaysPostpositionBackground === enable) return;
      this.alwaysPostpositionBackground = enable;
      this.rebuildLyricLines();
      this.calcLayout();
    }
    /** 获取当前是否设置了让背景人声行始终后置显示 */
    getAlwaysPostpositionBackground() {
      return this.alwaysPostpositionBackground;
    }
    getElement() {
      return this.element;
    }
    dispose() {
      this.element.remove();
      window.removeEventListener("pageshow", this.onPageShow);
      window.removeEventListener("pagehide", this.onPageHide);
    }
  };
  var LyricLineGroupBase = class {
    mainLine;
    bgLine;
    posY = new Spring(0);
    bgSlideY = new Spring(-80);
    top = 0;
    delay = 0;
    isActive = false;
    opacity = 1;
    blur = 0;
    isBgFirst = false;
    constructor(mainLine, bgLine) {
      this.mainLine = mainLine;
      this.bgLine = bgLine;
    }
    get startTime() {
      return this.mainLine.getLine().startTime;
    }
    get endTime() {
      return this.mainLine.getLine().endTime;
    }
    onLineSizeChange(size) {
      this.mainLine.onLineSizeChange(size);
      this.bgLine?.onLineSizeChange(size);
    }
    setTransform(top, force, delay, isActive, opacity, blur) {
      this.top = top;
      this.delay = delay;
      this.isActive = isActive;
      this.opacity = opacity;
      this.blur = blur;
      this.setLineTransformations(force, delay);
      const enableSpring = this.lyricPlayer.getEnableSpring();
      const hiddenSlideY = (this.lyricPlayer.getAlwaysPostpositionBackground() ? false : this.isBgFirst) ? 80 : -80;
      const isPlaying = this.lyricPlayer.getIsPlaying();
      const targetBgSlideY = isActive || !isPlaying ? 0 : hiddenSlideY;
      if (force || !enableSpring) {
        this.posY.setPosition(top);
        this.bgSlideY.setPosition(targetBgSlideY);
        this.renderStyles();
      } else {
        this.posY.setTargetPosition(top, delay);
        this.bgSlideY.setTargetPosition(targetBgSlideY, delay);
      }
    }
    setLineTransformations(force, delay) {
      const enableScale = this.lyricPlayer.getEnableScale();
      const isPlaying = this.lyricPlayer.getIsPlaying();
      const renderMode = this.isActive ? LyricLineRenderMode.GRADIENT : LyricLineRenderMode.SOLID;
      const SCALE_ASPECT = enableScale ? 97 : 100;
      let mainScale = 100;
      if (!this.isActive && isPlaying) mainScale = SCALE_ASPECT;
      this.mainLine.setTransform(mainScale, 1, 0, force, delay, renderMode);
      let bgScale = 100;
      if (!this.isActive && isPlaying) bgScale = 75;
      this.bgLine?.setTransform(bgScale, 1, 0, force, delay, renderMode);
    }
    update(delta) {
      if (this.lyricPlayer.getEnableSpring()) {
        this.posY.update(delta);
        this.bgSlideY.update(delta);
        this.renderStyles();
      }
      this.mainLine.update(delta);
      this.bgLine?.update(delta);
    }
    rebuildAllLines() {
      this.mainLine.rebuildElement();
      this.bgLine?.rebuildElement();
    }
    enable(time, shouldPlay) {
      this.mainLine.enable(time, shouldPlay);
      this.bgLine?.enable(time, shouldPlay);
    }
    disable() {
      this.mainLine.disable();
      this.bgLine?.disable();
    }
    dispose() {
      this.mainLine.dispose();
      this.bgLine?.dispose();
    }
  };
  var LyricLineGroup = class extends LyricLineGroupBase {
    lyricPlayer;
    element;
    bgWrapper;
    lastIsActive;
    constructor(lyricPlayer, mainLine) {
      super(mainLine);
      this.lyricPlayer = lyricPlayer;
      this.element = document.createElement("div");
      this.element.className = lyric_player_module_default.lyricLineWrapper;
      this.element.appendChild(mainLine.getElement());
      this.posY.setPosition(window.innerHeight * 2);
      lyricPlayer.resizeObserver.observe(this.element);
    }
    get isInSight() {
      const t3 = this.posY.getCurrentPosition();
      let h2 = this.lyricPlayer.lyricGroupSize?.get(this)?.[1];
      if (h2 === void 0 || h2 === 0) h2 = this.element.clientHeight || 0;
      const pb = this.lyricPlayer.size[1];
      const ov = this.lyricPlayer.getOverscanPx();
      return !(t3 > pb + h2 + ov || t3 < -h2 - ov);
    }
    show() {
      if (!this.element.parentElement) {
        const playerEl = this.lyricPlayer.getElement();
        const groups = this.lyricPlayer.currentLyricGroups;
        const myIndex = groups.indexOf(this);
        let referenceNode = null;
        if (myIndex !== -1) {
          for (let i2 = myIndex + 1; i2 < groups.length; i2++) if (groups[i2].element.parentElement === playerEl) {
            referenceNode = groups[i2].element;
            break;
          }
        }
        playerEl.insertBefore(this.element, referenceNode);
        this.lyricPlayer.resizeObserver.observe(this.element);
      }
      this.mainLine.show();
      this.bgLine?.show();
    }
    hide() {
      if (this.element.parentElement) {
        this.lyricPlayer.resizeObserver.unobserve(this.element);
        this.element.remove();
        this.mainLine.teardownContent();
        this.bgLine?.teardownContent();
      }
    }
    update(delta) {
      if (this.isInSight) this.show();
      else this.hide();
      super.update(delta);
    }
    addBgLine(bgLine) {
      if (this.bgLine) this.bgLine.dispose();
      if (this.bgWrapper) this.bgWrapper.remove();
      this.bgLine = bgLine;
      const bgStartTime = bgLine.getLine().words[0]?.startTime ?? bgLine.getLine().startTime;
      const mainStartTime = this.mainLine.getLine().words[0]?.startTime ?? this.mainLine.getLine().startTime;
      this.isBgFirst = bgStartTime < mainStartTime;
      if (this.mainLine.getLine().isDuet) bgLine.getElement().classList.add(lyric_player_module_default.lyricDuetLine);
      this.bgWrapper = document.createElement("div");
      this.bgWrapper.className = lyric_player_module_default.bgWrapper;
      this.bgWrapper.appendChild(bgLine.getElement());
      if (!this.lyricPlayer.getAlwaysPostpositionBackground() && this.isBgFirst) {
        this.bgWrapper.classList.add(lyric_player_module_default.bgWrapperTop);
        this.element.insertBefore(this.bgWrapper, this.mainLine.getElement());
        this.bgSlideY.setPosition(80);
      } else this.element.appendChild(this.bgWrapper);
    }
    renderStyles() {
      const y2 = this.posY.getCurrentPosition().toFixed(1);
      this.element.style.transform = `translateY(${y2}px)`;
      this.element.style.opacity = this.opacity.toString();
      this.element.style.filter = `blur(${Math.min(5, this.blur)}px)`;
      if (!this.lyricPlayer.getEnableSpring()) this.element.style.transitionDelay = `${this.delay}ms`;
      if (this.bgWrapper) {
        if (this.lastIsActive !== this.isActive) {
          this.lastIsActive = this.isActive;
          this.bgWrapper.classList.toggle(lyric_player_module_default.bgWrapperActive, this.isActive);
        }
        const slideY = this.bgSlideY.getCurrentPosition();
        const slideYStr = slideY.toFixed(1);
        const activeProgress = clamp01(1 - Math.abs(slideY) / 80);
        const scaleStr = (0.8 + activeProgress * 0.2).toFixed(3);
        this.bgWrapper.style.transform = `translateY(${slideYStr}%) scale(${scaleStr})`;
        const shouldBgFirst = !this.lyricPlayer.getAlwaysPostpositionBackground() && this.isBgFirst;
        if (shouldBgFirst) {
          const currentMarginTop = -(this.bgWrapper.clientHeight || 0) * (1 - activeProgress);
          this.bgWrapper.style.marginTop = `${currentMarginTop.toFixed(1)}px`;
        } else this.bgWrapper.style.marginTop = "";
        const isHidden = slideYStr === (shouldBgFirst ? "80.0" : "-80.0") && !this.isActive;
        this.bgWrapper.classList.toggle(lyric_player_module_default.bgWrapperHidden, isHidden);
      }
    }
    dispose() {
      super.dispose();
      this.lyricPlayer.resizeObserver.unobserve(this.element);
      this.element.remove();
    }
  };
  var isCJK = (char) => {
    return /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u.test(char);
  };
  var LyricLineBase = class extends EventTarget {
    top = 0;
    scale = 1;
    blur = 0;
    opacity = 1;
    delay = 0;
    lineTransforms = { scale: new Spring(100) };
    /**
    * 用于 CJK 词语边界检测的分词器
    */
    static wordSegmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(void 0, { granularity: "word" }) : null;
    /**
    * Unicode 标准的全局 Grapheme Cluster 分词器
    * 用于正确处理 emoji、复合字符等
    */
    static graphemeSegmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
    setTransform(scale = this.scale, opacity = this.opacity, blur = this.blur, _force = false, delay = 0, _mode = LyricLineRenderMode.SOLID) {
      this.scale = scale;
      this.opacity = opacity;
      this.blur = blur;
      this.delay = delay;
    }
    rebuildElement() {
    }
    /**
    * 判定歌词是否可以应用强调辉光效果
    *
    * 果子在对辉光效果的解释是一种强调（emphasized）效果
    *
    * 条件是一个单词时长大于等于 1s 且长度小于等于 7
    *
    * @param word 单词
    * @returns 是否可以应用强调辉光效果
    */
    static shouldEmphasize(word) {
      if (isCJK(word.word)) return word.endTime - word.startTime >= 1e3;
      return word.endTime - word.startTime >= 1e3 && word.word.trim().length <= 7 && word.word.trim().length > 1;
    }
    dispose() {
    }
  };
  var OVERFLOW_PENALTY_MULTIPLIER = 1e3;
  var CJK_BREAK_PENALTY_RATIO = 0.15;
  var NORMAL_BREAK_PENALTY_RATIO = 0.5;
  var SPACE_BREAK_REWARD_RATIO = 0.4;
  var PUNCTUATION_BREAK_REWARD_RATIO = 0.6;
  var PUNCTUATION_REGEX = /[,.;:!?，。；：！？、）】》」』’”)[\]}>~…]$/;
  function calcBalancedBreaks(children, containerWidth, fullText, segmenter) {
    const n3 = children.length;
    if (n3 === 0 || containerWidth <= 0) return [];
    const cjkBoundaries = /* @__PURE__ */ new Set();
    let offset = 0;
    for (const { segment, isWordLike } of segmenter.segment(fullText)) {
      if (offset > 0 && isWordLike) {
        if ([...segment].some((ch) => isCJK(ch))) cjkBoundaries.add(offset);
      }
      offset += segment.length;
    }
    const charOffsets = new Int32Array(n3 + 1);
    const prefixWidth = new Float64Array(n3 + 1);
    for (let i2 = 0; i2 < n3; i2++) {
      charOffsets[i2 + 1] = charOffsets[i2] + children[i2].text.length;
      prefixWidth[i2 + 1] = prefixWidth[i2] + children[i2].width;
    }
    if (prefixWidth[n3] <= containerWidth) return [];
    const dp = new Float64Array(n3 + 1).fill(Number.POSITIVE_INFINITY);
    const nextBreak = new Int32Array(n3 + 1).fill(-1);
    dp[n3] = 0;
    const PENALTY_CJK = (containerWidth * CJK_BREAK_PENALTY_RATIO) ** 2;
    const PENALTY_NORMAL = (containerWidth * NORMAL_BREAK_PENALTY_RATIO) ** 2;
    for (let i2 = n3 - 1; i2 >= 0; i2--) for (let j2 = i2 + 1; j2 <= n3; j2++) {
      const w2 = prefixWidth[j2] - prefixWidth[i2];
      let lineCost = 0;
      if (w2 > containerWidth) if (j2 === i2 + 1) lineCost = (w2 - containerWidth) ** 2 * OVERFLOW_PENALTY_MULTIPLIER;
      else continue;
      else lineCost = (containerWidth - w2) ** 2;
      let breakPenalty = 0;
      if (j2 < n3) {
        const prevChild = children[j2 - 1];
        if (PUNCTUATION_REGEX.test(prevChild.text)) breakPenalty = -((containerWidth * PUNCTUATION_BREAK_REWARD_RATIO) ** 2);
        else if (prevChild.isSpace) breakPenalty = -((containerWidth * SPACE_BREAK_REWARD_RATIO) ** 2);
        else if (cjkBoundaries.has(charOffsets[j2])) breakPenalty = PENALTY_CJK;
        else breakPenalty = PENALTY_NORMAL;
      }
      const totalCost = lineCost + breakPenalty + dp[j2];
      if (totalCost < dp[i2]) {
        dp[i2] = totalCost;
        nextBreak[i2] = j2;
      }
    }
    const breaks = [];
    let curr = 0;
    while (curr < n3) {
      curr = nextBreak[curr];
      if (curr > 0 && curr < n3) breaks.push(curr);
    }
    return breaks;
  }
  var sharedCanvasCtx = null;
  function getMeasurementContext() {
    if (!sharedCanvasCtx) sharedCanvasCtx = document.createElement("canvas").getContext("2d");
    return sharedCanvasCtx;
  }
  var LineBalancer = class {
    mainElement;
    isBalancing = false;
    lastBalancedContainerWidth = -1;
    constructor(mainElement) {
      this.mainElement = mainElement;
    }
    balanceLineBreaks(isNonDynamic, hasSplittedWords, wordSegmenter) {
      if (this.isBalancing || !this.mainElement) return;
      const computedStyle = getComputedStyle(this.mainElement);
      const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
      const containerWidth = this.mainElement.clientWidth - paddingLeft - paddingRight;
      if (containerWidth <= 0) return;
      if (isNonDynamic) {
        this.balanceNonDynamicLineBreaks(containerWidth, computedStyle, wordSegmenter);
        return;
      }
      if (!hasSplittedWords) return;
      this.balanceDynamicLineBreaks(containerWidth, wordSegmenter);
    }
    reset() {
      this.lastBalancedContainerWidth = -1;
    }
    executeLineBalance(containerWidth, adapter, wordSegmenter) {
      const existingBrs = this.mainElement.querySelectorAll("br");
      if (containerWidth === this.lastBalancedContainerWidth && existingBrs.length > 0) return;
      adapter.resetDOM();
      const prevWhiteSpace = this.mainElement.style.whiteSpace;
      this.mainElement.style.whiteSpace = "nowrap";
      const parentElement = this.mainElement.parentElement;
      let prevTransform = "";
      let transformChanged = false;
      if (parentElement) {
        prevTransform = parentElement.style.transform;
        if (prevTransform && prevTransform !== "none") {
          parentElement.style.transform = "none";
          transformChanged = true;
        }
      }
      let lockAcquired = false;
      try {
        const { childInfos, fullText } = adapter.buildChildInfos();
        let layoutWidth = childInfos.reduce((sum, c2) => sum + c2.width, 0);
        if (adapter.needsCalibration) {
          const range = document.createRange();
          range.selectNodeContents(this.mainElement);
          const visualWidth = range.getBoundingClientRect().width;
          if (layoutWidth > 0 && visualWidth > 0) {
            const scale = visualWidth / layoutWidth;
            for (const info of childInfos) info.width *= scale;
          }
          layoutWidth = visualWidth;
        }
        const safeContainerWidth = Math.max(1, containerWidth);
        if (layoutWidth <= safeContainerWidth) {
          this.lastBalancedContainerWidth = containerWidth;
          return;
        }
        const breaks = calcBalancedBreaks(childInfos, safeContainerWidth, fullText, wordSegmenter);
        if (breaks.length === 0) {
          this.lastBalancedContainerWidth = containerWidth;
          return;
        }
        this.isBalancing = true;
        lockAcquired = true;
        adapter.applyBreaks(breaks, childInfos);
        this.lastBalancedContainerWidth = containerWidth;
        this.isBalancing = false;
      } finally {
        this.mainElement.style.whiteSpace = prevWhiteSpace;
        if (transformChanged && parentElement) parentElement.style.transform = prevTransform;
        if (lockAcquired) this.isBalancing = false;
      }
    }
    balanceDynamicLineBreaks(containerWidth, wordSegmenter) {
      const infoToNode = [];
      this.executeLineBalance(containerWidth, {
        resetDOM: () => {
          this.mainElement.querySelectorAll("br").forEach((br) => {
            br.remove();
          });
        },
        buildChildInfos: () => {
          infoToNode.length = 0;
          const childNodes = Array.from(this.mainElement.childNodes);
          const childInfos = [];
          const range = document.createRange();
          for (const node of childNodes) if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent ?? "";
            if (text.length === 0) continue;
            range.selectNodeContents(node);
            childInfos.push({
              width: range.getBoundingClientRect().width,
              text,
              isSpace: text.trim().length === 0
            });
            infoToNode.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const rect = el.getBoundingClientRect();
            const elStyle = getComputedStyle(el);
            const marginLeft = Number.parseFloat(elStyle.marginLeft) || 0;
            const marginRight = Number.parseFloat(elStyle.marginRight) || 0;
            childInfos.push({
              width: clampPositive(rect.width + marginLeft + marginRight),
              text: el.textContent ?? "",
              isSpace: false
            });
            infoToNode.push(node);
          }
          return {
            childInfos,
            fullText: childInfos.map((c2) => c2.text).join("")
          };
        },
        applyBreaks: (breaks) => {
          for (let i2 = breaks.length - 1; i2 >= 0; i2--) {
            const breakIndex = breaks[i2];
            if (breakIndex >= 0 && breakIndex < infoToNode.length) this.mainElement.insertBefore(document.createElement("br"), infoToNode[breakIndex]);
          }
        },
        needsCalibration: false
      }, wordSegmenter);
    }
    balanceNonDynamicLineBreaks(containerWidth, computedStyle, wordSegmenter) {
      const fullText = this.mainElement.textContent ?? "";
      if (fullText.trim().length === 0) return;
      this.executeLineBalance(containerWidth, {
        resetDOM: () => {
          this.mainElement.innerHTML = "";
          this.mainElement.textContent = fullText;
        },
        buildChildInfos: () => {
          const ctx = getMeasurementContext();
          if (!ctx) {
            console.debug("Canvas 2D context is not supported, skipping line balancing");
            return {
              childInfos: [],
              fullText
            };
          }
          ctx.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
          if ("letterSpacing" in ctx) ctx.letterSpacing = computedStyle.letterSpacing !== "normal" ? computedStyle.letterSpacing : "0px";
          if ("wordSpacing" in ctx) ctx.wordSpacing = computedStyle.wordSpacing !== "normal" ? computedStyle.wordSpacing : "0px";
          const childInfos = [];
          for (const { segment } of wordSegmenter.segment(fullText)) childInfos.push({
            width: ctx.measureText(segment).width,
            text: segment,
            isSpace: segment.trim().length === 0
          });
          return {
            childInfos,
            fullText
          };
        },
        applyBreaks: (breaks, childInfos) => {
          this.mainElement.innerHTML = "";
          const breakSet = new Set(breaks);
          const fragment3 = document.createDocumentFragment();
          for (let i2 = 0; i2 < childInfos.length; i2++) {
            if (breakSet.has(i2)) fragment3.appendChild(document.createElement("br"));
            fragment3.appendChild(document.createTextNode(childInfos[i2].text));
          }
          this.mainElement.appendChild(fragment3);
        },
        needsCalibration: true
      }, wordSegmenter);
    }
  };
  var SPLIT_WHITESPACE_RE = /(\s+)/;
  var WHITESPACE_RE = /\s/g;
  function chunkAndSplitLyricWords(words) {
    const result = [];
    let currentGroup = [];
    const flushGroup = () => {
      if (currentGroup.length > 0) {
        result.push(currentGroup.length === 1 ? currentGroup[0] : [...currentGroup]);
        currentGroup = [];
      }
    };
    const processAtom = (atom) => {
      const isSpace = atom.word.trim().length === 0;
      const hasRuby = (atom.ruby?.length ?? 0) > 0;
      const isCJKChar = isCJK(atom.word);
      if (!isSpace && !hasRuby && !isCJKChar) currentGroup.push(atom);
      else {
        flushGroup();
        result.push(atom);
      }
    };
    for (const w2 of words) {
      const isSpace = w2.word.trim().length === 0;
      const romanWord = w2.romanWord ?? "";
      const obscene = w2.obscene ?? false;
      const hasRuby = (w2.ruby?.length ?? 0) > 0;
      if (isSpace || hasRuby) {
        processAtom({ ...w2 });
        continue;
      }
      const parts = w2.word.split(SPLIT_WHITESPACE_RE).filter((p3) => p3.length > 0);
      const totalLength = w2.word.replace(WHITESPACE_RE, "").length || 1;
      const timePerUnit = (w2.endTime - w2.startTime) / totalLength;
      let currentOffset = 0;
      for (const part of parts) {
        if (!part.trim()) {
          const startTime = w2.startTime + currentOffset * timePerUnit;
          processAtom({
            word: part,
            romanWord: "",
            startTime,
            endTime: startTime,
            obscene
          });
          continue;
        }
        if (isCJK(part) && part.length > 1 && romanWord.trim().length === 0) {
          const chars = part.split("");
          for (const char of chars) {
            const startTime = w2.startTime + currentOffset * timePerUnit;
            processAtom({
              word: char,
              romanWord: "",
              startTime,
              endTime: startTime + timePerUnit,
              obscene
            });
            currentOffset += 1;
          }
        } else {
          const partRealLen = part.length;
          const startTime = w2.startTime + currentOffset * timePerUnit;
          processAtom({
            word: part,
            romanWord,
            startTime,
            endTime: startTime + partRealLen * timePerUnit,
            obscene
          });
          currentOffset += partRealLen;
        }
      }
    }
    flushGroup();
    return result;
  }
  function createMatrix4() {
    return [
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ];
  }
  function scaleMatrix4(m2, scale = 1, origin = {
    x: 0,
    y: 0
  }) {
    const [ox, oy] = [origin.x, origin.y];
    return [
      m2[0] * scale,
      m2[1] * scale,
      m2[2] * scale,
      m2[3],
      m2[4] * scale,
      m2[5] * scale,
      m2[6] * scale,
      m2[7],
      m2[8] * scale,
      m2[9] * scale,
      m2[10] * scale,
      m2[11],
      m2[12] - ox * scale + ox,
      m2[13] - oy * scale + oy,
      m2[14],
      m2[15]
    ];
  }
  function matrix4ToCSS(m2, fractionDigits = 4) {
    const format2 = (n3, _) => n3.toFixed(fractionDigits);
    return `matrix3d(${m2.map(format2).join(", ")})`;
  }
  var ANIMATION_FRAME_QUANTITY = 32;
  var norNum = (min, max) => (x2) => clamp01((x2 - min) / (max - min));
  var EMP_EASING_MID = 0.5;
  var beginNum = norNum(0, EMP_EASING_MID);
  var endNum = norNum(EMP_EASING_MID, 1);
  var bezIn = bezier(0.2, 0.4, 0.58, 1);
  var bezOut = bezier(0.3, 0, 0.58, 1);
  var makeEmpEasing = (mid) => {
    return (x2) => x2 < mid ? bezIn(beginNum(x2)) : 1 - bezOut(endNum(x2));
  };
  function generateFadeGradient(width, padding = 0, bright = "rgba(0,0,0,var(--bright-mask-alpha, 1.0))", dark = "rgba(0,0,0,var(--dark-mask-alpha, 1.0))") {
    const totalAspect = 2 + width + padding;
    const widthInTotal = width / totalAspect;
    const leftPos = (1 - widthInTotal) / 2;
    return [`linear-gradient(to right,${bright} ${leftPos * 100}%,${dark} ${(leftPos + widthInTotal) * 100}%)`, totalAspect];
  }
  var LyricLineEl = class extends LyricLineBase {
    lyricPlayer;
    lyricLine;
    element = document.createElement("div");
    splittedWords = [];
    built = false;
    lineSize = [0, 0];
    renderMode = LyricLineRenderMode.SOLID;
    currentBrightAlpha = 1;
    currentDarkAlpha = 0.2;
    targetBrightAlpha = 1;
    targetDarkAlpha = 0.2;
    /**
    * 用于平衡换行、尽量减少各行长度差异的类
    */
    balancer;
    constructor(lyricPlayer, lyricLine = {
      words: [],
      translatedLyric: "",
      romanLyric: "",
      startTime: 0,
      endTime: 0,
      isBG: false,
      isDuet: false
    }) {
      super();
      this.lyricPlayer = lyricPlayer;
      this.lyricLine = lyricLine;
      this.element.setAttribute("class", lyric_player_module_default.lyricLine);
      if (this.lyricLine.isBG) this.element.classList.add(lyric_player_module_default.lyricBgLine);
      if (this.lyricLine.isDuet) this.element.classList.add(lyric_player_module_default.lyricDuetLine);
      this.element.appendChild(document.createElement("div"));
      this.element.appendChild(document.createElement("div"));
      this.element.appendChild(document.createElement("div"));
      const main = this.element.children[0];
      const trans = this.element.children[1];
      const roman = this.element.children[2];
      main.setAttribute("class", lyric_player_module_default.lyricMainLine);
      trans.setAttribute("class", lyric_player_module_default.lyricSubLine);
      roman.setAttribute("class", lyric_player_module_default.lyricSubLine);
      if (LyricLineBase.wordSegmenter) this.balancer = new LineBalancer(main);
      this.rebuildStyle();
    }
    areWordsOnSameLine(word1, word2) {
      if (word1?.mainElement && word2?.mainElement) {
        const word1el = word1.mainElement;
        const word2el = word2.mainElement;
        const rect1 = word1el.getBoundingClientRect();
        const rect2 = word2el.getBoundingClientRect();
        return Math.abs(rect1.top - rect2.top) < 10;
      }
      return true;
    }
    isEnabled = false;
    async enable(maskAnimationTime = this.lyricPlayer.getCurrentTime(), shouldPlay = this.lyricPlayer.getIsPlaying()) {
      this.isEnabled = true;
      this.element.classList.add(lyric_player_module_default.active);
      const main = this.element.children[0];
      const relativeTime = clampPositive(maskAnimationTime - this.lyricLine.startTime);
      for (const word of this.splittedWords) {
        for (const a2 of word.elementAnimations) {
          a2.currentTime = relativeTime;
          a2.playbackRate = 1;
          const timing = a2.effect?.getComputedTiming();
          const duration = Number(timing?.duration ?? 0);
          const endTime = Number(timing?.delay ?? 0) + duration;
          if (shouldPlay && relativeTime < endTime) a2.play();
          else a2.pause();
        }
        for (const a2 of word.maskAnimations) {
          const t3 = Math.min(this.totalDuration, relativeTime);
          a2.currentTime = t3;
          a2.playbackRate = 1;
          const timing = a2.effect?.getComputedTiming();
          const duration = Number(timing?.duration ?? 0);
          const endTime = Number(timing?.delay ?? 0) + duration;
          if (shouldPlay && t3 < endTime) a2.play();
          else a2.pause();
        }
      }
      main.classList.add(lyric_player_module_default.active);
    }
    disable() {
      this.isEnabled = false;
      this.element.classList.remove(lyric_player_module_default.active);
      this.renderMode = LyricLineRenderMode.SOLID;
      const main = this.element.children[0];
      for (const word of this.splittedWords) {
        for (const a2 of word.elementAnimations) if (a2.id === "float-word" || a2.id.includes("emphasize-word-float-only")) {
          a2.playbackRate = -1;
          a2.play();
        }
        for (const a2 of word.maskAnimations) a2.pause();
      }
      main.classList.remove(lyric_player_module_default.active);
    }
    lastWord;
    async resume() {
      if (!this.isEnabled) return;
      for (const word of this.splittedWords) {
        for (const a2 of word.elementAnimations) if (!this.lastWord || this.splittedWords.indexOf(this.lastWord) < this.splittedWords.indexOf(word)) {
          const timing = a2.effect?.getComputedTiming();
          const duration = timing?.duration || 0;
          const endTime = (timing?.delay || 0) + duration;
          const currentTime = a2.currentTime || 0;
          if (a2.playState !== "finished" && currentTime < endTime) a2.play();
        }
        for (const a2 of word.maskAnimations) if (!this.lastWord || this.splittedWords.indexOf(this.lastWord) < this.splittedWords.indexOf(word)) {
          const timing = a2.effect?.getComputedTiming();
          const duration = timing?.duration || 0;
          const endTime = (timing?.delay || 0) + duration;
          const currentTime = a2.currentTime || 0;
          if (a2.playState !== "finished" && currentTime < endTime) a2.play();
        }
      }
    }
    async pause() {
      if (!this.isEnabled) return;
      for (const word of this.splittedWords) {
        for (const a2 of word.elementAnimations) a2.pause();
        for (const a2 of word.maskAnimations) a2.pause();
      }
    }
    setMaskAnimationState(maskAnimationTime = 0) {
      const t3 = maskAnimationTime - this.lyricLine.startTime;
      for (const word of this.splittedWords) for (const a2 of word.maskAnimations) {
        a2.currentTime = clamp(t3, 0, this.totalDuration);
        a2.playbackRate = 1;
        if (t3 >= 0 && t3 < this.totalDuration) a2.play();
        else a2.pause();
      }
    }
    getLine() {
      return this.lyricLine;
    }
    lastStyle = "";
    show() {
      if (!this.built) {
        this.rebuildElement();
        this.built = true;
        this.updateMaskImageSync();
      }
    }
    rebuildStyle() {
      let style = "";
      style += `transform: scale(${(this.lineTransforms.scale.getCurrentPosition() / 100).toFixed(4)});`;
      if (!this.lyricPlayer.getEnableSpring()) style += `transition-delay:${this.delay}ms;`;
      style += `filter:blur(${Math.min(5, this.blur)}px);`;
      if (style !== this.lastStyle) {
        this.lastStyle = style;
        this.element.setAttribute("style", style);
      }
    }
    rebuildElement() {
      this.disposeElements();
      const main = this.element.children[0];
      const trans = this.element.children[1];
      const roman = this.element.children[2];
      if (this.lyricPlayer._getIsNonDynamic()) {
        main.textContent = this.lyricLine.words.map((w2) => this.lyricPlayer.processObsceneWord(w2)).join("");
        this.setSubLinesText(trans, roman);
        return;
      }
      const chunkedWords = chunkAndSplitLyricWords(this.lyricLine.words);
      const hasRubyLine = this.lyricLine.words.some((word) => (word.ruby?.length ?? 0) > 0);
      const hasRomanLine = this.lyricLine.words.some((word) => (word.romanWord?.trim().length ?? 0) > 0);
      main.innerHTML = "";
      for (const chunk of chunkedWords) this.buildWord(chunk, main, hasRubyLine, hasRomanLine);
      this.setSubLinesText(trans, roman);
    }
    /** 设置翻译与音译行文本 */
    setSubLinesText(trans, roman) {
      trans.textContent = this.lyricLine.translatedLyric;
      roman.textContent = this.lyricLine.romanLyric;
    }
    getRubyCharCount(word) {
      return (word.ruby ?? []).reduce((total, ruby) => total + ruby.word.length, 0);
    }
    getRubySegments(word) {
      return (word.ruby ?? []).filter((ruby) => (ruby?.word?.trim().length ?? 0) > 0);
    }
    createWord(word, shouldEmphasize, hasRubyLine, hasRomanLine) {
      const mainWordEl = document.createElement("span");
      const subElements = [];
      const romanWord = word.romanWord?.trim() ?? "";
      const wordContainer = hasRubyLine ? document.createElement("div") : mainWordEl;
      if (hasRubyLine) {
        const rubyWordEl = document.createElement("div");
        const rubySegments = this.getRubySegments(word);
        for (const ruby of rubySegments) {
          const rubyPartEl = document.createElement("span");
          rubyPartEl.textContent = ruby.word;
          rubyPartEl.dataset.startTime = String(ruby.startTime);
          rubyPartEl.dataset.endTime = String(ruby.endTime);
          rubyWordEl.appendChild(rubyPartEl);
        }
        rubyWordEl.classList.add(lyric_player_module_default.rubyWord);
        mainWordEl.classList.add(lyric_player_module_default.wordWithRuby);
        wordContainer.classList.add(lyric_player_module_default.wordBody);
        mainWordEl.appendChild(rubyWordEl);
        mainWordEl.appendChild(wordContainer);
      }
      const displayWord = this.lyricPlayer.processObsceneWord(word);
      if (shouldEmphasize) {
        mainWordEl.classList.add(lyric_player_module_default.emphasize);
        const trimmedWord = displayWord.trim();
        if (LyricLineBase.graphemeSegmenter) for (const { segment } of LyricLineBase.graphemeSegmenter.segment(trimmedWord)) {
          const charEl = document.createElement("span");
          charEl.textContent = segment;
          subElements.push(charEl);
          wordContainer.appendChild(charEl);
        }
        else for (const segment of Array.from(trimmedWord)) {
          const charEl = document.createElement("span");
          charEl.textContent = segment;
          subElements.push(charEl);
          wordContainer.appendChild(charEl);
        }
      } else if (hasRomanLine) {
        const wordEl = document.createElement("div");
        wordEl.textContent = displayWord.trim();
        wordContainer.appendChild(wordEl);
      } else if (romanWord.length === 0) wordContainer.textContent = displayWord.trim();
      if (hasRomanLine) {
        const romanWordEl = document.createElement("div");
        romanWordEl.textContent = romanWord.length > 0 ? romanWord : "\xA0";
        romanWordEl.classList.add(lyric_player_module_default.romanWord);
        wordContainer.appendChild(romanWordEl);
      }
      return {
        ...word,
        mainElement: mainWordEl,
        subElements,
        elementAnimations: [this.initFloatAnimation(word, mainWordEl)],
        maskAnimations: [],
        width: 0,
        height: 0,
        padding: 0,
        shouldEmphasize
      };
    }
    buildWord(input, main, hasRubyLine, hasRomanLine) {
      const chunk = Array.isArray(input) ? input : [input];
      if (chunk.length === 0) return;
      if (chunk.every((w2) => !w2.word.trim())) {
        const textContent = chunk.map((w2) => w2.word).join("");
        main.appendChild(document.createTextNode(textContent));
        return;
      }
      const merged = chunk.reduce((a2, b2) => {
        a2.endTime = Math.max(a2.endTime, b2.endTime);
        a2.startTime = Math.min(a2.startTime, b2.startTime);
        a2.word += b2.word;
        return a2;
      }, {
        word: "",
        romanWord: "",
        startTime: Number.POSITIVE_INFINITY,
        endTime: Number.NEGATIVE_INFINITY,
        wordType: "normal",
        obscene: false
      });
      let emp = chunk.some((word) => LyricLineBase.shouldEmphasize(word));
      if (!isCJK(merged.word)) emp = emp || LyricLineBase.shouldEmphasize(merged);
      const wrapperWordEl = document.createElement("span");
      wrapperWordEl.classList.add(lyric_player_module_default.emphasizeWrapper);
      const characterElements = [];
      for (const word of chunk) {
        if (!word.word.trim()) {
          wrapperWordEl.appendChild(document.createTextNode(word.word));
          continue;
        }
        const realWord = this.createWord(word, emp, hasRubyLine, hasRomanLine);
        if (emp) characterElements.push(...realWord.subElements);
        this.splittedWords.push(realWord);
        wrapperWordEl.appendChild(realWord.mainElement);
      }
      if (emp && this.splittedWords.length > 0) {
        const lastWordOfChunk = this.splittedWords[this.splittedWords.length - 1];
        const rubyCharCount = chunk.reduce((total, word) => total + this.getRubyCharCount(word), 0);
        lastWordOfChunk.elementAnimations.push(...this.initEmphasizeAnimation(merged, characterElements, merged.endTime - merged.startTime, merged.startTime - this.lyricLine.startTime, rubyCharCount));
      }
      main.appendChild(wrapperWordEl);
    }
    initFloatAnimation(word, wordEl) {
      const delay = word.startTime - this.lyricLine.startTime;
      const duration = Math.max(1e3, word.endTime - word.startTime);
      let up = 0.05;
      if (this.lyricLine.isBG) up *= 2;
      const a2 = wordEl.animate([{ transform: "translateY(0px)" }, { transform: `translateY(${-up}em)` }], {
        duration: Number.isFinite(duration) ? duration : 0,
        delay: Number.isFinite(delay) ? delay : 0,
        id: "float-word",
        composite: "add",
        fill: "both",
        easing: "ease-out"
      });
      a2.pause();
      return a2;
    }
    initEmphasizeAnimation(word, characterElements, duration, delay, rubyCharCount) {
      const de = clampPositive(delay);
      let du = Math.max(1e3, duration);
      const anchorCharCount = rubyCharCount > 0 ? rubyCharCount : Math.max(1, characterElements.length);
      let result = [];
      let amount = du / 2e3;
      amount = amount > 1 ? Math.sqrt(amount) : amount ** 3;
      let blur = du / 3e3;
      blur = blur > 1 ? Math.sqrt(blur) : blur ** 3;
      amount *= 0.6;
      blur *= 0.5;
      if (this.lyricLine.words.length > 0 && word.word.includes(this.lyricLine.words[this.lyricLine.words.length - 1].word)) {
        amount *= 1.6;
        blur *= 1.5;
        du *= 1.2;
      }
      amount = Math.min(1.2, amount);
      blur = Math.min(0.8, blur);
      const animateDu = Number.isFinite(du) ? du : 0;
      const empEasing = makeEmpEasing(EMP_EASING_MID);
      result = characterElements.flatMap((el, i2, arr) => {
        const wordDe = de + du / 2.5 / anchorCharCount * i2;
        const result2 = [];
        const frames = new Array(ANIMATION_FRAME_QUANTITY).fill(0).map((_, j2) => {
          const x2 = (j2 + 1) / ANIMATION_FRAME_QUANTITY;
          const transX = empEasing(x2);
          const glowLevel = empEasing(x2) * blur;
          const mat = scaleMatrix4(createMatrix4(), 1 + transX * 0.1 * amount);
          const offsetX = -transX * 0.03 * amount * (arr.length / 2 - i2);
          const offsetY = -transX * 0.025 * amount;
          return {
            offset: x2,
            transform: `${matrix4ToCSS(mat, 4)} translate(${offsetX}em, ${offsetY}em)`,
            textShadow: `0 0 ${Math.min(0.3, blur * 0.3)}em rgba(255, 255, 255, ${glowLevel})`
          };
        });
        const glow = el.animate(frames, {
          duration: animateDu,
          delay: Number.isFinite(wordDe) ? wordDe : 0,
          id: `emphasize-word-${el.textContent}-${i2}`,
          iterations: 1,
          composite: "replace",
          fill: "both"
        });
        glow.onfinish = () => {
          glow.pause();
        };
        glow.pause();
        result2.push(glow);
        const floatFrame = new Array(ANIMATION_FRAME_QUANTITY).fill(0).map((_, j2) => {
          const x2 = (j2 + 1) / ANIMATION_FRAME_QUANTITY;
          let y2 = Math.sin(x2 * Math.PI);
          if (this.lyricLine.isBG) y2 *= 2;
          return {
            offset: x2,
            transform: `translateY(${-y2 * 0.05}em)`
          };
        });
        const float = el.animate(floatFrame, {
          duration: animateDu * 1.4,
          delay: Number.isFinite(wordDe) ? wordDe - 400 : 0,
          id: "emphasize-word-float",
          iterations: 1,
          composite: "add",
          fill: "both"
        });
        float.onfinish = () => {
          float.pause();
        };
        float.pause();
        result2.push(float);
        return result2;
      });
      return result;
    }
    get totalDuration() {
      return this.lyricLine.endTime - this.lyricLine.startTime;
    }
    onLineSizeChange(_size) {
      this.updateMaskImageSync();
    }
    updateMaskImageSync() {
      for (const word of this.splittedWords) {
        const el = word.mainElement;
        if (el) {
          word.padding = Number.parseFloat(getComputedStyle(el).paddingLeft);
          word.width = el.clientWidth - word.padding * 2;
          word.height = el.clientHeight - word.padding * 2;
        } else {
          word.width = 0;
          word.height = 0;
          word.padding = 0;
        }
      }
      if (this.balancer && LyricLineBase.wordSegmenter) this.balancer.balanceLineBreaks(this.lyricPlayer._getIsNonDynamic(), this.splittedWords.length > 0, LyricLineBase.wordSegmenter);
      if (this.lyricPlayer.supportMaskImage) this.generateWebAnimationBasedMaskImage();
      else this.generateCalcBasedMaskImage();
      if (this.isEnabled) {
        const isPlayerRunning = this.lyricPlayer.getIsPlaying?.() ?? true;
        this.enable(this.lyricPlayer.getCurrentTime(), isPlayerRunning);
      }
    }
    generateCalcBasedMaskImage() {
      for (const word of this.splittedWords) {
        const wordEl = word.mainElement;
        if (wordEl) {
          word.width = wordEl.clientWidth;
          word.height = wordEl.clientHeight;
          const fadeWidth = word.height * this.lyricPlayer.getWordFadeWidth();
          const [maskImage, totalAspect] = generateFadeGradient(fadeWidth / word.width);
          const totalAspectStr = `${totalAspect * 100}% 100%`;
          if (this.lyricPlayer.supportMaskImage) {
            wordEl.style.maskImage = maskImage;
            wordEl.style.maskRepeat = "no-repeat";
            wordEl.style.maskOrigin = "left";
            wordEl.style.maskSize = totalAspectStr;
          } else {
            wordEl.style.webkitMaskImage = maskImage;
            wordEl.style.webkitMaskRepeat = "no-repeat";
            wordEl.style.webkitMaskOrigin = "left";
            wordEl.style.webkitMaskSize = totalAspectStr;
          }
          const w2 = word.width + fadeWidth;
          const maskPos = `clamp(${-w2}px,calc(${-w2}px + (var(--amll-player-time) - ${word.startTime})*${w2 / Math.abs(word.endTime - word.startTime)}px),0px) 0px, left top`;
          wordEl.style.maskPosition = maskPos;
          wordEl.style.webkitMaskPosition = maskPos;
        }
      }
    }
    generateWebAnimationBasedMaskImage() {
      const totalFadeDuration = Math.max(0, ...this.splittedWords.map((w2) => w2.endTime), this.lyricLine.endTime) - this.lyricLine.startTime;
      this.splittedWords.forEach((word, i2) => {
        const wordEl = word.mainElement;
        if (wordEl) {
          const fadeWidth = word.height * this.lyricPlayer.getWordFadeWidth();
          const [maskImage, totalAspect] = generateFadeGradient(fadeWidth / (word.width + word.padding * 2));
          const totalAspectStr = `${totalAspect * 100}% 100%`;
          if (this.lyricPlayer.supportMaskImage) {
            wordEl.style.maskImage = maskImage;
            wordEl.style.maskRepeat = "no-repeat";
            wordEl.style.maskOrigin = "left";
            wordEl.style.maskSize = totalAspectStr;
          } else {
            wordEl.style.webkitMaskImage = maskImage;
            wordEl.style.webkitMaskRepeat = "no-repeat";
            wordEl.style.webkitMaskOrigin = "left";
            wordEl.style.webkitMaskSize = totalAspectStr;
          }
          const widthBeforeSelf = this.splittedWords.slice(0, i2).reduce((a2, b2) => a2 + b2.width, 0) + (this.splittedWords[0] ? fadeWidth : 0);
          const minOffset = -(word.width + word.padding * 2 + fadeWidth);
          const clampOffset = (x2) => clamp(x2, minOffset, 0);
          let curPos = -widthBeforeSelf - word.width - word.padding - fadeWidth;
          let timeOffset = 0;
          const frames = [];
          let lastPos = curPos;
          let lastTime = 0;
          const pushFrame = () => {
            const moveOffset = curPos - lastPos;
            const time = clamp01(timeOffset);
            const duration = time - lastTime;
            const d3 = Math.abs(duration / moveOffset);
            if (curPos > minOffset && lastPos < minOffset) {
              const staticTime = Math.abs(lastPos - minOffset) * d3;
              const value = `${clampOffset(lastPos)}px 0`;
              const frame2 = {
                offset: lastTime + staticTime,
                maskPosition: value
              };
              frames.push(frame2);
            }
            if (curPos > 0 && lastPos < 0) {
              const staticTime = Math.abs(lastPos) * d3;
              const value = `${clampOffset(curPos)}px 0`;
              const frame2 = {
                offset: lastTime + staticTime,
                maskPosition: value
              };
              frames.push(frame2);
            }
            const frame = {
              offset: time,
              maskPosition: `${clampOffset(curPos)}px 0`
            };
            frames.push(frame);
            lastPos = curPos;
            lastTime = time;
          };
          pushFrame();
          let lastTimeStamp = 0;
          this.splittedWords.forEach((otherWord, j2) => {
            {
              const curTimeStamp = otherWord.startTime - this.lyricLine.startTime;
              const staticDuration = curTimeStamp - lastTimeStamp;
              timeOffset += staticDuration / totalFadeDuration;
              if (staticDuration > 0) pushFrame();
              lastTimeStamp = curTimeStamp;
            }
            {
              const fadeDuration = clampPositive(otherWord.endTime - otherWord.startTime);
              const rubySegments = this.getRubySegments(otherWord);
              const rubyCharCount = rubySegments.reduce((total, ruby) => total + ruby.word.length, 0);
              if (rubyCharCount > 0) {
                const widthPerChar = otherWord.width / rubyCharCount;
                let charIndex = 0;
                for (const ruby of rubySegments) {
                  const rubyStartTime = Number.isFinite(ruby.startTime) ? ruby.startTime : otherWord.startTime;
                  const rubyEndTime = Number.isFinite(ruby.endTime) ? ruby.endTime : otherWord.endTime;
                  const rubyStart = Math.max(rubyStartTime, otherWord.startTime);
                  const rubyEnd = Math.min(Math.max(rubyEndTime, rubyStart), otherWord.endTime);
                  const rubyStartStamp = rubyStart - this.lyricLine.startTime;
                  const rubyStaticDuration = rubyStartStamp - lastTimeStamp;
                  timeOffset += rubyStaticDuration / totalFadeDuration;
                  if (rubyStaticDuration > 0) pushFrame();
                  lastTimeStamp = rubyStartStamp;
                  const perCharDuration = clampPositive(rubyEnd - rubyStart) / ruby.word.length;
                  for (let rubyCharIndex = 0; rubyCharIndex < ruby.word.length; rubyCharIndex++) {
                    timeOffset += perCharDuration / totalFadeDuration;
                    curPos += widthPerChar;
                    if (j2 === 0 && charIndex === 0) curPos += fadeWidth * 1.5;
                    if (j2 === this.splittedWords.length - 1 && charIndex === rubyCharCount - 1) curPos += fadeWidth * 0.5;
                    if (perCharDuration > 0) pushFrame();
                    lastTimeStamp += perCharDuration;
                    charIndex++;
                  }
                }
                const wordEndStamp = Math.max(otherWord.endTime - this.lyricLine.startTime, lastTimeStamp);
                const wordTailDuration = wordEndStamp - lastTimeStamp;
                timeOffset += wordTailDuration / totalFadeDuration;
                if (wordTailDuration > 0) pushFrame();
                lastTimeStamp = wordEndStamp;
              } else {
                const segmentCount = 1;
                const segmentWidth = otherWord.width / segmentCount;
                const segmentDuration = fadeDuration / segmentCount;
                for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
                  timeOffset += segmentDuration / totalFadeDuration;
                  curPos += segmentWidth;
                  if (j2 === 0 && segmentIndex === 0) curPos += fadeWidth * 1.5;
                  if (j2 === this.splittedWords.length - 1 && segmentIndex === segmentCount - 1) curPos += fadeWidth * 0.5;
                  if (segmentDuration > 0) pushFrame();
                  lastTimeStamp += segmentDuration;
                }
              }
            }
          });
          for (const a2 of word.maskAnimations) a2.cancel();
          try {
            const ani = wordEl.animate(frames, {
              duration: totalFadeDuration || 1,
              id: `fade-word-${word.word}-${i2}`,
              fill: "both"
            });
            ani.pause();
            word.maskAnimations = [ani];
          } catch (err) {
            console.warn("\u5E94\u7528\u6E10\u53D8\u52A8\u753B\u53D1\u751F\u9519\u8BEF", frames, totalFadeDuration, err);
          }
        }
      });
    }
    getElement() {
      return this.element;
    }
    updateMaskAlphaTargets(scale) {
      const factor = clamp01((scale - 0.97) / 0.03);
      const dynamicDarkAlpha = factor * 0.2 + 0.2;
      const dynamicBrightAlpha = factor * 0.8 + 0.2;
      if (this.renderMode === LyricLineRenderMode.SOLID) {
        this.targetBrightAlpha = dynamicDarkAlpha;
        this.targetDarkAlpha = dynamicDarkAlpha;
      } else {
        this.targetBrightAlpha = dynamicBrightAlpha;
        this.targetDarkAlpha = dynamicDarkAlpha;
      }
    }
    applyAlphaToDom(delta) {
      const dt = delta || 0.016;
      const ATTACK_SPEED = 50;
      const RELEASE_SPEED = 7;
      const getFactor = (speed) => 1 - Math.exp(-speed * dt);
      const brightFactor = getFactor(this.targetBrightAlpha > this.currentBrightAlpha ? ATTACK_SPEED : RELEASE_SPEED);
      if (Math.abs(this.targetBrightAlpha - this.currentBrightAlpha) < 1e-3) this.currentBrightAlpha = this.targetBrightAlpha;
      else this.currentBrightAlpha += (this.targetBrightAlpha - this.currentBrightAlpha) * brightFactor;
      const darkFactor = getFactor(this.targetDarkAlpha > this.currentDarkAlpha ? ATTACK_SPEED : RELEASE_SPEED);
      if (Math.abs(this.targetDarkAlpha - this.currentDarkAlpha) < 1e-3) this.currentDarkAlpha = this.targetDarkAlpha;
      else this.currentDarkAlpha += (this.targetDarkAlpha - this.currentDarkAlpha) * darkFactor;
      this.element.style.setProperty("--bright-mask-alpha", this.currentBrightAlpha.toFixed(3));
      this.element.style.setProperty("--dark-mask-alpha", this.currentDarkAlpha.toFixed(3));
    }
    setTransform(scale = this.scale, opacity = 1, blur = 0, force = false, delay = 0, mode = LyricLineRenderMode.SOLID) {
      super.setTransform(scale, opacity, blur, force, delay);
      this.renderMode = mode;
      const enableSpring = this.lyricPlayer.getEnableSpring();
      this.top = 0;
      this.scale = scale;
      this.delay = delay * 1e3 | 0;
      const main = this.element.children[0];
      main.style.opacity = `${opacity}`;
      if (force || !enableSpring) {
        this.blur = Math.min(32, blur);
        this.lineTransforms.scale.setPosition(scale);
        this.rebuildStyle();
        const currentScale = this.lineTransforms.scale.getCurrentPosition();
        this.updateMaskAlphaTargets(currentScale / 100);
        this.currentBrightAlpha = this.targetBrightAlpha;
        this.currentDarkAlpha = this.targetDarkAlpha;
        this.element.style.setProperty("--bright-mask-alpha", String(this.currentBrightAlpha));
        this.element.style.setProperty("--dark-mask-alpha", String(this.currentDarkAlpha));
      } else {
        this.lineTransforms.scale.setTargetPosition(scale);
        if (this.blur !== Math.min(5, blur)) {
          this.blur = Math.min(5, blur);
          this.element.style.filter = `blur(${blur.toFixed(3)}px)`;
        }
      }
    }
    update(delta = 0) {
      if (!this.lyricPlayer.getEnableSpring()) return;
      this.lineTransforms.scale.update(delta);
      this.rebuildStyle();
      if (!this.built) return;
      const currentScale = this.lineTransforms.scale.getCurrentPosition() / 100;
      this.updateMaskAlphaTargets(currentScale);
      this.applyAlphaToDom(delta);
    }
    /** @internal */
    _getDebugTargetPos() {
      return `[\u4F4D\u79FB: ${this.top}; \u7F29\u653E: ${this.scale}; \u5EF6\u65F6: ${this.delay}]`;
    }
    teardownContent() {
      if (this.built) {
        this.disposeElements();
        this.built = false;
      }
    }
    disposeElements() {
      this.balancer?.reset();
      for (const realWord of this.splittedWords) {
        for (const a2 of realWord.elementAnimations) a2.cancel();
        for (const a2 of realWord.maskAnimations) a2.cancel();
        for (const sub of realWord.subElements) {
          sub.remove();
          sub.parentNode?.removeChild(sub);
        }
        realWord.elementAnimations = [];
        realWord.maskAnimations = [];
        realWord.subElements = [];
        if (realWord.mainElement?.parentNode) realWord.mainElement.parentNode.removeChild(realWord.mainElement);
      }
      this.splittedWords = [];
      const main = this.element.children[0];
      const trans = this.element.children[1];
      const roman = this.element.children[2];
      if (main) main.innerHTML = "";
      if (trans) trans.innerHTML = "";
      if (roman) roman.innerHTML = "";
    }
    dispose() {
      this.disposeElements();
      this.lyricPlayer.resizeObserver.unobserve(this.element);
      this.element.remove();
    }
  };
  var LyricLineMouseEvent = class extends MouseEvent {
    lineIndex;
    line;
    bgLine;
    /**
    * 自定义标志位，用于记录外部是否调用了 `stopPropagation`
    */
    isPropagationStopped = false;
    constructor(lineIndex, line, bgLine, event) {
      super(`line-${event.type}`, event);
      this.lineIndex = lineIndex;
      this.line = line;
      this.bgLine = bgLine;
    }
    stopPropagation() {
      this.isPropagationStopped = true;
      super.stopPropagation();
    }
    stopImmediatePropagation() {
      this.isPropagationStopped = true;
      super.stopImmediatePropagation();
    }
  };
  var DomLyricPlayer = class extends LyricPlayerBase {
    abortController = new AbortController();
    currentLyricGroups = [];
    onResize() {
      const computedStyles = getComputedStyle(this.element);
      this._baseFontSize = Number.parseFloat(computedStyles.fontSize);
      this.rebuildStyle();
    }
    supportPlusLighter = CSS.supports("mix-blend-mode", "plus-lighter");
    supportMaskImage = CSS.supports("mask-image", "none");
    innerSize = [0, 0];
    onMouseEventHandler = (e2) => {
      const target = e2.target;
      if (!(target instanceof Element)) return;
      const groupEl = target.closest(`.${lyric_player_module_default.lyricLineWrapper}`);
      if (!groupEl) return;
      const group = this.lyricGroupElementMap.get(groupEl);
      if (!group) return;
      const mainLine = group.mainLine;
      const bgLine = group.bgLine;
      const evt = new LyricLineMouseEvent(this.lyricLinesIndexes.get(mainLine) ?? -1, mainLine, bgLine, e2);
      if (!this.dispatchEvent(evt) || evt.defaultPrevented) e2.preventDefault();
      if (evt.isPropagationStopped) {
        e2.stopPropagation();
        e2.stopImmediatePropagation();
      }
    };
    /**
    * 是否为非逐词歌词
    * @internal
    */
    _getIsNonDynamic() {
      return this.isNonDynamic;
    }
    _baseFontSize = Number.parseFloat(getComputedStyle(this.element).fontSize);
    get baseFontSize() {
      return this._baseFontSize;
    }
    constructor() {
      super();
      this.onResize();
      this.element.classList.add("amll-lyric-player", "dom");
      if (this.disableSpring) this.element.classList.add(lyric_player_module_default.disableSpring);
      this.element.addEventListener("click", this.onMouseEventHandler, { signal: this.abortController.signal });
      this.element.addEventListener("contextmenu", this.onMouseEventHandler, { signal: this.abortController.signal });
    }
    rebuildStyle() {
    }
    setWordFadeWidth(value = 0.5) {
      super.setWordFadeWidth(value);
      for (const group of this.currentLyricGroups) {
        group.mainLine.updateMaskImageSync();
        group.bgLine?.updateMaskImageSync();
      }
    }
    /**
    * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
    * @param lines 歌词数组
    * @param initialTime 初始时间，默认为 0
    */
    setLyricLines(lines, initialTime = 0) {
      super.setLyricLines(lines, initialTime);
      if (this.hasDuetLine) this.element.classList.add(lyric_player_module_default.hasDuetLine);
      else this.element.classList.remove(lyric_player_module_default.hasDuetLine);
      if (!this.supportMaskImage) this.element.style.setProperty("--amll-player-time", `${initialTime}`);
      for (const group of this.currentLyricGroups) group.dispose();
      this.currentLyricGroups = [];
      let currentGroup = null;
      for (let i2 = 0; i2 < this.processedLines.length; i2++) {
        const line = this.processedLines[i2];
        const lineEl = new LyricLineEl(this, line);
        this.lyricLinesIndexes.set(lineEl, i2);
        if (!line.isBG || !currentGroup) {
          currentGroup = new LyricLineGroup(this, lineEl);
          this.currentLyricGroups.push(currentGroup);
          this.lyricGroupElementMap.set(currentGroup.element, currentGroup);
        } else currentGroup.addBgLine(lineEl);
      }
      this.setLinePosXSpringParams({});
      this.setLinePosYSpringParams({});
      this.setLineScaleSpringParams({});
      this.setCurrentTime(initialTime, true);
      this.calcLayout(true);
      this.update(0);
    }
    pause() {
      super.pause();
      this.element.classList.remove(lyric_player_module_default.playing);
      this.interludeDots.pause();
      for (const group of this.currentLyricGroups) {
        group.mainLine.pause();
        group.bgLine?.pause();
      }
    }
    resume() {
      super.resume();
      this.element.classList.add(lyric_player_module_default.playing);
      this.interludeDots.resume();
      for (const group of this.currentLyricGroups) {
        group.mainLine.resume();
        group.bgLine?.resume();
      }
    }
    update(delta = 0) {
      if (!this.timelineState.initialLayoutFinished) return;
      super.update(delta);
      if (!this.supportMaskImage) this.element.style.setProperty("--amll-player-time", `${this.timelineState.currentTime}`);
      if (!this.isPageVisible) return;
      const deltaS = delta / 1e3;
      for (const group of this.currentLyricGroups) group.update(deltaS);
    }
    dispose() {
      super.dispose();
      this.abortController.abort();
      this.element.remove();
      for (const group of this.currentLyricGroups) group.dispose();
      this.bottomLine.dispose();
      this.interludeDots.dispose();
    }
  };

  // node_modules/@applemusic-like-lyrics/core/dist/style.css
  var style_default = ".amll-lyric-player {\n  width: 100%;\n  max-width: 100%;\n  height: 100%;\n  color: var(--amll-lp-color, white);\n  contain: strict;\n  mix-blend-mode: plus-lighter;\n  font-size: var(--amll-lp-font-size, max(max(5vh, 2.5vw), 12px));\n  overflow: hidden;\n\n  @media screen and (width <= 768px) {\n    font-size: var(--amll-lp-font-size, max(8vw, 12px));\n  }\n\n  &.dom {\n    --amll-lp-line-width-aspect: .8;\n    --amll-lp-line-padding-x: 1em;\n    --amll-lp-bg-line-scale: .7;\n    user-select: none;\n    box-sizing: content-box;\n    z-index: 1;\n    line-height: 1.2;\n  }\n}\n\n@media screen and (width <= 768px) {\n  .amll-lyric-player {\n    --amll-lp-line-width-aspect: 1;\n    --amll-lp-line-padding-x: 0;\n  }\n}\n.FmKaba_lyricLineWrapper {\n  box-sizing: border-box;\n  width: 100%;\n  padding: .4em var(--lyric-line-padding-x);\n  will-change: transform, opacity, filter;\n  border-radius: .25em;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: .3em;\n  transition: opacity .4s, filter .4s, background-color .25s;\n  display: flex;\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  &:hover {\n    background-color: var(--amll-lp-hover-bg-color, #fff1);\n  }\n\n  &:active {\n    background-color: var(--amll-lp-hover-bg-color, #ffffff05);\n  }\n}\n\n.FmKaba_lyricLine {\n  box-sizing: border-box;\n  width: var(--amll-lp-width, 100%);\n  min-width: var(--amll-lp-width, 100%);\n  max-width: var(--amll-lp-width, 100%);\n  contain: layout style paint;\n  content-visibility: auto;\n  contain-intrinsic-size: auto 40px;\n  backface-visibility: hidden;\n  transform-origin: 0;\n  will-change: transform, filter, opacity;\n  height: fit-content;\n  margin: -.2em;\n  padding: .2em;\n  transition: box-shadow .25s;\n  position: relative;\n}\n\n.FmKaba_lyricDuetLine {\n  text-align: right;\n  transform-origin: 100%;\n}\n\n.FmKaba_lyricMainLine {\n  contain: layout style;\n  margin: -1em;\n  padding: 1em;\n  transition: opacity .3s .1s;\n\n  & span {\n    text-align: start;\n    vertical-align: bottom;\n    display: inline-block;\n  }\n\n  & .FmKaba_romanWord {\n    padding-inline-end: .3em;\n    font-size: .5em;\n    line-height: 1em;\n    display: flex;\n  }\n\n  & .FmKaba_rubyWord {\n    justify-content: center;\n    min-height: 1em;\n    font-size: .5em;\n    line-height: 1em;\n    display: flex;\n  }\n\n  & .FmKaba_wordWithRuby {\n    vertical-align: bottom;\n    flex-direction: column;\n    align-items: center;\n    display: inline-flex;\n  }\n\n  & .FmKaba_wordBody {\n    flex-direction: column;\n    align-items: center;\n    display: flex;\n  }\n\n  & > span, & span.FmKaba_emphasizeWrapper {\n    white-space: pre-wrap;\n    vertical-align: bottom;\n    will-change: transform, text-shadow;\n    contain: layout style;\n    margin: -1em;\n    padding: 1em;\n    display: inline-block;\n\n    &.FmKaba_emphasize, & span.FmKaba_emphasize {\n      backface-visibility: hidden;\n      margin: -1em;\n      padding: 1em;\n\n      & > span {\n        will-change: transform, text-shadow;\n        backface-visibility: hidden;\n        margin: -1em;\n        padding: 1em;\n      }\n    }\n  }\n}\n\n.FmKaba_lyricBgLine {\n  opacity: .4;\n  font-size: max(calc(1em * var(--amll-lp-bg-line-scale, .7)), 10px);\n  transition: background-color .25s, box-shadow .25s;\n\n  & .FmKaba_lyricMainLine {\n    padding: 1.2em 1em;\n  }\n\n  &.FmKaba_active {\n    opacity: .4;\n    transition: background-color .25s, box-shadow .25s;\n  }\n}\n\n.FmKaba_lyricSubLine {\n  opacity: .3;\n  font-size: max(.5em, 10px);\n  line-height: 1.5em;\n  transition: opacity .2s .25s;\n\n  @supports (mix-blend-mode: plus-lighter) {\n    opacity: .3;\n  }\n}\n\n.FmKaba_bottomLine {\n  cursor: default;\n  padding-top: 0;\n  padding-bottom: 0;\n  line-height: 1.8em;\n\n  &:empty {\n    height: 0;\n    margin: 0;\n    padding: 0;\n    display: none;\n  }\n}\n\n.FmKaba_bgWrapper {\n  top: 100%;\n  left: var(--lyric-line-padding-x);\n  z-index: -1;\n  align-items: inherit;\n  width: calc(100% - var(--lyric-line-padding-x) * 2);\n  visibility: visible;\n  pointer-events: auto;\n  opacity: 0;\n  transform-origin: 0 0;\n  flex-direction: column;\n  transition: opacity .3s;\n  display: flex;\n  position: absolute;\n}\n\n.FmKaba_bgWrapperTop {\n  transform-origin: 0 100%;\n  width: 100%;\n  margin-top: -999px;\n  position: relative;\n  top: auto;\n  bottom: auto;\n  left: 0;\n}\n\n.FmKaba_bgWrapperActive {\n  opacity: 1;\n  width: 100%;\n  position: relative;\n  top: auto;\n  bottom: auto;\n  left: 0;\n}\n\n.FmKaba_bgWrapperHidden {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.FmKaba_interludeDots {\n  opacity: 0;\n  transform-origin: center;\n  gap: .25em;\n  width: fit-content;\n  height: clamp(.5em, 1vh, 3em);\n  padding: 2.5% .75em;\n  transition: opacity .25s;\n  display: flex;\n  position: absolute;\n  left: 0;\n\n  &.FmKaba_enabled {\n    opacity: 1;\n  }\n\n  & > * {\n    background-color: var(--amll-lp-color, white);\n    aspect-ratio: 1;\n    border-radius: 50%;\n    width: clamp(.5em, 1vh, 3em);\n    height: clamp(.5em, 1vh, 3em);\n    margin-right: 4px;\n    display: inline-block;\n  }\n\n  &.FmKaba_duet {\n    transform-origin: center;\n    right: 0;\n  }\n}\n\n.FmKaba_disableSpring > *, .FmKaba_disableSpring .FmKaba_lyricLine {\n  transition: filter .25s, transform .5s, background-color .25s, box-shadow .25s;\n}\n\n.FmKaba_tmpDisableTransition {\n  transition: none !important;\n}\n\n.amll-lyric-player {\n  --lyric-line-padding-x: 1em;\n\n  @media screen and (width <= 500px) {\n    --lyric-line-padding-x: 20px;\n  }\n\n  &:hover .FmKaba_lyricLine, &:hover .FmKaba_lyricLineWrapper {\n    filter: unset !important;\n  }\n\n  &:not(.FmKaba_playing) .FmKaba_bgWrapper {\n    opacity: 1;\n    width: 100%;\n    position: relative;\n    top: auto;\n    bottom: auto;\n    left: 0;\n  }\n\n  &.FmKaba_hasDuetLine {\n    & .FmKaba_lyricLine:not(.FmKaba_lyricDuetLine) {\n      padding-right: 15%;\n    }\n\n    & .FmKaba_lyricDuetLine {\n      padding-left: 15%;\n    }\n\n    & .FmKaba_lyricLineWrapper:has(.FmKaba_lyricDuetLine) {\n      align-items: flex-end;\n\n      & .FmKaba_bgWrapper {\n        transform-origin: 100% 0;\n      }\n\n      & .FmKaba_bgWrapperTop {\n        transform-origin: 100% 100%;\n      }\n    }\n  }\n}\n";

  // src/amll-entry.js
  window.AMLL = { LyricPlayer: DomLyricPlayer, LayoutAlignAnchor, css: style_default };
})();
/*! Bundled license information:

punycode/punycode.js:
  (*! https://mths.be/punycode v1.4.1 by @mathias *)

@pixi/filter-bulge-pinch/dist/filter-bulge-pinch.mjs:
  (*!
   * @pixi/filter-bulge-pinch - v5.1.1
   * Compiled Wed, 11 Jan 2023 23:10:33 UTC
   *
   * @pixi/filter-bulge-pinch is licensed under the MIT License.
   * http://www.opensource.org/licenses/mit-license
   *)
*/
