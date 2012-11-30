protolus-router.js
===========

a lightweight URL router supporting a wide variety of usage patterns.

Creation
--------

    var ProtolusRouter = require('protolus-router');
    var router = new ProtolusRouter({});

Options are:

1. **argumentNames** : an array of strings to be used as keys when using the regex to function mode
2. **onMissing** : a callback for when no route is found
3. **ini** preload a particular INI file

Function to Function
--------------------
Use two functions, one to match the URL and the other to perform the action, arguments may be handled manually in either function. the action function also may return a value which is passed to the callback of the parse function (if a callback is passed).

    router.addRoute(function(url){
        //return a truthy value representing whether this url has been selected
    }, function(returnedValue){
        //use the incoming truthy value to either:
        //1) serve the request
        //2) return a value which will be passed to .route()s callback
    });

Regex to Function
-----------------
Use two functions, one to match the URL and the other to perform the action, arguments may be handled manually in either function. This function may also return a value for the optional parse callback.

    router.addRoute(\(users)/([A-Za-z][A-Za-z0-9]{3,16})/([0-9]+)\i, function(user, id, postId){
        //serve or return
    });

    or, if I had set argumentNames = ['user', 'id', 'postId'];
    
    router.addRoute(\(users)/([A-Za-z][A-Za-z0-9]{3,16})/([0-9]+)\i, function(args){
        // args = {user:'', id:'', postId:''}
        //serve or return
    });
    
    

INI Parsed
----------
You may also specify an INI file which acts as a list of rewrite rules, each line is of the form:

    articles/*/# = "articles?name=*&page=*"
    
You can either use the option in the constructor or call the INI function with or without a callback(any routes will be queued until the async load is complete)

    router.INI('my/awesome/config.ini', function(){
        //it's done!
    });
    
This will **always** require the callback to be used on the routed function, which will pass back the routed URL 

    router.route(url, function(routedURL){
        //do stuff here
    });
    
You can mix modes at will.
    
Enjoy,

-Abbey Hawk Sparrow