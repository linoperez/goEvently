package com.goevently.paymentservice.entity;

public enum PaymentStatus {
    PENDING,      // Payment created, awaiting user action
    SUCCESS,      // Payment successful
    FAILED,       // Payment failed
    CANCELLED,    // User cancelled payment
    REFUNDED,     // Payment refunded
    EXPIRED       // Payment link expired
}
