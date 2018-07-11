const sensorLib = require('node-dht-sensor');

// Initialize DHT11 sensor
/*
 * Here inside the initialize function, first argument is the sensor
 * For example for DHT11 sensor it is 11 and for DHT22 it is 22.
 * Second argument is the GPIO pin. Here We're using GPIO4 (pin #7)
*/
sensorLib.initialize(11, 4);


const Gpio = require('pigpio').Gpio,
	trigger = new Gpio(17, { mode: Gpio.OUTPUT }),
	echo = new Gpio(27, { mode: Gpio.INPUT, alert: true });

     let temp = sensorLib.read().temperature.toFixed(1),
        hum = sensorLib.read().humidity.toFixed(1),
        time = new Date;

trigger.digitalWrite(0);// Make sure trigger is low

let speedOfSoundMs = 30.2 - (0.055 * temp) + (0.0038 * hum);
// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
//var MICROSECDONDS_PER_CM = 1e6 / 34321;


var tankSideA = 0,
	counter = 0,
	sum = 0;

let startTick, results;
//formula for inches empty  space in tank A to gallons of water
const tankA = i => {
	let w = 162;
	    l = 166;
	    h = 120;
	    g = h - i;
	return Math.floor(w * l * g / 231); //formula for gallons
};
echo.on('alert', (level, tick) => {
	let endTick, diff;

	if (level == 1) {
		startTick = tick;
	} else {
		endTick = tick;
		diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
		const inches = (diff / 2 / speedOfSoundMs) / 2.54; //cm to inches
		      results = tankA(inches);
		//tank 30 samples >0 and add together
	}
	if (results > 0 && counter <= 29) {
		sum += results;
		counter++;
		//console.log("C"+ counter);
	}
	if (counter === 30) {
		tankSideA = sum / 30; //average
	}
});

const runCode = () => {
	let count = 0;
	// Trigger a distance measurement once per second
	const intervalID = setInterval(() => {
		count++;
		// Set trigger high for 10 microseconds
		trigger.trigger(10, 1);
		if (count === 40) {
			clearInterval(intervalID);
			//console.log(count);
		}
	}, 1000);
  };

const userData = {
      "tank"    : "A",
      "address" : "45 Ord Road Warwick",
      "gallons" : Math.floor(tankSideA),
      "date"    : time,
  "speedOfSound": speedOfSoundMs,
        "temp"  : temp + "C",
        "hum"   : hum + "%"
     };

setInterval(() => {
	    time = new Date();
	if (time.getSeconds() === 0) {
		runCode(); //start trigger
	}
	if (time.getSeconds() === 44) {
		console.log(userData);
	}
	if (time.getSeconds() === 45) {
		//reset
		tankSideA = 0;
		counter = 0;
		sum = 0;
	}
}, 1000);

