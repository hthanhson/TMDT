package com.example.tmdt.util;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderStatus;

/**
 * Utility class to convert between different OrderStatus enums
 */
public class OrderStatusConverter {
    
    /**
     * Convert from Order.OrderStatus to OrderStatus
     */
    public static OrderStatus toOrderStatus(Order.OrderStatus status) {
        try {
            return OrderStatus.valueOf(status.name());
        } catch (IllegalArgumentException e) {
            // This should not happen now that both enums have the same values
            return OrderStatus.PENDING;
        }
    }
    
    /**
     * Convert from OrderStatus to Order.OrderStatus
     */
    public static Order.OrderStatus toOrderInternalStatus(OrderStatus status) {
        try {
            return Order.OrderStatus.valueOf(status.name());
        } catch (IllegalArgumentException e) {
            // This should not happen now that both enums have the same values
            return Order.OrderStatus.PENDING;
        }
    }
    
    /**
     * Convert from String to Order.OrderStatus
     */
    public static Order.OrderStatus stringToOrderInternalStatus(String status) {
        try {
            return Order.OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            // Try to map to a supported status
            try {
                OrderStatus externalStatus = OrderStatus.valueOf(status);
                return toOrderInternalStatus(externalStatus);
            } catch (IllegalArgumentException ex) {
                // If status not found in either enum, default to PENDING
                return Order.OrderStatus.PENDING;
            }
        }
    }
    
    /**
     * Convert from String to OrderStatus
     */
    public static OrderStatus stringToOrderStatus(String status) {
        try {
            return OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            // Try to map to a supported status
            try {
                Order.OrderStatus internalStatus = Order.OrderStatus.valueOf(status);
                return toOrderStatus(internalStatus);
            } catch (IllegalArgumentException ex) {
                // If status not found in either enum, default to PENDING
                return OrderStatus.PENDING;
            }
        }
    }
} 