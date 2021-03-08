var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var back = document.getElementById('back'); // stop declaring stuff like this locally, use function parameters or globals!

var backCtx = back.getContext('2d'); // basically a 'copy' of the main canvas, 'canvas'.
// used to update the canvas, since using the main canvas on itself with drawImage produces
// strange results
//back.style.display = "inline";

var arcade = document.getElementById('arcadeBeep');
var gR = document.getElementById('gRiff');
gR.volume = 0.2;
arcade.volume = 0.05;  // this sound is so freakin loud... make sure to go back to mixcraft and dial it down later... WAY DOWN
ctx.fillStyle = "#333333";
ctx.fillRect(0,0,600,600);

var circles0 = [];
var circles1 = [];
var circles2 = [];
var gC = document.getElementById("greenCircle"); // the green circle canvas, used to draw on the main canvas
var gCTX = gC.getContext("2d");
var gFps, fpsInterval, startTime, now, then, elapsed, startFPS;
var stopTime;
var stop = false;
var winPointMarked = false;
var stopPointMarked = false;
var testWinTriggered = false;
var stopTriggered = false;
var stopAtCircle = -1;
var currStopStep = -1;
var reqID;
var gameEnded = false;
var flip = false;

const END_GAME_FLASHES = 5; // number of times lights should flash upon win.
var numFlashes = 0; // current number of flashes shown (1 flash per update)

// can't remember or really tell if this stuff is still used
gCTX.beginPath();
gCTX.arc(9,9,8,0,2*Math.PI);
gCTX.fillStyle = "#ff0000";
	gCTX.stroke();
	gCTX.fill()

var startPoint = {
	x: 300,
	y: 50
};
var endPoint = {
	x: 300,
	y: 50
};
// ###########################

var step = 50; // the amount of pixels to 'step' by when redrawing a new set; space between circles


// stuff to keep track of where the moving circles are, used for tracking win conditions and positions
// btw circle clumps
var circle_i = 0;
var secondCircle_i = 0;
var circle_i_0 = 0;
var circle_i_1 = 0;
var circle_i_2 = 0;
var circle_i_3 = 0;

var circlePos = [0,10,20,30,40,50,0];

const CIRCLE_GAP = 9; // gap between the sets of circles

init();


function init(){
	var xC = canvas.width / 2; 
	var yC = canvas.height / 2;

	drawCircle(0,0,2*Math.PI,xC,yC,0.1,220,circles0);
	drawCircle(0,0,2*Math.PI,xC,yC,0.1,200,circles1);
	drawCircle(0,0,2*Math.PI,xC,yC,0.1,240,circles2);

	canvas.style.display = "inline";
}

function welcomeMessage()
{
	var back = document.getElementById('back');
	var backCtx = back.getContext("2d");
	backCtx.globalCompositeOperation = 'destination-over';
	backCtx.clearRect(0,0,600,600);
	backCtx.textAlign = "center";
	backCtx.font = "30px Arial";
	backCtx.fillText("PLAY WHISTLE STOP", 300,300);
	backCtx.drawImage(canvas,0,0,600,600);
	
	// setTimeoout is weird

	setTimeout(function()
	{

		backCtx.clearRect(0,0,600,600);
		backCtx.fillText("3", 300,300);
		backCtx.drawImage(canvas,0,0,600,600);
	}, 1000);

	setTimeout(function()
	{

		backCtx.clearRect(0,0,600,600);
		backCtx.fillText("2", 300,300);
		backCtx.drawImage(canvas,0,0,600,600);
	}, 2000);

	setTimeout(function()
	{

		backCtx.clearRect(0,0,600,600);
		backCtx.fillText("1", 300,300);
		backCtx.drawImage(canvas,0,0,600,600);
	}, 3000);

	setTimeout(function()
	{

		backCtx.clearRect(0,0,600,600);
		backCtx.fillText("GO", 300,300);
		backCtx.drawImage(canvas,0,0,600,600);
	}, 4000);

	setTimeout(function()
	{
		backCtx.clearRect(0,0,600,600);
		backCtx.drawImage(canvas,0,0,600,600);
		reqID = window.requestAnimationFrame(draw);
		arcade.play();
	}, 4500);

	back.style.display = "inline";
}

