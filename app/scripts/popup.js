'use strict';
_.mixin(_.string.exports());
function makeCloseHandler(tabIds, owner) {
  return function onClick() {
    chrome.tabs.remove(tabIds, function() {
      owner.parentNode.removeChild(owner);
    });
  };
}

function makeActivateHandler(tabId) {
  return function onClick() {
    chrome.tabs.update(tabId, {active: true});
  };
}

function makeCloseButton(owner, tabIds) {
  return $('<button>x</button>').click(makeCloseHandler(tabIds, owner));
}

function lastActiveByHistory(tabHistory, tabId) {
  if (!(tabId in tabHistory)) {
    return 0;
  }
  if (!('lastActivated' in tabHistory[tabId])) {
    return 0;
  }
  return -tabHistory[tabId].lastActivated;
};

function populateList() {
  var $list = $('#domain-list');

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // console.log('Got all tabs: ', tabs);
    var tabHistory = chrome.extension.getBackgroundPage().tabHistory;
    var lastActive = _.partial(lastActiveByHistory, tabHistory);
    var byDomain = _(tabs).chain()
        .groupBy(function(tab) {
          var url = tab.url;

          if (_.str.startsWith(url, 'view-source:')) {
            url = url.slice('view-source:'.length);
          }

          if (!url) {
            return '';
          }

          var parser = document.createElement('a');
          parser.href = url;
          return parser.hostname;
        })
            .pairs()
            .forEach(function(countTab) {
              // sort tabs within a domain
              var tabs = countTab[1];
              console.log("Got domain: ", countTab[0], ": ", _.pluck(tabs, 'id'));
              var newtabs = _(tabs).chain()
              // in reverse order that you want
                  .sortBy(function(tab) { return tab.id; })
                  .sortBy(function(tab) { return tab.active; })
                  .sortBy(function(tab) { return tab.url; })
                  .sortBy(function(tab) { return lastActive(tab.id); })
                  .value();
              tabs.length = 0;
              // replace the identical object
              Array.prototype.push.apply(tabs, newtabs);
            })
    // sort domains
        .sortBy(function(countTab) { return -countTab[1].length; })
        .sortBy(function(countTab) {
          var tabs = countTab[1];
          return _(tabs).chain()
              .pluck('id')
              .map(lastActive)
              .max()
              .value();
        });

    _(byDomain).forEach(function(domainTabs) {
      //console.log("Got domain: ", domainTabs);
      var domain = domainTabs[0];
      var domainTabList = domainTabs[1];
      var $domainItem = $('<li class="domain">');
      var tabIds = _.pluck(domainTabList, 'id');

      var $parent = $list;
      if (domainTabList.length > 1) {
        var domainFavicon = _.chain(domainTabList)
            .groupBy(function(tab) { return tab.favIconUrl; })
            .pairs()
            .sortBy(function(iconTab) { return iconTab[1].length; })
            .last()
            .first()
            .value();
        // console.log(domain, ' => ', domainFavicon);
        if (domainFavicon) {
          $domainItem.append($('<img width="16" height="16">')
              .attr('src', domainFavicon));
        }
        $domainItem.append($('<span class="domain">').text(domain));

        $domainItem.append(makeCloseButton($domainItem.get(0), tabIds));

        var $domainList = $('<ul class="domain">');
        $domainItem.append($domainList);
        $parent = $domainList;
      }

      _.forEach(domainTabList, function(tab) {
        // console.log("   tab: ", tab);
        var $tabItem = $('<li class="tab">');
        if (tab.favIconUrl) {
          $tabItem.append($('<img height="16" width="16">').attr('src', tab.favIconUrl));
        }
        var $tabText = $('<a class="title" href="#">')
            .attr("title", domain)
            .text(tab.title)
            .click(makeActivateHandler(tab.id));
        $tabItem.append($tabText);

        $tabItem.append(makeCloseButton($tabItem.get(0), tab.id));
        // console.log("Appending ", $tabItem.get(0), " to ", $parent.get(0));
        $parent.append($tabItem);
      });

      // XXX hack to detect this case:(
      if ($parent === $domainList) {
        console.log("Appending full domain ", $domainItem.get(0), ' to ', $domainList.get(0));
        $list.append($domainItem.get(0));
      }
    });
  });

}

document.addEventListener('DOMContentLoaded', function() {
  populateList();
});
