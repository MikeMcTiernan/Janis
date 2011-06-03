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
    var i, collection = [], selectedElements;
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

Janis.formatStyle = function(style) {
    var ret = "";
    style.split("-").forEach(function(value, idx) {
        ret += idx ? value.charAt(0).toUpperCase() + value.substr(1).toLowerCase() : value.toLowerCase();
    }, this);
    return ret;
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
        var div, style = "", key;
        
        this.collection = collection;
        this.loopQueue = [];
        this.chainQueue = [];
        if (typeof Janis.config.browserProperty === 'undefined') {
            Janis.config.browserProperty = "transition";
            div = document.createElement('div');
            for (key in Janis.config.browserProperties) {
                if (Janis.config.browserProperties.hasOwnProperty(key)) {
                    style += Janis.config.browserProperties[key] + ": width 1s linear;";
                }
            }
            
            div.setAttribute("style", style);
            for (key in Janis.config.browserProperties) {
                if (Janis.config.browserProperties.hasOwnProperty(key) && div.style[key]) {
                    Janis.config.browserProperty = key;
                }
            }
        }
        this.collection.forEach(function(el) {
            el.style[Janis.config.browserProperty + 'Property'] = "*";
            el.style[Janis.config.browserProperty + 'Duration'] = Janis.config.duration + "ms";
        }, this);
        return this;
    },
    _animate: function(idx, opts) {
        var el, value, self = this, setStyles;
    
        opts.index = ++this.counter;
        if (typeof opts.duration === "undefined") {
            opts.duration = Janis.config.duration;
        }
        if (typeof opts.delay === "undefined") {
            opts.delay = Janis.config.delay;
        }
        if (typeof opts.easing === "undefined") {
            opts.easing = Janis.config.easing;
        }
        if (typeof opts.callback === "undefined") {
            opts.callback = function() {
                return;
            };
        }
        if (!(opts.callback instanceof Array)) {
            opts.callback = [opts.callback];
        }
            
        this.callbacks[opts.index] = opts.callback;

        el = this.collection[idx];
        el.style[Janis.config.browserProperty + "Duration"] = opts.duration + "ms";
        el.style[Janis.config.browserProperty + "TimingFunction"] = opts.easing;
    
        setStyles = function() {
            var cssProp;
            for (cssProp in opts.css) {
                if (opts.css.hasOwnProperty(cssProp)) {
                    value = opts.css[cssProp];
                    cssProp = Janis.formatStyle(cssProp);
                    el.style[cssProp] = value;
                }
            }
        };
        
        if (!opts.delay) {
            setStyles(opts);
        } else {
            window.setTimeout(setStyles, opts.delay);
        }

        window.setTimeout(function() {
            self.callbacks[opts.index].forEach(function(callback) {
                if (typeof callback === "function") {
                    callback(self, opts);
                } else if (callback instanceof Array) {
                    callback[0].apply(self, callback[1]);
                }
            });
        }, opts.delay + opts.duration + 1);
        
        return this;
    },
    animate: function(animations, commit) {
        var i, lastIdx = -1;
        if (!(animations instanceof Array)) {
            animations = [animations];
            for (i = 1; i < this.collection.length; ++i) {
                animations.push(animations[0]);
            }
        }

        if (this.isChained && !commit) {
            this.chainQueue.push(["animate", [animations, true]]);
            return this;
        }

        this.collection.forEach(function(el, idx) {
            var key, animation, config = {css: {}};
            if (!animations[idx] && lastIdx === -1) {
                return this;
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
                    } else {
                        config.css[key] = animation[key];
                    }
                }
            }
            
            this._animate(idx, config);
        }, this);

        return this;
    },
    maxDuration: function(animations) {
        var maxDuration = -1,
            totalTime = -1,
            isTimeout = false;
            
        animations.forEach(function(el) {
            if (typeof el.duration === "undefined") {
                el.duration = Janis.config.duration;
            }
            if (typeof el.delay === "undefined") {
                el.delay = Janis.config.delay;
            }
            totalTime = el.duration + el.delay;
            if ( totalTime > maxDuration ) {
                maxDuration = totalTime;
                isTimeout = true;
            }
        }, this);
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
        if (!this.chainQueue.length) {
            return this;
        }
        return this.loop(1);
    },
    next: function(returnOperation) {
        var operation = this.chainQueue.shift(), self = this;
        if (!operation) {
            return returnOperation ? [] : this;
        }
        self[operation[0]].apply(self, operation[1]);
        return returnOperation ? operation : this;
    },
    loopCounter: 0,
    loopQueue: [],
    loop: function(howMany, skipSetup) {
        var self = this, operation, maxDuration;

        this.isChained = false;
        if (!skipSetup) {
            if (!this.chainQueue.length) {
                return this;
            }
            
            if (typeof howMany === 'undefined') {
                howMany = -1;
            }
            this.loopCounter = howMany;
            this.loopQueue = this.chainQueue.concat();
        }

        if (!this.chainQueue.length && this.loopQueue.length) {
            this.chainQueue = this.loopQueue.concat();
            if (this.loopCounter > -1) {
                --this.loopCounter;
            }
        }
        
        if (this.loopCounter === 0 || !this.chainQueue.length) {
            return this;            
        }

        if (!this.isPaused) {
            operation = this.next(true);
            if (operation.length) {
                maxDuration = this.maxDuration(operation[1][0]);
                window.setTimeout(function() {
                    self.loop(self.loopCounter, true);
                }, maxDuration);
            }
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

