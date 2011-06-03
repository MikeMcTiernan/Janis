Janis Javascript Animation Framework 0.1
========================================

Janis is a lightweight Javascript framework that provides simple animations via 
CSS transitions for modern browsers on the web as well as mobile devices. It is
not designed to solve everyone's problems--it's simply designed to organize 
commonly used methods of animating DOM elements in Javascript. It is released
under the MIT license and is free to re-use or modify in any way as long as you
keep the copyright notice in the file.


Usage
----------------------------------------
Janus uses a design pattern similar to jQuery--you may call it as a function,
passing in the elements you wish to interact with and it will return a Janis
object you can perform animations with. For instance:

    var myElement = document.getElementById("somediv");
    Janis(myElement).animate({
        "left": "300px",
        "duration": 1000
    });
    
Will animate `<div id="somediv">` to an x position of 300 over 1000 ms. The first
and only argument to the Janis() function can be an HTML Element, an array of 
HTML Elements, a NodeList/HTMLCollection, or a CSS selector.

Janis also supports chained animations. To run animations back to back in order:

    var myAnimation = Janis(".my-div");
    myAnimation.chain().animate({
        "width": "100px",
        "height": "100px",
        "duration": 500
    }).animate({
        "width": "50px",
        "height": "50px",
        "duration": 500
    });

    // Execute the animation!
    myAnimation.execute();

This will animate any element with a class name of "my-div" to 100x100, followed by
animating the matching elements to 50x50. If we wanted to, we could loop this
chained animation by running the `loop()` method. The following syntax tells Janis 
to loop our animation chain 10 times:

    myAnimation.loop(10);

Alternatively, we could set the chain to loop infinitely by passing -1 as the argument,
or by simply leaving the argument undefined. We can also stop and start our animation at
any time:

    myAnimation.pause();
    myAnimation.play();

Please note, however, that the pause function does not stop the animation in
place. The element will finish its current step before pausing. This is a current
limitation in the CSS Transition specification, but I'm working out a clever 
way to address this.


Configuration and Defaults
------------------------------------------
This isn't the most elegant solution, but you can currently set default properties
thusly:

    Janis.config.duration = 1000; // Default 0
    Janis.config.delay = 0; // Default 0
    Janis.config.easing = "ease-in-out"; // Default 'linear'
    Janis.config.browserProperty = 'WebkitTransition'; // Auto-detects by default


Roadmap
------------------------------------------
*   Engineer method of pausing and resuming mid-transition
*   Make demos and examples
*   Develop better way (read: any way) of handling CSS Transforms
*   Enable specifying functions to determine value of properties
    ({"left": function(el) { return el.offsetLeft / 2; }})
*   Enable relative properties ({"left": "+10px"})
*   Dream up more features
