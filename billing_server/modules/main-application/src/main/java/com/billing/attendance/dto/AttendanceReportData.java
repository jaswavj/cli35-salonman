package com.billing.attendance.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AttendanceReportData {
    private List<AttendanceRow> rows = new ArrayList<>();
    private int count;
    private int inCount;
    private int outCount;
    private long workMinutes;
}
