package com.t2kcoffee.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MoMoConfig {
    
    @Value("${momo.partner-code:MOMOVYC220251113_TEST}")
    private String partnerCode;
    
    @Value("${momo.access-key:t0BTIMszMt6qjgsh}")
    private String accessKey;
    
    @Value("${momo.secret-key:zt8513fqezSxKSM3wJoONv1d14TJDd23}")
    private String secretKey;
    
    @Value("${momo.create-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String createUrl;
    
    @Value("${momo.public-key:MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtATDLCSyDjxk+7nxn44k4PdLDjskAsxErTAtwtfo1g66gGWfsM77CB9HSrSf54Cdz41j9jUJOSEfZfi4GPwHO0C39bkSvM0Rf0o1bYRFRYaG+OHUw8LnFT5LpKnxcAtv/iERkpEx9+eVydbd4b6lJcFbpn29dSThUPcpIYiJGtZE8Ysc0FgwpR42ASAfVoTDtUTH23DNYkNS9IYcy7QSzFZFxfHJx4fpUupv5PQ17Q90ZIF3U8/KqHb1eqSd9nuQ1pqy2+r8gdUeNbMwJ76Q9cC0ESa+MWvJSLpfH0y9SEaoBqCZlr1onfQVwDPpIe3gRKnShpi17M6WCOQeL3r1XTF4u5DpVfo0Wui9ggmbPjxo76Ao+Ki3QplTch5FE3QAz7a8BNzml0qr54VdSApzHHEa+JgrlGdIyVd9yi+hvnQjZLd/rDHCus2nCbo3LiWDdz4SPBc9eS7zSdbHKdlzTdYbZhSP8wiea/zxncnOeNUt1DQMMI+tSzS7t/gNTuJPEvw7ZCVuZ/Ea0fp3I4zr6lWlovMl3PvIfWFB7d8O2Wk4ToY1SDPJQbPOPO3SJzCDU39ZglhR/XVhsNLAH31f7fD7e44r9rt0VNxBLS5FDtN89d3elVSEyZ+MVNJZO6JggDk0w80tD2cIwSyzl7AWFaUB7xweQC1D+npdNAYYnrsCAwEAAQ==}")
    private String publicKey;
    
    @Value("${momo.pos-url:https://test-payment.momo.vn/v2/gateway/api/pos}")
    private String posUrl;
    
    @Value("${momo.return-url:https://elmer-untenacious-karry.ngrok-free.dev/api/momo/return}")
    private String returnUrl;
    
    @Value("${momo.notify-url:https://elmer-untenacious-karry.ngrok-free.dev/api/momo/notify}")
    private String notifyUrl;
    
    public String getPartnerCode() {
        return partnerCode;
    }
    
    public String getAccessKey() {
        return accessKey;
    }
    
    public String getSecretKey() {
        return secretKey;
    }
    
    public String getCreateUrl() {
        return createUrl;
    }
    
    public String getPublicKey() {
        return publicKey;
    }
    
    public String getPosUrl() {
        return posUrl;
    }
    
    public String getReturnUrl() {
        return returnUrl;
    }
    
    public String getNotifyUrl() {
        return notifyUrl;
    }
}

