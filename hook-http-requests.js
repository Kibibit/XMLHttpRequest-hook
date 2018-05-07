window.KIBIBITHttpRequestHook = {
    addHookToHttpRequests: addHookToHttpRequests,
    unwire: clearXmlRequestCallbacks,
    getLoggedData: getLoggedData
};

function getLoggedData(urlSubstring) {
    window.$$KIBIBIT_LoggedResponses = window.$$KIBIBIT_LoggedResponses || {};
    
    if (!urlSubstring) {
        return window.$$KIBIBIT_LoggedResponses;
    }

    var allKeys = Object.keys(window.$$KIBIBIT_LoggedResponses);

    var loggedResponseKey = allKeys.find(function(loggedResponseUrl) {
        return loggedResponseUrl.indexOf(urlSubstring) > -1;
    });

    return window.$$KIBIBIT_LoggedResponses[loggedResponseKey];
}

function clearXmlRequestCallbacks() {
    if (Array.isArray(XMLHttpRequest.$$KIBIBIT_requestCallbacks)) {
        XMLHttpRequest.$$KIBIBIT_requestCallbacks = [];
        XMLHttpRequest.$$KIBIBIT_responseCallbacks = [];
    }
}

function addHookToHttpRequests() {
    var COMPLETED_READY_STATE = 4;

    addXMLRequestCallback(null, onResponse);

    function onResponse(xhr) {
        window.$$KIBIBIT_LoggedResponses = window.$$KIBIBIT_LoggedResponses || {};

        window.$$KIBIBIT_LoggedResponses[xhr.responseURL] = {
            url: xhr.responseURL,
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.response

        };
    }

    // this function needs to be defined in the browser we use to listen to all XMLHttpRequests:
    function addXMLRequestCallback(requestCallback, responseCallback) {
        ensureXMLHookIsPresent();

        if (requestCallback) {
            XMLHttpRequest.$$KIBIBIT_requestCallbacks.push(requestCallback);
        }

        if (responseCallback) {
            XMLHttpRequest.$$KIBIBIT_responseCallbacks.push(responseCallback);
        }
    }

    function ensureXMLHookIsPresent() {
        var RealXHRSend;

        if (!Array.isArray(XMLHttpRequest.$$KIBIBIT_requestCallbacks)) {
            // create a callback queue
            XMLHttpRequest.$$KIBIBIT_requestCallbacks = [];
            XMLHttpRequest.$$KIBIBIT_responseCallbacks = [];
            // store the native send()
            RealXHRSend = XMLHttpRequest.prototype.send;
            // override the native send()
            XMLHttpRequest.prototype.send = function () {
                // Fire request callbacks before sending the request
                fireCallbacks(XMLHttpRequest.$$KIBIBIT_requestCallbacks, this);

                // Wire response callbacks
                if (this.addEventListener) {
                    var self = this;
                    this.addEventListener("readystatechange", function () {
                        fireResponseCallbacksIfCompleted(self, XMLHttpRequest.$$KIBIBIT_responseCallbacks);
                    }, false);
                }
                else {
                    proxifyOnReadyStateChange(this);
                }

                // call the native send()
                RealXHRSend.apply(this, arguments);
            }
        }
    }

    // gets a callbacks array and passes the xhr as an argument
    function fireCallbacks(callbacks, xhr) {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](xhr);
        }
    }

    // override xhr's onreadystatechange.
    // (used if no addEventListener is present on the xhr object
    function proxifyOnReadyStateChange(xhr) {
        var realOnReadyStateChange = xhr.onreadystatechange;
        if (realOnReadyStateChange) {
            xhr.onreadystatechange = function () {
                fireResponseCallbacksIfCompleted(xhr);
                realOnReadyStateChange();
            };
        }
    }

    function fireResponseCallbacksIfCompleted(xhr, responseCallbacks) {
        if (xhr.readyState === COMPLETED_READY_STATE) {
            fireCallbacks(responseCallbacks, xhr);
        }
    }
}
