var should = require("should");
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
                should.equal('index', routed);
            });
        });
        
        it('Routed URL is correct with group', function(){
            var router = new ProtolusRouter();
            router.addRoute(function(url){
                return url == '';
            }, 'test', function(){
                return 'index';
            });
            router.route('', 'test', function(routed){
                should.equal('index', routed);
            });
        });
        
        it('Routed URL is incorrect without group', function(){
            var router = new ProtolusRouter({
                onMissing : function(){
                    should.equal(true, true);
                }
            });
            router.addRoute(function(url){
                return url == '';
            }, 'test', function(){
                return 'index';
            });
            router.route('', 'blah', function(routed){
                should.fail('This route should not occur', arguments);
            });
        });
    });
    
    describe('addRoute(testFunction, actionFunction) , route(url)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            var a = {};
            router.addRoute(function(url){
                return url == '';
            }, function(){
                a.result = 'index';
            });
            router.route('');
            should.equal('index', a.result);
        });
    });
    
    describe('addRoute(regex, calculateFunction) , route(url, callback)', function(){
        it('Routed URL is correct', function(){
            var router = new ProtolusRouter();
            router.addRoute( /(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i , function(){
                return Array.prototype.slice.call(arguments, 0);;
            });
            router.route('users/khrome/42', function(a, b, c){
                should.equal(a, 'users');
                should.equal(b, 'khrome');
                should.equal(c, '42');
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
                should.equal(args.type, 'users');
                should.equal(args.handle, 'khrome');
                should.equal(args.id, '42');
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
            should.equal('users.js?handle=khrome&id=42', result);
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
            should.equal('users.js?handle=khrome&id=42', result);
        });
    });
    
    describe('INI(fileName) , route(url, callback)', function(){
        var router = new ProtolusRouter().INI('test.ini');
        it('Routed URL is correct', function(){
            router.route('users/khrome', function(routed){
                should.equal('profile?username=khrome', routed);
            });
        });
        
        it('Routed URL is incorrect without group', function(){
            router.route('users/khrome/upload', function(routed){
                should.fail('should not route url without correct group');
            });
        });
        
        it('Routed URL is correct with group', function(){
            router.route('users/khrome/upload', 'post', function(routed){
                should.equal('dropbox?username=khrome', routed);
            });
        });
    });
});