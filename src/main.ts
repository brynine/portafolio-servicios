import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

  window.addEventListener('error', (event) => {
  if (
    event.message.includes('Cross-Origin-Opener-Policy') ||
    event.message.includes('window.close')
  ) {
    event.preventDefault();
  }
});

