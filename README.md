# XMLHttpRequest-hook
add the ability to hook callbacks to XMLHttpRequests

you can inject this into your `Protractor` code by creating the following class:
```
export class HttpHook {
    static wireHttpHook(): SeleniumPromise<any> {
        return browser.executeAsyncScript((done) => {
            (function (scriptElement, scriptUrl) {
                // if already injected, don't create another one
                if (isMyScriptLoaded(scriptUrl)) {
                    return;
                }

                scriptElement.src = scriptUrl;

                // after the scripts loads, init the hook to XMLHttpRequest
                scriptElement.onload = function () {
                    const KIBIBITHttpRequestHook = (<any>window).KIBIBITHttpRequestHook;
                    if (KIBIBITHttpRequestHook) {
                        KIBIBITHttpRequestHook.addHookToHttpRequests();
                        console.log('WIRED HTTP HOOK');
                        done('WIRED HTTP HOOK');
                    }
                };

                document.head.appendChild(scriptElement);

                function isMyScriptLoaded(url) {
                    if (!url) throw new Error('isMyScriptLoaded expects a url');
                    var scripts = document.getElementsByTagName('script');
                    for (var i = scripts.length; i--;) {
                        if (scripts[i].src == url) return true;
                    }
                    return false;
                }

            })(document.createElement('script'), '//cdn.rawgit.com/Kibibit/XMLHttpRequest-hook/43fc5291/hook-http-requests.js');
        });
    }

    static unwireHttpHook(): SeleniumPromise<any>  {
        return browser.executeAsyncScript((done) => {
            const KIBIBITHttpRequestHook = (<any>window).KIBIBITHttpRequestHook;
            if (KIBIBITHttpRequestHook) {
                KIBIBITHttpRequestHook.unwire();
                console.log('UNWIRED HTTP HOOK');
                done('UNWIRED HTTP HOOK');
            }
        });
    }

    static getLoggedData(requestSubstring?: string): SeleniumPromise<any> {
        return browser.executeAsyncScript((done) => {
            const KIBIBITHttpRequestHook = (<any>window).KIBIBITHttpRequestHook;
            if (KIBIBITHttpRequestHook) {
                // will be returned to protractor
                let loggedData = KIBIBITHttpRequestHook.getLoggedData(requestSubstring);

                console.log('DATA SENT', loggedData);
                done(loggedData);
                return loggedData;
            }

            throw new Error(`looks like the script wasn't injected`);
        });
    }
}
```
