//todo: events support
var prime = require('prime');
var Class = require('Classy');
var type = require('prime/util/type');
var array = require('prime/es5/array');
var fn = require('prime/es5/function');
var regexp = require('prime/es5/regexp');
var Emitter = require('prime/util/emitter');
var fs = require('fs');

var ProtolusRouter = Class({
    Implements : [Emitter],
    //EnhancedEmitter
    once : function(type, fn){
        var ob = this;
        function cb(){
            ob.off(type, cb);
            fn();
        }
        this.on(type, cb);
    },
    //FileLoader
    loadQueue: [],
    loadFileCount: 0, 
    loadFile : function(fileName, callback){
        this.loadFileCount++;
        fs.readFile(fileName, 'utf8', fn.bind(function(err, data){
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
    },
    //end
    routes : [],
    groupings : {},
    initialize : function(options){
        if(!options) options = {};
        this.options = options;
        if(this.options.ini) this.INI(this.options.ini);
    },
    addRoute : function(test){
        var args = Array.prototype.slice.call(arguments, 0);
        var callback = args.pop();
        var group = args.length == 2? args.pop():'*';
        if(type(group) == 'string') group = [group];
        if(type(test) == 'string' || type(test) == 'regexp'){
            var regex;
            if(type(test) == 'regexp') regex = test;
            if(type(test) == 'string'){
                if(this.options.simpleSelectors === false){
                    regex = new RegExp(test);
                }else{
                    regex = this.stringToRegex(test);
                }
            }
            if(this.options.argumentNames){
                var names = this.options.argumentNames;
                test = function(url){
                    var matches = url.match(regex);
                    if(matches){
                        var args = {};
                        var lastName;
                        if(matches.length > 1) matches.shift();
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
        if(type(callback) == 'string'){
            var replacement = this.stringToReplacement(callback);
            test = function(url){
                if(url.match(regex)){
                    return url.replace(regex, replacement);
                }else return false;
            }
            callback = function(url){
                return url;
            }
        }
        var vals = {
            test : test,
            callback : callback,
            group : group,
            id : Math.floor(Math.random()*1000000)
        };
        this.routes.push(vals);
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
    stringToRegex : function(selector){
        if(selector == '%') selector = '(.*?)'
        else selector = selector.replace(/\*/g, '(.[A-Za-z0-9_-]+?)').replace('#', '([0-9]*?)');
        return new RegExp('^'+selector+'$');
    },
    stringToReplacement : function(selector){
        var count = 1;
        var pos = selector.indexOf('*');
        while(pos != -1){
            selector = selector.substring(0, pos)+'$'+(count++)+selector.substring(pos+1);
            pos = selector.indexOf('*');
        }
        return selector;
    },
    INI : function(fileName, callback){
        this.loadFile(fileName, fn.bind(function(data){
            var parseTree = this.parseINI(data);
            array.forEach(parseTree, fn.bind(function(group){
                array.forEach(group.value, fn.bind(function(route, index){
                    this.addRoute(group.value[index].key, group.key, group.value[index].value);
                }, this));
            }, this));
        }, this));
        return this;
    },
    route : function(url){
        var args = Array.prototype.slice.call(arguments, 0);
        var callback = type(args[args.length-1]) == 'function'?args.pop():undefined;
        var group = args.length == 2? args.pop():'*';
        this.fileLoadComplete(fn.bind(function(){
            var found;
            var result;
            var called = false;
            array.forEach(this.routes, fn.bind(function(route){
                if(route.group != '*' && array.indexOf(route.group, group) == -1 ) return;
                if(called) return;
                found = route.test(url);
                if(type(found) == 'array'){
                    found.shift(); //remove the full selection if we have subselections
                    delete found.index;
                    delete found.input;
                }
                if(found && route.callback){
                    if(type(found) == 'array') result = route.callback.apply(this, found);
                    else result = route.callback.call(this, found);
                    called = true;
                }
                if(callback && result){
                    if(type(result) == 'array') callback.apply(this, result);
                    else callback(result || url);
                }
            }, this));
            if(!called && this.options.passthru && callback) callback(url); 
            if(!called && this.options.onMissing){
                this.options.onMissing(url);
            }
        }, this));
    }
});
module.exports = ProtolusRouter;