function winAnims()
{

	if(!flip)
	{
		gCTX.beginPath();
		gCTX.arc(9,9,8,0,2*Math.PI);
		gCTX.fillStyle = "#00cc00";
		gCTX.stroke();
		gCTX.fill()
	}
	else
	{
		gCTX.beginPath();
		gCTX.arc(9,9,8,0,2*Math.PI);
		gCTX.fillStyle = "#ff0000";
		gCTX.stroke();
		gCTX.fill();
	}

}

function toggleAudio(option)
{
	var audioIcon = document.getElementById('volumeIcon');
	var muteIcon = document.getElementById('muteIcon');
	var audio = document.getElementsByTagName("audio");
	if(option == "off")
	{
		audioIcon.style.display = "none";
		muteIcon.style.display = "block";
		for(var i = 0; i < audio.length; i++)
		{
			audio[i].muted = true;
		}
		
	}
	else 
	{
		muteIcon.style.display = "none";
		audioIcon.style.display = "block";
		for(var i = 0; i < audio.length; i++)
		{
			audio[i].muted = false;
		}
	}
	
}

function stopToWin()
{
	var testWinButton = document.getElementById('testWin');
	testWinTriggered = true;
}

function toggleWheel(){
	var stopButton = document.getElementById('stopButton')
	var winMsg = document.getElementById('winMsg');
	var loserMsg = document.getElementById('loserMsg');

	winMsg.style.display = "none";
	loserMsg.style.display = "none";
	if(stop){
		stop = false;
		gameEnded = false;
		stopTriggered = false;
		stopAtCircle = -1;
		flip = true;
		winAnims(); // recalled here to make sure light is back to red, and doesn't stay green after a win
		reqID = requestAnimationFrame(draw);
		stopButton.innerHTML = "STOP"
		stopTime = null;
		gFps = startFPS;
		fpsInterval = 1000 / gFps;

		arcade.play();
	}
	else{
		stop = true;
		stopTriggered = true;

		stopButton.style.display = "none";
		stopAtCircle = circle_i + 15;
		currStopStep = 0;

		// everything... seems to be in order...
		if(stopAtCircle >= circles0.length)
		{
			var diff = stopAtCircle - circles0.length;
			stopAtCircle = diff;
		}

		stopTime = Date.now();
		gFps = 15;
		fpsInterval = 1000 / gFps;
		stopButton.innerHTML = "PLAY"
	}
}

function startAnimating(fps) {
	var gR = document.getElementById('gRiff');
	var back = document.getElementById('back'); // don't redeclare globals
	var start = document.getElementById('startGame');  //start button
	var stopButton = document.getElementById('stopButton');
	stopButton.style.display = "block";
	start.style.display = "none";
	canvas.style.display = "none";
	back.style.display = "inline";
	gR.play();
    fpsInterval = 1000 / fps;
    startFPS = fps;
    gFps = fps;
    then = Date.now();
    startTime = then;
    welcomeMessage();
}

function checkWin()
{
	var circle;
	var winCircleHit = false;

	//FUNNNNCTION!!!!
	circlePos.fill(circle_i); // fill the position array with the current position
	if(circles0[circle_i].winCircle)
	{
		winCircleHit = true;
	}
	else
	{
		for(var i = 1; i < circlePos.length && !winCircleHit; i++)
		{
			circlePos[i] = circlePos[i-1] + CIRCLE_GAP;
			circlePos[i] = checkBounds(circlePos[i]);
			circle = circles0[circlePos[i]];
			if(circle.winCircle)
			{
				winCircleHit = true;
			}
		}
	}
	

	return winCircleHit;
}

