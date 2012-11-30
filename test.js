var assert = require("assert");
describe('ProtolusRouter', function(){
    var ProtolusRouter = require('protolus-router');
    
    describe('addRoute(testFunction, calculateFunction) , route(url, callback)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            router.addRoute(function(url){
                return url == '';
            }, function(){
                return 'index';
            });
            router.route('', function(routed){
                assert.equal('index', routed);
            });
        });
        
        it('Routed URL is correct with group', function(){
            var router = new ProtolusRouter();
            router.addRoute(function(url){
                return url == '';
            }, function(){
                return 'index';
            }, 'test');
            router.route('', 'test', function(routed){
                assert.equal('index', routed);
            });
        });
        
        it('Routed URL is incorrect without group', function(){
            var router = new ProtolusRouter({
                onMissing : function(){
                    assert.equal(true, true);
                }
            });
            router.addRoute(function(url){
                return url == '';
            }, function(){
                return 'index';
            }, 'test');
            router.route('', 'blah', function(routed){
                assert.equal(true, false);
            });
        });
    });
    
    describe('addRoute(testFunction, actionFunction) , route(url)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            var result;
            router.addRoute(function(url){
                return url == '';
            }, function(){
                result = 'index';
            });
            router.route('');
            assert.equal('index', result);
        });
    });
    
    describe('addRoute(regex, calculateFunction) , route(url, callback)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            router.addRoute( /(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i , function(){
                return arguments;
            });
            router.route('users/khrome/42', function(args){
                assert.equal(args[0], 'users');
                assert.equal(args[1], 'khrome');
                assert.equal(args[2], '42');
            });
        });
        
        it('Routed URL is correct with names', function(){
            var router = new ProtolusRouter({
                argumentNames : ['type', 'handle', 'id']
            });
            router.addRoute( /(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i , function(args){
                return args;
            });
            router.route('users/khrome/42', function(args){
                assert.equal(args.type, 'users');
                assert.equal(args.handle, 'khrome');
                assert.equal(args.id, '42');
            });
        });
    });
    
    describe('addRoute(regex, actionFunction) , route(url)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            var result;
            router.addRoute(/(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i, function(type, handle, id){
                result = type+'.js?handle='+handle+'&id='+id;
            });
            router.route('users/khrome/42');
            assert.equal('index', result);
        });
        
        it('Routed URL is correct with names', function(){
            var router = new ProtolusRouter({
                argumentNames : ['type', 'handle', 'id']
            });
            var result;
            router.addRoute(/(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i, function(args){
                result = args.type+'.js?handle='+args.handle+'&id='+args.id;
            });
            router.route('users/khrome/42');
            assert.equal('index', result);
        });
    });
});