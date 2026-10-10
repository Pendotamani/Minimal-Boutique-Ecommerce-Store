importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCnkuPRGXkmtcxRsSL8eaXDeY7ddQvB3jo",
  authDomain: "iglifestyles.firebaseapp.com",
  projectId: "iglifestyles",
  storageBucket: "iglifestyles.firebasestorage.app",
  messagingSenderId: "99691717046",
  appId: "1:99691717046:web:07a5ea6190949ba9b2e117",
  measurementId: "G-QSX7XHD013"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "ig.lifestyles";
  const options = {
    body: payload.notification?.body || "A new order is awaiting review.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: "/admin" }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find((client) => client.url === destination);
    if (existing && "focus" in existing) return existing.focus();
    return self.clients.openWindow(destination);
  })());
});
