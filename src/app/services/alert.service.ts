import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alerts$ = new BehaviorSubject<Alert[]>([]);
  alerts = this.alerts$.asObservable();

  private idCounter = 0;

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, timeout: number = 5000) {
    const alert: Alert = {
      id: `alert-${this.idCounter++}`,
      type,
      title,
      message,
      timeout
    };

    const currentAlerts = this.alerts$.value;
    this.alerts$.next([...currentAlerts, alert]);

    if (timeout > 0) {
      setTimeout(() => {
        this.remove(alert.id);
      }, timeout);
    }
  }

  success(title: string, message: string, timeout?: number) {
    this.show('success', title, message, timeout);
  }

  error(title: string, message: string, timeout?: number) {
    this.show('error', title, message, timeout);
  }

  warning(title: string, message: string, timeout?: number) {
    this.show('warning', title, message, timeout);
  }

  info(title: string, message: string, timeout?: number) {
    this.show('info', title, message, timeout);
  }

  remove(id: string) {
    const currentAlerts = this.alerts$.value;
    this.alerts$.next(currentAlerts.filter(alert => alert.id !== id));
  }

  clear() {
    this.alerts$.next([]);
  }
}
