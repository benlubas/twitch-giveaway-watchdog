const BLACK_LIST_TIME = 1;

function readChats(url) {
  console.log("reading chat...");
  let chats = Array.from(document.querySelectorAll(".text-fragment")).map(
    (v) => v.textContent
  );

  console.log("chats: ", chats);

  const map = new Map();
  let count = 0;
  chats.forEach((chat) => {
    if (chat.charAt(0) == "!") {
      count += 1;
      if (map.has(chat)) {
        map.set(chat, map.get(chat) + 1);
      } else {
        map.set(chat, 1);
      }
    }
  });

  if (chats.length > 10 && count > chats.length * 0.4) {
    let rec = 0;
    let recChat = "";
    map.forEach((val, key) => {
      if (val > rec) {
        recChat = key;
        rec = val;
      }
    });

    function showNotif() {
      const notification = new Notification("Giveaway Watchdog Alert", {
        body: `Giveaway alert for ${url.substring(url.indexOf("v") + 2)}\n
        Try typing ${recChat}`,
      });
    }
    if (Notification.permission === "granted") {
      showNotif();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showNotif();
        }
      });
    }
  }
  console.log("read chats function finished running");
}
console.log("file");

chrome.alarms.create("readChat", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((a) => {
  console.log("alarm: ", a);
  if (a.name === "readChat") {
    chrome.tabs.query({}, (tabs) => {
      tabs = tabs.filter((t) => /\g*twitch.tv\/*/.test(t.url));
      console.log("tabs: ", tabs);
      tabs.forEach((tab) => {
        console.log("for each");
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: readChats,
            args: [tab.url],
          },
          () => console.log("callback")
        );
      });
    });
  } else if (a.name.indexOf("clear blacklist") !== -1) {
    const url = a.name.split(" ")[2];
    chrome.storage.local.get(["blacklist"], function (result) {
      chrome.storage.local.set(
        { blacklist: result.filter((x) => x !== url) },
        function () {
          console.log("removing " + url + " from blacklist");
          chrome.alarms.clear("clear blacklist " + url);
        }
      );
    });
  } else {
    console.log("else");
  }
});
