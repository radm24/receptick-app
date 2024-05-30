import ModalView from './ModalView';
import icons from '../../img/icons.svg';
import { SHOP_LIST_MAX_ITEMS, MODAL_CLOSE_ANIM_DUR } from '../config.js';

class ShoppingListView extends ModalView {
  _parentElement = document.querySelector('.shopping-list__list');
  _message = 'Choose a recipe and add its ingredients to your shopping list!';

  _modal = document.querySelector('.shopping-list-window');
  #btnOpen = document.querySelector('.nav__btn--shopping-list');
  #btnClose = this._modal.querySelector('.btn--close-modal');

  #mode;
  #form = document.querySelector('.shopping-list');
  #btnEdit = document.querySelector('.list__btn-edit');
  #btnDeleteAll = document.querySelector('.list__btn-delete-all');
  #btnDownload = document.querySelector('.list__btn-download');
  #btnAdd = document.querySelector('.list__btn-add');
  #btnSave = document.querySelector('.list__btn-save');

  // Workaround to protected mode of D&D dragover event, since data passed into
  // drag data store in dragstart event is not accessible in dragover event
  #draggedItemId;

  constructor() {
    super();
    this.#mode = 'view';
    this.#addHandlerShowModal();
    this.#addHandlerEditList();
    this.#addHandlerDeleteList();
    this.#addHandlerAddListItem();
    this.#addHandlerSaveList();
    this.#addHandlerListItemAction();
    this.#addHandlerInputFieldPressEnterKey();

    this.#addHandlerDragStart();
    this.#addHandlerDragOver();
    this.#addHandlerDragEnd();
  }

  /**
   * Provides fallback value for rendering if data is empty and renders 'shopping list' component.
   * @param  {...*} args
   */
  render(...args) {
    // Creating a fallback value in case of switching to the 'edit' mode
    // with the empty shopping list, to correctly render an empty input field
    // args[0] === 'data' param
    if (!args[0]) args[0] = [{}];
    super.render(...args);
  }

