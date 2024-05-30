class ThemeView {
  #htmlEl = document.documentElement;
  #toggleBtn = document.querySelector('.theme__circle');
  #logoLight = document.querySelector('.header__logo--light');
  #logoDark = document.querySelector('.header__logo--dark');

  /**
   * Adds event listener to toggle theme on the 'theme' slider click.
   * @param {callback} handler
   */
  addHandlerToggleTheme(handler) {
    document.querySelector('.theme').addEventListener('click', () => {
      const newTheme =
        this.#htmlEl.dataset.theme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
      handler(newTheme);
    });
  }

  /**
   * Sets new color theme.
   * @param {'dark' | 'light'} newTheme New theme value
   */
  setTheme(newTheme) {
    this.#htmlEl.dataset.theme = newTheme;

    // Toggle light / dark theme logo
    this.#logoLight.style.display = newTheme === 'light' ? 'block' : 'none';
    this.#logoDark.style.display = newTheme === 'light' ? 'none' : 'block';

    // Move switch button
    this.#toggleBtn.classList.toggle('theme__circle--light');
    this.#toggleBtn.classList.toggle('theme__circle--dark');
  }
}

export default new ThemeView();
