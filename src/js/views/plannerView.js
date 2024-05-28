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

  render(...args) {
    const data = Object.entries(args[0]);
    this.#showHideScrollButtons(data);
    super.render(...args);
  }

  renderMessage() {
    this.#showHideScrollButtons();
    super.renderMessage();
  }

  addHandlerShowModal(handler) {
    this.#btnOpen.addEventListener('click', () => {
      handler();
      super._showModal();
    });
  }

  #addHandlerCloseModal() {
    [this.#btnClose, this._overlay].forEach((el) =>
      el.addEventListener('click', super._closeModal.bind(this))
    );
  }

  #addHandlerCloseModalOnRecipeClick() {
    this._parentElement.addEventListener('click', (e) => {
      const link = e.target.closest('.preview__link');
      if (link) super._closeModal();
    });
  }

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

  addHandlerRemoveRecipe(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.preview__btn--remove');
      if (!btn) return;

      e.preventDefault();

      const itemEl = btn.closest('.preview');
      const itemId = +itemEl.dataset.id;
      const dayListEl = itemEl.closest('.planner__day-list');
      itemEl.remove();

      // Check if the planner view should be rerendered
      const forceRender = !dayListEl.childElementCount;

      // Check if the datepicker should be considered for updating
      const isActiveRecipe = !!itemEl.querySelector('.preview__link--active');

      handler(itemId, forceRender, isActiveRecipe);
    });
  }

  #showHideScrollButtons(data) {
    const isEmptyClass = this._modal.classList.contains('planner--empty');

    // if data is not empty and there is 'planner-empty' class
    // if data is empty and there is no 'planner-empty' class
    if ((data?.length && isEmptyClass) || (!data?.length && !isEmptyClass))
      this._modal.classList.toggle('planner--empty');
  }

  _generateMarkup() {
    // Sort dates in meal planner
    const sortedDates = Object.entries(this._data).sort(
      ([a], [b]) => Date.parse(a) - Date.parse(b)
    );

    return sortedDates.map(this.#generateMarkupPlannerDay).join('');
  }

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
