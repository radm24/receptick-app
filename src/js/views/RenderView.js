import icons from '../../img/icons.svg';

class RenderView {
  _data;

  /**
   * Render the received object to the DOM
   * @param {Object | Object[]} data The data to be rendered (e.g. recipe)
   * @param {String} markup
   * @returns
   * @this {Object} RenderView instance
   * @author Radik Musin
   * @todo Finish implementation
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

  update(data) {
    this._data = data;
    const newMarkup = this._generateMarkup();

    const newDOM = document.createRange().createContextualFragment(newMarkup);
    let newElements = [...newDOM.querySelectorAll('*')];
    let oldElements = [...this._parentElement.querySelectorAll('*')];

    // Remove exception nodes
    if (this._updateExceptionNodes) {
      newElements = this.#removeExceptionNodes(newElements);
      oldElements = this.#removeExceptionNodes(oldElements);
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

  #clear() {
    this._parentElement.innerHTML = '';
  }

  #removeExceptionNodes(arr) {
    this._updateExceptionNodes.forEach(
      (exceptionNode) => (arr = arr.filter((el) => !el.closest(exceptionNode)))
    );
    return arr;
  }

  renderSpinner() {
    this._parentElement.innerHTML = `
            <div class="spinner">
                <svg>
                    <use href="${icons}#icon-loader"></use>
                </svg>
            </div>
        `;
  }

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
