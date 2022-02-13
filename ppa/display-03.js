const COOL_BLUE = '0, 115, 255'

class Display {
	constructor() {

		this.init_elements()

		this.buffer = {
			individuals: 	document.createElement("canvas").getContext("2d"),
			landscape: 		document.createElement("canvas").getContext("2d"),
		}

		this.context = {
			individuals: 	document.getElementById("individuals_canvas").getContext("2d"),
			landscape: 		document.getElementById("landscape_canvas").getContext("2d"),
			graph: 			document.getElementById("graph_canvas").getContext("2d"),      
		}

		this.graph = null
		this.rendered_generation = null    
 
		this.color1     = 'white';
		this.color2     = `rgb(${COOL_BLUE},.5)`;

		this.scale = 1
	}

	init_elements() {
		document.body.style.color = 'white'
		document.body.style.display = 'grid'
		document.body.style.position = 'relative'
		document.body.style['align-items'] = 'center'    

		let innerHTML = `
		<div id="content_wrapper" style="width:100%;height:100%;position:absolute;padding:10px">
		<div id="content_div" style="width: 100%; height: 100%;display:grid;grid-template-rows:min-content;">
			<div id="content_top_div" style="display: grid; grid-template-columns: auto 60%; align-items: end; column-gap:5px;">
				<div id="content_top_left_div" style="height:100%;display:grid;align-items:end;">
					<div id="table_div" style="display: grid; grid-template-columns: auto auto;">
						<div>Generation</div>
						<div id="generation"></div>
						<div>Best</div>
						<div id="best_score"></div>
						<div>Avg</div>
						<div id="avg_score"></div>                
					</div>
					<div id="speed_div" style="display:grid; grid-template-columns:auto min-content;">
						<input id="speed_slider" type="range" min=0 max=10 value=5 style="width:100%;">
						<div id="fps"></div>
					</div>
					<div id="content_top_left_bar_div" style="display:grid; grid-template-columns:auto auto auto auto; column-gap:5px;">
						<button id="info_btn" class="btn">Info</button>
						<button id="reset_btn" class="btn">Reset</button>
					</div>
				</div>
				<div id="content_top_right_div">
					<div id="content_top_right_canvas_div" style="position: relative; margin-top:5px">
						<div id="current_score" style="position:absolute; padding-inline: 5px;">Score: 0</div>
						<canvas id="individuals_canvas" style="width:100%; position: absolute; border: 2px solid grey; border-radius: 5px; image-rendering: auto;"></canvas>
						<canvas id="landscape_canvas" style="width:100%; image-rendering: auto; z-index: 1000"></canvas>
					</div>
				</div>
			</div>
			<div id="content_bottom_div" style="height:100%;display: grid; grid-template-columns: 50% 50%;">
				<div id="graph_canvas_div" style="display:grid"><canvas id="graph_canvas"></canvas></div>
			</div>
		</div>
		</div>
		`

		let highlights_info = `
		1. Go into the settings below and click "Load Best Parameters" to see the trained cart perform.
		<br><br>
		2. Try taking control of the cart by clicking "Drive" and get a feel for the task.
		<br><br>
		3. Try playing with the settings to see how it affects the learning.
		`

		let implementation_info = ` 
		The main neural network is the policy network; it accepts input from the cart (Position, Velocity, Angle and Angular Velocity) 
		and gives a Q-value (the total expected future reward; can be any real number) for each possible policy (Left or Right) it can take. 
		The cart then takes the decision with the highest value, or a completely random one, where epsilon (exploration rate) 
		is the probability it does something random. The experience from every timestep, consisting of the input state, action, 
		resulting state and reward, is saved into a memory replay buffer. At every timestep a random batch is taken from this replay buffer, 
		on which we run gradient descent (see the digits project for a more detailed description).
		The updates to the weights and biases are scaled using the learning rate eta (sometimes called alpha in this context).
		<br><br>
		A DQN calculates its error by taking the difference between the target and the Q-value of the taken action. The target
		(aka expectation) is determined by the observed reward from the taken action, and adding the highest Q-value from the new
		observed state, after multiplying that Q-value by gamma (the discount factor). A gamma below 1 puts more emphasis on the observed
		short term reward than the expected. In the case of cartpole the same reward is given at every timestep so there are no differences
		in the short term. That's why the value of 1 was chosen here, but slightly lower works too.
		<br><br>
		The problem with this method is that the target and Q-value for the taken action are both estimated by the policy network.
		This means that a nudge to the weights and biases won't only adjust the Q-value for the taken action as an outcome,
		but also the target itself. This is inherently unstable because immediately after the nudge of the Q-value towards the target, 
		the target has moved to a different value.
		<br>
		To fix this we add another neural network, the target network. This is what makes a DQN a double DQN. The target network starts
		as an exact copy of the policy network, but the nudges aren't applied to it so the target stays at the same value. As you can
		imagine, this on its own causes the policy network to converge to some useless function because the target network doesn't "know"
		any more than the policy network at the beginning. However, if we update the target network once in a while by copying the policy
		network's parameters, the target network will slowly step along with the policy network's training. By letting the target network
		remain the same for a number of timesteps we stabilize the policy training, at the expense of training speed.
		`

		let controls_info = `
		<div style="display: grid; grid-template-columns: auto auto; column-gap: 5px;">
			<div>epsilon</div>
			<div>adjustable by entering a number (easier when paused). This is the rate of exploration (probability of taking a random action at any timestep)</div>

			<div>eta</div>
			<div>adjustable by entering a number (easier when paused). This is the learning rate (factor by which nudges to parameters are multiplied)</div>

			<div><br></div><div><br></div>

			<div>Slider</div>
			<div>Adjust the speed of training. Drag to the left to pause</div>

			<div>Reset</div>
			<div>Resets the neural network parameters to a random value</div>

			<div>Save</div>
			<div>Lets you download the network parameters to a text file</div>

			<div>Load</div>
			<div>Lets you upload a text file of network parameters and replace the current ones. Only possible with the same network topology</div>

			<div><br></div><div><br></div>

			<div>Drive</div>
			<div>Disables the AI temporarily and lets you control the cart. Use the arrow keys (Click again to disable)</div>    
		</div>   
		`

		let visualization_info = `
		<b>Neural Network:</b><br>
		The neural network is depicted as a network of lines (the weights), where opacity indicates weight strength. The biases aren't displayed to prevent visual clutter. The nodes in this network are the neurons. If a neuron is currently activated, this is visualized by a circle. Again, opacity indicates activation strength. Blue lines and circles represent negative weights and activations respectively. Below the output neurons their labels are displayed.
		The blue label is the one with the highest activation.<br>
		<br>
		<b>Environment:</b><br>
		The white rectangle is the cart and the blue bar is the pole it's trying to keep upright.<br>
		<br>
		<b>Chart:</b><br>
		In the line chart the blue line represents the score at each episode, and the white the rolling average over the past 100 episodes.<br>
		<br>
		<b>Stats:</b>
		<div style="display: grid; grid-template-columns: auto auto; column-gap:5px;">
			<div>Episode</div>
			<div>The amount of attempts the cart has taken so far</div>

			<div>Best</div>
			<div>The best score of any episode so far</div>

			<div>Avg</div>
			<div>The rolling average score over the past 100 episodes</div>

			<div>Episodes since best</div>
			<div>The amount of episodes that have passed since the best score was achieved</div>

			<div>epsilon</div>
			<div>The exploration rate. This is the probability a random action is chosen instead of the policy network's highest outcome at any timestep</div>
			
			<div>eta</div>
			<div>The learning rate (aka alpha). This is the factor by which the adjustment to the policy network is scaled at each timestep</div>

			<div><br></div><div><br></div>

			<div>total parameters</div>
			<div>The total amount of weights and biases in the neural network</div>

			<div>total neurons</div>
			<div>The total amount of neurons in the network, including input and output</div>
		</div>  
		`

		let info_html = `
		In this project the little white cart is supposed to learn how to balance the blue bar without it reaching an angle of 12 degrees.
		It attempts this by using a Double Deep Q-Network (DDQN), which updates neural network weights and biases based on experience replay.
		<br><br>
		Significant progress is to be expected by episode 100, at default settings. This is quite consistent.

		<details>
			<summary><h4>HIGHLIGHTS</h4></summary>
			${highlights_info}
		</details>
		<br>
		<details>
			<summary><h4>VISUALIZATION</h4></summary>
			${visualization_info}
		</details>
		<br>
		<details>
			<summary><h4>CONTROLS</h4></summary>
			${controls_info}
		</details>
		<br>
		<details>
			<summary><h4>IMPLEMENTATION</h4></summary>
			${implementation_info}
		</details>    
		`

		let settings = `
		<div id="info_div" style="background-color: rgb(0,0,0,.95);width: 90%;height: 90%;border-radius: 20px;z-index: 1;position:absolute;justify-content: center;display:none;">
		<a id="close_info_btn">x</a>
		<div data-simplebar style="width: 100%;height: 100%;padding: 30px;">

			<h2>Info</h2>
			<p>${info_html}</p>
			<br>

			<div id="settings_div" style="border-radius:5px;display: grid;width: 100%;padding: 5px;background-color:rgb(255,255,255,.2);">

				<h2 style="justify-self: center;">Settings</h2>
				<h4>Basic Hyperparameters</h4>
				<div class="settings_div">
					<div>
						<input id="epsilon_decay"> 
						<label for="epsilon_decay">Epsilon Decay</label>
						<p class="settings_expl">This is the factor with which the epsilon value is multiplied each episode, to gradually decrease randomness.</p>
					</div>
					<div>
						<input id="gamma"> 
						<label for="gamma">Gamma</label>
						<p class="settings_expl">This is the discount factor of the estimated future reward when calculating the error of the network.</p>
					</div>
					<div>
						<input id="replay_buffer_size"> 
						<label for="replay_buffer_size">Memory Replay Buffer Size</label>
						<p class="settings_expl">The amount of experiences (combination of action, state, next state and reward) that can be saved at one time. When this is full a random experience gets replaced with each timestep.</p>
					</div>
					<div>
						<input id="batch_size"> 
						<label for="batch_size">Batch Size</label>
						<p class="settings_expl">The amount of experiences that are used in Stochastic Gradient Descent each timestep.</p>
					</div>
					<div>
						<input id="double_dqn" type="checkbox"> 
						<label for="double_dqn">Double DQN</label>
						<p class="settings_expl">Enables the target network. If set to false the policy network serves as its own judge, which can lead to instability.</p>
					</div>
					<div>
						<input id="target_net_timer"> 
						<label for="target_net_timer">Target Net Update Timer</label>
						<p class="settings_expl">The timesteps to pass before the target network is updated to the learned parameters of the policy network.</p>
					</div>
				</div>
				<br>
				<h4>Environment</h4>
				<div class="settings_div">
					<div>
						<input id="episode_limit"> 
						<label for="episode_limit">Episode Limit</label>
						<p class="settings_expl">The maximum number of timesteps in an episode. Infinity is fine (turned off) but if you want more and shorter episodes set it to around 2000</p>
					</div>               
					<div>
						<button id="load_best_btn" class="btn">Load Best Parameters</button>
						<p class="settings_expl">Loads the best parameters I've trained so far</p>
					</div>
				</div>
				<br>
				<h4>Advanced Settings / Heuristics</h4>
				<div class="settings_div">
					<!--
					<div>
						<input id="auto_set_best"> 
						<label for="auto_set_best">Automatic Reset to Best</label>
						<p class="settings_expl">Takes the average score of this amount of recent episodes. If that average is significantly lower than the high score it resets to the best parameters. Infinity turns it off</p>
					</div>
					<div>
						<input id="auto_adjust_epsilon"> 
						<label for="auto_adjust_epsilon">Automatic Epsilon Adjustment</label>
						<p class="settings_expl">Increases the randomness when stagnating. This integer dictates how many episodes can go by without updating</p>
					</div>
					-->
					<div>
						<input id="auto_adjust_eta" type="checkbox">
						<label for="auto_adjust_eta">Automatic Eta Adjustment</label>
						<p class="settings_expl">Decreases the learning rate when performing well. This means you can start higher initially (like at .01) which speed up learning by a LOT. It likely depends on other parameters but when I added this it went from ~500 to ~250 episodes to solve</p>
					</div>
					<div>
						<input id="printing" type="checkbox"> 
						<label for="printing">Printing</label>
						<p class="settings_expl">If set to true this prints some messages in the console when updates happen.</p>
					</div>
				</div>
				<button id="set_default_btn" class="btn">Set Default</button>
			</div>
		</div>
		</div>
		`

		document.body.insertAdjacentHTML('beforeend', innerHTML)
		document.body.insertAdjacentHTML('beforeend', settings)
	}
	
