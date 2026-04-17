package com.goevently.eventservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InternalApiSecurityService {

    @Value("${internal.api.secret}")
    private String internalApiSecret;

    public boolean isValidInternalCall(String internalCall, String internalSecret) {
        return "true".equalsIgnoreCase(internalCall)
                && internalApiSecret != null
                && internalApiSecret.equals(internalSecret);
    }
}