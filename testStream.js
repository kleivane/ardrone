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
socket.pipe(parser).pipe(RGBA)

client.takeoff();
client.after(5000, function(){
    RGBA.on('data', function(data){
        console.log("RGBA "+data.length);
        var count = 0;
        var side = 0;
        for(var i = 0; i < data.length; i=i+4){
            if(range(data[i], 190) && range(data[i+1], 55) && range(data[i+2],105)){
                count++; 
                side = side + (i%(240*4))/(4*240); 
            }
        };
        side = side/count;
        console.log("Verdi side: "+side);
        if(side < 0.3){
            client.counterClockwise(0.5);
        }else if (side > 0.7){
            client.clockwise(0.5);
        }else{
            client.stop();
        }
    })
}).after(15000, function(){
    client.stop();
    client.land();
});

var range = function(rgba, match){
    return (Math.abs(rgba - match) < 10);
}