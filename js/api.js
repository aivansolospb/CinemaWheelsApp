/**
 * @file api.js
 * @description Логика для взаимодействия с Google Apps Script API (JSONP).
 */

function callApi(action, payload, callback, errorCallback) {
  const callbackName = 'jsonpCallback_' + new Date().getTime() + '_' + Math.floor(Math.random() * 100000);
  const script = document.createElement('script');

  window[callbackName] = function(data) {
    try {
      if (data && data.status === 'error') {
        if (errorCallback) errorCallback(data);
        else console.error('Ошибка API:', data.message || data.error);
      } else {
        if (callback) callback(data);
      }
    } catch (e) {
      console.error("Ошибка в колбэке JSONP:", e);
      if (errorCallback) errorCallback({error: 'js_callback_error', message: e.toString()});
    } finally {
      // Очистка
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete window[callbackName];
    }
  };

  let src = `${API_URL}?action=${action}&callback=${callbackName}`;
  if (payload) {
    src += `&payload=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  script.onerror = function() {
    const errorMsg = 'Сетевая ошибка или API недоступен.';
    console.error(errorMsg, src);
    if (errorCallback) errorCallback({error: 'network_error', message: errorMsg});
    
    if(document.body.contains(script)) {
      document.body.removeChild(script);
    }
    delete window[callbackName];
  };

  script.src = src;
  document.body.appendChild(script);
}

