"use strict";
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
	echo = new Gpio(27, { mode: Gpio.INPUT, alert: true }),
      triggerB = new Gpio(6, { mode: Gpio.OUTPUT }),
	echoB = new Gpio(5, { mode: Gpio.INPUT, alert: true }),
        temp = sensorLib.read().temperature.toFixed(1),
         hum = sensorLib.read().humidity.toFixed(1);

trigger.digitalWrite(0);
triggerB.digitalWrite(0); // Make sure trigger is low

const speedOfSoundms = 30.2 - (0.055 * temp) + (0.0038 * hum);
// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
//var MICROSECDONDS_PER_CM = 1e6 / 34321;

let tankSideA = 0,
    tankSideB = 0,
	counter = 0,
       counterB = 0,
	sum = 0,
       sumB = 0,
        max = 14000,
           userData;

let startTick,
    startTickB,
    results,
    resultsB;
//formula for inches empty  space in tank A to gallons of water
const tankA = i => {
	let w = 162,
	l = 166,
	h = 120,
	g = h - i;
	return Math.floor(w * l * g / 231); //formula for gallons
};
const tankB = i => {
	let w = 168,
	l = 166,
	h = 120,
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
		const inches = (diff / 2 /speedOfSoundms) / 2.54; //cm to inches
		 results = tankA(inches);
		//tank 30 samples >0 and add together
	}
	if (results > 0 && results < max && counter <= 29) {
		sum += results;
		counter++;
		//console.log("C"+ counter);
	}
	if (counter === 30) {
		tankSideA = sum / 30; //average
	}
});

echo.on('alert', (levelB, tickB) => {
	let endTickB, diffB;

	if (levelB == 1) {
		startTickB = tickB;
	} else {
		endTickB = tickB;
		diffB = (endTickB >> 0) - (startTickB >> 0); // Unsigned 32 bit arithmetic
		const inchesB = (diffB / 2 /speedOfSoundms) / 2.54; //cm to inches
		let resultsB = tankB(inchesB);
		//tank 30 samples >0 and add together
	}
	if (resultsB > 0 && resultsB < max && counterB <= 29) {
		sumB += resultsB;
		counterB++;
		//console.log("C"+ counter);
	}
	if (counterB === 30) {
		tankSideB = sumB / 30; //average
	}
});

const runCode = () => {
	let count = 0;
	// Trigger a distance measurement once per second
	const intervalID = setInterval(() => {
		count++;
		// Set trigger high for 10 microseconds
		trigger.trigger(10, 1);
                triggerB.trigger(10, 1);
		if (count === 40) {
			clearInterval(intervalID);
			//console.log(count);
		}
	}, 1000);
};
//User data
 

setInterval(() => {
	let time = new Date();
	if (time.getSeconds() === 0) {
		runCode(); //start trigger
	}
	if (time.getSeconds() === 44) {
		console.log( userData = {
     "tank_A": "Side A",
  "gallons_A": Math.floor(tankSideA),
    "tank_B" : "Side B",
  "gallons_B": Math.floor(tankSideB),
    "address": "45 Ord Road Warwick",
       "date": time,
 "SpeedOfSound" : speedOfSoundms, 
       "temp": temp + "C",
   "humidity": hum + "%"
});
	}
	if (time.getSeconds() === 45) {
		//reset
		tankSideA = 0;
                tankSideB = 0;
		counter = 0;
                counterB = 0;
		sum = 0;
                sumB = 0;
	}
}, 1000);

