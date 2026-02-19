import { atom, type WritableAtom } from 'nanostores';
import type { ActionAlert, DeployAlert } from '~/types/actions';

export class AlertsStore {
  actionAlert: WritableAtom<ActionAlert | undefined> =
    import.meta.hot?.data.actionAlert ?? atom<ActionAlert | undefined>(undefined);

  deployAlert: WritableAtom<DeployAlert | undefined> =
    import.meta.hot?.data.deployAlert ?? atom<DeployAlert | undefined>(undefined);

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.actionAlert = this.actionAlert;
      import.meta.hot.data.deployAlert = this.deployAlert;
    }
  }

  setActionAlert(alert: ActionAlert | undefined) {
    this.actionAlert.set(alert);
  }

  clearActionAlert() {
    this.actionAlert.set(undefined);
  }

  setDeployAlert(alert: DeployAlert | undefined) {
    this.deployAlert.set(alert);
  }

  clearDeployAlert() {
    this.deployAlert.set(undefined);
  }
}

export const alertsStore = new AlertsStore();

