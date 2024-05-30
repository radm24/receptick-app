import View from './RenderView.js';
import icons from '../../img/icons.svg';
import fracty from 'fracty';
import datepicker from 'js-datepicker';
import { PLANNER_DAYS_INTERVAL } from '../config.js';
import { getCurrentDateTS } from '../helpers.js';

class RecipeView extends View {
  _parentElement = document.querySelector('.recipe');
  _errorMessage = "We couldn't find that recipe. Please try another one!";
  _updateExceptionElements = [
    '.qs-datepicker-container',
    '.recipe__nutritional-value',
  ];

  #datePicker;

  /**
   * Adds event listeners to load recipe on hash change or initial load.
   * @param {callback} handler
   */
  addHandlerRender(handler) {
    ['hashchange', 'load'].forEach((ev) =>
      window.addEventListener(ev, handler)
    );
  }

  /**
   * Adds event listener to increase / decrease servings on the servings control buttons click.
   * @param {callback} handler
   */
  addHandlerUpdateServings(handler) {
    this._parentElement
      .querySelector('.recipe__info-buttons')
      .addEventListener('click', (e) => {
        const btn = e.target.closest('.btn--update-servings');
        if (btn && +btn.dataset.updateTo > 0) handler(+btn.dataset.updateTo);
      });
  }

  /**
   * Renders datepicker element and handles its selected date.
   * @param {Object[]} dateEvents Dates that should be indicated as events
   * @param {callback} handler
   */
  addHandlerPlanner(dateEvents, handler) {
    const now = new Date();
    const getMaxDate = (date) =>
      new Date(new Date(date).setDate(date.getDate() + PLANNER_DAYS_INTERVAL));

    // Define datepicker element
    this.#datePicker = datepicker('.btn--planner', {
      position: 'tr',
      startDay: 1, // Monday
      events: dateEvents,
      minDate: now,
      maxDate: getMaxDate(now),
      showAllDates: true,
      onShow: (e) => {
        // Check if min date is today's date
        const nowTS = getCurrentDateTS();
        if (Date.parse(e.minDate) === nowTS) return;

        // Set min date and max date according to actual today's date
        const today = new Date(nowTS);
        e.minDate = today;
        e.maxDate = getMaxDate(today);

        // Force to re-render calendar
        this.#datePicker.setDate();
      },
      onSelect: ({ dateSelected }) => {
        // Unselect a date
        this.#datePicker.setDate();

        // Check if selected date is not past
        if (Date.parse(dateSelected) < getCurrentDateTS()) return;

        // Save selected date to meal planner
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }).format(dateSelected);

