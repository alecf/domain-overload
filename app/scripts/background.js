'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({text: '\'Allo'});

var tabHistory = {
};

function setTabHistory(tabId, slot, value) {
  if (!(tabId in tabHistory)) {
    tabHistory[tabId] = {};
  }
  tabHistory[tabId][slot] = value;
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  setTabHistory(activeInfo.tabId, 'lastActivated', new Date());
});

chrome.tabs.onCreated.addListener(function(tab) {
  setTabHistory(tab.id, 'created', new Date());
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  delete tabHistory[tabId];
});

console.log('\'Allo \'Allo! Event Page for Browser Action');
