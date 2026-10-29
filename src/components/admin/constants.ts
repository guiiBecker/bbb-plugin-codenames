// react-modal appends the portal to whatever this returns, with no null check of its own,
// so fall back to the body when the client has not rendered the container.
export const getModalParent = (): HTMLElement => (
  document.querySelector<HTMLElement>('#modals-container') ?? document.body
);
