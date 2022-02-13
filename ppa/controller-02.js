class Controller {
  constructor() {
  }

  init_buttons() {
    document.getElementById("speed_slider").oninput = function() {
      let time_step = this.value
      document.value.engine.changeTimeStep(1000/time_step)
      document.value.controller.adjust_speed_slider(time_step)
    }

    document.getElementById("info_btn").onclick = function() {
      let div = document.getElementById("info_div")
      let display = div.style.display
      if (display == 'none') {
        div.style.display = 'block'
      } else {
        div.style.display = 'none'
      }
    }    
    document.getElementById("close_info_btn").onclick = function() {
      document.getElementById("info_div").style.display = 'none'
    }

    document.getElementById("reset_btn").onclick = function() {
      document.value.game.reset()
      document.value.population.reset()
    }
  }
  
  adjust_speed_slider(time_step) {
    let slider = document.getElementById("speed_slider")
    slider.value = time_step
    document.getElementById("fps").innerHTML = time_step
  }

  init_settings() {
    this.settings_update_values()

    document.getElementById("set_default_btn").onclick = function() {
      document.value.game.set_default_settings()
    }

    document.getElementById("printing").onchange = function() {
      document.value.game.printing = this.checked
    }

  }

  settings_update_values() {
    document.getElementById("printing").checked = document.value.game.printing
  }

  keyDownUp(type, key_code) {

    let down = (type == "keydown")
    
    switch(key_code) {

      // case 37: this.left=down;  break;
      // case 39: this.right=down; break;

    }

  }  
}
