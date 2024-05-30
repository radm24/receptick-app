import ModalView from './ModalView.js';
import icons from '../../img/icons.svg';
import {
  RECIPE_MIN_INGR,
  RECIPE_MAX_INGR,
  MODAL_CLOSE_ANIM_DUR,
} from '../config.js';

class AddRecipeView extends ModalView {
  _parentElement = document.querySelector('.upload');
  _message = 'Recipe was successfully uploaded :)';

  _modal = document.querySelector('.add-recipe-window');
  #btnOpen = document.querySelector('.nav__btn--add-recipe');
  #btnClose = this._modal.querySelector('.btn--close-modal');

  #ingControls = document.querySelector('.upload__ing-controls');
  #ingredientsEl = document.querySelector('.upload__ingredients');

  constructor() {
    super();
    this.#addHandlerShowModal();
    this.#addHandlerCloseModal();
    this.#addHandlerIngControls();
  }

  /** Adds event listener to show 'add recipe' modal window on the 'add recipe' button click. */
  #addHandlerShowModal() {
    this.#btnOpen.addEventListener('click', super._showModal.bind(this));
  }

  /** Adds event listener to close 'add recipe' modal window on click the 'close' button or overlay. */
  #addHandlerCloseModal() {
    [this.#btnClose, this._overlay].forEach((el) =>
      el.addEventListener('click', this.closeModal.bind(this))
    );
  }

  /**
   * Add event listener to upload user recipe on the 'upload' button click.
   * @param {callback} handler
   */
  addHandlerUpload(handler) {
    this._parentElement.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const dataObj = Object.fromEntries(formData);
      handler(dataObj);
    });
  }

  /** Closes 'add recipe' modal window and re-renders 'add recipe' component if there is error or success message. */
  closeModal() {
    if (this._modal.classList.contains('hidden')) return;

    super._closeModal();

    // Re-render 'add recipe' page if success or error message has replaced its content
    // Check if modal window was closed
    if (this._modal.classList.contains('hidden')) this.#checkAndRerender();
  }

  /** Checks if there is error or success message, if so then re-renders 'add recipe' component. */
  #checkAndRerender() {
    const render = !!this._parentElement.querySelector(
      ':scope > .message, :scope > .error'
    );

    if (!render) return;

    const cb = this.#reinitHandlerIngControls.bind(this);
    setTimeout(
      () => super.render(true, null, cb), // 'true' value just a placeholder to avoid error on render method
      MODAL_CLOSE_ANIM_DUR * 1000
    );
  }

  /** Adds event listener to newly rendered ingredients control buttons. */
  #reinitHandlerIngControls() {
    this.#ingControls = document.querySelector('.upload__ing-controls');
    this.#ingredientsEl = document.querySelector('.upload__ingredients');

    this.#addHandlerIngControls();
  }

  /** Adds event listener to add / remove ingredient inputs row on ingredients control buttons click. */
  #addHandlerIngControls() {
    this.#ingControls.addEventListener('click', (e) => {
      const btn = e.target.closest('.upload__btn-ing');
      if (!btn) return;

      e.preventDefault();

      const action = btn.dataset.action;
      const numRows = this.#ingredientsEl.childElementCount;

      if (
        (numRows <= RECIPE_MIN_INGR && action === 'remove') ||
        (numRows >= RECIPE_MAX_INGR && action === 'add')
      )
        return;

      if (action === 'add') this.#addIngRow(numRows);
      if (action === 'remove')
        this.#removeIngRow(this.#ingredientsEl.lastElementChild);
    });
  }

  /**
   * Adds new ingredient inputs row.
   * @param {number} numRows Current number of ingredients rows
   */
  #addIngRow(numRows) {
    const newRow = this.#generateIngRow(numRows + 1);
    this.#ingredientsEl.insertAdjacentHTML('beforeend', newRow);

    // Scroll to the newly created row
    this.#ingredientsEl.lastElementChild.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Removes specified ingredient inputs row.
   * @param {Element} lastRow Ingredient element to remove
   */
  #removeIngRow(lastRow) {
    this.#ingredientsEl.removeChild(lastRow);

    // Scroll to the new last row
    this.#ingredientsEl.lastElementChild.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Generates ingredient inputs row.
   * @param {number} num Serial number of new ingredient element
   * @returns {string} Markup of ingredient element in string format
   */
  #generateIngRow(num) {
    return `
      <div class="upload__ing-row">
        <label>Ingredient ${num}</label>
        <div class="upload__ing-fields">
          <input
            type="number"
            name="ing-${num}-quantity"
            placeholder="Quantity"
            step="0.01"
            min="0.01"
            max="10000"
          />
          <input type="text" name="ing-${num}-unit" placeholder="Unit" maxlength="100" />
          <input
            type="text"
            name="ing-${num}-description"
            placeholder="Ingredient"
            ${num === 1 ? 'required' : ''}
            maxlength="200"
          />
        </div>
      </div>
    `;
  }

  /**
   * Generates 'Add Recipe' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    return `
      <div class="upload__column">
        <h3 class="upload__heading">Recipe data</h3>
        <label>Title</label>
        <input required name="title" type="text" maxlength="200" />
        <label>URL</label>
        <input required name="sourceUrl" type="text" maxlength="500" />
        <label>Image URL</label>
        <input required name="image" type="text" maxlength="500" />
        <label>Publisher</label>
        <input required name="publisher" type="text" maxlength="200" />
        <label>Prep time</label>
        <input required name="cookingTime" type="number" min="1" max="1000" />
        <label>Servings</label>
        <input required name="servings" type="number" min="1" max="1000" />
      </div>

      <div class="upload__column">
        <h3 class="upload__heading">Ingredients</h3>
        <div class="upload__ing-controls">
          <button class="btn--tiny upload__btn-ing" data-action="add">
            <svg>
              <use href="${icons}#icon-plus"></use>
            </svg>
          </button>
          <button class="btn--tiny upload__btn-ing" data-action="remove">
            <svg>
              <use href="${icons}#icon-minus"></use>
            </svg>
          </button>
        </div>
        <div class="upload__ingredients">
          ${[...Array(RECIPE_MIN_INGR)]
            .map((_, idx) => this.#generateIngRow(idx + 1))
            .join('')}
        </div>
      </div>

      <button class="btn upload__btn">
        <svg>
          <use href="${icons}#icon-upload-cloud"></use>
        </svg>
        <span>Upload</span>
      </button>
    `;
  }
}

export default new AddRecipeView();