function update(context)
{
	context.clearRect(0, 0, 600, 600); // clear canvas

	drawThree(context, circle_i);
	circlePos.fill(circle_i);
	for(var i = 1; i < circlePos.length; i++)
	{
		circlePos[i] = circlePos[i-1] + CIRCLE_GAP;
		circlePos[i] = checkBounds(circlePos[i]);
		drawThree(context, circlePos[i]);
	}

  	context.drawImage(canvas, 0,0,600,600);

}

function checkBounds(i)
{
	var diff = -1;
	if(i >= circles0.length)
	{
		diff = i - circles0.length;
		i = diff;
	}

	return i;
}

function drawThree(context, i)
{
	// 1 green circle
	context.save();
	context.translate(circles0[i].x, circles0[i].y);
  	context.drawImage(gC, -9, -9);
  	context.restore();

  	// 2 green circles
  	context.save();
	context.translate(circles1[i].x, circles1[i].y);
  	context.drawImage(gC, -9, -9);
  	context.restore();

  	// 3 green circles!!
  	context.save();
	context.translate(circles2[i].x, circles2[i].y);
  	context.drawImage(gC, -9, -9);
  	context.restore();
}

function draw()
{
	reqID = window.requestAnimationFrame(draw);

	// why do you keep re-declaring globals?
	var back = document.getElementById('back').getContext('2d');


	back.globalCompositeOperation = 'destination-over';

	now = Date.now();
	
	elapsed = now - then;
	if(elapsed > fpsInterval)
	{
		then = now - (elapsed % fpsInterval);
		if(stopTriggered)
		{

			if(gFps > 5)
			{
				gFps -= 1;
				fpsInterval = 1000 / gFps;
			}
			currStopStep++; // unused now
		}
		
		update(back);

		// irrelevent now 
  		if(testWinTriggered && circles0[circle_i].winCircle)
  		{
  			cancelAnimationFrame(reqID);
  		}

  		if(circle_i == stopAtCircle)
		{
			gameEnded = true;
			if(checkWin())
			{
				flip = !flip;
				winAnims();
				update(back);
  				var winMsg = document.getElementById('winMsg');
  				winMsg.style.display = "block";
			}
			else
			{
				var loserMsg = document.getElementById('loserMsg');
				loserMsg.style.display = "block";
			}

			var stopBtn = document.getElementById('stopButton');
			stopBtn.style.display = "block";
			arcade.pause();
			arcade.currentTime = 0;
			if(numFlashes > END_GAME_FLASHES)
			{
				numFlashes = 0;
				cancelAnimationFrame(reqID);
				
			}
			else
			{
				numFlashes++;
			}
		}	

		if(!gameEnded)
		{
			if(circle_i + 1 == circles0.length)
	  		{
	  			circle_i = 0;
	  		}
	  		else
	  		{
	  			circle_i++;
	  		}
		}
  		
	}
}


function drawCircle(startX, startY,end, xC, yC, step, inc,circles)
{
	ctx.strokeStyle = "#000000"
	for(var i = 0; i < end; i+=step)
	{
		var stepX = (startX + inc) * Math.cos(i);
		var stepY = (startY + inc) * Math.sin(i);
		var colour = "";
		if(i < Math.PI + step && i > Math.PI - step + 0.1)
		{
			colour = "#990000"
			winPointMarked = true;
		}
		else if(i < Math.PI / 2 + step - 0.1 && i > Math.PI / 2 - step)
		{
			colour = "#b3b300"
			stopPointMarked = true;
		}
		else 
		{
			colour = "#990000";
		}
		drawCircleRow(stepX + xC, stepY + yC,colour,circles);
	}
}

function drawCircleRow(x,y,colour,circles){
	ctx.beginPath();
	ctx.arc(x,y,8,0, 2*Math.PI);
	ctx.fillStyle = colour;
	ctx.stroke();
	ctx.fill()
	var circle = {
		x: x,
		y: y,
		r: 8,
		colour: colour,
		winCircle: winPointMarked,
		stopCircle: stopPointMarked
	};
	if(winPointMarked)
	{
		winPointMarked = false;
	}
	if(stopPointMarked)
	{
		stopPointMarked = false;
	}
	circles.push(circle);
}
