window.addEventListener("load", function(event) {

	"use strict";

	  ///////////////////
	 //// FUNCTIONS ////
	///////////////////

	var keyDownUp = function(event) {

		controller.keyDownUp(event.type, event.keyCode);

	}

	var resize = function(event) {

		// display.resize(document.documentElement.clientWidth - 32, document.documentElement.clientHeight - 32, game.world.height / game.world.width);
		display.render();

	}

	var render = function() {

		display.updateStats(game)
		display.updateGraph(game)
		display.drawLandscape(game.world.landscape, game.world.global_min, game.world.global_max)
		display.drawIndividuals(population.individuals, game.world.bounds, game.scores.length-1)

		display.render()      

	}

	var update = function() {

		switch(game.state) {
			case "birth": 
				population.assign_fitnesses()
				population.make_offsprings()
				game.state = "kill"
				break
			case "kill":
				population.select_pop()
				game.scores.push(population.fmin)
				game.avg_scores.push(population.get_average_value())				
				game.state = "birth"
				break
		}

	}

	  /////////////////
	 //// OBJECTS ////
	/////////////////

	var controller = new Controller()
	var game       = new Game()
	var display    = new Display()
	var engine     = new Engine(1000/1, render, update)
	var population = new Population(30, 5, game.world.landscape_fn, game.world.bounds)
	
	document.value = {
		display: display,
		controller: controller,
		game: game,
		engine: engine,
		population: population,
	}    

	  ////////////////////
	 //// INITIALIZE ////
	////////////////////

	display.buffer.individuals.canvas.height  = game.world.height
	display.buffer.individuals.canvas.width   = game.world.width
	display.buffer.landscape.canvas.height    = game.world.height
	display.buffer.landscape.canvas.height    = game.world.width

	resize()

	controller.init_buttons(game)
	controller.init_settings()
	controller.adjust_speed_slider(1000/engine.time_step)

	display.graph = display.initGraph()

	population.init_pop()

	engine.start()

	window.addEventListener("keydown", keyDownUp)
	window.addEventListener("keyup",   keyDownUp)
	window.addEventListener("resize",  resize)

})