var net = require('net');
var ardrone = require('ar-drone');
var client = ardrone.createClient();
require('./extendObservable.js'); // Adds the toObservable method to EventEmitter

var RGBAStream = require('./RGBAStream');
var PaVEParser = require('./node_modules/ar-drone/lib/video/PaVEParser');
var FaceStream = require('./FaceStream');

var parser = new PaVEParser();
var face = new FaceStream();
var RGBA = new RGBAStream();
var socket = net.connect({ host: '192.168.1.1', port: 5555});
socket.pipe(parser).pipe(RGBA);

client.takeoff();

client.after(5000, function(){
    RGBA.on('data', function(data){
        var count = 0;
        var side = 0;
        for(var i = 0; i < data.length; i=i+4){
            if(range(data[i], 190) && range(data[i+1], 55) && range(data[i+2],105)){
                count++; 
                side = side + (i%(240*4))/(4*240); 
            }
        };
        side = side/count;
        if(side < 0.3){
            console.log("counterClockwise");
            client.counterClockwise(0.5);
        }else if (side > 0.7){
            console.log("clockwise");
            client.clockwise(0.5);
        }else{
            client.stop();
            console.log("stop " + count);
            if(count > 180){
                client.back(0.5);
                console.log("back")
            } else if(count < 120) {
                client.front(0.5);
                console.log("front")
            }
        }
    })
}).after(15000, function(){
    client.stop();
    client.land();
    //RGBA.off('data');
});

var range = function(rgba, match){
    return (Math.abs(rgba - match) < 25);
}