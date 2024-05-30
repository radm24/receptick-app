import icons from '../../img/icons.svg';

class RenderView {
  _data;

  /**
   * Callback to execute after component rendering
   * @callback renderCallback
   */

  /**
   * Renders specific component or error message to the DOM.
   * @param {*} data The data to be rendered (e.g. recipe)
   * @param {String} [markup] HTML in string format
   * @param {renderCallback} [callback]
   */
  render(data, markup, callback) {
    if (
      !data ||
      (Array.isArray(data) && !data.length) ||
      (data instanceof Object && !Object.keys(data).length)
    )
      return this.renderError();

    this._data = data;
    const html = markup ? markup : this._generateMarkup();

    this.#clear();
    this._parentElement.insertAdjacentHTML('afterbegin', html);

    if (callback) callback();
  }

  /**
   * Updates component text and attributes if possible, otherwise re-render the component completely.
   * @param {*} data The data to be rendered (e.g. recipe)
   */
  update(data) {
    this._data = data;
    const newMarkup = this._generateMarkup();

    const newDOM = document.createRange().createContextualFragment(newMarkup);
    let newElements = [...newDOM.querySelectorAll('*')];
    let oldElements = [...this._parentElement.querySelectorAll('*')];

    // Remove exception elements
    if (this._updateExceptionElements) {
      newElements = this.#removeExceptionElements(newElements);
      oldElements = this.#removeExceptionElements(oldElements);
    }

    // Check if update is possible (call render as fallback)
    if (newElements.length !== oldElements.length)
      return this.render(data, newMarkup);

    newElements.forEach((newEl, i) => {
      const curEl = oldElements[i];

      // Update changed text
      if (
        !newEl.isEqualNode(curEl) &&
        newEl.firstChild?.nodeValue.trim() !==
          curEl.firstChild?.nodeValue.trim()
      ) {
        curEl.textContent = newEl.textContent;
      }

      // Update changed attributes
      if (!newEl.isEqualNode(curEl)) {
        [...newEl.attributes].forEach((attr) => {
          if (curEl.getAttribute(attr.name) !== attr.value) {
            curEl.setAttribute(attr.name, attr.value);
          }
        });
      }
    });
  }

  /** Clears the component content. */
  #clear() {
    this._parentElement.innerHTML = '';
  }

  /**
   * Removes elements from component's elements array that should not be considered on component update.
   * @param {Object[]} arr Component's elements
   * @returns {Object[]} Components's elements without excluded ones.
   */
  #removeExceptionElements(arr) {
    this._updateExceptionElements.forEach(
      (exceptionEl) => (arr = arr.filter((el) => !el.closest(exceptionEl)))
    );
    return arr;
  }

  /** Renders a spinner inside a component. */
  renderSpinner() {
    this._parentElement.innerHTML = `
            <div class="spinner">
                <svg>
                    <use href="${icons}#icon-loader"></use>
                </svg>
            </div>
        `;
  }

  /**
   * Renders an error message inside a component.
   * @param {*} [message] Error message text.
   */
  renderError(message = this._errorMessage) {
    this._parentElement.innerHTML = `
        <div class="error">
            <div>
                <svg>
                    <use href="${icons}#icon-alert-triangle"></use>
                </svg>
            </div>
            <p>${message}</p>
        </div>
    `;
  }

  /**
   * Renders a message inside a component.
   * @param {*} [message] Message text.
   */
  renderMessage(message = this._message) {
    this._parentElement.innerHTML = `
        <div class="message">
            <div>
                <svg>
                    <use href="${icons}#icon-smile"></use>
                </svg>
            </div>
            <p>${message}</p>
        </div>
    `;
  }
}

export default RenderView;
