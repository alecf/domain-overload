'use strict';


function populateList() {
  var list = document.querySelector('#domain-list');

  chrome.tabs.query({}, function(tabs) {
    var byDomain = _.chain(tabs)
        .groupBy(function(tab) {
          var url = tab.url;

          if (!url) return '';

          var parser = document.createElement('a');
          parser.href = url;

          return parser.hostname;
        })
            .pairs()
            .sortBy(function(countTab) { return -countTab[0]; })
            .value();

    _.forEach(byDomain, function(countTab) {
      var count = countTab[0];
      var domainTabs = countTab[1];
      var domainItem = document.createElement('li');
      var domainList = document.createElement('ul');
      domainItem.appendChild(domainList);

      _.forEach(domainTabs, function(tab) {
        var tabItem = document.createElement('li');
        tabItem.textContent = tab.title;
        domainList.appendChild(tabItem);
      });
      list.appendChild(domainList);
    });


  });

}

document.addEventListener('DOMContentLoaded', function() {

  console.log('\'Allo \'Allo! Popup');

});
