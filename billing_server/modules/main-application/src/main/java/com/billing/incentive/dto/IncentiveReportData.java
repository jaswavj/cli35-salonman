package com.billing.incentive.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class IncentiveReportData {
    private List<IncentiveProgress> rows = new ArrayList<>();
    private Double collectionTotal = 0.0;
    private Double incentiveTotal = 0.0;
    private Integer count = 0;
}