        handler(formattedDate);
      },
    });
    this.#datePicker.calendarContainer.classList.add('datepicker--planner');

    // Prevent calendar from closing on clicking the planner button
    this._parentElement
      .querySelector('.btn--planner')
      .addEventListener('click', (e) => {
        e.stopPropagation();
      });
  }

  /**
   * Adds event listener to bookmark / unbookmark a recipe on the 'bookmark' button click.
   * @param {callback} handler
   */
  addHandlerBookmark(handler) {
    this._parentElement
      .querySelector('.btn--bookmark')
      .addEventListener('click', handler);
  }

  /**
   * Adds event listener to add recipe ingredients to the shopping list on the 'ingredients' button click.
   * @param {callback} handler
   */
  addHandlerIngredients(handler) {
    this._parentElement
      .querySelector('.btn--ingredients')
      .addEventListener('click', handler);
  }

  /**
   * Updates datepicker's events array according to provided action.
   * @param {Date} date Date to add / remove / filter by
   * @param {'add' | 'remove' | 'update'} action Action to perform on datepicker's events array
   */
  updateDatePickerEvents(date, action) {
    const events = this.#datePicker.events;
    const timestamp = Date.parse(date); // NaN if date is undefined

    // Show specified date as event on datepicker or remove it
    if (action === 'add') events[timestamp] = true;
    if (action === 'remove') if (events[timestamp]) delete events[timestamp];

    // Update day events according to today's date
    if (action === 'update') {
      const filteredEventEntries = Object.entries(events).filter(
        ([eventTS]) => eventTS >= timestamp
      );
      this.#datePicker.events = Object.fromEntries(filteredEventEntries);
    }

    // Re-render calendar to update date events
    this.#datePicker.setDate();
  }

  /**
   * Generates 'Recipe' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    const {
      image,
      title,
      cookingTime,
      servings,
      ingredients,
      publisher,
      sourceUrl,
      key,
      bookmarked,
      nutrients,
    } = this._data;

    return `
        <figure class="recipe__fig">
            <img src=${image} alt=${title} class="recipe__img" />
            <h1 class="recipe__title">
                <span>${title}</span>
            </h1>
        </figure>

        <div class="recipe__details">
            <div class="recipe__info">
                <svg class="recipe__info-icon">
                    <use href="${icons}#icon-clock"></use>
                </svg>
                <span class="recipe__info-data recipe__info-data--minutes">${cookingTime}</span>
                <span class="recipe__info-text">minutes</span>
            </div>
            <div class="recipe__info">
                <svg class="recipe__info-icon">
                    <use href="${icons}#icon-users"></use>
                </svg>
                <span class="recipe__info-data recipe__info-data--people">${servings}</span>
                <span class="recipe__info-text">servings</span>

                <div class="recipe__info-buttons">
                    <button class="btn--tiny btn--update-servings" data-update-to="${
                      servings - 1
                    }">
                        <svg>
                            <use href="${icons}#icon-minus-circle"></use>
                        </svg>
                    </button>
                    <button class="btn--tiny btn--update-servings" data-update-to="${
                      servings + 1
                    }">
                        <svg>
                            <use href="${icons}#icon-plus-circle"></use>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="recipe__controls">
                <div class="recipe__user-generated ${key ? '' : 'hidden'}">
                    <svg>
                        <use href="${icons}#icon-user"></use>
                    </svg>
                </div>
                <button class="btn--round btn--planner">
                    <svg class="">
                        <use href="${icons}#icon-planner-add"></use>
                    </svg>
                </button>
                <button class="btn--round btn--bookmark">
                    <svg class="">
                        <use href="${icons}#icon-bookmark${
      bookmarked ? '-fill' : ''
    }"></use>
                    </svg>
                </button>
            </div>
        </div>

        ${
          Object.values(nutrients).some(Boolean)
            ? this.#generateMarkupNutrients(nutrients)
            : ''
        }

        <div class="recipe__ingredients">
            <h2 class="heading--2">Recipe ingredients</h2>
            <button class="btn--round btn--ingredients">
            <svg class="">
                <use href="${icons}#icon-shopping-list-add"></use>
            </svg>
        </button>
            <ul class="recipe__ingredient-list">
                ${ingredients.map(this.#generateMarkupIngredients).join('')}
            </ul>
        </div>

        <div class="recipe__directions">
            <h2 class="heading--2">How to cook it</h2>
            <p class="recipe__directions-text">
                This recipe was carefully designed and tested by
                <span class="recipe__publisher">${publisher}</span>. Please check out
                directions at their website.
            </p>
            <a class="btn--small recipe__btn" href="${sourceUrl}" target="_blank">
                <span>Directions</span>
                <svg class="search__icon">
                    <use href="${icons}#icon-arrow-right"></use>
                </svg>
            </a>
        </div>
    `;
  }

  /**
   * Generates nutritional data block.
   * @param {Object} nutrients Nutrients data
   * @returns {string} Markup of the element in string format
   */
  #generateMarkupNutrients(nutrients) {
    return `
        <div class="recipe__nutritional-value">
            <h2 class="heading--2">Nutritional value / serving</h2>
            <div class="recipe__nutrients">
                ${Object.entries(nutrients)
                  .map(([nutrient, amount]) => {
                    return `
                        <div class="recipe__nutrient">
                            <h3 class="heading--3">${nutrient}</h3>
                            <span class="recipe__nutrient-amount">${amount} ${
                      nutrient === 'calories' ? 'kcal' : 'g'
                    }</span>
                        </div>
                    `;
                  })
                  .join('')}
            </div>
        </div>
    `;
  }

  /**
   * Generates ingredient element.
   * @param {Object} ingredient Ingredient data (quantity, unit, description)
   * @param {number | null} ingredient.quantity
   * @param {string} ingredient.unit
   * @param {string} ingredient.description
   * @returns {string} Markup of the element in string format
   */
  #generateMarkupIngredients({ quantity, unit, description }) {
    return `
        <li class="recipe__ingredient">
            <svg class="recipe__icon">
                <use href="${icons}#icon-check"></use>
            </svg>
            <div class="recipe__quantity">${
              quantity ? fracty(quantity) : ''
            }</div>
            <div class="recipe__description">
                <span class="recipe__unit">${unit}</span>
                ${description}
            </div>
        </li>
    `;
  }
}

export default new RecipeView();
