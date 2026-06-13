import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../../services/alert.service';

@Component({
  selector: 'app-alert-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-container.component.html',
  styleUrl: './alert-container.component.scss'
})
export class AlertContainerComponent implements OnInit {
  private alertService = inject(AlertService);
  alerts: Alert[] = [];

  ngOnInit() {
    this.alertService.alerts.subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  removeAlert(id: string) {
    this.alertService.remove(id);
  }

  getAlertClass(type: string): string {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }
}
