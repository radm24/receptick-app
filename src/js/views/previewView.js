import icons from '../../img/icons.svg';

class PreviewView {
  generateMarkup(data, page) {
    const { id, entryId, image, title, publisher, key } = data;
    const curId = window.location.hash.slice(1);

    return `
      <li class="preview" ${entryId ? `data-id="${entryId}"` : ''}>
        <a class="preview__link ${
          id === curId ? 'preview__link--active' : ''
        }" href="#${id}">
          <figure class="preview__fig">
            <img src="${image}" alt="${title}" />
          </figure>
          <div class="preview__data">
            <h4 class="preview__title">${title}</h4>
            ${
              page === 'planner'
                ? ''
                : `
                  <p class="preview__publisher">${publisher}</p>
                  <div class="preview__user-generated ${key ? '' : 'hidden'}">
                    <svg>
                        <use href="${icons}#icon-user"></use>
                    </svg>
                  </div>
                `
            }
          </div>
        </a>
        ${
          page === 'planner'
            ? `
          <button class="preview__btn--remove">
            <svg>
                <use href="${icons}#icon-bin"></use>
            </svg>
          </button>
        `
            : ''
        }
      </li>
    `;
  }
}

export default new PreviewView();
