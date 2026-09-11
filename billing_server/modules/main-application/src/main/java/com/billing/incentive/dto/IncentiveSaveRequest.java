package com.billing.incentive.dto;

import lombok.Data;

@Data
public class IncentiveSaveRequest {
    private Long id;
    private String shopId;
    private Long userId;
    private Double targetAmount;
    private String compareType;
    private String incentiveMode;
    private Double incentiveValue;
}
