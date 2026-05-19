export function useCountryPicker(selector) {
  const countryPicker = document.querySelector(selector);

  if (!countryPicker) {
    return;
  }

  const trigger = countryPicker.querySelector('[data-country-trigger]');
  const flagEl = countryPicker.querySelector('[data-country-flag]');
  const label = countryPicker.querySelector('[data-country-label]');
  const hiddenInput = countryPicker.querySelector('[data-country-input]');
  const phoneInput = countryPicker.querySelector('[data-phone-number-input]');
  const panel = countryPicker.querySelector('[data-country-panel]');
  const search = countryPicker.querySelector('[data-country-search]');
  const options = Array.from(countryPicker.querySelectorAll('[data-country-option]'));
  const defaultFlag = countryPicker.dataset.defaultFlag || '';
  const defaultCode = countryPicker.dataset.defaultCode || '';
  const defaultLabel = countryPicker.dataset.defaultLabel || defaultCode;
  const defaultExample = countryPicker.dataset.defaultExample || '';

  if (!trigger || !label || !hiddenInput || !panel || !search) {
    return;
  }

  const closePanel = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  const openPanel = () => {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => search.focus());
  };

  const filterOptions = (query = '') => {
    const searchValue = query.trim().toLowerCase();

    options.forEach((option) => {
      const searchText = option.dataset.search || '';
      option.hidden = searchValue !== '' && !searchText.includes(searchValue);
    });
  };

  trigger.addEventListener('click', () => {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  search.addEventListener('input', (event) => {
    filterOptions(event.currentTarget.value);
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const code = option.dataset.code || '';
      const flag = option.dataset.flag || '';

      if (flagEl) flagEl.textContent = flag;
      label.textContent = code;
      hiddenInput.value = code;

      if (phoneInput) {
        const example = option.dataset.example || '';
        phoneInput.placeholder = example;
      }

      search.value = '';
      filterOptions('');
      closePanel();
    });
  });

  document.addEventListener('click', (event) => {
    if (!countryPicker.contains(event.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePanel();
    }
  });

  return {
    reset() {
      if (flagEl) flagEl.textContent = defaultFlag;
      label.textContent = defaultLabel;
      hiddenInput.value = defaultCode;
      if (phoneInput) phoneInput.placeholder = defaultExample;
      search.value = '';
      filterOptions('');
      closePanel();
    },
  };
}
