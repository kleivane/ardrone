var net = require('net');
var ardrone = require('ar-drone');
var client = ardrone.createClient();
require('./extendObservable.js'); // Adds the toObservable method to EventEmitter

// RGB 190 55 105
// HSV 338 71 90

var RGBAStream = require('./RGBAStream');
var PaVEParser = require('./node_modules/ar-drone/lib/video/PaVEParser');
var FaceStream = require('./FaceStream');

var parser = new PaVEParser();
var face = new FaceStream();
var RGBA = new RGBAStream();
var socket = net.connect({ host: '192.168.1.1', port: 5555});
var teller= [];
socket.pipe(parser).pipe(RGBA);

try{

var stdin = process.openStdin();
stdin.on('data', function() { 
    console.log("Killswitch");
    client.stop();
    client.land(); 
});

client.takeoff();

var framecount = 0;
client.after(1000, function(){
    RGBA.on('data', function(data){
        var count = 0;
        var side = 0; 
        var frame = framecount % 4;
        for(var i = 0; i < data.length; i=i+4){
            var hsv = rgb2hsv(data[i], data[i+1], data[i+2]);
            if(range(hsv.h, 340) && hsv.s > 20 && hsv.v > 60){
                count++; 
                side = side + (i%(240*4))/(4*240); 
            }
        };
        side = side/count;
        console.log("Count "+count)
 

        if(side < 0.35){
            console.log("counterClockwise");
            teller[frame] = "counterClockwise";
        }else if (side > 0.65){
            console.log("clockwise");
             teller[frame] = "clockwise";
        }else{
            if(count > 150){
                console.log("back");
                teller[frame] = "back";
            } else if(count < 100 && count > 5) {
                console.log("front");
                teller[frame] = "front";
            } else {
                console.log("stop " + count);
                teller[frame] = "stop";
            }
        }

       if(teller[0] === teller[1] &&  teller[1] === teller[2] && teller[2] === teller[3]){
            client.stop();
            client[teller[0]](0.2);

            console.log("calling "+ teller[0] )

       }

        framecount++;


    })
})
} catch(e){
     console.log("Error! Abort!");
    client.stop();
    client.land(); 
}

var range = function(number, match){
    return (Math.abs(number - match) < 5);
}

function rgb2hsv () {
    var rr, gg, bb,
        r = arguments[0] / 255,
        g = arguments[1] / 255,
        b = arguments[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}