export function useFormSuccess({ formSelector, successSelector, onSuccess }) {
  const form = document.querySelector(formSelector);
  const successMessage = document.querySelector(successSelector);

  if (!form || !successMessage) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    successMessage.hidden = false;
    form.reset();
    onSuccess?.();
  });
}
