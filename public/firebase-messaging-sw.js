importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyB9D7E4gWhp48aGlOvcDUm34J-b4zgNWd0",
  authDomain: "blax-75190.firebaseapp.com",
  projectId: "blax-75190",
  messagingSenderId: "340663072497",
  appId: "1:340663072497:web:cfe1d98b8b6b5d12139b50",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title;
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon,
    badge: payload.notification?.badge,
    data: payload.fcmOptions?.link,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// klik notif buka halaman admin
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data));
});
