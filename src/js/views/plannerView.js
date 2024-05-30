import ModalView from './ModalView';
import previewView from './previewView.js';
import { getCurrentDateTS } from '../helpers.js';

class PlannerView extends ModalView {
  _parentElement = document.querySelector('.planner__list');
  _message = 'Choose a recipe and add it to your meal planner!';

  _modal = document.querySelector('.planner-window');
  #btnOpen = document.querySelector('.nav__btn--meal-planner');
  #btnClose = this._modal.querySelector('.btn--close-modal');
  #btnLeft = this._modal.querySelector('.planner__btn--left');
  #btnRight = this._modal.querySelector('.planner__btn--right');

  constructor() {
    super();
    this.#addHandlerCloseModal();
    this.#addHandlerCloseModalOnRecipeClick();
    this.#addHandlerScrollControls();
  }

  /**
   * Shows / hides scroll buttons and renders 'meal planner' component.
   * @param  {...*} args
   */
  render(...args) {
    const data = Object.entries(args[0]);
    this.#showHideScrollButtons(data);
    super.render(...args);
  }

  /** Hides scroll buttons and renders empty list message. */
  renderMessage() {
    this.#showHideScrollButtons();
    super.renderMessage();
  }

  /**
   * Adds event listener to show 'meal planner' modal window on the 'meal planner' button click.
   * @param {callback} handler
   */
  addHandlerShowModal(handler) {
    this.#btnOpen.addEventListener('click', () => {
      handler();
      super._showModal();
    });
  }

  /** Adds event listener to close 'meal planner' modal window on click the 'close' button or overlay. */
  #addHandlerCloseModal() {
    [this.#btnClose, this._overlay].forEach((el) =>
      el.addEventListener('click', super._closeModal.bind(this))
    );
  }

  /** Adds event listener to close 'meal planner' modal window on a recipe click. */
  #addHandlerCloseModalOnRecipeClick() {
    this._parentElement.addEventListener('click', (e) => {
      const link = e.target.closest('.preview__link');
      if (link) super._closeModal();
    });
  }

  /** Adds event listener to scroll planner list on the scroll buttons click. */
  #addHandlerScrollControls() {
    // Add handlers for 'move left' and 'move right' buttons
    [this.#btnLeft, this.#btnRight].forEach((btn) => {
      const direction = btn.classList.contains('planner__btn--left')
        ? 'left'
        : 'right';

      btn.addEventListener('click', () => {
        const plannerElWidth = this._parentElement.clientWidth;
        this._parentElement.scrollBy({
          left: direction === 'left' ? -plannerElWidth : plannerElWidth,
          behavior: 'smooth',
        });
      });
    });
  }

  /**
   * Adds event listener to remove recipe from meal planner on the 'remove' button click.
   * @param {callback} handler
   */
  addHandlerRemoveRecipe(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.preview__btn--remove');
      if (!btn) return;

      e.preventDefault();

      const itemEl = btn.closest('.preview');
      const itemId = +itemEl.dataset.id;
      const dayListEl = itemEl.closest('.planner__day-list');
      itemEl.remove();

      // Check if the planner view should be re-rendered
      const forceRender = !dayListEl.childElementCount;

      // Check if the datepicker should be considered for updating
      const isActiveRecipe = !!itemEl.querySelector('.preview__link--active');

      handler(itemId, forceRender, isActiveRecipe);
    });
  }

  /**
   * Shows / hides scroll buttons depending on if there are recipes in meal planner or not.
   * @param {Object[]} data Recipes in meal planner
   */
  #showHideScrollButtons(data) {
    const isEmptyClass = this._modal.classList.contains('planner--empty');

    // if data is not empty and there is 'planner-empty' class
    // if data is empty and there is no 'planner-empty' class
    if ((data?.length && isEmptyClass) || (!data?.length && !isEmptyClass))
      this._modal.classList.toggle('planner--empty');
  }

  /**
   * Generates 'Meal Planner' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    // Sort dates in meal planner
    const sortedDates = Object.entries(this._data).sort(
      ([a], [b]) => Date.parse(a) - Date.parse(b)
    );

    return sortedDates.map(this.#generateMarkupPlannerDay).join('');
  }

  /**
   * Generates day element of the 'meal planner' component.
   * @param {[string, Object[]]} data  Data containing date in string format and recipes for that date
   * @returns {string} Markup of the element in string format
   */
  #generateMarkupPlannerDay([date, recipes]) {
    // Check if provided date is today's date
    const today = Date.parse(date) === getCurrentDateTS();

    return `
      <div class="planner__day">
        <h3 class="planner__day-title ${today ? 'today' : ''}">${date}</h3>
        <ul class="planner__day-list">
          ${recipes
            .map(({ recipeId: id, id: entryId, ...props }) =>
              previewView.generateMarkup({ id, entryId, ...props }, 'planner')
            )
            .join('')}
        </ul>
      </div>
    `;
  }
}

export default new PlannerView();
