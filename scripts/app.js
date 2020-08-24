(function () {
    'use strict';
  
    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/
  
  /**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
app.getSchedule = function getSchedules(key, label) {
  var dbPromise = self.indexedDB.open("taller1_db", 1);
  dbPromise.onerror = function(event) {
    // Do something with request.errorCode!
    console.log("error");
  };

  dbPromise.onupgradeneeded = function(event) { 
    // Save the IDBDatabase interface 
    var db = event.target.result;
    if (!db.objectStoreNames.contains('metros')) {
      // Create an objectStore for this database
      db.createObjectStore("metros", {keyPath: 'url'});
    }
  };

  dbPromise.onsuccess = function(event1){
    var db = event1.target.result;
    var transaction = db.transaction(["metros"]);
    var objectStore = transaction.objectStore("metros");
    var request = objectStore.get('https://api-ratp.pierre-grimaud.fr/v3/schedules/'+key);
    request.onsuccess = function(event) {
     // Hacer algo cuando se obtenga el registro.
      if(event.target.result != undefined){
        var data = event.target.result;
        var response = data;
        var result = {};
        result.key = key;
        result.label = label;
        result.created = response._metadata.date;
        result.schedules = response.result.schedules;
        app.updateTimetableCard(result);    
      }
      else{
        fetch('https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key)
          .then((data) => {
            data.json().then(function(json) {
              var response = json;
              var result = {};
              result.key = key;
              result.label = label;
              result.created = response._metadata.date;
              result.schedules = response.result.schedules;
              app.updateTimetableCard(result);  
          });
          })
          .catch((e) => {
            console.log(e);
          });;
      }
    };
  }
}

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getSchedulesFromCache(key) {
  // CODELAB: Add code to get weather forecast from the caches object.
    if (!('caches' in window)) {
      return null;
    }
    var api_url = 'https://api-ratp.pierre-grimaud.fr/v3';
    const url = `${api_url}/schedules/${key}`;
    return caches.match(url)
        .then((response) => {
          if (response) {
            return response.json();
          }
          return null;
        })
        .catch((err) => {
          console.error('Error getting data from cache', err);
          return null;
        });

}


    /*app.getSchedule = function (key, label) {
        getSchedules(key, label).then(data => {
          console.log('pregunte al cache');
            if(data!=null){
                var response = data;
                var result = {};
                result.key = key;
                result.label = label;
                result.created = response._metadata.date;
                result.schedules = response.result.schedules;
                app.updateTimetableCard(result);           
            }
        });
    }
      
        getSchedulesFromNetwork(key).then(data => {
            if(data!=null){
              console.log("entre a preguntar a la red.");
              var response = data;
              var result = {};
              result.key = key;
              result.label = label;
              result.created = response._metadata.date;
              result.schedules = response.result.schedules;
              app.updateTimetableCard(result);   
              var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;
              var request = new XMLHttpRequest();
              request.onreadystatechange = function () {
                  if (request.readyState === XMLHttpRequest.DONE) {
                      if (request.status === 200) {
                          var response = JSON.parse(request.response);
                          
                          if (first_load){                            
                            first_load = false;
                            caches.open('data-cache-v3').then((cache) => {
                              // If the response was good, clone it and store it in the cache.
                              cache.put(url, request.response);
                            });
                          } 
                        
                          var result = {};
                          result.key = key;
                          result.label = label;
                          result.created = response._metadata.date;
                          result.schedules = response.result.schedules;
                          app.updateTimetableCard(result);
                      }
                  } else {
                      // Return the initial weather forecast since no data is available.
                      app.updateTimetableCard(initialStationTimetable);
                  }
              };
              request.open('GET', url);
              request.send();*/
   

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/

    app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];
  
    
})();
