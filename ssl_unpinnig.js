// A simple Frida script for SSL unpinning.
// It hooks various common SSL/TLS verification functions.

if (Java.available) {
    Java.perform(function() {
        console.log("SSL Unpinning script loaded.");

        // -- Android 7.0+ (Nougat) --
        try {
            var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            TrustManagerImpl.checkTrusted.implementation = function(chain, authType, host) {
                console.log('TrustManagerImpl.checkTrusted() called');
                return;
            };
        } catch (err) {
            console.log('[-] TrustManagerImpl.checkTrusted() not found or hook failed.');
        }

        // -- Square OkHttp3 --
        try {
            var CertificatePinner = Java.use('okhttp3.CertificatePinner');
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, certificates) {
                console.log('CertificatePinner.check() called. Bypassing SSL pinning for ' + hostname);
                return;
            };
        } catch (err) {
            console.log('[-] OkHttp3 CertificatePinner hook failed.');
        }
        
        // -- TrustKit --
        try {
            var TrustKit = Java.use('com.datatheorem.android.trustkit.pinning.OkHttp3SslPinningInterceptor');
            TrustKit.intercept.implementation = function(chain) {
                console.log('TrustKit.intercept() called. Bypassing SSL pinning.');
                return this.intercept.call(this, chain);
            };
        } catch (err) {
            console.log('[-] TrustKit hook failed.');
        }
        
        // -- Other common SSL pinning libraries --
        try {
            var WebView = Java.use('android.webkit.WebView');
            WebView.setWebViewClient.implementation = function(client) {
                console.log('WebView.setWebViewClient() called. Bypassing SSL pinning...');
                this.setWebViewClient.call(this, client);
            };
        } catch (err) {
            console.log('[-] WebView hook failed.');
        }

        // -- Alternative for SSLPinning --
        try {
            var sslPinning = Java.use('net.sqlcipher.database.SQLiteDatabase');
            sslPinning.enableSSLPinning.implementation = function(arg) {
                console.log('SSLPinning.enableSSLPinning() called. Bypassing SSL pinning.');
                return true;
            };
        } catch(err) {
            console.log('[-] net.sqlcipher hook failed.');
        }
        
        console.log("SSL Unpinning script finished loading.");
    });
} else {
    console.log("Java not available. Frida Gadget may have loaded too early.");
}
