/**
Janis Javascript Animation Framework
Copyright (C) 2011 by Michael McTiernan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following condition(s):

You must not be a complete anus.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**/


var Janis = function(target) {
    var i, collection = [], selectedElements, self = this;
    if (target instanceof NodeList || target instanceof HTMLCollection) {
        for (i = 0; i < target.length; ++i) {
            collection.push(target[i]);
        }
    } else if (typeof target === "string") {
        selectedElements = document.querySelectorAll(target);
        for (i = 0; i < selectedElements.length; ++i) {
            collection.push(selectedElements[i]);
        }
    } else if (!(target instanceof Array)) {
        collection.push(target);
    } else {
        collection = target;
    }
    return new Janis.pt.init(collection);
};


Janis.config = {
    easing: "ease",
    duration: 0,
    delay: 0
};

Janis.pt = Janis.prototype = {
    callbacks: {},
    collection: [],
    counter: 0,
    p: 0,
    b: "",
    u: 'undefined',
    t: 'transition',
    init: function(collection) {
        var div, style = "", props = ["moz", "o", "webkit", "ms"], 
            pre = Janis.config.pre, b = Janis.config.bro, self = this, transition=self.t;
        
        self.collection = collection;
        self.loopQueue = [];
        self.chainQueue = [];
        if (typeof pre === self.u) {
            div = document.createElement('div');
            props.forEach(function(prop) {
                div.style[self.cap(prop)+"Transition"] = "all 1s ease";
                if (div.style[self.cap(prop)+"TransitionProperty"]) {
                    pre = self.cap(prop) + "Transition";
                }
            });
            pre = pre ? pre : transition;
            Janis.config.pre = pre;
        }
        props.forEach(function(prop) {
            if (pre.toLowerCase().indexOf(prop.toLowerCase()) === 0) {
                self.b = "-"+prop+"-";
            }
        });
        
        self.p = pre;
        self.collection.forEach(function(el) {
            el.style[pre] = "all 1s ease";
        });
        return self;
    },
    isArray: function(variable) {
        return variable instanceof Array;
    },
    cap: function(str) {
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
    },
    formatStyle: function(style) {
        var ret = "", self = this;
        style.split("-").forEach(function(value, idx) {
            ret += idx ? self.cap(value) : value.toLowerCase();
        });
        return ret;
    },
    _animate: function(idx, opts) {
        var e, value, self = this, setStyles;
        opts.index = ++self.counter;
        if (typeof opts.duration === self.u) {
            opts.duration = Janis.config.duration;
        }
        if (typeof opts.delay === self.u) {
            opts.delay = Janis.config.delay;
        }
        if (typeof opts.easing === self.u) {
            opts.easing = Janis.config.easing;
        }
        if (typeof opts.callback === self.u) {
            opts.callback = function() {
                return;
            };
        }
        if (!self.isArray(opts.callback)) {
            opts.callback = [opts.callback];
        }
            
        self.callbacks[opts.index] = opts.callback;

        e = self.collection[idx];

        if (opts.duration == 0) {
            e.style[self.p] = "none";
        } else {
            e.style[self.p] = "all " + opts.duration + "ms " + opts.easing;
        }
        
        setStyles = function() {
            var cssProp;
            for (cssProp in opts.css) {
                if (opts.css.hasOwnProperty(cssProp)) {
                    value = opts.css[cssProp];
                    cssProp = self.formatStyle(cssProp);
                    e.style[cssProp] = value;
                }
            }
        }
        
        if (!opts.delay) {
            setStyles();
        } else {
            setTimeout(setStyles, opts.delay);
        }

        setTimeout(function() {
            self.callbacks[opts.index].forEach(function(callback) {
                if (typeof callback === "function") {
                    callback(self, opts);
                } else if (self.isArray(callback)) {
                    callback[0].apply(self, callback[1]);
                }
            });
        }, opts.delay + opts.duration + 1);
        
        return self;
    },
    animate: function(animations, commit) {
        var i, lastIdx = -1, self = this;
        if (!self.isArray(animations)) {
            animations = [animations];
            for (i = 1; i < self.collection.length; ++i) {
                animations.push(animations[0]);
            }
        }

        if (self.isChained && !commit) {
            self.chainQueue.push(["animate", [animations, 1]]);
            return self;
        }

        self.collection.forEach(function(el, idx) {
            var key, animation, config = {css: {}}, transform = "";
            if (!animations[idx] && lastIdx === -1) {
                return self;
            }
            
            if (!animations[idx]) {
                animation = animations[lastIdx];
            } else {
                animation = animations[idx];
                lastIdx = idx;
            }
            
            for (key in animation) {
                if (animation.hasOwnProperty(key)) {
                    if (key === "duration" || key === "delay" || key === "easing" || key === "callback") {
                        config[key] = animation[key];
                    } else if (key === "rotate" || key.indexOf("translate") === 0 || key.indexOf("skew") === 0) {
                        transform += key + "("+animation[key]+") ";
                    } else if (key === "transform") {
                        transform += animation[key];
                    } else if (key === "transform-origin") {
                        config.css[self.b+key] = animation[key];
                    } else {
                        config.css[key] = animation[key];
                    }
                }
            }
            if (transform.length) {
                config.css[self.b+"transform"] = transform;
            }
            
            self._animate(idx, config);
        });

        return self;
    },
    maxDuration: function(animations) {
        var maxDuration = -1,
            totalTime = -1,
            self = this;
            
        animations.forEach(function(el) {
            if (typeof el.duration === self.u) {
                el.duration = Janis.config.duration;
            }
            if (typeof el.delay === self.u) {
                el.delay = Janis.config.delay;
            }
            totalTime = el.duration + el.delay;
            if ( totalTime > maxDuration ) {
                maxDuration = totalTime;
            }
        });
        return maxDuration;
    },
    isChained: 0,
    chainQueue: [],
    chain: function(/* void */) {
        var self = this;
        self.isChained = 1;
        self.chainQueue = [];
        return self;
    },
    execute: function() {
        var self = this;
        if (!self.chainQueue.length) {
            return self;
        }
        return self.loop(1);
    },
    next: function(returnOperation) {
        var self = this, operation = self.chainQueue.shift();
        if (!operation) {
            return returnOperation ? [] : self;
        }
        self[operation[0]].apply(self, operation[1]);
        return returnOperation ? operation : self;
    },
    loopCounter: 0,
    loopQueue: [],
    loop: function(howMany, skipSetup) {
        var self = this, operation, maxDuration;

        self.isChained = 0;
        if (!skipSetup) {
            if (!self.chainQueue.length) {
                return self;
            }
            
            if (typeof howMany === self.u) {
                howMany = -1;
            }
            self.loopCounter = howMany;
            self.loopQueue = self.chainQueue.concat();
        }

        if (!self.chainQueue.length && self.loopQueue.length) {
            self.chainQueue = self.loopQueue.concat();
            if (self.loopCounter > -1) {
                --self.loopCounter;
            }
        }
        
        if (self.loopCounter === 0 || !self.chainQueue.length) {
            return self;            
        }

        if (!self.paused) {
            operation = self.next(1);
            if (operation.length) {
                maxDuration = self.maxDuration(operation[1][0]);
                setTimeout(function() {
                    self.loop(self.loopCounter, 1);
                }, maxDuration);
            }
        }
        return self;
    },
    paused: 0,
    pause: function() {
        var self = this;
        self.paused = 1;
        return self;
    },
    play: function() {
        var self = this;
        self.paused = 0;
        self.loop(self.loopCounter, 1);
        return self;
    }
};

Janis.pt.init.prototype = Janis.pt;

