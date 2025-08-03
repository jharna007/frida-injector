Java.perform(function () {
    console.log("Universal SSL unpinning script loaded");

    // OkHTTPv3 & v4 bypass
    try {
        var okhttp3_TrustManager = Java.use("okhttp3.CertificatePinner");
        okhttp3_TrustManager.check.overload("java.lang.String", "java.util.List").implementation = function () {
            console.log("[+] Bypassed OkHTTPv3/4 CertificatePinner");
            return;
        };
    } catch (err) {
        console.log("[-] OkHTTP CertificatePinner not found");
    }

    // TrustManagerImpl (Android default)
    try {
        var TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
        TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, tlsContext) {
            console.log("[+] Bypassed TrustManagerImpl.verifyChain");
            return untrustedChain;
        };
    } catch (err) {
        console.log("[-] TrustManagerImpl not found");
    }

    // WebViewClient onReceivedSslError
    try {
        var WebViewClient = Java.use("android.webkit.WebViewClient");
        WebViewClient.onReceivedSslError.implementation = function (webview, handler, error) {
            console.log("[+] Bypassed WebViewClient onReceivedSslError");
            handler.proceed();
        };
    } catch (err) {
        console.log("[-] WebViewClient not found");
    }

    // Apache Harmony
    try {
        var sslSession = Java.use("org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl");
        sslSession.startHandshake.implementation = function () {
            console.log("[+] Bypassed Apache Harmony SSL handshake");
            // Don't call the real handshake
        };
    } catch (err) {
        console.log("[-] Apache Harmony SSL socket not found");
    }

    // TrustAllManager fallback
    try {
        var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
        var TrustManager = Java.registerClass({
            name: "org.kaif.CustomTrustManager",
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function (chain, authType) {},
                checkServerTrusted: function (chain, authType) {},
                getAcceptedIssuers: function () { return []; }
            }
        });
        var SSLContext = Java.use("javax.net.ssl.SSLContext");
        SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom")
            .implementation = function (keyManager, trustManager, secureRandom) {
                console.log("[+] Injected TrustAllManager into SSLContext");
                this.init(keyManager, [TrustManager.$new()], secureRandom);
            };
    } catch (err) {
        console.log("[-] Could not patch SSLContext");
    }

});
