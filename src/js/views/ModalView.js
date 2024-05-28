import RenderView from './RenderView';

class ModalView extends RenderView {
  _overlay = document.querySelector('.overlay');

  _showModal() {
    if (!this._modal.classList.contains('hidden')) return;

    this._modal.classList.remove('hidden');
    this._overlay.classList.remove('hidden');
  }

  _closeModal() {
    if (this._modal.classList.contains('hidden')) return;

    this._modal.classList.add('hidden');
    this._overlay.classList.add('hidden');
  }
}

export default ModalView;
