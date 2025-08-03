/*
 * Universal Android SSL Pinning Bypass with Frida
 * This script attempts to bypass SSL pinning in a variety of common Android libraries.
 */
if (Java.available) {
    Java.perform(function() {
        console.log("-> SSL unpinning script loaded.");

        var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
        var FileInputStream = Java.use("java.io.FileInputStream");
        var BufferedInputStream = Java.use("java.io.BufferedInputStream");
        var X509Certificate = Java.use("java.security.cert.X509Certificate");
        var KeyStore = Java.use("java.security.KeyStore");
        var TrustManagerFactory = Java.use('javax.net.ssl.TrustManagerFactory');
        var SSLContext = Java.use('javax.net.ssl.SSLContext');

        // -- Certificate pinning bypass --
        try {
            var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            TrustManagerImpl.checkTrusted.implementation = function(chain, authType, host) {
                console.log("[+] TrustManagerImpl.checkTrusted() called. Bypassing pinning for: " + host);
                return;
            };
        } catch (e) {
            console.log("[-] TrustManagerImpl.checkTrusted() not found or failed to hook.");
        }

        // -- OkHttp3 --
        try {
            var CertificatePinner = Java.use('okhttp3.CertificatePinner');
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function() {
                console.log("[+] OkHttp3 CertificatePinner.check() called. Bypassing pinning.");
                return;
            };
        } catch (e) {
            console.log("[-] OkHttp3 CertificatePinner.check() hook failed.");
        }

        // -- TrustKit --
        try {
            var TrustKit = Java.use('com.datatheorem.android.trustkit.pinning.OkHttp3SslPinningInterceptor');
            TrustKit.intercept.implementation = function(chain) {
                console.log("[+] TrustKit.intercept() called. Bypassing pinning.");
                return this.intercept.call(this, chain);
            };
        } catch (e) {
            console.log("[-] TrustKit.intercept() hook failed.");
        }

        // -- WebView --
        try {
            var WebView = Java.use('android.webkit.WebView');
            WebView.setWebViewClient.implementation = function(client) {
                console.log("[+] WebView.setWebViewClient() called. Bypassing pinning.");
                this.setWebViewClient.call(this, client);
            };
        } catch (e) {
            console.log("[-] WebView.setWebViewClient() hook failed.");
        }

        // -- Custom TrustManager bypass --
        try {
            var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
            var TrustManager = Java.registerClass({
                name: 'com.r0ck.TrustManager',
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function(chain, authType) {},
                    checkServerTrusted: function(chain, authType) {},
                    getAcceptedIssuers: function() {
                        return [];
                    }
                }
            });

            TrustManagerFactory.getTrustManagers.implementation = function() {
                console.log("[+] TrustManagerFactory.getTrustManagers() called. Using custom TrustManager.");
                return [TrustManager.$new()];
            };

            SSLContext.init.implementation = function(kmf, tmf, sr) {
                console.log("[+] SSLContext.init() called. Using custom TrustManager.");
                this.init.call(this, kmf, [TrustManager.$new()], sr);
            };

        } catch (e) {
            console.log("[-] TrustManager bypass failed.");
        }

        console.log("-> SSL unpinning script finished loading.");
    });
}
