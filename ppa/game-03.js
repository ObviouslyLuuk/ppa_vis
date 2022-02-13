class Game {
	constructor() {
		this.world = new Game.World(this)

		this.state = 'birth' // can be birth, kill

		// Settings
		this.printing = false

		// Trackers
		this.scores = []
		this.avg_scores = []
	}

	set_default_settings() {
		this.state = 'birth'

		this.printing = false

		this.reset()
		document.value.controller.settings_update_values()
	}

	reset() {
		this.scores = []
		this.avg_scores = []
	}
}

Game.World = class {
	constructor(game, benchmark="MartinGaddy") {
		this.game = game
		
		this.landscape_fn = BENCHMARKS[benchmark].function
		this.bounds = BENCHMARKS[benchmark].bounds

		this.score = null

		this.width = 600
		this.height = 400

		this.global_min = Infinity
		this.global_max = -Infinity
		this.landscape = this.get_landscape()

	}

	/**
	 * 
	 * @returns 2D array of objective values
	 */
	get_landscape() {
		let landscape = []
		let x1_range = this.bounds[0][1] - this.bounds[0][0]
		let x2_range = this.bounds[1][1] - this.bounds[1][0]
		for (let x = 0; x < this.width; x++) {
			let x1 = x/this.width * x1_range + this.bounds[0][0]
			landscape.push([])
			for (let y = 0; y < this.height; y++) {
				let x2 = y/this.height * x2_range + this.bounds[1][0]
				let value = this.landscape_fn(x1, x2)
				this.global_max = Math.max(value, this.global_max)
				this.global_min = Math.min(value, this.global_min)
				landscape[x].push(value)
			}
		}
		return landscape
	}

}


BENCHMARKS = {
	SixHumpCamel: {
		function: function (x1, x2) {
			return (4 - 2.1*x1**2 + x1**4/3) * x1**2 + x1*x2 + (-4 + 4*x2**2) * x2**2
		},
		bounds: [
			[-3,3],
			[-2,2],
		]
	},
	MartinGaddy: {
		function: function (x1, x2) {
			return (x1 - x2)**2 + ( (x1 + x2 - 10)/3 )**2
		},
		bounds: [
			[-20,20],
			[-20,20],
		]
	},
	GoldsteinPrice: {
		function: function (x1, x2) {
			return (1 + (x1 + x2 + 1)**2 * 
				(19 - 14*x1 + 3*x1**2 - 14*x2 + 6*x1*x2 + 3*x2**2)) *
				(30 + (2*x1 - 3*x2)**2 *
				(18 - 32*x1 + 12*x1**2 + 48*x2 - 36*x1*x2 + 27*x2**2))
		},
		bounds: [
			[-2,2],
			[-2,2],
		]
	},
	Branin: {
		function: function (x1, x2) {
			return (x2 - 5.1/(4*Math.PI**2)*x1**2 + 5/Math.PI * x1 - 6)**2
				+ 10*(1 - 1/(8*Math.PI)) * Math.cos(x1) + 10
		},
		bounds: [
			[-5,15],
			[-5,15],
		]
	},
	Easom: {
		function: function (x1, x2) {
			return - Math.cos(x1) * Math.cos(x2) * 
				Math.exp(- ((x1-Math.PI)**2) - (x2 - Math.PI)**2)
		},
		bounds: [
			[-100,100],
			[-100,100],
		]
	},
}
