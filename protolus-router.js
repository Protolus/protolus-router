var prime = require('prime');
var type = require('prime/util/type');
var array = require('prime/es5/array');
var fn = require('prime/es5/function');
var regexp = require('prime/es5/regexp');
var Emitter = require('prime/util/emitter');
var fs = require('fs');

var EnhancedEmitter = prime({
    inherits: Emitter,
    once : function(type, fn){
        var ob = this;
        function cb(){
            ob.off(type, cb);
            fn();
        }
        this.on(type, cb);
    }
});

var FileLoader = prime({
    loadQueue: [],
    loadFileCount: 0, 
    loadFile : function(type, callback){
        this.loadFileCount++;
        fs.readFile(fileName, 'utf8', fn.bind(function(data){
            this.loadFileCount--;
            if(callback) callback(data);
            if(this.loadQueue.length > 0 && this.loadFileCount == 0){
                var callbacks = this.loadQueue;
                this.loadQueue = [];
                array.forEach(callbacks, function(callback){
                    callback();
                });
            }
        }, this));
    },
    fileLoadComplete : function(callback){
        if(this.loadFileCount === 0) callback();
        else this.loadQueue.push(callback);
    }
});

module.exports = prime({ //the default engine
    routes : [],
    constructor : function(options){
        this.browser = require("browser");
        this.options = options;
        if(this.options.ini) this.INI(this.options.ini);
    },
    addRoute : function(test, callback){
        if(typeOf(test) == 'string' || typeOf(test) == 'regex'){
            var regex;
            if(typeOf(test) == 'regex') regex = test;
            else regex = new RegExp(test);
            if(this.options.argumentNames){
                var names = this.options.argumentNames;
                test = function(url){
                    var matches = url.match(regex);
                    if(matches){
                        var args = {};
                        var lastName;
                        array.forEach(names, function(name, index){
                            args[name] = matches[index];
                            lastName = name;
                        });
                        return args;
                    }else return false;
                }
            }else{
                test = function(url){
                    var matches = url.match(regex);
                    if(matches) return matches;
                    else return false;
                }
            }
        }
        this.routes.push({
            test : test,
            callback : callback
        });
    },
    parseINI : function(text, order){
        var inQuote = false;
        var inComment = false;
        var isAssigning = false;
        var inGrouping = false;
        var buffer = '';
        var label = '';
        var group = null;
        var currentQuoteType = '';
        var results = [];
        var ch;
        for(var lcv=0; lcv < text.length; lcv++){
            ch = text[lcv];
            if(buffer == '' && ch == '['){
                inGrouping = true;
            }
            if(inGrouping){
                if(ch == ']'){
                    group = buffer;
                    buffer = '';
                    inGrouping = false;
                }else if(ch != '[') buffer += ch;
                continue;
            }
            if(inComment){
                if(ch == "\n"){
                    inComment = false;
                    if(isAssigning){
                        if(group == null){
                            if(label != '') results[label] = buffer;
                        }else{
                            if(!results[group]) results[group] = {};
                            if(label != '') results[group][label] = buffer;
                        }
                        label = buffer = '';
                    }
                }else continue;
            }
            if(!inQuote && !inComment){ //we're reading chars
                if(ch == ';'){
                    inComment = true;
                    continue;
                }
                if(ch == '\'' || ch == '"'){
                    inQuote = true;
                    currentQuoteType = ch;
                    continue;
                }
                if(!isAssigning && ch == '='){
                    label = buffer;
                    buffer = '';
                    isAssigning = true;
                }else{
                    if(ch == "\n"){
                        isAssigning = false;
                        if(group == null){
                            if(label != '') results[results.length] = {key:label,value:buffer};
                        }else{
                            if(results.length == 0 || (results[results.length-1].key != group)) results[results.length] = {key:group,value:[]};
                            if(label != '') results[results.length-1]['value'][results[results.length-1]['value'].length] = {key:label, value:buffer};
                        }
                        label = buffer = '';
                    }else{
                        if(ch != ' ') buffer += ch;
                    }
                }
            }else{
                if(inQuote){ // keep reading until we see our quote end
                    if(ch == currentQuoteType){
                        inQuote = false;
                    }else{
                        buffer += ch;
                    }
                }
            }
        }
        if(group == null){
            if(label != ''){
                results[results.length] = {key:label,value:buffer};
            }
        }else{
            if(results.length == 0 || (results[results.length-1].key != group)) results[results.length] = {key:group,value:[]};
            if(label != '') results[results.length-1]['value'][results[results.length-1]['value'].length] = {key:label, value:buffer};
        }
        return results;
    },
    INI : function(fileName, callback){
        this.loadFile(fileName, function(data){
            var parseTree = this.parseINI();
            var routes = (parseTree && parseTree[0] && parseTree[0].value)?parseTree[0].value:[];
            array.each(routes, fn.bind(function(route, index){
                if(routes[index].key == '%') routes[index].key = '(.*?)'
                else routes[index].key = routes[index].key.replace(/\*/g, '(.*?)').replace('#', '([0-9]*?)');
                routes[index].regex = new RegExp('^'+routes[index].key+'$');
                count = 1;
                var pos = routes[index].value.indexOf('*');
                while(pos != -1){
                    routes[index].value = routes[index].value.substring(0, pos)+'$'+(count++)+routes[index].value.substring(pos+1);
                    pos = routes[index].value.indexOf('*');
                }
                this.addRoute(function(url){
                    if(url.match(routes[index].regex)){
                        return url.replace(routes[index].regex, routes[index].value);
                    }else return false;
                }, function(routed){
                    return routed;
                });
            }));
        });
    },
    route : function(url, callback){
        this.fileLoadComplete(fn.bind(function(){
            var found;
            var result;
            array.forEach(this.routes, function(route){
                if(found) return;
                found = route.test(url);
                if(found) result = route.callback.apply(this, (found===false?[]:found));
                if(callback) callback(result || url);
            });
            if(!found && this.options.onMissing) this.options.onMissing(url);
        }, this);
    },
    terminate : function(){
    }
}).implement(EnhancedEmitter).implement(FileLoader);