  /** Toggles between 'view' and 'edit' modes.*/
  #toggleMode() {
    this.#mode = this.#mode === 'view' ? 'edit' : 'view';
    this.#form.classList.toggle('view');
    this.#form.classList.toggle('edit');
  }

  /** Adds event listener to show 'shopping list' modal window on the 'shopping list' button click. */
  #addHandlerShowModal() {
    this.#btnOpen.addEventListener('click', this._showModal.bind(this));
  }

  /**
   * Adds event listener to close 'shopping list' modal window on click the 'close' button or overlay.
   * @param {callback} handler
   */
  addHandlerCloseModal(handler) {
    [this.#btnClose, this._overlay].forEach((el) =>
      el.addEventListener('click', () => {
        this._closeModal();

        // If a modal in 'edit' mode then discard all changes and switch to 'view' mode
        if (
          !(
            this._parentElement ===
              document.querySelector('.shopping-list__list') &&
            this.#mode === 'edit'
          )
        )
          return;

        setTimeout(() => {
          this.#toggleMode();
          handler();
        }, MODAL_CLOSE_ANIM_DUR * 1000);
      })
    );
  }

  /**
   * Adds event listener to save changes made in shopping list on the 'shopping list' form submit.
   * @param {callback} handler
   */
  addHandlerUpdateList(handler) {
    this.#form.addEventListener('submit', (e) => {
      e.preventDefault();

      let dataObj = {};
      if (e.submitter !== this.#btnDeleteAll)
        dataObj = Object.fromEntries(new FormData(this.#form));

      handler(dataObj);
    });
  }

  /**
   * Adds event listener to download the shopping list as PDF file on the 'download' button click.
   * @param {callback} handler
   */
  addHandlerDownloadList(handler) {
    this.#btnDownload.addEventListener('click', (e) => {
      e.preventDefault();

      handler();
    });
  }

  /** Adds event listener to switch the shopping list to 'edit' mode on the 'edit' button click. */
  #addHandlerEditList() {
    this.#btnEdit.addEventListener('click', (e) => {
      e.preventDefault();

      this.#toggleMode();

      // Check if the shopping list is empty and if so then render empty input field
      if (this._parentElement.querySelector('.message')) {
        this.render();
      }

      // Make list items are draggable
      [...this._parentElement.children].forEach((listItem) => {
        listItem.setAttribute('draggable', true);
      });
    });
  }

  /** Adds event listener to handle 'dragstart' event of shopping list items. */
  #addHandlerDragStart() {
    this._parentElement.addEventListener('dragstart', (e) => {
      e.target.classList.add('dragging');
      this.#draggedItemId = e.target.dataset.id;
    });
  }

  /** Adds event listener to handle 'dragover' event of shopping list items and move them inside the shopping list. */
  #addHandlerDragOver() {
    this._parentElement.addEventListener('dragover', (e) => {
      e.preventDefault();

      const targetItem = e.target.closest('.shopping-list__list-item');
      if (!targetItem) return;

      const targetItemId = targetItem.dataset.id;
      const draggedItemId = this.#draggedItemId;

      if (targetItemId === draggedItemId) return;

      const list = this._parentElement;
      const listItems = [...list.children];
      const draggedItem = list.querySelector(`[data-id="${draggedItemId}"]`);
      const draggedItemIdx = listItems.indexOf(draggedItem);
      const targetItemIdx = listItems.indexOf(targetItem);

      if (draggedItemIdx < targetItemIdx) {
        list.insertBefore(draggedItem, targetItem.nextSibling);
      }
      if (draggedItemIdx > targetItemIdx) {
        list.insertBefore(draggedItem, targetItem);
      }
    });
  }

  /** Adds event listener to handle 'dragend' event of shopping list items. */
  #addHandlerDragEnd() {
    this._parentElement.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
      this.#draggedItemId = null;
    });
  }

  /** Adds event listener to empty the shopping list on the 'delete all' button click. */
  #addHandlerDeleteList() {
    this.#btnDeleteAll.addEventListener('click', (e) => {
      e.preventDefault();

      // Check if the list has been actually deleted
      const listItem = this._parentElement.querySelector('li');
      if (listItem) this.#form.requestSubmit(this.#btnDeleteAll);
    });
  }

  /** Adds event listener to add a new item to the shopping list on the 'add' button click. */
  #addHandlerAddListItem() {
    this.#btnAdd.addEventListener('click', (e) => {
      e.preventDefault();

      // Generate new list item and scroll to it
      const idx = this._parentElement.childElementCount;
      if (idx >= SHOP_LIST_MAX_ITEMS) return;

      const newItem = this.#generateMarkupListItem({}, idx);
      this._parentElement.insertAdjacentHTML('beforeend', newItem);
      this._parentElement.lastElementChild.scrollIntoView({
        behavior: 'smooth',
      });
    });
  }

  /** Adds event listener to save items in the shopping list on the 'save' button click */
  #addHandlerSaveList() {
    this.#btnSave.addEventListener('click', (e) => {
      e.preventDefault();

      this.#toggleMode();
      this.#form.requestSubmit();
    });
  }

  /** Adds event listener to check / remove item in the shopping list on click the 'check' or 'discard' buttons. */
  #addHandlerListItemAction() {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.item-controls__btn');
      if (!btn) return;

      e.preventDefault();

      const item = btn.closest('li');
      const action = btn.classList.contains('item-controls__btn-check')
        ? 'check'
        : 'discard';

      if (action === 'check') {
        const checkbox = item.querySelector('[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.#form.requestSubmit();
      }
      if (action === 'discard') {
        item.remove();
      }
    });
  }

  /** Adds event listener to jump to the next item input on the 'Enter' key press while item input is focused. */
  #addHandlerInputFieldPressEnterKey() {
    this._parentElement.addEventListener('keydown', (e) => {
      const itemInput = e.target.closest('.shopping-list__ing-input');

      if (!itemInput || e.key !== 'Enter') return;

      e.preventDefault();

      const list = this._parentElement;
      const listItems = [...this._parentElement.children];
      const curItemIdx = listItems.indexOf(itemInput.parentNode);

      if (list.childElementCount === curItemIdx + 1) itemInput.blur();
      else
        listItems[curItemIdx + 1]
          .querySelector('.shopping-list__ing-input')
          .focus();
    });
  }

  /**
   * Generates 'Shopping List' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    return Object.values(this._data)
      .map(this.#generateMarkupListItem.bind(this))
      .join('');
  }

  /**
   * Generates shopping list item element.
   * @param  {...*} args Data containing item name, item checked attribute and optional item index attribute
   * @returns {string} Markup of the element in string format
   */
  #generateMarkupListItem(...args) {
    const [{ item, checked }, idx = 0] = args;
    const id = `${idx}${Date.now()}`;

    return `
      <li class="shopping-list__list-item"
          draggable="${this.#mode === 'edit'}"
          data-id="${id}"
      >
        <div class="shopping-list__ingredient ${checked ? 'checked' : ''}">
          <p>${item ? item : ''}</p>
          <input 
            type="checkbox" 
            name="checked-${id}"
            class="shopping-list__ing-checkbox"
            ${checked ? 'checked' : ''}
          />
        </div>
        <input
          type="text"
          name="item-${id}"
          class="shopping-list__ing-input"
          placeholder="Item to buy"
          maxlength="100"
          value="${item ? item : ''}"
          ${checked ? 'readonly' : ''}
          data-html2canvas-ignore="true"
        />
        <div class="shopping-list__item-controls">
          <button class="btn--tiny item-controls__btn item-controls__btn-check">
            <svg>
              <title>Check</title>
              <use href="${icons}#icon-checkmark"></use>
            </svg>
          </button>
        </div>
        <div class="shopping-list__item-controls">
          <button class="btn--tiny item-controls__btn item-controls__btn-discard">
            <svg>
              <title>Discard</title>
              <use href="${icons}#icon-minus"></use>
            </svg>
          </button>
        </div>
      </li>
    `;
  }
}

export default new ShoppingListView();
