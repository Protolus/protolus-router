var ProtolusRouter = require('protolus-router');
var should = require('should');
/*
var router = new ProtolusRouter({
    //argumentNames : ['type', 'handle', 'id'],
    onMissing : function(){
        console.log('no match');
    }
});
router.addRoute( /(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i , function(args){
    if(router.options.argumentNames) return args;
    else return Array.prototype.slice.call(arguments, 0);
});
router.route('users/khrome/42', function(a, b, c){
    console.log('routed', a, b, c);
});//*/
//*
var router = new ProtolusRouter({
    onMissing : function(){
        should.equal(true, true);
    }
});
router.addRoute(function(url){
    return url == '';
}, function(){
    return 'index';
}, 'test');
router.route('', 'blah', function(routed){
    should.fail('This route should not occur', arguments);
}); //*/

//*
var router = new ProtolusRouter();
router.addRoute( /(users)\/([A-Za-z][A-Za-z0-9]{3,16})\/([0-9]+)/i , function(){
    return Array.prototype.slice.call(arguments, 0);;
});
router.route('users/khrome/42', function(args){
    should.equal(args[0], 'users');
    should.equal(args[1], 'khrome');
    should.equal(args[2], '42');
});
//*/