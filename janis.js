/**
Janis Javascript Animation Framework
Copyright (C) 2011 by Michael McTiernan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**/
(function() {	
    var Janis = function(target) {
        if (target instanceof NodeList || target instanceof HTMLCollection) {
            collection = new Array();
            for (var i = 0; i < target.length; ++i) {
                collection.push(target[i]);
            }
        } else if (typeof target == "string") {
            collection = new Array();
            tmp = document.querySelectorAll(target);
            for (var i = 0; i < tmp.length; ++i) {
                collection.push(tmp[i]);
            }
        } else if (!(target instanceof Array)) {
            collection = new Array();
            collection.push(target);
        } else {
            collection = target;
        }
        return new Janis.pt.init(collection);
    };
    
    Janis.formatStyle = function(s) {
        r = "";
        s.split("-").forEach(function(v, i) {
            r += i ? v.charAt(0).toUpperCase() + v.substr(1).toLowerCase() : v.toLowerCase();
        });
        return r;
    };
    
    Janis.keys = function(o) {
        var k = [];
        for (var a in o) if (typeof o[a] !== "function") k.push(a);
        return k;
    };
    
    Janis.config = {
        easing: "ease-in-out",
        duration: 0,
        delay: 0,
        browserProperties: {
            "transition" : "transition",
            "MozTransition" : "-moz-transition",
            "OTransition" : "-o-transition",
            "webkitTransition" : "-webkit-transition",
            "MsTransition" : "-ms-transition"
        }
    };
    
    Janis.pt = Janis.prototype = {
        callbacks: {},
        collection: [],
        counter: 0,
        init: function(collection) {
            this.collection = collection;
            if (typeof Janis.config.browserProperty === 'undefined') {
                Janis.config.browserProperty = "transition";
                var div = document.createElement('div'), style = "";
                for (var i in Janis.config.browserProperties) {
                    var browserProperty = Janis.config.browserProperties[i];
                    style += browserProperty + ": width 1s linear;";
                };
                
                div.setAttribute("style", style);
                for (var i in Janis.config.browserProperties) {
                    if (div.style[i]) Janis.config.browserProperty = i;
                };
            }
            this.collection.forEach(function(el, idx) {
                el.style[Janis.config.browserProperty + 'Property'] = "*";
                el.style[Janis.config.browserProperty + 'Duration'] = Janis.config.duration + "ms";
            });
            return this;
        },
        _a: function(idx, opts) {
            opts.index = ++this.counter;
            if (opts.duration === undefined || opts.duration === null)
                opts.duration = Janis.config.duration;
            if (opts.delay === undefined || opts.delay === null)
                opts.delay = Janis.config.delay;
            if (opts.easing === undefined || opts.easing === null)
                opts.easing = Janis.config.easing;
            if (opts.callback === undefined || opts.callback === null)
                opts.callback = function(janis, animation) {
                    return;
                };
            if (!(opts.callback instanceof Array))
                opts.callback = new Array(opts.callback);
                
            this.callbacks[opts['index']] = opts.callback;

            var el = this.collection[idx];
            
            el.style[Janis.config.browserProperty + "Duration"] = opts.duration + "ms";
            el.style[Janis.config.browserProperty + "TimingFunction"] = opts.easing;
        
            var setStyles = function() {
                for (var style in opts.css) {
                    var value = opts.css[style];
                    style = Janis.formatStyle(style);
                    el.style[style] = value;
                };
            };
            
            if (!opts.delay) {
                setStyles(opts);
            } else {
                window.setTimeout(setStyles, opts.delay);
            }

            var self = this;
            window.setTimeout(function() {
                for (var i in self.callbacks[opts['index']]) {
                    if (typeof self.callbacks[opts['index']][i] == "function") {
                        self.callbacks[opts['index']][i](self, opts);
                    } else if (self.callbacks[opts['index']][i] instanceof Array) {
                        self.callbacks[opts['index']][i][0].apply(self, self.callbacks[opts['index']][i][1]);
                    }
                }
            }, opts.delay + opts.duration + 1);
            
            return this;
        },
        animate: function(animations, commit) {
            if (!(animations instanceof Array)) {
                var tmp = new Array();
                for (var i in this.collection) {
                    tmp[i] = animations;
                }
                animations = tmp;
            }

            if (this.isChained && !commit) {
                this.chainQueue.push(["animate", [animations, true]]);
                return this;
            }

            lastIdx = -1;
            for (var idx in this.collection) {
                config = {css: {}};
                if (!animations[idx] && lastIdx === -1) return this;
                if (!animations[idx]) {
                    animation = animations[lastIdx];
                } else {
                    animation = animations[idx];
                    lastIdx = idx;
                }
                
                for (var key in animation) {
                    if (key == "duration" || key == "delay" || key == "easing" || key == "callback") {
                        config[key] = animation[key];
                    } else {
                        config.css[key] = animation[key];
                    }
                }
                
                this._a(idx, config);
            }

            return this;
        },
        maxDuration: function(animations) {
            var maxDuration = -1,
                totalTime = -1,
                isTimeout = false;
                
            animations.forEach(function(el, idx) {
                if (typeof el.duration == "undefined") el.duration = Janis.config.duration;
                if (typeof el.delay == "undefined") el.delay = Janis.config.delay;
                totalTime = (parseInt(el.duration) + parseInt(el.delay));
                if ( totalTime > maxDuration ) {
                    maxDuration = totalTime;
                    isTimeout = true;
                }
            });
            return maxDuration;
        },
        isChained: false,
        chainQueue: [],
        chain: function(/* void */) {
            this.isChained = true;
            this.chainQueue = [];
            return this;
        },
        execute: function() {
            if (!this.chainQueue.length) return this;
            return this.loop(1);
        },
        _n: function(returnOperation) {
            if (!this.chainQueue.length) return returnOperation ? [] : this;
            var operation = this.chainQueue.shift(), self = this;
            self[operation[0]].apply(self, operation[1]);
            return returnOperation ? operation : this;
        },
        loopCounter: 0,
        loopQueue: [],
        loop: function(howMany, skipSetup) {
            var self = this;
            this.isChained = false;
            if (!skipSetup) {
                if (!this.chainQueue.length) return this;
                if (typeof howMany == 'undefined') howMany = -1;
                
                this.loopCounter = parseInt(howMany);
                this.loopQueue = [];
                this.chainQueue.forEach(function(el, idx) {
                    self.loopQueue.push(el);
                });
            }

            if (!this.chainQueue.length && this.loopQueue.length) {
                this.loopQueue.forEach(function(el) {
                    self.chainQueue.push(el);
                });
                if (this.loopCounter > -1) --this.loopCounter;
            }
            if (this.loopCounter === 0 || !this.chainQueue.length) return this;            

            if (!this.isPaused) {
                var operation = this._n(true);
                if (!operation.length) return;
                var maxDuration = this.maxDuration(operation[1][0]);
                window.setTimeout(function() {
                    self.loop(self.loopCounter, true);
                }, maxDuration);
            }
            return this;
        },
        isPaused: false,
        pause: function() {
            this.isPaused = true;
            return this;
        },
        play: function() {
            this.isPaused = false;
            this.loop(this.loopCounter, true);
            return this;
        }
    };
    
    Janis.pt.init.prototype = Janis.pt;
    window['Janis'] = Janis;
})();
