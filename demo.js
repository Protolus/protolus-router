var ProtolusRouter = require('protolus-router');
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
});