	updateStats(game) {
		document.getElementById("generation").innerHTML = game.scores.length-1
		document.getElementById("best_score").innerHTML = game.scores[game.scores.length-1]
		if (game.avg_scores[0]) {
			try { document.getElementById("avg_score").innerHTML = game.avg_scores[game.scores.length-1].toFixed(2) } catch(err) {console.log(err)}
		}
	}

	initGraph() {
		this.rendered_generation = null
		let ctx = this.context.graph

		let graph = new Chart(ctx, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
						label: 'score',
						data: [],
						backgroundColor: [`rgba(${COOL_BLUE}, 0.2)`],
						borderColor: [`rgba(${COOL_BLUE}, 1)`],              
						borderWidth: 1,
						yAxisId: 'y'
					},{
						label: 'rolling average 100',
						data: [],
						backgroundColor: ['rgba(255, 255, 255, 0.2)'], // white
						borderColor: ['rgba(255, 255, 255, 1)'],              
						borderWidth: 1,
						yAxisId: 'y'
					},
					// {
					//   label: 'epsilon',
					//   data: [],
					//   backgroundColor: ['rgba(255, 150, 150, 0.2)'], // red
					//   borderColor: ['rgba(255, 150, 150, 1)'],              
					//   borderWidth: 1,
					//   yAxisId: 'y1'
					// },
				]
			},
			options: {
					scales: {
						y: {
							position: 'right',
							beginAtZero: true,
							grid: {
								drawBorder: false,
								color: function(context) {
									if (context.tick.value == 0)
										return 'black'
									return 'rgb(0,0,0,.2)'
								},
							}                  
						},
						// y1: {
						//   beginAtZero: true,
						//   max: 1,
						//   position: 'left',
						//   grid: {
						//     drawOnChartArea: false, // The second scale shouldn't have a grid
						//   }                  
						// }
					},
					interaction: {
						mode: 'index',
						intersect: false,
					},      
					animation: {
						duration: 0
					},   
			}
		});

		return graph
	}

	updateGraph(game) {
		let generation = game.scores.length
		if (generation == this.rendered_generation) return

		let labels = []
		for (let i in game.scores) {labels.push(parseInt(i)+1)}

		this.graph.data.labels = labels
		this.graph.data.datasets[0].data = game.scores
		this.graph.data.datasets[1].data = game.avg_scores
		this.graph.update()

		this.rendered_generation = generation
	}

	drawLandscape(landscape, min, max) {
		this.context.landscape.clearRect(0,0,10000,10000)
		let ctx = this.buffer.landscape
		ctx.clearRect(0,0,10000,10000)

		max /= 10

		// this.context.landscape.canvas.height = ctx.canvas.height
		// this.context.landscape.canvas.width = ctx.canvas.width
		this.context.landscape.canvas.height = landscape[0].length
		this.context.landscape.canvas.width = landscape.length
		ctx.canvas.height = this.context.landscape.canvas.height
		ctx.canvas.width = this.context.landscape.canvas.width

		for (let x in landscape) {
			let row = landscape[x]
			for (let y in row) {
				let value = Math.min(row[y], max)
				let norm_value = 1-(max-value)/(max-min)
				// ctx.fillStyle = `rgb(${COOL_BLUE}},${1-norm_value})`
				let lightness = 50
				let threshold = .2
				if (norm_value < threshold)
					lightness += (threshold-norm_value)*50
				ctx.fillStyle = `hsl(${norm_value*255},100%,${lightness}%)`
				ctx.fillRect(x, y, 1, 1)
			}
		}
	}

	drawIndividuals(individuals, bounds, generation) {
		this.context.individuals.clearRect(0,0,10000,10000)
		let ctx = this.buffer.individuals
		ctx.clearRect(0,0,10000,10000)

		this.context.individuals.canvas.height = this.context.landscape.canvas.height
		this.context.individuals.canvas.width = this.context.landscape.canvas.width
		ctx.canvas.height = this.context.individuals.canvas.height
		ctx.canvas.width = this.context.individuals.canvas.width

		let width_height = [ctx.canvas.width, ctx.canvas.height]

		for (let individual of individuals) {
			if (individual.x) continue

			let scaled_values = []
			for (let i in individual.values) {
				let value = individual.values[i]
				let bound = bounds[i]
				scaled_values.push( (value - bound[0]) / (bound[1] - bound[0]) * width_height[i] )
			}
			individual.x = scaled_values[0]
			individual.y = scaled_values[1]
		}

		for (let individual of individuals) {
			ctx.fillStyle = "black"
			// if (individual.generation > generation) {
			// 	ctx.fillStyle = "green"
			// }
			ctx.beginPath()
			ctx.ellipse(individual.x, individual.y, 2, 2, 0, 0, 7)
			ctx.fill()
			for (let child of individual.offspring) {
				ctx.strokeStyle = "black"
				ctx.beginPath()
				ctx.moveTo(individual.x, individual.y)
				ctx.lineTo(child.x, child.y)
				ctx.stroke()
			}
		}
	}

	resize(width, height, height_width_ratio) {

		if (height / width > height_width_ratio) {

			this.context.individuals.canvas.height = width * height_width_ratio;
			this.context.individuals.canvas.width = width;

		} else {

			this.context.individuals.canvas.height = height;
			this.context.individuals.canvas.width = height / height_width_ratio;

		}

		let content_div = document.getElementById("content_div")
		let graph_canvas = this.context.graph.canvas

		if (!window.mobileCheck()) {
			let graph_width = content_div.offsetWidth * .5
			let graph_height = content_div.offsetHeight - document.getElementById("content_top_div").offsetHeight
			if (this.graph) { 
				this.graph.destroy() 
				graph_canvas.height = graph_height
				graph_canvas.width = graph_width
				this.graph = this.initGraph()
				this.updateGraph(document.value.game)
			} else {
				graph_canvas.height = graph_height
				graph_canvas.width = graph_width
			}    
    
		} else { // Mobile
			// If new mobile
			document.getElementsByClassName("settings_div").forEach(element => {
				element.style['grid-template-columns'] = "auto"
			})
			content_div.appendChild(nn_canvas)
			let top_left_div = document.getElementById("content_top_left_div")
			top_left_div.parentElement.removeChild(top_left_div)
			content_div.appendChild(top_left_div)
			graph_canvas.parentElement.removeChild(graph_canvas)
			content_div.appendChild(graph_canvas)

			document.getElementById("content_top_div").style['grid-template-columns'] = 'auto'
			// -----
		}

	}

	render() { 
		this.context.landscape.drawImage(this.buffer.landscape.canvas, 0, 0, this.buffer.landscape.canvas.width, this.buffer.landscape.canvas.height, 0, 0, this.context.landscape.canvas.width, this.context.landscape.canvas.height); 
		this.context.individuals.drawImage(this.buffer.individuals.canvas, 0, 0, this.buffer.individuals.canvas.width, this.buffer.individuals.canvas.height, 0, 0, this.context.individuals.canvas.width, this.context.individuals.canvas.height);   
	}  

}