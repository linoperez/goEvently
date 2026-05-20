package com.goevently.paymentservice.entity;

public enum PaymentMethod {
    CREDIT_CARD,      // Visa, Mastercard, etc.
    DEBIT_CARD,       // All debit cards
    NET_BANKING,      // NEFT, RTGS transfers
    UPI,              // UPI payments
    WALLET,           // Google Pay, Apple Pay, Phone Pe, etc.
    EMI               // Installment plans
}
