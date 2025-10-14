export function sendNotification(title: string, body: string) {
  if (window.gstcalc && window.gstcalc.sendNotification) {
    window.gstcalc.sendNotification(title, body);
  } else {
    console.warn('Notifications API not available.');
  }
}
