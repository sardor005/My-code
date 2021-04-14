'use strict';



// Architecture

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration){
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.desription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }

  click(){
    this.clicks++
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords, distance, duration, cadence){
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();

  }

  calcPace(){
    this.pace = this.duration / this.distance;
    return this.pace
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();

  }

  calcSpeed(){
    this.speed = this.distance / (this.duration / 60);
    return this.speed
  }
}

// const run1 = new Running([39, -5], 5 , 22)
// console.log(run1);


//  Site architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Your current location isn't loaded");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coord = [latitude, longitude];

    this.#map = L.map('map').setView(coord, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // #Map handling
    this.#map.on('click', this._showForm.bind(this));
   
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work)
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(){
    // Empty inputs
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value =
      '';
    //  Hide the Form
    form.style.display = 'none'
    form.classList.add('hidden') 
    setTimeout(() => form.style.display = 'grid', 1000)  
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    // Helper fn
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout runninng, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check data if it is valid
      // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) return alert('Please, give here possitive number');
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Please, give here possitive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Please, give here possitive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add new object to worout Array
    this.#workout.push(workout);
    // console.log(workout);

    // Render workout map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout)
      // Hiding form fn
    this._hideForm()

    // Set locol storage to all workouts
    this._localStorage()

  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.desription}`)
      .openPopup();
  }

  _renderWorkout(workout){
      let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.desription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;

      if(workout.type === 'running'){
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
      }

      if(workout.type === 'cycling'){
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> 
        `;
      }

      form.insertAdjacentHTML('afterend', html)
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout')
    
    if (!workoutEl) return;
    

    const workout = this.#workout.find(work => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1
      }
    });
      // workout.click()
  }

  _localStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workout))
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'))
    // console.log(data);

    if(!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work)
    })
  }

  reset(){
    localStorage.removeItem('workouts');
    location.reload()
  }
}

const app = new App();



