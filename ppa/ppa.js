class Population {
    constructor(popSize=30, nmax=5, landscape_fn, bounds=[[-1,1],[-2,2]], steepness_factor=1000) {
        this.popSize = popSize
        this.nmax = nmax

        this.steepness_factor = steepness_factor
        this.evaluations = 1

        this.landscape_fn = landscape_fn
        this.bounds = bounds
        this.individuals = this.init_pop()

        this.fmax = null
        this.fmin = null
    }

    init_pop() {
        let individuals = []
        for (let i = 0; i < this.popSize; i++) {
            let individual = new Individual(null, 0)
            individual.random_init(this.bounds)
            individuals.push(individual)
        }
        return individuals
    }

    get_obj_values() {
        this.fmax = -Infinity
        this.fmin = Infinity
        for (let individual of this.individuals) {
            let obj_value = individual.get_obj_value(this.landscape_fn)
            this.fmax = Math.max(this.fmax, obj_value)
            this.fmin = Math.min(this.fmin, obj_value)
        }
        this.evaluations++
    }

    assign_fitnesses() {
        this.get_obj_values()

        for (let individual of this.individuals) {
            let norm_obj_value = (this.fmax - individual.obj_value) / (this.fmax - this.fmin)
            let s = this.evaluations / this.steepness_factor + 1
            individual.assign_fitness(norm_obj_value, s)
        }
    }

    make_offsprings() {
        let offspring = []
        for (let individual of this.individuals) {
            offspring.push(
                ...individual.make_offspring(this.nmax, this.bounds)
            )
        }
        this.individuals.push(...offspring)

    }

    select_pop() {
        this.get_obj_values()
        let selection = this.individuals.sort((a, b) => a.obj_value - b.obj_value).slice(0, this.popSize)
        for (let i = this.popSize; i < this.individuals.length; i++) {
            this.individuals[i].kill()
        }
        this.individuals = selection
    }

    get_average_value() {
        let sum = 0
        for (let individual of this.individuals) {
            sum += individual.obj_value
        }
        return sum / this.individuals.length
    }

    reset() {
        this.individuals = this.init_pop()

        this.fmax = null
        this.fmin = null
    }
}

class Individual {
    constructor(parent, generation) {
        this.parent = parent
        this.generation = generation
        this.values = null
        this.obj_value = null
        this.fitness = null

        this.offspring = []
    }

    random_init(bounds) {
        this.values = []
        for (let bound of bounds) {
            let range = bound[1] - bound[0]
            this.values.push(Math.random()*range + bound[0])
        }
    }

    get_obj_value(landscape_fn) {
        if (this.obj_value)
            return this.obj_value

        this.obj_value = landscape_fn(...this.values)
        return this.obj_value
    }

    assign_fitness(norm_obj_value, s) {
        this.fitness = .5 * (Math.tanh(s*4 * norm_obj_value - s*2) + 1)
        return this.fitness
    }

    make_offspring(nmax, bounds) {
        let amount = Math.floor(nmax*this.fitness*Math.random())
        let offspring = []
        for (let i = 0; i < amount; i++) {
            let individual = new Individual(this, this.generation+1)
            individual.values = [...this.values]
            individual.mutate(this.fitness, bounds)
            offspring.push(individual)
        }
        this.offspring.push(...offspring)
        return offspring
    }

    mutate(fitness, bounds) {
        for (let i in this.values) {
            let range = bounds[i][1] - bounds[i][0]
            this.values[i] += range * 2*(Math.random()-.5)*(1-fitness)
            
            // Correct back to bound if it exceeds it
            if (this.values[i] > bounds[i][1]) {
                this.values[i] = bounds[i][1]
            }
            if (this.values[i] < bounds[i][0]) {
                this.values[i] = bounds[i][0]
            }
        }
    }

    kill_child(child) {
        this.offspring.splice(this.offspring.findIndex( (e) => e == child ))
    }

    kill() {
        if (!this.parent) {
            return
        }
        this.parent.kill_child(this)
    }
}