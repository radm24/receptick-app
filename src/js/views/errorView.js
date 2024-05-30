import ModalView from './ModalView.js';

class ErrorView extends ModalView {
  _parentElement = document.querySelector('.error__message');

  _modal = document.querySelector('.error-window');
  #btnClose = this._modal.querySelector('.btn--close-modal');

  constructor() {
    super();
    this.#addHandlerCloseModal();
  }

  /** Adds event listeners to close 'error' modal window on click the 'close' button or overlay. */
  #addHandlerCloseModal() {
    [this.#btnClose, this._overlay].forEach((el) =>
      el.addEventListener('click', super._closeModal.bind(this))
    );
  }

  /**
   * Shows error message in modal window.
   * @param {string} message Error message text
   */
  show(message) {
    super.renderError(message);
    super._showModal();
  }
}

export default new ErrorView();
